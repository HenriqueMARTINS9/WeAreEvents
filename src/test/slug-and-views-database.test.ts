// @vitest-environment node
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const venueId = "00000000-0000-4000-8000-000000000001";
const otherId = "00000000-0000-4000-8000-000000000002";
const postId = "00000000-0000-4000-8000-000000000003";
let db: PGlite;
const rows = async (sql: string, params: unknown[] = []) => (await db.query(sql, params)).rows;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create table public.venues (id uuid primary key, slug text unique not null, title text not null, active boolean default true);
    create table public.blog_posts (id uuid primary key, slug text unique not null, published boolean default true);
    alter table public.venues enable row level security;
    alter table public.blog_posts enable row level security;
    grant select on public.venues, public.blog_posts to anon, authenticated;
    create policy venue_read on public.venues for select using (active);
    create policy post_read on public.blog_posts for select using (published);
    insert into public.venues values ('${venueId}', 'le-myra', 'Le Myra', true), ('${otherId}', 'autre-lieu', 'Autre lieu', true);
    insert into public.blog_posts values ('${postId}', 'article-original', true);
  `);
  await db.exec(await readFile(new URL("../../supabase/migrations/20261118090000_slug_redirects_and_venue_views.sql", import.meta.url), "utf8"));
}, 30000);

afterAll(async () => { await db?.close(); });

describe.sequential("slug redirect transactions in PostgreSQL", () => {
  it("backfills the urgent redirect and follows multiple renames directly", async () => {
    expect(await rows("select source_path, target_path from public.redirects")).toEqual([{ source_path: "/salle/le-paris-clandestin", target_path: "/salle/le-myra" }]);
    await db.exec(`update public.venues set slug = 'myra-renomme' where id = '${venueId}'; update public.venues set slug = 'myra-final' where id = '${venueId}';`);
    expect(await rows("select distinct target_path from public.redirects")).toEqual([{ target_path: "/salle/myra-final" }]);
    expect((await rows("select * from public.redirects")).length).toBe(3);
  });

  it("supports reverting a slug without a self redirect or loop", async () => {
    await db.exec(`update public.venues set slug = 'le-myra' where id = '${venueId}'`);
    expect(await rows("select * from public.redirects where source_path = '/salle/le-myra'")).toEqual([]);
    expect(await rows("select distinct target_path from public.redirects")).toEqual([{ target_path: "/salle/le-myra" }]);
  });

  it("reserves historic aliases against reuse and rolls back the failed edit", async () => {
    await expect(db.exec(`update public.venues set slug = 'myra-final' where id = '${otherId}'`)).rejects.toThrow("réservé");
    expect(await rows(`select slug from public.venues where id = '${otherId}'`)).toEqual([{ slug: "autre-lieu" }]);
    await expect(db.exec("insert into public.venues values ('00000000-0000-4000-8000-000000000004', 'myra-final', 'Intrus', true)")).rejects.toThrow("réservé");
  });

  it("records article aliases independently, including unchanged slugs", async () => {
    await db.exec(`update public.blog_posts set slug = 'article-nouveau' where id = '${postId}'; update public.blog_posts set slug = 'article-final' where id = '${postId}'; update public.blog_posts set slug = 'article-final' where id = '${postId}';`);
    expect(await rows("select source_path, target_path from public.redirects where blog_post_id is not null order by source_path")).toEqual([
      { source_path: "/blog/article-nouveau", target_path: "/blog/article-final" },
      { source_path: "/blog/article-original", target_path: "/blog/article-final" },
    ]);
  });

  it("hides aliases of unpublished content and forbids public writes", async () => {
    await db.exec(`update public.blog_posts set published = false where id = '${postId}'; set role anon;`);
    try {
      expect(await rows("select * from public.redirects where blog_post_id is not null")).toEqual([]);
      await expect(db.exec("delete from public.redirects")).rejects.toThrow("permission denied");
    } finally { await db.exec("reset role"); }
  });
});

describe.sequential("venue page view storage and reports", () => {
  it("accepts anonymous events once per UUID and rejects inactive or absent slugs", async () => {
    await db.exec(`update public.venues set active = false where id = '${otherId}'; set role anon;`);
    try {
      await db.exec(`
        select public.record_venue_page_view('le-myra', '10000000-0000-4000-8000-000000000001');
        select public.record_venue_page_view('le-myra', '10000000-0000-4000-8000-000000000001');
        select public.record_venue_page_view('autre-lieu', '10000000-0000-4000-8000-000000000002');
        select public.record_venue_page_view('absent', '10000000-0000-4000-8000-000000000003');
      `);
      await expect(db.exec("select * from public.venue_page_views")).rejects.toThrow("permission denied");
      await expect(db.exec("select * from public.venue_monthly_page_views('2026-11-01')")).rejects.toThrow("permission denied");
    } finally { await db.exec("reset role"); }
    expect(await rows("select slug, venue_id, viewed_at > now() - interval '1 minute' as recent from public.venue_page_views")).toEqual([{ slug: "le-myra", venue_id: venueId, recent: true }]);
    await db.exec("delete from public.venue_page_views");
  });

  it("uses Paris month boundaries, preserves views after renames, and includes zero counts", async () => {
    await db.exec(`
      insert into public.venue_page_views values
        ('20000000-0000-4000-8000-000000000001', '${venueId}', 'ancien-slug', '2026-10-31T22:59:59Z'),
        ('20000000-0000-4000-8000-000000000002', '${venueId}', 'ancien-slug', '2026-10-31T23:00:00Z'),
        ('20000000-0000-4000-8000-000000000003', '${venueId}', 'le-myra', '2026-11-30T22:59:59Z'),
        ('20000000-0000-4000-8000-000000000004', '${venueId}', 'le-myra', '2026-11-30T23:00:00Z');
      update public.venues set slug = 'myra-statistiques' where id = '${venueId}';
      set role authenticated;
    `);
    try {
      expect(await rows("select slug, views::integer from public.venue_monthly_page_views('2026-11-01')")).toEqual([
        { slug: "myra-statistiques", views: 2 }, { slug: "autre-lieu", views: 0 },
      ]);
      expect(await rows("select views::integer from public.venue_monthly_page_views('2026-12-01') where venue_id = $1", [venueId])).toEqual([{ views: 1 }]);
    } finally { await db.exec("reset role"); }
  });

  it("aggregates more than the default 1000-row REST limit", async () => {
    await db.exec(`insert into public.venue_page_views select gen_random_uuid(), '${venueId}', 'myra-statistiques', '2026-11-15T12:00:00Z' from generate_series(1, 1100)`);
    expect(await rows("select views::integer from public.venue_monthly_page_views('2026-11-01') where venue_id = $1", [venueId])).toEqual([{ views: 1102 }]);
  });
});
