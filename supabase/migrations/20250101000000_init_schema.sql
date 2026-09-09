-- Extensions
create extension if not exists pgcrypto;
create extension if not exists supabase_vault;

-- ============================================================================
-- Tenancy
-- ============================================================================

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'trial',
  created_at timestamptz not null default now()
);

create table memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'agent')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

-- ============================================================================
-- Audiência
-- ============================================================================

create table contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  full_name text,
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table contact_channels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  contact_id uuid not null references contacts (id) on delete cascade,
  channel text not null check (
    channel in ('whatsapp', 'telegram', 'sms', 'email', 'instagram', 'facebook', 'wifi', 'bluetooth')
  ),
  -- identificador do canal: telefone E.164 para whatsapp/sms, chat_id para telegram, endereço para email...
  external_id text not null,
  opt_in boolean not null default false,
  opt_in_at timestamptz,
  opt_in_source text,
  opt_out_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, channel, external_id)
);

create table segments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  -- regras de filtro sobre contacts/contact_channels; interpretado pela camada de aplicação
  definition jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Canais & credenciais
-- ============================================================================

create table channel_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  channel text not null default 'whatsapp',
  provider text not null check (provider in ('whatsapp_cloud', 'whatsapp_evolution')),
  -- phone_number_id (Cloud API) ou instance id (Evolution API): usado para resolver o
  -- tenant a partir de um webhook, sem nunca confiar num organization_id vindo do payload.
  external_ref text not null,
  -- aponta para vault.secrets.id; o segredo em si nunca fica nesta tabela nem em texto puro.
  credential_secret_id uuid not null,
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  unique (provider, external_ref)
);

create table message_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  channel text not null default 'whatsapp',
  name text not null,
  language text not null default 'pt_BR',
  category text,
  body text not null,
  variables jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (
    status in ('draft', 'pending_review', 'approved', 'rejected')
  ),
  provider_template_id text,
  created_at timestamptz not null default now(),
  unique (organization_id, channel, name, language)
);

-- ============================================================================
-- Campanhas & envio
-- ============================================================================

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  channel text not null default 'whatsapp',
  segment_id uuid references segments (id) on delete set null,
  template_id uuid references message_templates (id) on delete set null,
  scheduled_at timestamptz not null,
  status text not null default 'draft' check (
    status in ('draft', 'scheduled', 'expanding', 'sending', 'completed', 'canceled', 'failed')
  ),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  campaign_id uuid not null references campaigns (id) on delete cascade,
  contact_id uuid not null references contacts (id) on delete cascade,
  contact_channel_id uuid not null references contact_channels (id) on delete cascade,
  status text not null default 'pending' check (
    status in ('pending', 'queued', 'sent', 'delivered', 'read', 'failed', 'skipped_opt_out')
  ),
  created_at timestamptz not null default now(),
  unique (campaign_id, contact_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  campaign_id uuid references campaigns (id) on delete cascade,
  campaign_recipient_id uuid references campaign_recipients (id) on delete cascade,
  contact_id uuid not null references contacts (id) on delete cascade,
  channel text not null,
  direction text not null check (direction in ('outbound', 'inbound')),
  provider_message_id text,
  status text not null default 'queued' check (
    status in ('queued', 'sent', 'delivered', 'read', 'failed')
  ),
  error text,
  attempt_count int not null default 0,
  dead_letter_at timestamptz,
  body text,
  created_at timestamptz not null default now()
);

-- Idempotência: um único envio de saída por (campanha, contato). Reprocessar a
-- mesma tarefa da fila nunca gera uma segunda mensagem.
create unique index messages_campaign_contact_outbound_key
  on messages (campaign_id, contact_id)
  where campaign_id is not null and direction = 'outbound';

create table conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  contact_id uuid not null references contacts (id) on delete cascade,
  channel text not null,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, contact_id, channel)
);

-- Dedupe de webhooks: providers como a Meta reentregam eventos. A chave de
-- idempotência é calculada pelo parser do provider (ex.: id da mensagem, ou
-- hash de id+status+timestamp para atualizações de status).
create table webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  organization_id uuid references organizations (id) on delete set null,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create table usage_counters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  channel text not null,
  period date not null,
  sent_count int not null default 0,
  unique (organization_id, channel, period)
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations (id) on delete cascade,
  actor_type text not null check (actor_type in ('user', 'ai', 'system')),
  actor_id uuid,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Índices críticos (ver doc de arquitetura, seção "Eficiência & resiliência")
-- ============================================================================

create unique index contact_channels_identity_key
  on contact_channels (organization_id, channel, external_id);

create index messages_campaign_status_idx
  on messages (campaign_id, status);

create index campaign_recipients_pending_idx
  on campaign_recipients (campaign_id)
  where status = 'pending';

create index memberships_user_idx on memberships (user_id);
create index contacts_org_idx on contacts (organization_id);
create index campaigns_org_scheduled_idx on campaigns (organization_id, scheduled_at);
