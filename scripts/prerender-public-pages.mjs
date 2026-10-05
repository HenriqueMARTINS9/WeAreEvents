import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { seoLandingPages } from "../src/data/seo-landings-data.js";
import { getIndexableSeoPages, getMatchingSeoVenues } from "../src/data/seo-venue-filter.js";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(rootDir, "dist");

try {
  const envFile = await readFile(join(rootDir, ".env.local"), "utf8");
  envFile.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  });
} catch {
  // Production variables are supplied by Vercel; a local env file is optional.
}

const siteUrl = (process.env.VITE_SITE_URL || "https://www.wearevents.fr").replace(/\/$/, "");
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const defaultImage = `${siteUrl}/og-image.svg`;

const escapeHtml = (value = "") => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const escapeJsonForHtml = (value) => JSON.stringify(value)
  .replace(/</g, "\\u003c")
  .replace(/>/g, "\\u003e")
  .replace(/&/g, "\\u0026");

const sanitizeBlogHtml = (value = "") => String(value)
  .replace(/<script[\s\S]*?<\/script>/gi, "")
  .replace(/<style[\s\S]*?<\/style>/gi, "")
  .replace(/<!--([\s\S]*?)-->/g, "")
  .replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (tag, rawName, attributes) => {
    const name = rawName.toLowerCase();
    const allowed = new Set(["p", "h1", "h2", "h3", "strong", "b", "em", "i", "ul", "ol", "li", "blockquote", "br", "a"]);
    if (!allowed.has(name)) return "";
    if (tag.startsWith("</")) return `</${name}>`;
    if (name === "br") return "<br>";
    if (name !== "a") return `<${name}>`;
    const href = attributes.match(/href\s*=\s*["']([^"']+)["']/i)?.[1] ?? "";
    const safeHref = /^(https?:\/\/|\/|#)/i.test(href) ? href : "";
    return safeHref ? `<a href="${escapeHtml(safeHref)}">` : "<a>";
  });

