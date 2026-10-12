import { seoLandingPages } from "../src/data/seo-landings-data.js";
import { getIndexableSeoPages, getMatchingSeoVenues } from "../src/data/seo-venue-filter.js";

const siteUrl = (process.env.VITE_SITE_URL || process.env.PUBLIC_SITE_URL || "https://www.wearevents.fr").replace(/\/$/, "");
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const staticPages = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/blog", changefreq: "weekly", priority: "0.7" },
  { path: "/inspirations", changefreq: "weekly", priority: "0.7" },
  { path: "/tous-nos-lieux", changefreq: "weekly", priority: "0.8" },
  { path: "/faq", changefreq: "monthly", priority: "0.5" },
  { path: "/reseaux-sociaux", changefreq: "monthly", priority: "0.4" },
  { path: "/qui-sommes-nous", changefreq: "monthly", priority: "0.6" },
  { path: "/entreprises", changefreq: "monthly", priority: "0.7" },
];

const escapeXml = (value) => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&apos;");

const getDate = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
};

const latestDate = (values) => values
  .map((value) => value && new Date(value))
  .filter((date) => date && !Number.isNaN(date.getTime()))
  .sort((left, right) => right.getTime() - left.getTime())[0]?.toISOString().slice(0, 10);

const fetchSupabaseRows = async (table, params) => {
  if (!supabaseUrl || !supabaseKey) return [];
  const url = new URL(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/${table}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url, {
    headers: { apikey: supabaseKey, authorization: `Bearer ${supabaseKey}`, accept: "application/json" },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Supabase ${table} sitemap fetch failed with ${response.status}`);
  return response.json();
};

const fetchSitemapData = async () => {
  const [venues, posts, metadata] = await Promise.all([
    fetchSupabaseRows("venues", { select: "*", active: "eq.true", order: "updated_at.desc", limit: "1000" }),
    fetchSupabaseRows("blog_posts", { select: "slug,updated_at,published_at", published: "eq.true", order: "updated_at.desc", limit: "1000" }),
    fetchSupabaseRows("seo_metadata", { select: "page_path,updated_at", active: "eq.true", limit: "1000" }).catch(() => []),
  ]);
  return { venues, posts, metadata };
};

const buildUrl = ({ path, lastmod, changefreq, priority }) => {
  const loc = `${siteUrl}${path === "/" ? "" : path}`;
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : ""}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
};

const buildUrlSet = (urls) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from(new Map(urls.map((url) => [url.path, url])).values()).map(buildUrl).join("\n")}
</urlset>\n`;

const buildIndex = (lastmods) => `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${["pages", "venues", "blog"].map((type) => `  <sitemap>\n    <loc>${siteUrl}/sitemap-${type}.xml</loc>${lastmods[type] ? `\n    <lastmod>${lastmods[type]}</lastmod>` : ""}\n  </sitemap>`).join("\n")}
</sitemapindex>\n`;

const getSeoPriority = (slug) => {
  if (slug === "location-salle-paris") return "0.85";
  if (slug.startsWith("location-salle-paris-")) return "0.75";
  return "0.76";
};

const buildPartitions = ({ venues, posts, metadata }) => {
  const metadataDates = new Map(metadata.map((item) => [item.page_path, item.updated_at]));
  const latestVenue = latestDate(venues.map((venue) => venue.updated_at));
  const latestBlog = latestDate(posts.map((post) => post.updated_at || post.published_at));
  const seoPages = getIndexableSeoPages(venues, seoLandingPages);
  const pages = [
    ...staticPages.map((page) => ({ ...page, lastmod: getDate(metadataDates.get(page.path)) || (page.path === "/blog" ? latestBlog : latestVenue) })),
    ...seoPages.map((page) => ({
      path: `/${page.slug}`,
      lastmod: getDate(metadataDates.get(`/${page.slug}`)) || latestDate(getMatchingSeoVenues(venues, page).map((venue) => venue.updated_at)),
      changefreq: "weekly",
      priority: getSeoPriority(page.slug),
    })),
  ];
  const venueUrls = venues
    .filter((venue) => venue.slug && !["l'étage-du-mirasol", "l’étage-du-mirasol"].includes(venue.slug))
    .map((venue) => ({ path: `/salle/${venue.slug}`, lastmod: getDate(venue.updated_at), changefreq: "weekly", priority: "0.8" }));
  const blog = posts
    .filter((post) => post.slug)
    .map((post) => ({ path: `/blog/${post.slug}`, lastmod: getDate(post.updated_at || post.published_at), changefreq: "monthly", priority: "0.6" }));
  return { pages, venues: venueUrls, blog };
};

export default async function handler(request, response) {
  let partitions = { pages: staticPages, venues: [], blog: [] };
  try {
    partitions = buildPartitions(await fetchSitemapData());
  } catch (error) {
    console.error(error);
  }

  const requestedType = request.query?.type || new URL(request.url, siteUrl).searchParams.get("type");
  response.setHeader("Content-Type", "application/xml; charset=utf-8");
  response.setHeader("Cache-Control", "no-store, max-age=0");

  if (["pages", "venues", "blog"].includes(requestedType)) {
    response.status(200).send(buildUrlSet(partitions[requestedType]));
    return;
  }

  response.status(200).send(buildIndex({
    pages: latestDate(partitions.pages.map((item) => item.lastmod)),
    venues: latestDate(partitions.venues.map((item) => item.lastmod)),
    blog: latestDate(partitions.blog.map((item) => item.lastmod)),
  }));
}
