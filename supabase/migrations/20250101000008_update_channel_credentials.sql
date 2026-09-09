-- create_channel_connection só cria. Token da Cloud API expira (~60 dias
-- pra token de usuário; menos em alguns fluxos) e, sem isto, girar a
-- credencial exigia apagar e recriar a conexão inteira — perdendo o
-- histórico e trocando o id que outras linhas referenciam.
create or replace function public.update_channel_connection_credentials(
  p_connection_id uuid,
  p_credentials jsonb
)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_org uuid;
  v_secret_id uuid;
begin
  select organization_id, credential_secret_id into v_org, v_secret_id
  from channel_connections
  where id = p_connection_id;

  if v_org is null then
    raise exception 'conexão não encontrada';
  end if;

  if not private.is_org_admin(v_org) then
    raise exception 'somente admin/owner pode atualizar credenciais';
  end if;

  perform vault.update_secret(v_secret_id, p_credentials::text);
end;
$$;

revoke all on function public.update_channel_connection_credentials(uuid, jsonb) from public;
grant execute on function public.update_channel_connection_credentials(uuid, jsonb) to authenticated;
