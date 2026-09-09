-- Backoff exponencial de verdade: sem isso, record_send_failure devolvia o
-- destinatário pra 'pending' e o próximo tick do worker tentava de novo na
-- hora — uma falha temporária do provedor virava rajada de retentativas em
-- vez de espera crescente.
alter table campaign_recipients add column retry_after timestamptz;

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
    update campaign_recipients set status = 'failed', retry_after = null where id = p_recipient_id;
  else
    -- 1, 2, 4, 8, 16 minutos... com teto de 30 min, pra não deixar uma
    -- mensagem realmente presa esperando quase uma hora sem motivo.
    update campaign_recipients
    set status = 'pending',
        retry_after = now() + (least(power(2, v_attempts), 30) * interval '1 minute')
    where id = p_recipient_id;
  end if;
end;
$$;

revoke all on function public.record_send_failure(uuid, uuid, text, int) from public;
grant execute on function public.record_send_failure(uuid, uuid, text, int) to service_role;
