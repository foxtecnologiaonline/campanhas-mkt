-- Pré-visualização de audiência: mesma lógica de filtro do expand_campaign,
-- só que contando em vez de inserir. Mantida como função separada (em vez de
-- expand_campaign(dry_run boolean)) pra não arriscar um "modo teste" acabar
-- gravando linha por engano — são caminhos de código totalmente distintos.
create or replace function public.count_segment_audience(
  p_organization_id uuid,
  p_channel text,
  p_segment_id uuid default null
)
returns int
language plpgsql
as $$
declare
  v_segment segments%rowtype;
  v_count int;
begin
  if not private.is_org_member(p_organization_id) then
    raise exception 'sem acesso a esta organização';
  end if;

  if p_segment_id is not null then
    select * into v_segment
    from segments
    where id = p_segment_id and organization_id = p_organization_id;
  end if;

  select count(*) into v_count
  from contact_channels cc
  join contacts c on c.id = cc.contact_id
  where cc.organization_id = p_organization_id
    and cc.channel = p_channel
    and cc.opt_in = true
    and (
      v_segment.id is null
      or v_segment.definition ->> 'type' = 'all'
      or (
        v_segment.definition ->> 'type' = 'tag'
        and c.custom_fields -> 'tags' @> to_jsonb(v_segment.definition ->> 'tag')
      )
    );

  return v_count;
end;
$$;

revoke all on function public.count_segment_audience(uuid, text, uuid) from public;
grant execute on function public.count_segment_audience(uuid, text, uuid) to authenticated;
