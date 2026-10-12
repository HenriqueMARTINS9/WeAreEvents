alter table public.venues
  add column if not exists faq jsonb not null default '[]'::jsonb;

alter table public.blog_posts
  add column if not exists venue_slugs text[] not null default '{}';
