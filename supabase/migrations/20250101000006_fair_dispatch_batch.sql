-- Antes, o worker drenava um lote global de campaign_recipients pendentes
-- (join simples, limit único) — uma campanha grande de um tenant podia
-- monopolizar o lote inteiro do tick e atrasar o envio de outras
-- organizações. Esta função garante um teto por campanha: no máximo
-- p_per_campaign destinatários de cada uma das p_max_campaigns campanhas
-- ativas mais antigas, por tick.
create or replace function public.list_pending_recipients(
  p_per_campaign int default 10,
  p_max_campaigns int default 10
)
returns setof campaign_recipients
language sql
as $$
  with due_campaigns as (
    select id
    from campaigns
    where status = 'sending'
    order by scheduled_at
    limit p_max_campaigns
  )
  select r.*
  from due_campaigns dc
  cross join lateral (
    select *
    from campaign_recipients r
    where r.campaign_id = dc.id
      and r.status = 'pending'
      and (r.retry_after is null or r.retry_after <= now())
    order by r.created_at
    limit p_per_campaign
  ) r;
$$;

revoke all on function public.list_pending_recipients(int, int) from public;
grant execute on function public.list_pending_recipients(int, int) to service_role;
