alter table public.venues add column if not exists seo_title text not null default '';
alter table public.venues add column if not exists meta_description text not null default '';
