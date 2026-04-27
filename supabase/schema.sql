create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public)
values ('wearevents-images', 'wearevents-images', true)
on conflict (id) do update set public = excluded.public;

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
  services text[] not null default '{}',
  spaces jsonb not null default '[]'::jsonb,
  access_details text[] not null default '{}',
  useful_information text[] not null default '{}',
  pricing_text text not null default '',
  cover_image text not null default '',
  gallery text[] not null default '{}',
  video_url text,
  video_start_seconds integer not null default 0,
  video_end_seconds integer,
  tiktok_url text,
  google_review_url text not null default '',
  price_tier text not null default '€€',
  closing_time text not null default '',
  ambiance_types text[] not null default '{}',
  external_options text[] not null default '{}',
  metro_access text,
  featured boolean not null default false,
  active boolean not null default true,
  contact_email text not null default '',
  rating numeric(2, 1) not null default 0,
  review_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text not null default '',
  title text not null,
  excerpt text not null default '',
  content text not null default '',
  read_time text not null default '',
  image text not null default '',
  published boolean not null default true,
  published_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

alter table public.venues enable row level security;
alter table public.blog_posts enable row level security;

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

drop policy if exists "Public can read WeAreEvents images" on storage.objects;
create policy "Public can read WeAreEvents images"
on storage.objects for select
using (bucket_id = 'wearevents-images');

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
