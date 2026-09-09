-- Schema privado: funções auxiliares de RLS não expostas via PostgREST.
create schema if not exists private;

-- Um usuário sempre pode ver as próprias memberships (sem isso, is_org_member
-- ficaria circular: para checar acesso à organização X, precisamos antes
-- poder ler a linha de membership do próprio usuário).
alter table memberships enable row level security;

create policy memberships_select_own
  on memberships for select
  using (user_id = auth.uid());

create function private.is_org_member(org_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
  );
$$;

create function private.is_org_admin(org_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
  );
$$;

-- organizations ---------------------------------------------------------

alter table organizations enable row level security;

create policy organizations_select_member
  on organizations for select
  using (private.is_org_member(id));

create policy organizations_update_admin
  on organizations for update
  using (private.is_org_admin(id))
  with check (private.is_org_admin(id));

-- Tabelas de tenant padrão: membro lê e escreve, admin/owner exigido só onde
-- marcado explicitamente abaixo (credenciais de canal).
-- contacts ---------------------------------------------------------------

alter table contacts enable row level security;

create policy contacts_all_member
  on contacts for all
  using (private.is_org_member(organization_id))
  with check (private.is_org_member(organization_id));

-- contact_channels ---------------------------------------------------------

alter table contact_channels enable row level security;

create policy contact_channels_all_member
  on contact_channels for all
  using (private.is_org_member(organization_id))
  with check (private.is_org_member(organization_id));

-- segments -----------------------------------------------------------------

alter table segments enable row level security;

create policy segments_all_member
  on segments for all
  using (private.is_org_member(organization_id))
  with check (private.is_org_member(organization_id));

-- channel_connections: credenciais de canal só para admin/owner. Mesmo assim,
-- credential_secret_id só referencia o segredo — o valor decriptado nunca
-- passa por esta tabela nem por PostgREST (ver vault.decrypted_secrets).
alter table channel_connections enable row level security;

create policy channel_connections_select_member
  on channel_connections for select
  using (private.is_org_member(organization_id));

create policy channel_connections_write_admin
  on channel_connections for insert
  with check (private.is_org_admin(organization_id));

create policy channel_connections_update_admin
  on channel_connections for update
  using (private.is_org_admin(organization_id))
  with check (private.is_org_admin(organization_id));

create policy channel_connections_delete_admin
  on channel_connections for delete
  using (private.is_org_admin(organization_id));

-- message_templates ---------------------------------------------------------

alter table message_templates enable row level security;

create policy message_templates_all_member
  on message_templates for all
  using (private.is_org_member(organization_id))
  with check (private.is_org_member(organization_id));

-- campaigns / campaign_recipients / messages ---------------------------------

alter table campaigns enable row level security;

create policy campaigns_all_member
  on campaigns for all
  using (private.is_org_member(organization_id))
  with check (private.is_org_member(organization_id));

alter table campaign_recipients enable row level security;

create policy campaign_recipients_select_member
  on campaign_recipients for select
  using (private.is_org_member(organization_id));

alter table messages enable row level security;

create policy messages_select_member
  on messages for select
  using (private.is_org_member(organization_id));

-- conversations ---------------------------------------------------------

alter table conversations enable row level security;

create policy conversations_select_member
  on conversations for select
  using (private.is_org_member(organization_id));

-- usage_counters: leitura para o próprio tenant, escrita só via service role.

alter table usage_counters enable row level security;

create policy usage_counters_select_member
  on usage_counters for select
  using (private.is_org_member(organization_id));

-- audit_log: leitura para o próprio tenant; nenhuma escrita direta do client
-- (toda entrada é gravada pela camada de aplicação com a service role).

alter table audit_log enable row level security;

create policy audit_log_select_member
  on audit_log for select
  using (private.is_org_member(organization_id));

-- webhook_events: nenhuma policy criada de propósito. Com RLS habilitada e
-- zero policies, anon/authenticated não enxergam nem escrevem nada aqui —
-- só a service role (que sempre ignora RLS) processa webhooks.
alter table webhook_events enable row level security;

-- Segredos de canal: o Vault já não expõe vault.secrets/vault.decrypted_secrets
-- para os papéis anon/authenticated por padrão no Supabase. Este REVOKE fica
-- explícito aqui como defesa em profundidade, caso o padrão mude.
revoke all on vault.decrypted_secrets from anon, authenticated;
