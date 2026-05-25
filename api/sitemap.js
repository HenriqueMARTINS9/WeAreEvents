const siteUrl = (process.env.VITE_SITE_URL || process.env.PUBLIC_SITE_URL || "https://www.wearevents.fr").replace(/\/$/, "");
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE || process.env.SUPABASE_ANON_KEY;

const staticUrls = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/recherche", changefreq: "daily", priority: "0.9" },
  { path: "/blog", changefreq: "weekly", priority: "0.7" },
  { path: "/mentions-legales", changefreq: "yearly", priority: "0.3" },
  { path: "/cgu", changefreq: "yearly", priority: "0.3" },
  { path: "/politique-confidentialite", changefreq: "yearly", priority: "0.3" },
];

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const getDate = (value) => {
  if (!value) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return date.toISOString().slice(0, 10);
};

const buildUrl = ({ path, lastmod, changefreq, priority }) => {
  const loc = `${siteUrl}${path === "/" ? "" : path}`;
  const lastmodTag = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : "";

  return `  <url>
    <loc>${escapeXml(loc)}</loc>${lastmodTag}
    <changefreq>${escapeXml(changefreq)}</changefreq>
    <priority>${escapeXml(priority)}</priority>
  </url>`;
};

const fetchSupabaseRows = async (table, params) => {
  if (!supabaseUrl || !supabaseKey) return [];

  const url = new URL(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/${table}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url, {
    headers: {
      apikey: supabaseKey,
      authorization: `Bearer ${supabaseKey}`,
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase ${table} sitemap fetch failed with ${response.status}`);
  }

  return response.json();
};

const getDynamicUrls = async () => {
  const [venues, blogPosts] = await Promise.all([
    fetchSupabaseRows("venues", {
      select: "slug,updated_at",
      active: "eq.true",
      order: "updated_at.desc",
    }),
    fetchSupabaseRows("blog_posts", {
      select: "slug,updated_at,published_at",
      published: "eq.true",
      order: "published_at.desc",
    }),
  ]);

  return [
    ...venues
      .filter((venue) => venue.slug)
      .map((venue) => ({
        path: `/salle/${venue.slug}`,
        lastmod: getDate(venue.updated_at),
        changefreq: "weekly",
        priority: "0.8",
      })),
    ...blogPosts
      .filter((post) => post.slug)
      .map((post) => ({
        path: `/blog/${post.slug}`,
        lastmod: getDate(post.updated_at || post.published_at),
        changefreq: "monthly",
        priority: "0.6",
      })),
  ];
};

const buildSitemap = (urls) => {
  const uniqueUrls = Array.from(new Map(urls.map((url) => [url.path, url])).values());

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueUrls.map(buildUrl).join("\n")}
</urlset>
`;
};

export default async function handler(_request, response) {
  let dynamicUrls = [];

  try {
    dynamicUrls = await getDynamicUrls();
  } catch (error) {
    console.error(error);
  }

  response.setHeader("Content-Type", "application/xml; charset=utf-8");
  response.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
  response.status(200).send(buildSitemap([...staticUrls, ...dynamicUrls]));
}
