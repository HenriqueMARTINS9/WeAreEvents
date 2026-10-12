create or replace function public.claim_due_review_followups(batch_size integer default 50)
returns setof public.booking_requests
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with due as (
    select booking_requests.id
    from public.booking_requests
    where status = 'confirmed'
      and review_email_sent_at is null
      and review_email_scheduled_at is not null
      and review_email_scheduled_at <= now()
    order by review_email_scheduled_at asc
    for update skip locked
    limit greatest(1, least(batch_size, 100))
  )
  update public.booking_requests as booking
  set
    review_email_scheduled_at = now() + interval '15 minutes',
    review_email_attempts = booking.review_email_attempts + 1,
    review_email_last_error = null
  from due
  where booking.id = due.id
  returning booking.*;
end;
$$;

revoke all on function public.claim_due_review_followups(integer) from public, anon, authenticated;
grant execute on function public.claim_due_review_followups(integer) to service_role;