const normalizePath = (value = "/") => {
  const path = String(value).split(/[?#]/)[0] || "/";
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  return withSlash === "/" ? "/" : withSlash.replace(/\/+$/, "");
};

const fetchRows = async (table, params) => {
  if (!supabaseUrl || !supabaseKey) return [];
  const url = new URL(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/${table}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url, {
    headers: { apikey: supabaseKey, authorization: `Bearer ${supabaseKey}`, accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Supabase ${table} prerender fetch failed with ${response.status}`);
  return response.json();
};

const [venues, posts, metadataRows] = await Promise.all([
  fetchRows("venues", { select: "*", active: "eq.true", order: "updated_at.desc", limit: "1000" }),
  fetchRows("blog_posts", { select: "*", published: "eq.true", order: "published_at.desc", limit: "1000" }),
  fetchRows("seo_metadata", { select: "page_path,title,description,intro,guide,faq", active: "eq.true", limit: "1000" })
    .catch(() => fetchRows("seo_metadata", { select: "page_path,title,description", active: "eq.true", limit: "1000" })),
]);

const metadataOverrides = new Map(metadataRows.map((row) => [normalizePath(row.page_path), row]));
const metadataFor = (path, title, description) => {
  const override = metadataOverrides.get(normalizePath(path));
  return {
    title: String(override?.title || title).trim(),
    description: String(override?.description || description).trim(),
    intro: String(override?.intro || "").trim(),
    guide: String(override?.guide || "").trim(),
    faq: Array.isArray(override?.faq) ? override.faq : [],
  };
};

const replaceOrInsertHeadTag = (html, matcher, tag) =>
  matcher.test(html) ? html.replace(matcher, tag) : html.replace("</head>", `    ${tag}\n  </head>`);

const applyDocument = (template, { path, title, description, image = defaultImage, type = "website", noindex = false, jsonLd, body }) => {
  const metadata = metadataFor(path, title, description);
  const canonical = `${siteUrl}${path === "/" ? "/" : path}`;
  let html = template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(metadata.title)}</title>`);
  const tags = [
    [/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${escapeHtml(canonical)}" />`],
    [/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${escapeHtml(metadata.description)}">`],
    [/<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i, `<meta name="robots" content="${noindex ? "noindex, nofollow" : "index, follow"}" />`],
    [/<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:type" content="${escapeHtml(type)}" />`],
    [/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${escapeHtml(canonical)}" />`],
    [/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${escapeHtml(metadata.title)}">`],
    [/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${escapeHtml(metadata.description)}">`],
    [/<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${escapeHtml(image || defaultImage)}" />`],
    [/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${escapeHtml(metadata.title)}">`],
    [/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${escapeHtml(metadata.description)}">`],
    [/<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:image" content="${escapeHtml(image || defaultImage)}" />`],
  ];
  tags.forEach(([matcher, tag]) => { html = replaceOrInsertHeadTag(html, matcher, tag); });
  if (jsonLd) html = html.replace("</head>", `    <script type="application/ld+json" id="wearevents-prerender-jsonld">${escapeJsonForHtml(jsonLd)}</script>\n  </head>`);
  return html.replace('<div id="root"></div>', `<div id="root">${body}\n    </div>`);
};

const shell = (content) => `
  <header style="padding:22px 24px;border-bottom:1px solid #e5e5e5;font-family:Arial,sans-serif;">
    <a href="/" style="font-weight:800;color:#171717;text-decoration:none;">Wearevents</a>
    <nav aria-label="Navigation principale" style="float:right;"><a href="/recherche">Trouver une salle</a> · <a href="/inspirations">Inspirations</a> · <a href="/blog">Blog</a></nav>
  </header>${content}`;

const pageLayout = (content) => shell(`<main data-prerender-seo style="font-family:Arial,sans-serif;max-width:1120px;margin:0 auto;padding:64px 24px;color:#171717;">${content}</main>`);
const breadcrumbs = (items) => `<nav aria-label="Fil d'Ariane" style="font-size:13px;margin-bottom:26px;">${items.map((item, index) => `${index ? " / " : ""}${item.href ? `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>` : escapeHtml(item.label)}`).join("")}</nav>`;
const locationSlug = (value) => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const rawVenuePrice = (venue) => {
  const amount = Number(venue.price_amount ?? 0);
  if (!amount) return venue.pricing_text || "Sur devis";
  if (venue.price_type === "per_person") return `À partir de ${amount} € / pers.`;
  if (venue.price_type === "minimum_spend") return `Minimum de consommation : ${amount} €`;
  return `Location à partir de ${amount} €`;
};

const venueLinkGrid = (items) => items.length ? `<section style="margin-top:46px;"><h2>Lieux à découvrir</h2><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;">${items.map((venue) => `<article style="border:1px solid #e5e5e5;border-radius:8px;overflow:hidden;"><a href="/salle/${escapeHtml(venue.slug)}" style="display:block;color:#171717;text-decoration:none;">${venue.cover_image ? `<img src="${escapeHtml(venue.cover_image)}" alt="Espace principal de ${escapeHtml(venue.title)} à ${escapeHtml(venue.city)}" width="640" height="420" loading="lazy" style="width:100%;height:190px;object-fit:cover;">` : ""}<div style="padding:16px;"><strong>${escapeHtml(venue.title)}</strong><span style="display:block;margin-top:7px;color:#666;">${escapeHtml(venue.city)} · Jusqu'à ${Number(venue.max_capacity || 0)} personnes</span><span style="display:block;margin-top:7px;color:#D94F6D;">${escapeHtml(rawVenuePrice(venue))}</span></div></a></article>`).join("")}</div></section>` : "";

const template = await readFile(join(distDir, "index.html"), "utf8");
await writeFile(join(distDir, "app-shell.html"), template, "utf8");
const writePage = async (path, html) => {
  const filePath = path === "/" ? join(distDir, "index.html") : join(distDir, path.slice(1), "index.html");
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, html, "utf8");
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Wearevents",
  url: siteUrl,
  logo: `${siteUrl}/og-image.svg`,
  sameAs: ["https://www.instagram.com/wearevents.fr/", "https://www.tiktok.com/@wearevents.fr", "https://www.linkedin.com/company/wearevents/"],
};

const indexableSeoPages = getIndexableSeoPages(venues, seoLandingPages);

await writePage("/", applyDocument(template, {
  path: "/",
  title: "Wearevents | Location de salle pour votre événement",
  description: "Découvrez des lieux événementiels vérifiés, comparez les options et envoyez une demande de disponibilité gratuite en quelques clics.",
  jsonLd: organizationJsonLd,
  body: pageLayout(`<h1 style="font-family:Georgia,serif;font-size:64px;line-height:1;">Le lieu idéal pour votre événement à Paris.</h1><p style="font-size:18px;line-height:1.7;max-width:760px;">Des lieux premium, vérifiés et adaptés à votre événement, avec une demande simple et gratuite.</p>${venueLinkGrid(venues.slice(0, 12))}<section><h2>Trouvez votre lieu</h2>${indexableSeoPages.map((page) => `<a href="/${escapeHtml(page.slug)}" style="display:inline-block;margin:4px 8px 4px 0;">${escapeHtml(page.h1)}</a>`).join("")}</section><p style="margin-top:40px;"><a href="/inspirations">Explorer toutes les inspirations</a></p>`),
}));

for (const rawPage of seoLandingPages) {
  const path = `/${rawPage.slug}`;
  const page = { ...rawPage, ...metadataFor(path, rawPage.title, rawPage.description) };
  const matchingVenues = getMatchingSeoVenues(venues, page);
  const isIndexable = rawPage.indexable !== false && matchingVenues.length >= 3;
  const activeFaq = page.faq?.length ? page.faq : rawPage.faq;
  const activeIntro = page.intro || rawPage.intro;
  const guide = page.guide ? `<section style="margin-top:48px;"><h2>Bien choisir votre lieu</h2><div style="white-space:pre-line;line-height:1.8;">${escapeHtml(page.guide)}</div></section>` : "";
  const jsonLd = [
    { "@context": "https://schema.org", "@type": "CollectionPage", name: page.h1, description: page.description, url: `${siteUrl}${path}`, mainEntity: { "@type": "ItemList", itemListElement: matchingVenues.slice(0, 24).map((venue, index) => ({ "@type": "ListItem", position: index + 1, name: venue.title, url: `${siteUrl}/salle/${venue.slug}` })) } },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: activeFaq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: siteUrl }, { "@type": "ListItem", position: 2, name: "Inspirations", item: `${siteUrl}/inspirations` }, { "@type": "ListItem", position: 3, name: page.h1, item: `${siteUrl}${path}` }] },
  ];
  const faq = `<section style="margin-top:48px;"><h2>Questions fréquentes</h2>${activeFaq.map((item) => `<article style="border-top:1px solid #e5e5e5;padding:16px 0;"><h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p></article>`).join("")}</section>`;
  const pageCount = Math.ceil(matchingVenues.length / 24);
  const pagination = pageCount > 1 ? `<nav aria-label="Pagination">${Array.from({ length: pageCount }, (_, index) => `<a href="${path}${index ? `?page=${index + 1}` : ""}" style="margin-right:10px;">${index + 1}</a>`).join("")}</nav>` : "";
  await writePage(path, applyDocument(template, {
    path,
    title: page.title,
    description: page.description,
    noindex: !isIndexable,
    image: matchingVenues[0]?.cover_image || defaultImage,
    jsonLd,
    body: pageLayout(`${breadcrumbs([{ label: "Accueil", href: "/" }, { label: "Inspirations", href: "/inspirations" }, { label: page.h1 }])}<h1 style="font-family:Georgia,serif;font-size:58px;line-height:1;">${escapeHtml(page.h1)}</h1><p style="font-size:18px;line-height:1.7;max-width:760px;">${escapeHtml(activeIntro)}</p>${venueLinkGrid(matchingVenues.slice(0, 24))}${pagination}${guide}${faq}`),
  }));
}

const inspirationsDescription = "Toutes les recherches utiles pour trouver une salle à Paris : événement, capacité, ambiance, budget, équipements, horaires et options.";
await writePage("/inspirations", applyDocument(template, {
  path: "/inspirations",
  title: "Inspirations lieux événementiels à Paris | Wearevents",
  description: inspirationsDescription,
  jsonLd: [{ "@context": "https://schema.org", "@type": "CollectionPage", name: "Inspirations lieux événementiels à Paris", description: inspirationsDescription, url: `${siteUrl}/inspirations`, mainEntity: { "@type": "ItemList", itemListElement: indexableSeoPages.map((page, index) => ({ "@type": "ListItem", position: index + 1, name: page.h1, url: `${siteUrl}/${page.slug}` })) } }, { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: siteUrl }, { "@type": "ListItem", position: 2, name: "Inspirations", item: `${siteUrl}/inspirations` }] }],
  body: pageLayout(`${breadcrumbs([{ label: "Accueil", href: "/" }, { label: "Inspirations" }])}<h1 style="font-family:Georgia,serif;font-size:58px;line-height:1;">Toutes les recherches pour trouver le bon lieu à Paris.</h1><p style="font-size:18px;line-height:1.7;">${escapeHtml(inspirationsDescription)}</p><section style="margin-top:44px;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;">${indexableSeoPages.map((page) => `<a href="/${page.slug}" style="border:1px solid #e5e5e5;border-radius:8px;padding:16px;color:#171717;text-decoration:none;"><strong>${escapeHtml(page.h1)}</strong></a>`).join("")}</section>`),
}));

await writePage("/blog", applyDocument(template, {
  path: "/blog",
  title: "Blog événementiel - Conseils pour choisir le bon lieu",
  description: "Guides pratiques, checklists et conseils concrets pour choisir une salle et réussir votre événement.",
  jsonLd: [{ "@context": "https://schema.org", "@type": "CollectionPage", name: "Blog Wearevents", url: `${siteUrl}/blog`, mainEntity: { "@type": "ItemList", itemListElement: posts.map((post, index) => ({ "@type": "ListItem", position: index + 1, name: post.title, url: `${siteUrl}/blog/${post.slug}` })) } }, { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: siteUrl }, { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/blog` }] }],
  body: pageLayout(`${breadcrumbs([{ label: "Accueil", href: "/" }, { label: "Blog" }])}<h1 style="font-family:Georgia,serif;font-size:58px;">Blog Wearevents</h1><p style="font-size:18px;">Guides pratiques pour trouver le bon lieu pour vos événements.</p><section style="margin-top:42px;">${posts.map((post) => `<article style="border-top:1px solid #e5e5e5;padding:20px 0;"><h2><a href="/blog/${escapeHtml(post.slug)}">${escapeHtml(post.title)}</a></h2><p>${escapeHtml(post.excerpt)}</p></article>`).join("")}</section>`),
}));

for (const post of posts) {
  const path = `/blog/${post.slug}`;
  const title = post.seo_title || `${post.title} - Blog Wearevents`;
  const description = post.meta_description || post.excerpt || "Conseils événementiels Wearevents.";
  const safeContent = sanitizeBlogHtml(post.content);
  await writePage(path, applyDocument(template, {
    path,
    title,
    description,
    image: post.image || defaultImage,
    type: "article",
    jsonLd: [{ "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description, image: post.image || defaultImage, datePublished: post.published_at, dateModified: post.updated_at, mainEntityOfPage: `${siteUrl}${path}`, publisher: { "@type": "Organization", name: "Wearevents", url: siteUrl } }, { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: siteUrl }, { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/blog` }, { "@type": "ListItem", position: 3, name: post.title, item: `${siteUrl}${path}` }] }],
    body: pageLayout(`${breadcrumbs([{ label: "Accueil", href: "/" }, { label: "Blog", href: "/blog" }, { label: post.title }])}<article><h1 style="font-family:Georgia,serif;font-size:56px;line-height:1;">${escapeHtml(post.title)}</h1>${post.image ? `<img src="${escapeHtml(post.image)}" alt="Illustration de l'article ${escapeHtml(post.title)}" width="1200" height="675" style="width:100%;height:auto;border-radius:8px;">` : ""}<div style="max-width:760px;font-size:17px;line-height:1.8;">${safeContent}</div></article>`),
  }));
}

for (const venue of venues) {
  const path = `/salle/${venue.slug}`;
  const title = venue.seo_title || `${venue.title} | Réservez rapidement`;
  const address = venue.address || venue.city || "";
  const description = venue.meta_description || `${address}. Jusqu'à ${Number(venue.max_capacity || 0)} personnes. Retrouvez les informations utiles sur la page de l'établissement.`;
  const faq = [
    { question: `Peut-on privatiser ${venue.title} ?`, answer: `Oui, ${venue.title} peut être privatisé selon les disponibilités et les modalités proposées par l'établissement.` },
    { question: `Quels événements peut-on organiser chez ${venue.title} ?`, answer: `${venue.title} accueille notamment ${(venue.event_categories || []).slice(0, 6).join(", ") || "des événements privés et professionnels"}.` },
    { question: `Comment réserver ${venue.title} ?`, answer: `Envoyez gratuitement une demande sur Wearevents. Notre équipe vérifie ensuite la disponibilité et les conditions avec le lieu.` },
  ];
  const venueSchema = { "@context": "https://schema.org", "@type": "EventVenue", name: venue.title, description: venue.description, image: [venue.cover_image, ...(venue.gallery || [])].filter(Boolean), url: `${siteUrl}${path}`, address: { "@type": "PostalAddress", streetAddress: address, addressLocality: venue.city, addressCountry: "FR" }, maximumAttendeeCapacity: Number(venue.max_capacity || 0) || undefined };
  if (Number(venue.rating) > 0 && Number(venue.review_count) > 0) venueSchema.aggregateRating = { "@type": "AggregateRating", ratingValue: Number(venue.rating), reviewCount: Number(venue.review_count) };
  if (Number(venue.price_amount) > 0) venueSchema.offers = { "@type": "Offer", price: Number(venue.price_amount), priceCurrency: "EUR", description: rawVenuePrice(venue) };
  const similar = venues.filter((candidate) => candidate.id !== venue.id && (candidate.city === venue.city || (candidate.venue_types || []).some((type) => (venue.venue_types || []).includes(type)))).slice(0, 6);
  const locationPath = `/location-salle-${locationSlug(venue.city)}`;
  await writePage(path, applyDocument(template, {
    path,
    title,
    description,
    image: venue.cover_image || defaultImage,
    jsonLd: [venueSchema, { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) }, { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: siteUrl }, { "@type": "ListItem", position: 2, name: `Salles à ${venue.city}`, item: `${siteUrl}${locationPath}` }, { "@type": "ListItem", position: 3, name: venue.title, item: `${siteUrl}${path}` }] }],
    body: pageLayout(`${breadcrumbs([{ label: "Accueil", href: "/" }, { label: `Salles à ${venue.city}`, href: locationPath }, { label: venue.title }])}<article><h1 style="font-family:Georgia,serif;font-size:58px;line-height:1;">${escapeHtml(venue.title)}</h1><p>${escapeHtml(address)} · Jusqu'à ${Number(venue.max_capacity || 0)} personnes</p>${venue.cover_image ? `<img src="${escapeHtml(venue.cover_image)}" alt="${escapeHtml(venue.title)}" width="1200" height="800" style="width:100%;height:auto;border-radius:8px;">` : ""}<div style="max-width:780px;font-size:17px;line-height:1.8;white-space:pre-line;">${escapeHtml(venue.description)}</div><section><h2>Événements adaptés</h2><p>${escapeHtml((venue.event_categories || []).join(", "))}</p></section><section><h2>Questions fréquentes</h2>${faq.map((item) => `<h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p>`).join("")}</section></article>${venueLinkGrid(similar)}`),
  }));
}

const staticPages = [
  { path: "/faq", title: "FAQ - Questions fréquentes sur la réservation de lieux", description: "Fonctionnement de Wearevents, gratuité du service, types de lieux, délais de réservation et formats de privatisation.", h1: "Questions fréquentes", text: "Tout ce qu'il faut savoir pour rechercher, comparer et réserver un lieu avec Wearevents." },
  { path: "/reseaux-sociaux", title: "Réseaux sociaux Wearevents", description: "Retrouvez Wearevents sur Instagram, TikTok et LinkedIn pour découvrir nos lieux et inspirations événementielles.", h1: "Suivez Wearevents", text: "Découvrez les visites de lieux, nouveautés et conseils événementiels de Wearevents sur les réseaux sociaux." },
  { path: "/qui-sommes-nous", title: "Qui sommes-nous ? | Wearevents", description: "Découvrez Wearevents, notre sélection de lieux et l'accompagnement proposé aux organisateurs à Paris et en Île-de-France.", h1: "Wearevents simplifie la recherche de lieux événementiels", text: "Nous aidons particuliers, entreprises et agences à trouver un lieu fiable, adapté et disponible." },
  { path: "/entreprises", title: "Événements d'entreprise à Paris | Wearevents", description: "Trouvez un lieu pour votre séminaire, conférence, cocktail, lancement de produit ou soirée d'entreprise à Paris.", h1: "Un lieu adapté à chaque événement professionnel", text: "Recevez des propositions cohérentes avec votre format, votre capacité et votre budget." },
  { path: "/mentions-legales", title: "Mentions légales - Wearevents", description: "Informations relatives à l'éditeur et à l'hébergement du site Wearevents.", h1: "Mentions légales", text: "Informations légales relatives à l'édition, à l'hébergement et à l'utilisation du site Wearevents." },
  { path: "/cgu", title: "Conditions générales d'utilisation - Wearevents", description: "Conditions d'accès et d'utilisation du site Wearevents.", h1: "Conditions générales d'utilisation", text: "Les présentes conditions encadrent l'accès et l'utilisation des services proposés par Wearevents." },
  { path: "/politique-confidentialite", title: "Politique de confidentialité - Wearevents", description: "Informations sur la collecte et l'utilisation des données personnelles par Wearevents.", h1: "Politique de confidentialité", text: "Cette page explique quelles données sont collectées via les formulaires et comment exercer vos droits." },
];

for (const page of staticPages) {
  await writePage(page.path, applyDocument(template, {
    ...page,
    jsonLd: { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: siteUrl }, { "@type": "ListItem", position: 2, name: page.h1, item: `${siteUrl}${page.path}` }] },
    body: pageLayout(`${breadcrumbs([{ label: "Accueil", href: "/" }, { label: page.h1 }])}<h1 style="font-family:Georgia,serif;font-size:58px;">${escapeHtml(page.h1)}</h1><p style="font-size:18px;line-height:1.7;">${escapeHtml(page.text)}</p>`),
  }));
}

console.log(`Prerendered ${seoLandingPages.length} SEO pages, ${venues.length} venues, ${posts.length} blog posts and public static pages.`);
