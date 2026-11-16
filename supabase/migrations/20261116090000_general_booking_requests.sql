alter table public.booking_requests
  add column if not exists date_flexible boolean not null default false,
  add column if not exists preferred_zone text not null default '';

comment on column public.booking_requests.date_flexible is
  'Indique que le client accepte plusieurs dates pour sa demande générale.';

comment on column public.booking_requests.preferred_zone is
  'Zone géographique souhaitée pour une demande sans lieu présélectionné.';
