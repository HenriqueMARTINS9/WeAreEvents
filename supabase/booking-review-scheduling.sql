create or replace function public.schedule_booking_review_followup()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'confirmed'
    and (tg_op = 'INSERT' or old.status is distinct from 'confirmed')
    and new.review_email_sent_at is null
  then
    if new.desired_date is not null then
      new.review_email_scheduled_at = greatest(
        ((new.desired_date + 2)::date + time '10:00') at time zone 'Europe/Paris',
        now()
      );
    else
      new.review_email_scheduled_at = now() + interval '2 days';
    end if;
    new.review_email_last_error = null;
  elsif new.status <> 'confirmed' and new.review_email_sent_at is null then
    new.review_email_scheduled_at = null;
    new.review_email_last_error = null;
  end if;

  return new;
end;
$$;

drop trigger if exists booking_requests_schedule_review_followup on public.booking_requests;
create trigger booking_requests_schedule_review_followup
before insert or update of status, desired_date on public.booking_requests
for each row execute function public.schedule_booking_review_followup();

update public.booking_requests
set review_email_scheduled_at = greatest(
  ((desired_date + 2)::date + time '10:00') at time zone 'Europe/Paris',
  now()
)
where status = 'confirmed'
  and desired_date is not null
  and review_email_sent_at is null
  and review_email_scheduled_at is null;
