begin;

-- Keep aliases attached to the content ID, including after several renames.
create table if not exists public.redirects (
  source_path text primary key,
  target_path text not null,
  venue_id uuid references public.venues(id) on delete cascade,
  blog_post_id uuid references public.blog_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (num_nonnulls(venue_id, blog_post_id) = 1),
  check (source_path <> target_path),
  check (source_path ~ '^/(salle|blog)/[^/?#[:space:]]+$'),
  check (target_path ~ '^/(salle|blog)/[^/?#[:space:]]+$')
);
create index if not exists redirects_venue_id_idx on public.redirects(venue_id);
create index if not exists redirects_blog_post_id_idx on public.redirects(blog_post_id);

alter table public.redirects enable row level security;
revoke all on public.redirects from anon, authenticated;
grant select on public.redirects to anon, authenticated;
create policy "Read redirects to public content" on public.redirects for select
using (
  exists (select 1 from public.venues v where v.id = venue_id and v.active)
  or exists (select 1 from public.blog_posts b where b.id = blog_post_id and b.published)
);

create or replace function public.keep_slug_redirects()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  prefix text := case when tg_table_name = 'venues' then '/salle/' else '/blog/' end;
  alias public.redirects%rowtype;
begin
  -- Serialize slug allocation and renames in each namespace, including inserts.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('slug_redirects:' || tg_table_name));
  if tg_op = 'UPDATE' and old.slug is not distinct from new.slug then
    return new;
  end if;

  select * into alias from public.redirects where source_path = prefix || new.slug;
  if found and (case when tg_table_name = 'venues' then alias.venue_id else alias.blog_post_id end)
      is distinct from new.id then
    raise exception 'Ce slug est réservé par une ancienne URL. Choisissez un autre slug.';
  end if;

  if tg_op = 'UPDATE' then
    -- Returning to a former slug removes its alias, so no redirect loop can form.
    delete from public.redirects where source_path = prefix || new.slug;
    update public.redirects set target_path = prefix || new.slug
      where (tg_table_name = 'venues' and venue_id = new.id)
         or (tg_table_name = 'blog_posts' and blog_post_id = new.id);
    insert into public.redirects (source_path, target_path, venue_id, blog_post_id)
    values (prefix || old.slug, prefix || new.slug,
      case when tg_table_name = 'venues' then new.id end,
      case when tg_table_name = 'blog_posts' then new.id end);
  end if;
  return new;
end;
$$;
revoke all on function public.keep_slug_redirects() from public, anon, authenticated;

create trigger venues_keep_slug_redirects before insert or update of slug on public.venues
for each row execute function public.keep_slug_redirects();
create trigger blog_posts_keep_slug_redirects before insert or update of slug on public.blog_posts
for each row execute function public.keep_slug_redirects();

-- Backfill the already-renamed venue as well as the immediate hosting rule.
insert into public.redirects (source_path, target_path, venue_id)
select '/salle/le-paris-clandestin', '/salle/le-myra', id
from public.venues where slug = 'le-myra'
on conflict (source_path) do nothing;

create table if not exists public.venue_page_views (
  id uuid primary key,
  venue_id uuid references public.venues(id) on delete set null,
  slug text not null,
  viewed_at timestamptz not null default now()
);
create index if not exists venue_page_views_date_venue_idx on public.venue_page_views(viewed_at, venue_id);
alter table public.venue_page_views enable row level security;
revoke all on public.venue_page_views from anon, authenticated;

-- Clients cannot supply a timestamp, read events, or count inactive/missing venues.
-- The event UUID makes retrying the same page display idempotent.
create or replace function public.record_venue_page_view(p_slug text, p_view_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.venue_page_views (id, venue_id, slug)
  select p_view_id, id, slug from public.venues where slug = p_slug and active
  on conflict (id) do nothing;
$$;
revoke all on function public.record_venue_page_view(text, uuid) from public;
grant execute on function public.record_venue_page_view(text, uuid) to anon, authenticated;

-- Aggregate in the database, rather than truncating events at the REST row limit.
-- As in the existing back office, authenticated users have administrator access.
create or replace function public.venue_monthly_page_views(p_month date)
returns table (venue_id uuid, slug text, title text, views bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select v.id, v.slug, v.title, count(p.id)
  from public.venues v
  left join public.venue_page_views p on p.venue_id = v.id
    and p.viewed_at >= (date_trunc('month', p_month::timestamp) at time zone 'Europe/Paris')
    and p.viewed_at < ((date_trunc('month', p_month::timestamp) + interval '1 month') at time zone 'Europe/Paris')
  group by v.id, v.slug, v.title
  order by count(p.id) desc, v.title, v.id;
$$;
revoke all on function public.venue_monthly_page_views(date) from public, anon;
grant execute on function public.venue_monthly_page_views(date) to authenticated;

commit;
