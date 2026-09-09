-- Substitui expand_campaign para interpretar segments.definition em vez de
-- tratar "todo contato com opt-in" como a única audiência possível.
--
-- Formato suportado por enquanto (guardado em segments.definition):
--   {"type": "all"}              -- todo contato com opt-in no canal (padrão
--                                   quando a campanha não tem segment_id)
--   {"type": "tag", "tag": "x"}  -- contatos cujo custom_fields->'tags'
--                                   (um array jsonb) contém "x"
--
-- create or replace preserva o nome/assinatura da função já em produção —
-- não precisa dropar nem recriar grants.
create or replace function public.expand_campaign(p_campaign_id uuid)
returns int
language plpgsql
as $$
declare
  v_campaign campaigns%rowtype;
  v_segment segments%rowtype;
  v_inserted int;
begin
  select * into v_campaign from campaigns where id = p_campaign_id;
  if not found then
    return 0;
  end if;

  if v_campaign.segment_id is not null then
    select * into v_segment from segments where id = v_campaign.segment_id;
  end if;

  insert into campaign_recipients (organization_id, campaign_id, contact_id, contact_channel_id, status)
  select cc.organization_id, v_campaign.id, cc.contact_id, cc.id, 'pending'
  from contact_channels cc
  join contacts c on c.id = cc.contact_id
  where cc.organization_id = v_campaign.organization_id
    and cc.channel = v_campaign.channel
    and cc.opt_in = true
    and (
      v_segment.id is null
      or v_segment.definition ->> 'type' = 'all'
      or (
        v_segment.definition ->> 'type' = 'tag'
        and c.custom_fields -> 'tags' @> to_jsonb(v_segment.definition ->> 'tag')
      )
    )
  on conflict (campaign_id, contact_id) do nothing;

  get diagnostics v_inserted = row_count;

  update campaigns set status = 'sending' where id = v_campaign.id;

  return v_inserted;
end;
$$;

revoke all on function public.expand_campaign(uuid) from public;
grant execute on function public.expand_campaign(uuid) to service_role;
