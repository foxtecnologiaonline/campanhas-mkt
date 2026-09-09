-- ============================================================================
-- RPCs do pipeline de envio. Cada uma cobre uma transição de estado atômica —
-- nenhuma faz read-modify-write pela camada de aplicação, exatamente para
-- evitar a condição de corrida descrita na doc de arquitetura (duas execuções
-- do dispatch sobrepostas não podem reivindicar o mesmo trabalho duas vezes).
-- Todas são restritas a service_role: só o worker as chama, nunca o client.
-- ============================================================================

-- Reivindica até p_limit campanhas agendadas cujo horário já chegou, travando
-- as linhas com FOR UPDATE SKIP LOCKED para que dois ticks do worker rodando
-- ao mesmo tempo nunca expandam a mesma campanha duas vezes.
create or replace function public.claim_due_campaigns(p_limit int default 5)
returns setof campaigns
language plpgsql
as $$
begin
  return query
  update campaigns
  set status = 'expanding'
  where id in (
    select id
    from campaigns
    where status = 'scheduled' and scheduled_at <= now()
    order by scheduled_at
    limit p_limit
    for update skip locked
  )
  returning *;
end;
$$;

revoke all on function public.claim_due_campaigns(int) from public;
grant execute on function public.claim_due_campaigns(int) to service_role;

-- Expande uma campanha reivindicada em campaign_recipients.
--
-- LIMITAÇÃO CONHECIDA DO MVP: o construtor de segmentos ainda não existe, então
-- a única audiência suportada por enquanto é "todo contato da organização com
-- opt-in no canal da campanha". `segment_id` já é gravado na campanha para
-- quando o filtro de segments.definition for implementado — esta função só
-- precisa passar a interpretá-lo, o resto do pipeline não muda.
create or replace function public.expand_campaign(p_campaign_id uuid)
returns int
language plpgsql
as $$
declare
  v_campaign campaigns%rowtype;
  v_inserted int;
begin
  select * into v_campaign from campaigns where id = p_campaign_id;
  if not found then
    return 0;
  end if;

  insert into campaign_recipients (organization_id, campaign_id, contact_id, contact_channel_id, status)
  select cc.organization_id, v_campaign.id, cc.contact_id, cc.id, 'pending'
  from contact_channels cc
  where cc.organization_id = v_campaign.organization_id
    and cc.channel = v_campaign.channel
    and cc.opt_in = true
  on conflict (campaign_id, contact_id) do nothing;

  get diagnostics v_inserted = row_count;

  update campaigns set status = 'sending' where id = v_campaign.id;

  return v_inserted;
end;
$$;

revoke all on function public.expand_campaign(uuid) from public;
grant execute on function public.expand_campaign(uuid) to service_role;

-- Reivindica um destinatário pendente para envio. Faz duas coisas atômicas:
-- 1) trava e marca o destinatário como 'queued' (skip locked = duas execuções
--    do worker nunca pegam o mesmo destinatário);
-- 2) cria (ou, se já existir e tiver falhado sem esgotar tentativas, reabre)
--    a linha de mensagem correspondente, respeitando o índice único de
--    idempotência em (campaign_id, contact_id). Se a mensagem já existe num
--    estado terminal (enviada, ou esgotou tentativas), não reivindica de novo
--    — só sincroniza o destinatário com esse estado.
create or replace function public.claim_recipient_for_send(p_recipient_id uuid)
returns table (message_id uuid, organization_id uuid, campaign_id uuid, contact_id uuid, channel text)
language plpgsql
as $$
declare
  v_recipient campaign_recipients%rowtype;
  v_channel text;
  v_message_id uuid;
  v_existing_status text;
begin
  select * into v_recipient
  from campaign_recipients
  where id = p_recipient_id and status = 'pending'
  for update skip locked;

  if not found then
    return;
  end if;

  select c.channel into v_channel from campaigns c where c.id = v_recipient.campaign_id;

  insert into messages (organization_id, campaign_id, campaign_recipient_id, contact_id, channel, direction, status)
  values (v_recipient.organization_id, v_recipient.campaign_id, v_recipient.id, v_recipient.contact_id, v_channel, 'outbound', 'queued')
  on conflict (campaign_id, contact_id) where direction = 'outbound'
  do update set status = 'queued'
    where messages.status = 'failed' and messages.dead_letter_at is null
  returning id into v_message_id;

  if v_message_id is null then
    select status into v_existing_status
    from messages
    where campaign_id = v_recipient.campaign_id and contact_id = v_recipient.contact_id and direction = 'outbound';

    update campaign_recipients
    set status = case when v_existing_status = 'failed' then 'failed' else 'sent' end
    where id = v_recipient.id;

    return;
  end if;

  update campaign_recipients set status = 'queued' where id = v_recipient.id;

  return query select v_message_id, v_recipient.organization_id, v_recipient.campaign_id, v_recipient.contact_id, v_channel;
