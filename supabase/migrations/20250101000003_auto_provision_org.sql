-- Ao criar a conta (primeiro login via magic link), o usuário já ganha uma
-- organização própria como owner — sem isso, o painel não teria como saber
-- em qual tenant operar e precisaria de um passo manual de admin só para
-- começar a usar o produto.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  insert into organizations (name)
  values (coalesce(new.email, 'Nova organização'))
  returning id into v_org_id;

  insert into memberships (organization_id, user_id, role)
  values (v_org_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
