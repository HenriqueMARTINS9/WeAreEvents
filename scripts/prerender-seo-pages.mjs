import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { seoLandingPages } from "../src/data/seo-landings-data.js";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(rootDir, "dist");
const siteUrl = (process.env.VITE_SITE_URL || "https://www.wearevents.fr").replace(/\/$/, "");
const defaultImage = `${siteUrl}/og-image.svg`;

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

const template = await readFile(join(distDir, "index.html"), "utf8");

await Promise.all(
  seoLandingPages.map(async (page) => {
    const pagePath = join(distDir, page.slug, "index.html");
    await mkdir(dirname(pagePath), { recursive: true });
    await writeFile(pagePath, applySeoMetadata(template, page), "utf8");
  }),
);

console.log(`Generated ${seoLandingPages.length} prerendered SEO pages.`);
