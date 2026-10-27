alter table public.booking_requests
  add column if not exists venue_response_token uuid not null default gen_random_uuid(),
  add column if not exists venue_response_status text not null default 'waiting',
  add column if not exists venue_response_at timestamptz,
  add column if not exists venue_response_reason text,
  add column if not exists venue_response_conditions text,
  add column if not exists venue_response_reminder_due_at timestamptz,
  add column if not exists venue_response_reminder_sent_at timestamptz,
  add column if not exists venue_response_reminder_last_error text,
  add column if not exists loss_reason text;

alter table public.booking_requests
  alter column venue_response_reminder_due_at set default (now() + interval '24 hours');

create unique index if not exists booking_requests_venue_response_token_idx
on public.booking_requests (venue_response_token);

create index if not exists booking_requests_venue_response_reminders_due_idx
on public.booking_requests (venue_response_reminder_due_at)
where venue_response_status = 'waiting' and venue_response_reminder_sent_at is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'booking_requests_venue_response_status_check'
  ) then
    alter table public.booking_requests
      add constraint booking_requests_venue_response_status_check
      check (venue_response_status in ('waiting', 'available', 'unavailable', 'conditions_sent'));
  end if;
end $$;
