import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { seoLandingPages } from "../src/data/seo-landings-data.js";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(rootDir, "dist");
const siteUrl = (process.env.VITE_SITE_URL || "https://www.wearevents.fr").replace(/\/$/, "");
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const defaultImage = `${siteUrl}/og-image.svg`;
const seoIndexPath = "inspirations";
const seoIndexTitle = "Inspirations lieux événementiels à Paris | Wearevents";
const seoIndexDescription =
  "Toutes les recherches utiles pour trouver une salle à Paris : événement, capacité, ambiance, budget, équipements, horaires et options.";

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const escapeJsonForHtml = (value) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

const replaceOrInsertHeadTag = (html, matcher, tag) => {
  if (matcher.test(html)) return html.replace(matcher, tag);
  return html.replace("</head>", `    ${tag}\n  </head>`);
};

const normalizeSeoPath = (value = "/") => {
  const path = String(value || "/").split(/[?#]/)[0] || "/";
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  return withSlash === "/" ? "/" : withSlash.replace(/\/+$/, "");
};

const fetchSeoMetadataOverrides = async () => {
  if (!supabaseUrl || !supabaseKey) return new Map();

  try {
    const url = new URL(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/seo_metadata`);
    url.searchParams.set("select", "page_path,title,description");
    url.searchParams.set("active", "eq.true");
    url.searchParams.set("limit", "1000");

    const response = await fetch(url, {
      headers: {
        apikey: supabaseKey,
        authorization: `Bearer ${supabaseKey}`,
        accept: "application/json",
      },
    });

    if (!response.ok) throw new Error(`Supabase SEO metadata fetch failed with ${response.status}`);

    const rows = await response.json();
    return new Map(
      rows
        .filter((row) => row.page_path)
        .map((row) => [
          normalizeSeoPath(row.page_path),
          {
            title: String(row.title || "").trim(),
            description: String(row.description || "").trim(),
          },
        ]),
    );
  } catch (error) {
    console.warn(error);
    return new Map();
  }
};

const seoMetadataOverrides = await fetchSeoMetadataOverrides();

const applyMetadataOverride = (path, title, description) => {
  const override = seoMetadataOverrides.get(normalizeSeoPath(path));

  return {
    title: override?.title || title,
    description: override?.description || description,
  };
};

const applyPageMetadataOverride = (page) => ({
  ...page,
  ...applyMetadataOverride(`/${page.slug}`, page.title, page.description),
});

const buildJsonLd = (page) => [
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: page.h1,
    description: page.description,
    url: `${siteUrl}/${page.slug}`,
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: siteUrl },
      { "@type": "ListItem", position: 2, name: page.h1, item: `${siteUrl}/${page.slug}` },
    ],
  },
];

const renderStaticContent = (page) => `
      <main data-prerender-seo style="font-family:Inter,Arial,sans-serif;max-width:960px;margin:0 auto;padding:72px 24px;color:#171717;">
        <p style="margin:0 0 12px;color:#d94f6d;font-size:14px;font-weight:700;">${escapeHtml(page.eyebrow)}</p>
        <h1 style="margin:0;font-family:Georgia,serif;font-size:clamp(40px,7vw,72px);line-height:.98;">${escapeHtml(page.h1)}</h1>
        <p style="margin:24px 0 0;max-width:720px;font-size:18px;line-height:1.7;color:#525252;">${escapeHtml(page.intro)}</p>
        <p style="margin:28px 0 0;">
          <a href="${escapeHtml(page.searchUrl)}" style="display:inline-block;border-radius:8px;background:#d94f6d;color:#fff;padding:14px 18px;text-decoration:none;font-weight:700;">Voir les lieux disponibles</a>
        </p>
        <section style="margin-top:56px;">
          <h2 style="margin:0 0 18px;font-size:28px;">Questions fréquentes</h2>
          ${page.faq
            .map(
              (item) => `
          <article style="border-top:1px solid #e5e5e5;padding:18px 0;">
            <h3 style="margin:0;font-size:18px;">${escapeHtml(item.question)}</h3>
            <p style="margin:10px 0 0;color:#525252;line-height:1.65;">${escapeHtml(item.answer)}</p>
          </article>`,
            )
            .join("")}
        </section>
      </main>`;

const buildSeoIndexJsonLd = (description) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Inspirations lieux événementiels à Paris",
  description,
  url: `${siteUrl}/${seoIndexPath}`,
  mainEntity: {
    "@type": "ItemList",
    itemListElement: seoLandingPages.map((page, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: page.h1,
      url: `${siteUrl}/${page.slug}`,
    })),
  },
});

const renderSeoIndexStaticContent = (description) => `
      <main data-prerender-seo style="font-family:Inter,Arial,sans-serif;max-width:1120px;margin:0 auto;padding:72px 24px;color:#171717;">
        <p style="margin:0 0 12px;color:#d94f6d;font-size:14px;font-weight:700;">Inspirations</p>
        <h1 style="margin:0;font-family:Georgia,serif;font-size:clamp(40px,7vw,72px);line-height:.98;">Toutes les recherches pour trouver le bon lieu à Paris.</h1>
        <p style="margin:24px 0 0;max-width:760px;font-size:18px;line-height:1.7;color:#525252;">${escapeHtml(description)}</p>
        <section style="margin-top:56px;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;">
          ${seoLandingPages
            .map(
              (page) => `
          <a href="/${escapeHtml(page.slug)}" style="display:block;border:1px solid #e5e5e5;border-radius:8px;padding:14px 16px;color:#171717;text-decoration:none;">
            <strong style="display:block;font-size:15px;line-height:1.35;">${escapeHtml(page.h1)}</strong>
            <span style="display:block;margin-top:8px;color:#737373;font-size:13px;line-height:1.5;">${escapeHtml(page.intentLabel)} à ${escapeHtml(page.locationLabel)}</span>
          </a>`,
            )
            .join("")}
        </section>
      </main>`;

const applySeoMetadata = (template, page) => {
  const canonical = `${siteUrl}/${page.slug}`;
  let html = template;

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(page.title)}</title>`);
  html = replaceOrInsertHeadTag(html, /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${escapeHtml(canonical)}" />`);
  html = replaceOrInsertHeadTag(html, /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${escapeHtml(page.description)}">`);
  html = replaceOrInsertHeadTag(html, /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${escapeHtml(canonical)}" />`);
  html = replaceOrInsertHeadTag(html, /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${escapeHtml(page.title)}">`);
  html = replaceOrInsertHeadTag(html, /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${escapeHtml(page.description)}">`);
  html = replaceOrInsertHeadTag(html, /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${escapeHtml(defaultImage)}" />`);
  html = replaceOrInsertHeadTag(html, /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${escapeHtml(page.title)}">`);
  html = replaceOrInsertHeadTag(html, /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${escapeHtml(page.description)}">`);
  html = replaceOrInsertHeadTag(html, /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:image" content="${escapeHtml(defaultImage)}" />`);
  html = html.replace(
    "</head>",
    `    <script type="application/ld+json" id="wearevents-prerender-jsonld">${escapeJsonForHtml(buildJsonLd(page))}</script>\n  </head>`,
  );
  html = html.replace('<div id="root"></div>', `<div id="root">${renderStaticContent(page)}\n    </div>`);

  return html;
};

const applySeoIndexMetadata = (template) => {
  const canonical = `${siteUrl}/${seoIndexPath}`;
  const metadata = applyMetadataOverride(`/${seoIndexPath}`, seoIndexTitle, seoIndexDescription);
  let html = template;

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(metadata.title)}</title>`);
  html = replaceOrInsertHeadTag(html, /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${escapeHtml(canonical)}" />`);
  html = replaceOrInsertHeadTag(html, /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${escapeHtml(metadata.description)}">`);
  html = replaceOrInsertHeadTag(html, /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${escapeHtml(canonical)}" />`);
  html = replaceOrInsertHeadTag(html, /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${escapeHtml(metadata.title)}">`);
  html = replaceOrInsertHeadTag(html, /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${escapeHtml(metadata.description)}">`);
  html = replaceOrInsertHeadTag(html, /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${escapeHtml(defaultImage)}" />`);
  html = replaceOrInsertHeadTag(html, /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${escapeHtml(metadata.title)}">`);
  html = replaceOrInsertHeadTag(html, /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${escapeHtml(metadata.description)}">`);
  html = replaceOrInsertHeadTag(html, /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:image" content="${escapeHtml(defaultImage)}" />`);
  html = html.replace(
    "</head>",
    `    <script type="application/ld+json" id="wearevents-prerender-jsonld">${escapeJsonForHtml(buildSeoIndexJsonLd(metadata.description))}</script>\n  </head>`,
  );
  html = html.replace('<div id="root"></div>', `<div id="root">${renderSeoIndexStaticContent(metadata.description)}\n    </div>`);

  return html;
};

const template = await readFile(join(distDir, "index.html"), "utf8");

await Promise.all(
  seoLandingPages.map(async (rawPage) => {
    const page = applyPageMetadataOverride(rawPage);
    const pagePath = join(distDir, page.slug, "index.html");
    await mkdir(dirname(pagePath), { recursive: true });
    await writeFile(pagePath, applySeoMetadata(template, page), "utf8");
  }),
);

const seoIndexPagePath = join(distDir, seoIndexPath, "index.html");
await mkdir(dirname(seoIndexPagePath), { recursive: true });
await writeFile(seoIndexPagePath, applySeoIndexMetadata(template), "utf8");

console.log(`Generated ${seoLandingPages.length} prerendered SEO pages and /${seoIndexPath}.`);
