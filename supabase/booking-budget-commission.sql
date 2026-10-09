alter table public.booking_requests
  add column if not exists budget_range text,
  add column if not exists commission_amount numeric(10, 2);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'booking_requests_commission_amount_check'
  ) then
    alter table public.booking_requests
      add constraint booking_requests_commission_amount_check
      check (commission_amount is null or commission_amount >= 0);
  end if;
end $$;
