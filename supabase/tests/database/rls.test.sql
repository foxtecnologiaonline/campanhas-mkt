-- Testes de RLS com pgTAP.
--
-- STATUS: escritos e revisados, mas NUNCA EXECUTADOS nesta sessão — não
-- havia Docker funcional nem a CLI do Supabase disponíveis no ambiente em
-- que isto foi escrito, e sem eles não dá pra rodar `supabase test db`
-- (que sobe um Postgres local com pgTAP pra isso). Rodar antes de confiar
-- nestas garantias:
--
--   npx supabase test db
--
-- Dependem da extensão supabase_test_helpers (github.com/usebasejump/
-- supabase-test-helpers), que precisa estar instalada no projeto local —
-- é o padrão hoje recomendado pelo próprio Supabase pra mockar usuários
-- autenticados em teste (tests.create_supabase_user / tests.authenticate_as
-- / tests.get_supabase_uid). Os nomes exatos dessas funções podem ter
-- mudado entre versões do pacote — conferir contra a versão instalada se
-- os testes não rodarem de primeira.
--
-- Cobertura: isolamento entre organizações em `contacts` (select e insert),
-- restrição de admin/owner em `channel_connections`, e que `webhook_events`
-- não é visível por nenhum usuário autenticado (só service_role, que
-- ignora RLS e por isso nem entra no escopo deste teste).

begin;
select plan(6);

select tests.create_supabase_user('owner_a@example.com');
select tests.create_supabase_user('agent_a@example.com');
select tests.create_supabase_user('owner_b@example.com');

-- Organização A: um owner e um agent.
insert into organizations (id, name) values ('11111111-1111-1111-1111-111111111111', 'Org A (teste)');
insert into memberships (organization_id, user_id, role)
values
  ('11111111-1111-1111-1111-111111111111', tests.get_supabase_uid('owner_a@example.com'), 'owner'),
  ('11111111-1111-1111-1111-111111111111', tests.get_supabase_uid('agent_a@example.com'), 'agent');

-- Organização B: isolada, só pra provar que não vaza pra A.
insert into organizations (id, name) values ('22222222-2222-2222-2222-222222222222', 'Org B (teste)');
insert into memberships (organization_id, user_id, role)
values ('22222222-2222-2222-2222-222222222222', tests.get_supabase_uid('owner_b@example.com'), 'owner');

insert into contacts (id, organization_id, full_name)
values ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Contato da Org A');

-- 1. Owner da Org A enxerga o contato da própria organização.
select tests.authenticate_as('owner_a@example.com');
select is(
  (select count(*)::int from contacts where id = '33333333-3333-3333-3333-333333333333'),
  1,
  'owner da Org A vê contato da própria organização'
);

-- 2. Owner da Org B não enxerga o contato da Org A.
select tests.authenticate_as('owner_b@example.com');
select is(
  (select count(*)::int from contacts where id = '33333333-3333-3333-3333-333333333333'),
  0,
  'owner da Org B não vê contato da Org A'
);

-- 3. Owner da Org B não consegue inserir um contato na Org A.
select throws_ok(
  $$insert into contacts (organization_id, full_name) values ('11111111-1111-1111-1111-111111111111', 'invasão')$$,
  'new row violates row-level security policy for table "contacts"',
  null,
  'owner da Org B não consegue inserir contato na Org A'
);

-- 4. Agent da Org A não consegue conectar um canal (só admin/owner).
select tests.authenticate_as('agent_a@example.com');
select throws_ok(
  $$select create_channel_connection('11111111-1111-1111-1111-111111111111'::uuid, 'whatsapp', 'whatsapp_cloud', 'teste-123', '{"accessToken":"x","phoneNumberId":"teste-123"}'::jsonb)$$,
  'somente admin/owner pode conectar um canal',
  null,
  'agent não consegue conectar canal'
);

-- 5. Owner da Org A consegue conectar um canal.
select tests.authenticate_as('owner_a@example.com');
select lives_ok(
  $$select create_channel_connection('11111111-1111-1111-1111-111111111111'::uuid, 'whatsapp', 'whatsapp_cloud', 'teste-123', '{"accessToken":"x","phoneNumberId":"teste-123"}'::jsonb)$$,
  'owner consegue conectar canal'
);

-- 6. webhook_events não tem nenhuma policy — nenhum usuário autenticado
-- enxerga nada ali, nem mesmo o dono da organização.
select is(
  (select count(*)::int from webhook_events),
  0,
  'usuário autenticado não enxerga nenhuma linha de webhook_events'
);

select * from finish();
rollback;
