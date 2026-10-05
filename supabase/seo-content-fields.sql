alter table public.seo_metadata add column if not exists intro text not null default '';
alter table public.seo_metadata add column if not exists guide text not null default '';
alter table public.seo_metadata add column if not exists faq jsonb not null default '[]'::jsonb;

update public.venues
set slug = 'letage-du-mirasol'
where slug in ('l''étage-du-mirasol', 'l’étage-du-mirasol');