end;
$$;

revoke all on function public.claim_recipient_for_send(uuid) from public;
grant execute on function public.claim_recipient_for_send(uuid) to service_role;

-- Marca sucesso e incrementa o contador de uso do período — um único
-- round-trip, sem read-modify-write na aplicação.
create or replace function public.record_send_success(
  p_message_id uuid,
  p_recipient_id uuid,
  p_provider_message_id text
)
returns void
language plpgsql
as $$
declare
  v_org uuid;
  v_channel text;
begin
  update messages
  set status = 'sent', provider_message_id = p_provider_message_id
  where id = p_message_id
  returning organization_id, channel into v_org, v_channel;

  update campaign_recipients set status = 'sent' where id = p_recipient_id;

  insert into usage_counters (organization_id, channel, period, sent_count)
  values (v_org, v_channel, date_trunc('month', now())::date, 1)
  on conflict (organization_id, channel, period)
  do update set sent_count = usage_counters.sent_count + 1;
end;
$$;

revoke all on function public.record_send_success(uuid, uuid, text) from public;
grant execute on function public.record_send_success(uuid, uuid, text) to service_role;

-- Marca falha com backoff por contagem de tentativas; ao esgotar
-- p_max_attempts, grava dead_letter_at em vez de tentar para sempre.
create or replace function public.record_send_failure(
  p_message_id uuid,
  p_recipient_id uuid,
  p_error text,
  p_max_attempts int default 5
)
returns void
language plpgsql
as $$
declare
  v_attempts int;
begin
  update messages
  set attempt_count = attempt_count + 1,
      error = p_error,
      status = 'failed'
  where id = p_message_id
  returning attempt_count into v_attempts;

  if v_attempts >= p_max_attempts then
    update messages set dead_letter_at = now() where id = p_message_id;
    update campaign_recipients set status = 'failed' where id = p_recipient_id;
  else
    update campaign_recipients set status = 'pending' where id = p_recipient_id;
  end if;
end;
$$;

revoke all on function public.record_send_failure(uuid, uuid, text, int) from public;
grant execute on function public.record_send_failure(uuid, uuid, text, int) to service_role;

-- Fecha campanhas que não têm mais destinatário pendente ou em fila.
create or replace function public.close_finished_campaigns()
returns int
language sql
as $$
  with done as (
    update campaigns c
    set status = 'completed'
    where c.status = 'sending'
      and not exists (
        select 1 from campaign_recipients r
        where r.campaign_id = c.id and r.status in ('pending', 'queued')
      )
    returning c.id
  )
  select count(*)::int from done;
$$;

revoke all on function public.close_finished_campaigns() from public;
grant execute on function public.close_finished_campaigns() to service_role;

-- Lê a credencial decriptada de uma conexão de canal. security definer é o
-- que permite ao service_role (que não tem acesso direto ao schema vault via
-- PostgREST) ler vault.decrypted_secrets sem que essa exposição seja geral —
-- só esta função, para uma conexão específica, atravessa a fronteira.
create or replace function public.get_channel_credentials(p_connection_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_secret text;
begin
  select ds.decrypted_secret into v_secret
  from vault.decrypted_secrets ds
  join channel_connections cc on cc.credential_secret_id = ds.id
  where cc.id = p_connection_id;

  if v_secret is null then
    return null;
  end if;

  return v_secret::jsonb;
end;
$$;

revoke all on function public.get_channel_credentials(uuid) from public;
grant execute on function public.get_channel_credentials(uuid) to service_role;

-- Cria uma conexão de canal + guarda a credencial no Vault, numa única
-- transação. security definer é necessário para chamar vault.create_secret
-- (authenticated não tem acesso direto ao schema vault); por isso a função
-- refaz a checagem de admin manualmente antes de fazer qualquer coisa — sem
-- essa checagem, security definer contornaria a RLS de channel_connections.
create or replace function public.create_channel_connection(
  p_organization_id uuid,
  p_channel text,
  p_provider text,
  p_external_ref text,
  p_credentials jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_secret_id uuid;
  v_connection_id uuid;
begin
  if not private.is_org_admin(p_organization_id) then
    raise exception 'somente admin/owner pode conectar um canal';
  end if;

  v_secret_id := vault.create_secret(p_credentials::text, p_external_ref, 'credenciais de ' || p_provider);

  insert into channel_connections (organization_id, channel, provider, external_ref, credential_secret_id)
  values (p_organization_id, p_channel, p_provider, p_external_ref, v_secret_id)
  returning id into v_connection_id;

  return v_connection_id;
end;
$$;

revoke all on function public.create_channel_connection(uuid, text, text, text, jsonb) from public;
grant execute on function public.create_channel_connection(uuid, text, text, text, jsonb) to authenticated;
