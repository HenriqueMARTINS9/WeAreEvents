create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wearevents-images', 'wearevents-images', true, 262144000, null)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  tagline text not null default '',
  description text not null default '',
  city text not null default '',
  address text not null default '',
  location jsonb not null default '{"lat": 0, "lng": 0}'::jsonb,
  venue_code text not null unique,
  min_capacity integer not null default 0,
  max_capacity integer not null default 0,
  event_categories text[] not null default '{}',
  venue_types text[] not null default '{}',
  services text[] not null default '{}',
  spaces jsonb not null default '[]'::jsonb,
  access_details text[] not null default '{}',
  useful_information text[] not null default '{}',
  pricing_text text not null default '',
  price_amount numeric(10, 2),
  price_type text,
  cover_image text not null default '',
  gallery text[] not null default '{}',
  video_url text,
  video_start_seconds integer not null default 0,
  video_end_seconds integer,
  tiktok_url text,
  google_review_url text not null default '',
  seo_title text not null default '',
  meta_description text not null default '',
  price_tier text not null default '€€',
  closing_time text not null default '',
  ambiance_types text[] not null default '{}',
  external_options text[] not null default '{}',
  privatization_types text[] not null default '{}',
  guest_dispositions text[] not null default '{}',
  space_types text[] not null default '{}',
  option_features text[] not null default '{}',
  metro_access text,
  featured boolean not null default false,
  active boolean not null default true,
  contact_email text not null default '',
  rating numeric(2, 1) not null default 0,
  review_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.venues add column if not exists video_start_seconds integer not null default 0;
alter table public.venues add column if not exists video_end_seconds integer;
alter table public.venues add column if not exists price_tier text not null default '€€';
alter table public.venues add column if not exists closing_time text not null default '';
alter table public.venues add column if not exists ambiance_types text[] not null default '{}';
alter table public.venues add column if not exists external_options text[] not null default '{}';
alter table public.venues add column if not exists venue_types text[] not null default '{}';
alter table public.venues add column if not exists privatization_types text[] not null default '{}';
alter table public.venues add column if not exists guest_dispositions text[] not null default '{}';
alter table public.venues add column if not exists space_types text[] not null default '{}';
alter table public.venues add column if not exists option_features text[] not null default '{}';
alter table public.venues add column if not exists metro_access text;
alter table public.venues add column if not exists seo_title text not null default '';
alter table public.venues add column if not exists meta_description text not null default '';
alter table public.venues add column if not exists price_amount numeric(10, 2);
alter table public.venues add column if not exists price_type text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'venues_price_type_check'
  ) then
    alter table public.venues
      add constraint venues_price_type_check
      check (price_type is null or price_type in ('per_person', 'minimum_spend', 'venue_hire'));
  end if;
end;
$$;

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text not null default '',
  title text not null,
  excerpt text not null default '',
  content text not null default '',
  read_time text not null default '',
  image text not null default '',
  secondary_keywords text[] not null default '{}',
  seo_title text not null default '',
  meta_description text not null default '',
  published boolean not null default true,
  published_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.blog_posts add column if not exists secondary_keywords text[] not null default '{}';
alter table public.blog_posts add column if not exists seo_title text not null default '';
alter table public.blog_posts add column if not exists meta_description text not null default '';

create table if not exists public.seo_metadata (
  id uuid primary key default gen_random_uuid(),
  page_path text not null unique,
  title text not null default '',
  description text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.booking_requests (
  id text primary key,
  venue_id uuid references public.venues(id) on delete set null,
  venue_code text not null default '',
  venue_title text not null default '',
  venue_city text not null default '',
  first_name text not null default '',
  last_name text not null default '',
  email text not null default '',
  phone text not null default '',
  desired_date date,
  start_time text not null default '',
  end_time text not null default '',
  guest_count integer not null default 0,
  event_type text not null default '',
  requested_spaces text[] not null default '{}',
  message text,
  landing_page text not null default '',
  referrer text not null default '',
  traffic_source text not null default '',
  utm_source text not null default '',
  utm_medium text not null default '',
  utm_campaign text not null default '',
  interaction_source text not null default '',
  review_token uuid not null default gen_random_uuid(),
  review_email_scheduled_at timestamptz,
  review_email_sent_at timestamptz,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.booking_requests add column if not exists venue_id uuid references public.venues(id) on delete set null;
alter table public.booking_requests add column if not exists venue_code text not null default '';
alter table public.booking_requests add column if not exists venue_title text not null default '';
alter table public.booking_requests add column if not exists venue_city text not null default '';
alter table public.booking_requests add column if not exists first_name text not null default '';
alter table public.booking_requests add column if not exists last_name text not null default '';
alter table public.booking_requests add column if not exists email text not null default '';
alter table public.booking_requests add column if not exists phone text not null default '';
alter table public.booking_requests add column if not exists desired_date date;
alter table public.booking_requests add column if not exists start_time text not null default '';
alter table public.booking_requests add column if not exists end_time text not null default '';
alter table public.booking_requests add column if not exists guest_count integer not null default 0;
alter table public.booking_requests add column if not exists event_type text not null default '';
alter table public.booking_requests add column if not exists requested_spaces text[] not null default '{}';
alter table public.booking_requests add column if not exists message text;
alter table public.booking_requests add column if not exists status text not null default 'new';
alter table public.booking_requests add column if not exists landing_page text not null default '';
alter table public.booking_requests add column if not exists referrer text not null default '';
alter table public.booking_requests add column if not exists traffic_source text not null default '';
alter table public.booking_requests add column if not exists utm_source text not null default '';
alter table public.booking_requests add column if not exists utm_medium text not null default '';
alter table public.booking_requests add column if not exists utm_campaign text not null default '';
alter table public.booking_requests add column if not exists interaction_source text not null default '';
alter table public.booking_requests add column if not exists review_token uuid not null default gen_random_uuid();
alter table public.booking_requests add column if not exists review_email_scheduled_at timestamptz;
alter table public.booking_requests add column if not exists review_email_sent_at timestamptz;

create unique index if not exists booking_requests_review_token_idx
on public.booking_requests (review_token);

create table if not exists public.venue_reviews (
  id uuid primary key default gen_random_uuid(),
  booking_request_id text not null unique references public.booking_requests(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  review_token uuid not null unique,
  author_name text not null default '',
  rating integer not null check (rating between 1 and 5),
  comment text not null check (char_length(comment) between 10 and 1200),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.prepare_venue_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  booking public.booking_requests;
begin
  select * into booking
  from public.booking_requests
  where review_token = new.review_token
    and status = 'confirmed';

  if booking.id is null then
    raise exception 'Lien d''avis invalide ou réservation non confirmée';
  end if;

  new.booking_request_id = booking.id;
  new.venue_id = booking.venue_id;
  new.author_name = trim(concat(booking.first_name, ' ', left(booking.last_name, 1), case when booking.last_name <> '' then '.' else '' end));
  return new;
end;
$$;

drop trigger if exists venue_reviews_prepare on public.venue_reviews;
create trigger venue_reviews_prepare
before insert on public.venue_reviews
for each row execute function public.prepare_venue_review();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists venues_set_updated_at on public.venues;
create trigger venues_set_updated_at
before update on public.venues
for each row execute function public.set_updated_at();

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
before update on public.blog_posts
for each row execute function public.set_updated_at();

drop trigger if exists seo_metadata_set_updated_at on public.seo_metadata;
create trigger seo_metadata_set_updated_at
before update on public.seo_metadata
for each row execute function public.set_updated_at();

drop trigger if exists booking_requests_set_updated_at on public.booking_requests;
create trigger booking_requests_set_updated_at
before update on public.booking_requests
for each row execute function public.set_updated_at();

drop trigger if exists venue_reviews_set_updated_at on public.venue_reviews;
create trigger venue_reviews_set_updated_at
before update on public.venue_reviews
for each row execute function public.set_updated_at();

alter table public.venues enable row level security;
alter table public.blog_posts enable row level security;
alter table public.seo_metadata enable row level security;
alter table public.booking_requests enable row level security;
alter table public.venue_reviews enable row level security;

drop policy if exists "Public can read active venues" on public.venues;
create policy "Public can read active venues"
on public.venues for select
using (active = true);

drop policy if exists "Authenticated users can manage venues" on public.venues;
create policy "Authenticated users can manage venues"
on public.venues for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public can read published blog posts" on public.blog_posts;
create policy "Public can read published blog posts"
on public.blog_posts for select
using (published = true);

drop policy if exists "Authenticated users can manage blog posts" on public.blog_posts;
create policy "Authenticated users can manage blog posts"
on public.blog_posts for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public can read active SEO metadata" on public.seo_metadata;
create policy "Public can read active SEO metadata"
on public.seo_metadata for select
using (active = true);

drop policy if exists "Authenticated users can manage SEO metadata" on public.seo_metadata;
create policy "Authenticated users can manage SEO metadata"
on public.seo_metadata for all
to authenticated
using (true)
with check (true);

drop policy if exists "Anyone can create booking requests" on public.booking_requests;
create policy "Anyone can create booking requests"
on public.booking_requests for insert
to anon
with check (true);

drop policy if exists "Authenticated users can manage booking requests" on public.booking_requests;
create policy "Authenticated users can manage booking requests"
on public.booking_requests for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public can read published venue reviews" on public.venue_reviews;
create policy "Public can read published venue reviews"
on public.venue_reviews for select
using (published = true);

drop policy if exists "Anyone can submit a confirmed booking review" on public.venue_reviews;
create policy "Anyone can submit a confirmed booking review"
on public.venue_reviews for insert
to anon
with check (true);

drop policy if exists "Authenticated users can manage venue reviews" on public.venue_reviews;
create policy "Authenticated users can manage venue reviews"
on public.venue_reviews for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public can read WeAreEvents images" on storage.objects;
-- Public buckets serve files by URL without a storage.objects SELECT policy.
-- Keeping SELECT closed prevents clients from listing every file in the bucket.

drop policy if exists "Authenticated users can upload WeAreEvents images" on storage.objects;
create policy "Authenticated users can upload WeAreEvents images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'wearevents-images');

drop policy if exists "Authenticated users can update WeAreEvents images" on storage.objects;
create policy "Authenticated users can update WeAreEvents images"
on storage.objects for update
to authenticated
using (bucket_id = 'wearevents-images')
with check (bucket_id = 'wearevents-images');

drop policy if exists "Authenticated users can delete WeAreEvents images" on storage.objects;
create policy "Authenticated users can delete WeAreEvents images"
on storage.objects for delete
to authenticated
using (bucket_id = 'wearevents-images');
