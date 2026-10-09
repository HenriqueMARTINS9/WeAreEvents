import { readFile, stat } from "node:fs/promises";
import { join, normalize, sep } from "node:path";
import { getEventSeoPath, SEO_EVENT_TYPES, seoLandingPages } from "../src/data/seo-landings-data.js";
import { getMatchingSeoVenues } from "../src/data/seo-venue-filter.js";

const distDir = join(process.cwd(), "dist");
const siteUrl = (process.env.VITE_SITE_URL || process.env.PUBLIC_SITE_URL || "https://www.wearevents.fr").replace(/\/$/, "");
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const isSupabaseServerConfigured = Boolean(supabaseUrl && supabaseKey);
const defaultImage = `${siteUrl}/og-image.svg`;

const staticIndexablePaths = new Set([
  "/",
  "/blog",
  "/inspirations",
  "/faq",
  "/reseaux-sociaux",
  "/qui-sommes-nous",
  "/entreprises",
  "/mentions-legales",
  "/cgu",
  "/politique-confidentialite",
]);
const staticMetadata = {
  "/": {
    title: "Wearevents | Location de salle pour votre événement",
    description:
      "Découvrez des lieux événementiels vérifiés, comparez les options et envoyez une demande de disponibilité gratuite en quelques clics.",
  },
  "/recherche": {
    title: "Trouver une salle événementielle - Recherche Wearevents",
    description:
      "Recherchez une salle par ville, capacité, type d'événement, ambiance et budget. Comparez les lieux et envoyez une demande gratuite.",
  },
  "/avis": {
    title: "Donner votre avis | Wearevents",
    description:
      "Partagez votre expérience après un événement réservé avec Wearevents.",
  },
  "/blog": {
    title: "Blog événementiel - Conseils pour choisir le bon lieu",
    description:
      "Guides pratiques, checklists et conseils concrets pour choisir une salle, organiser un mariage, un anniversaire, un séminaire ou privatiser un lieu.",
  },
  "/inspirations": {
    title: "Inspirations lieux événementiels à Paris | Wearevents",
    description:
      "Toutes les recherches utiles pour trouver une salle à Paris : événement, capacité, ambiance, budget, équipements, horaires et options.",
  },
  "/faq": {
    title: "FAQ - Questions fréquentes sur la réservation de lieux",
    description:
      "Fonctionnement de Wearevents, gratuité du service, types de lieux, délais de réservation et formats de privatisation.",
  },
  "/reseaux-sociaux": {
    title: "Réseaux sociaux Wearevents",
    description:
      "Retrouvez Wearevents sur Instagram, TikTok et LinkedIn pour découvrir nos lieux, vidéos et inspirations événementielles.",
  },
  "/qui-sommes-nous": {
    title: "Qui sommes-nous ? | Wearevents",
    description: "Découvrez Wearevents, notre sélection de lieux événementiels et l'accompagnement proposé aux organisateurs à Paris et en Île-de-France.",
  },
  "/entreprises": {
    title: "Événements d'entreprise à Paris | Wearevents",
    description: "Trouvez un lieu pour votre séminaire, conférence, cocktail, lancement de produit ou soirée d'entreprise à Paris.",
  },
  "/mentions-legales": {
    title: "Mentions légales - Wearevents",
    description:
      "Informations relatives à l'éditeur, à l'hébergement, à la propriété intellectuelle et aux données personnelles du site Wearevents.",
  },
  "/cgu": {
    title: "Conditions générales d'utilisation - Wearevents",
    description:
      "Conditions d'accès et d'utilisation du site Wearevents et de ses services de recherche de lieux événementiels.",
  },
  "/politique-confidentialite": {
    title: "Politique de confidentialité - Wearevents",
    description:
      "Informations sur la collecte, l'utilisation, la conservation et les droits liés aux données personnelles traitées sur Wearevents.",
  },
};
const noindexPaths = new Set(["/admin", "/recherche", "/avis"]);
const seoLandingPaths = new Set(seoLandingPages.map((page) => `/${page.slug}`));

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

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
    return /^(https?:\/\/|\/|#)/i.test(href) ? `<a href="${escapeHtml(href)}">` : "<a>";
  });

const normalizeSeoPath = (value = "/") => {
  const path = String(value || "/").split(/[?#]/)[0] || "/";
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  return withSlash === "/" ? "/" : withSlash.replace(/\/+$/, "");
};

const canonicalUrl = (path) => `${siteUrl}${path === "/" ? "/" : path}`;

const isInsideDist = (filePath) => {
  const normalizedDist = normalize(distDir);
  const normalizedFile = normalize(filePath);
  return normalizedFile === normalizedDist || normalizedFile.startsWith(`${normalizedDist}${sep}`);
};

const fileExists = async (filePath) => {
  try {
    const result = await stat(filePath);
    return result.isFile();
  } catch {
    return false;
  }
};

const readHtmlForPath = async (path) => {
  if (path !== "/") {
    const staticPagePath = join(distDir, path.slice(1), "index.html");

    if (isInsideDist(staticPagePath) && await fileExists(staticPagePath)) {
      return { html: await readFile(staticPagePath, "utf8"), prerendered: true };
    }
  }

  if (path === "/") {
    return { html: await readFile(join(distDir, "index.html"), "utf8"), prerendered: true };
  }

  const shellPath = join(distDir, "app-shell.html");
  return {
    html: await readFile(await fileExists(shellPath) ? shellPath : join(distDir, "index.html"), "utf8"),
    prerendered: false,
  };
};

const replaceOrInsertHeadTag = (html, matcher, tag) => {
  if (matcher.test(html)) return html.replace(matcher, tag);
  return html.replace("</head>", `    ${tag}\n  </head>`);
};

const escapeJsonForHtml = (value) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

const applyRuntimeContent = (html, body, jsonLd) => {
  let nextHtml = html
    .replace(/<script[^>]+id="wearevents-(?:pre)?render-jsonld"[^>]*>[\s\S]*?<\/script>\s*/gi, "")
    .replace(/<script[^>]+id="wearevents-runtime-jsonld"[^>]*>[\s\S]*?<\/script>\s*/gi, "");
  if (/<main\s+data-prerender-seo[\s\S]*?<\/main>/i.test(nextHtml)) {
    nextHtml = nextHtml.replace(/<main\s+data-prerender-seo[\s\S]*?<\/main>/i, body);
  } else if (/<div id="root">[\s\S]*?<\/div>\s*<script/i.test(nextHtml)) {
    nextHtml = nextHtml.replace(/<div id="root">[\s\S]*?<\/div>(\s*<script)/i, `<div id="root">${body}</div>$1`);
  } else {
    nextHtml = nextHtml.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  }
  if (jsonLd) {
    nextHtml = nextHtml.replace(
      "</head>",
      `    <script type="application/ld+json" id="wearevents-runtime-jsonld">${escapeJsonForHtml(jsonLd)}</script>\n  </head>`,
    );
  }
  return nextHtml;
};

const applyHtmlMetadata = (html, metadata) => {
  const {
    path,
    title,
    description,
    image = defaultImage,
    type = "website",
    noindex,
  } = metadata;
  const canonical = canonicalUrl(metadata.canonicalPath || path);
  let nextHtml = html;

  nextHtml = nextHtml.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  nextHtml = replaceOrInsertHeadTag(nextHtml, /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${escapeHtml(canonical)}" />`);
  nextHtml = replaceOrInsertHeadTag(nextHtml, /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${escapeHtml(description)}">`);
  if (typeof noindex === "boolean") {
    nextHtml = replaceOrInsertHeadTag(nextHtml, /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i, `<meta name="robots" content="${noindex ? "noindex, follow" : "index, follow"}" />`);
  }
  nextHtml = replaceOrInsertHeadTag(nextHtml, /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:type" content="${escapeHtml(type)}" />`);
  nextHtml = replaceOrInsertHeadTag(nextHtml, /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${escapeHtml(canonical)}" />`);
  nextHtml = replaceOrInsertHeadTag(nextHtml, /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${escapeHtml(title)}">`);
  nextHtml = replaceOrInsertHeadTag(nextHtml, /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${escapeHtml(description)}">`);
  nextHtml = replaceOrInsertHeadTag(nextHtml, /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${escapeHtml(image || defaultImage)}" />`);
  nextHtml = replaceOrInsertHeadTag(nextHtml, /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${escapeHtml(title)}">`);
  nextHtml = replaceOrInsertHeadTag(nextHtml, /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${escapeHtml(description)}">`);
  nextHtml = replaceOrInsertHeadTag(nextHtml, /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:image" content="${escapeHtml(image || defaultImage)}" />`);

  return nextHtml;
};

const fetchSupabaseRows = async (table, params) => {
  if (!isSupabaseServerConfigured) return [];

  const url = new URL(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/${table}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url, {
    headers: {
      apikey: supabaseKey,
      authorization: `Bearer ${supabaseKey}`,
      accept: "application/json",
    },
    signal: AbortSignal.timeout(5_000),
  });

  if (!response.ok) throw new Error(`Supabase ${table} fetch failed with ${response.status}`);

  return response.json();
};

const fetchSeoMetadata = async (path) => {
  let rows;
  try {
    rows = await fetchSupabaseRows("seo_metadata", {
      select: "title,description,intro,guide,faq",
      page_path: `eq.${path}`,
      active: "eq.true",
      limit: "1",
    });
  } catch {
    rows = await fetchSupabaseRows("seo_metadata", {
      select: "title,description",
      page_path: `eq.${path}`,
      active: "eq.true",
      limit: "1",
    });
  }
  const [row] = rows;

  if (!row) return null;

  return {
    title: String(row.title || "").trim(),
    description: String(row.description || "").trim(),
    intro: String(row.intro || "").trim(),
    guide: String(row.guide || "").trim(),
    faq: Array.isArray(row.faq) ? row.faq : [],
  };
};

const venueCardGrid = (venues) => `<section><h2>Lieux à découvrir</h2><div>${venues.map((venue) => `<article><h3><a href="/salle/${escapeHtml(venue.slug)}">${escapeHtml(venue.title)}</a></h3><p>${escapeHtml(venue.city || "Paris")} · Jusqu'à ${Number(venue.max_capacity || 0)} personnes · ${escapeHtml(formatVenuePrice(venue))}</p></article>`).join("")}</div></section>`;
const arrayValue = (value) => Array.isArray(value) ? value.filter((item) => String(item || "").trim()) : [];
const venueList = (title, items) => {
  const values = arrayValue(items);
  return values.length ? `<section><h2>${escapeHtml(title)}</h2><ul>${values.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>` : "";
};
const venueEventLinks = (items) => {
  const allowed = new Set(SEO_EVENT_TYPES);
  const values = arrayValue(items).filter((item) => allowed.has(item));
  return values.length
    ? `<section><h2>Idéal pour</h2><ul>${values.map((item) => `<li><a href="${escapeHtml(getEventSeoPath(item))}">${escapeHtml(item)}</a></li>`).join("")}</ul></section>`
    : "";
};
const formatVenuePrice = (venue) => {
  const amount = Number(venue.price_amount ?? 0);
  if (amount > 0) {
    if (venue.price_type === "per_person") return `À partir de ${amount} € / pers.`;
    if (venue.price_type === "minimum_spend") return `Minimum de consommation : ${amount} €`;
    return `Location à partir de ${amount} €`;
  }
  const tier = venue.price_tier || "€€";
  const labels = { "€": "budget économique", "€€": "budget moyen", "€€€": "budget élevé", "€€€€": "budget premium" };
  return `${tier} · ${labels[tier] || "budget sur devis"}`;
};
const buildVenueFaq = (venue) => {
  const events = arrayValue(venue.event_categories);
  const searchable = [...arrayValue(venue.venue_types), ...arrayValue(venue.services), ...arrayValue(venue.option_features), ...arrayValue(venue.ambiance_types), ...arrayValue(venue.external_options)].join(" ").toLowerCase();
  return [
    { show: arrayValue(venue.spaces).length || arrayValue(venue.privatization_types).length, question: "Peut-on privatiser ce lieu ?", answer: `Oui, ${venue.title} peut être privatisé via Wearevents, dans son ensemble ou sous la forme d'un espace dédié selon ses conditions.` },
    { show: events.length, question: "Quels types d'événements peut-on organiser ici ?", answer: `${venue.title} accueille notamment ${events.slice(0, 8).join(", ")}. Notre équipe vérifie que le format et la configuration correspondent à votre événement.` },
    { show: /(bar|restaurant|traiteur|restauration|boisson|cuisine)/.test(searchable), question: "Le lieu propose-t-il des boissons ou de la restauration ?", answer: `Oui, ${venue.title} propose des boissons et/ou une offre de restauration selon le format retenu.` },
    { show: /(musique|système son|systeme son|table de mixage)/.test(searchable), question: "Peut-on mettre sa propre musique ?", answer: `Oui, ${venue.title} permet de prévoir votre musique selon les conditions et les modalités techniques du lieu.` },
    { show: true, question: "Comment réserver ce lieu avec Wearevents ?", answer: `Envoyez gratuitement une demande de disponibilité depuis cette fiche. Notre équipe qualifie votre besoin et vous accompagne jusqu'à la confirmation.` },
    { show: /(terrasse|rooftop|extérieur|exterieur|jardin|patio|cour|piscine)/.test(searchable), question: "Le lieu dispose-t-il d'une terrasse, d'un rooftop ou d'un espace extérieur ?", answer: `Oui, ${venue.title} dispose d'un espace extérieur selon la configuration indiquée sur sa fiche.` },
    { show: /(danser|piste de danse|festif|animé|anime|club|discothèque|discotheque)/.test(searchable), question: "Le lieu permet-il de danser ou d'organiser une soirée festive ?", answer: `Oui, ${venue.title} permet d'organiser une soirée festive ou de danser selon les conditions et les horaires du lieu.` },
  ].filter((item) => item.show);
};

const venueTypePaths = {
  Bar: "/bar-privatisable-paris",
  Restaurant: "/restaurant-privatisable-paris",
  "Discothèque": "/discotheque-paris",
  Rooftop: "/rooftop-a-privatiser-paris",
  Villa: "/villa-evenement-paris",
  Loft: "/loft-evenementiel-paris",
};

const getVenueLocation = (venue) => {
  const postalCode = String(venue.address || "").match(/\b\d{5}\b/)?.[0] || "";
  const arrondissement = postalCode === "75116"
    ? 16
    : Number(postalCode.match(/^750(0[1-9]|1\d|20)$/)?.[1] || 0);

  if (!arrondissement) return { label: venue.city || "Paris", path: "/location-salle-paris" };

  const suffix = arrondissement === 1 ? "1er" : `${arrondissement}e`;
  return { label: `Paris ${suffix}`, path: `/location-salle-paris-${suffix}` };
};

const fetchSeoLandingMetadata = async (path, requestedPage = 1) => {
  const page = seoLandingPages.find((candidate) => `/${candidate.slug}` === path);
  if (!page) return null;
  const [venues, override] = await Promise.all([
    fetchSupabaseRows("venues", { select: "*", active: "eq.true", limit: "1000" }),
    fetchSeoMetadata(path),
  ]);
  const matchingVenues = getMatchingSeoVenues(venues, page);
  const pageSize = 24;
  const pageCount = Math.max(1, Math.ceil(matchingVenues.length / pageSize));
  const currentPage = Math.min(Math.max(1, requestedPage), pageCount);
  const displayedVenues = matchingVenues.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const faq = override?.faq?.length ? override.faq : page.faq;
  const intro = override?.intro || page.intro;
  const guide = override?.guide || "";
  const pagination = pageCount > 1 ? `<nav aria-label="Pagination des lieux">${Array.from({ length: pageCount }, (_, index) => `<a href="${path}${index ? `?page=${index + 1}` : ""}">${index + 1}</a> `).join("")}</nav>` : "";
  const runtimeBody = `<main data-prerender-seo style="font-family:Arial,sans-serif;max-width:1120px;margin:0 auto;padding:64px 24px;color:#171717;">
    <nav aria-label="Fil d'Ariane"><a href="/">Accueil</a> / <a href="/inspirations">Inspirations</a> / ${escapeHtml(page.h1)}</nav>
    <h1>${escapeHtml(page.h1)}</h1><p>${escapeHtml(intro)}</p>
    ${venueCardGrid(displayedVenues)}${pagination}
    ${guide ? `<section><h2>Bien choisir votre lieu</h2><div style="white-space:pre-line;">${escapeHtml(guide)}</div></section>` : ""}
    <section><h2>Questions fréquentes</h2>${faq.map((item) => `<article><h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p></article>`).join("")}</section>
  </main>`;
  return {
    title: override?.title || page.title,
    description: override?.description || page.description,
    image: displayedVenues[0]?.cover_image || defaultImage,
    noindex: page.indexable === false || matchingVenues.length < 3,
    canonicalPath: currentPage > 1 ? `${path}?page=${currentPage}` : path,
    runtimeBody,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "CollectionPage", name: page.h1, description: override?.description || page.description, url: `${siteUrl}${path}`, mainEntity: { "@type": "ItemList", itemListElement: displayedVenues.map((venue, index) => ({ "@type": "ListItem", position: ((currentPage - 1) * pageSize) + index + 1, name: venue.title, url: `${siteUrl}/salle/${venue.slug}` })) } },
        { "@type": "FAQPage", mainEntity: faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
        { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: siteUrl }, { "@type": "ListItem", position: 2, name: "Inspirations", item: `${siteUrl}/inspirations` }, { "@type": "ListItem", position: 3, name: page.h1, item: `${siteUrl}${path}` }] },
      ],
    },
  };
};

const fetchVenueMetadata = async (slug) => {
  let [venue] = await fetchSupabaseRows("venues", {
    select: "id,title,slug,tagline,description,address,city,min_capacity,max_capacity,cover_image,gallery,event_categories,venue_types,services,spaces,useful_information,option_features,ambiance_types,external_options,privatization_types,guest_dispositions,space_types,metro_access,location,closing_time,rating,review_count,price_amount,price_type,pricing_text,price_tier,seo_title,meta_description",
    slug: `eq.${slug}`,
    active: "eq.true",
    limit: "1",
  });

  if (!venue && slug === "letage-du-mirasol") {
    [venue] = await fetchSupabaseRows("venues", {
      select: "id,title,slug,tagline,description,address,city,min_capacity,max_capacity,cover_image,gallery,event_categories,venue_types,services,spaces,useful_information,option_features,ambiance_types,external_options,privatization_types,guest_dispositions,space_types,metro_access,location,closing_time,rating,review_count,price_amount,price_type,pricing_text,price_tier,seo_title,meta_description",
      slug: "in.(l'étage-du-mirasol,l’étage-du-mirasol)",
      active: "eq.true",
      limit: "1",
    }).catch(() => []);
    if (venue) venue = { ...venue, slug: "letage-du-mirasol" };
  }

  if (!venue) return null;

  const [reviews, nearbyVenues] = await Promise.all([
    fetchSupabaseRows("venue_reviews", { select: "author_name,rating,comment,created_at", venue_id: `eq.${venue.id}`, published: "eq.true", order: "created_at.desc", limit: "100" }).catch(() => []),
    fetchSupabaseRows("venues", { select: "id,title,slug,city,max_capacity", city: `eq.${venue.city}`, active: "eq.true", limit: "7" }).catch(() => []),
  ]);

  const address = venue.address || venue.city || "";
  const maxCapacity = Number(venue.max_capacity ?? 0);
  const capacity = maxCapacity > 0 ? `Jusqu'à ${maxCapacity} personnes.` : "Capacité sur demande.";
  const path = `/salle/${venue.slug}`;
  const rating = reviews.length ? reviews.reduce((total, review) => total + Number(review.rating || 0), 0) / reviews.length : 0;
  const reviewCount = reviews.length;
  const eventCategories = Array.isArray(venue.event_categories) ? venue.event_categories : [];
  const venueTypes = Array.isArray(venue.venue_types) ? venue.venue_types : [];
  const location = getVenueLocation(venue);
  const typePath = venueTypePaths[venueTypes[0]] || "/location-salle-paris";
  const faq = buildVenueFaq(venue);
  const priceAmount = Number(venue.price_amount ?? 0);
  const venueSchema = {
    "@type": ["EventVenue", "LocalBusiness"],
    name: venue.title,
    description: venue.description || venue.tagline || "",
    image: [venue.cover_image, ...(Array.isArray(venue.gallery) ? venue.gallery : [])].filter(Boolean),
    url: `${siteUrl}${path}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: address,
      addressLocality: venue.city,
      addressCountry: "FR",
    },
    maximumAttendeeCapacity: maxCapacity || undefined,
    geo: venue.location?.lat && venue.location?.lng ? { "@type": "GeoCoordinates", latitude: venue.location.lat, longitude: venue.location.lng } : undefined,
    priceRange: venue.price_tier || undefined,
    amenityFeature: [...(venue.services || []), ...(venue.option_features || [])].map((name) => ({ "@type": "LocationFeatureSpecification", name, value: true })),
    aggregateRating: rating > 0 && reviewCount > 0
      ? { "@type": "AggregateRating", ratingValue: rating, reviewCount }
      : undefined,
    review: reviews.map((review) => ({ "@type": "Review", author: { "@type": "Person", name: review.author_name }, reviewRating: { "@type": "Rating", ratingValue: Number(review.rating), bestRating: 5 }, reviewBody: review.comment, datePublished: review.created_at })),
    offers: priceAmount > 0
      ? { "@type": "Offer", price: priceAmount, priceCurrency: "EUR", description: venue.pricing_text || undefined }
      : undefined,
  };
  const runtimeBody = `<main style="font-family:Arial,sans-serif;max-width:1120px;margin:0 auto;padding:64px 24px;color:#171717;">
    <nav aria-label="Fil d'Ariane" style="font-size:13px;margin-bottom:26px;"><a href="/">Accueil</a> / <a href="${location.path}">${escapeHtml(location.label)}</a> / ${escapeHtml(venue.title)}</nav>
    <article>
      <h1 style="font-family:Georgia,serif;font-size:58px;line-height:1;">${escapeHtml(venue.title)}<small style="display:block;margin-top:14px;font-family:Arial,sans-serif;font-size:22px;font-weight:500;">${escapeHtml(venueTypes[0] || "Lieu événementiel")} à privatiser à ${escapeHtml(venue.city)}</small></h1>
      <p>${escapeHtml(address)} · ${escapeHtml(capacity)} · ${escapeHtml(formatVenuePrice(venue))}</p>
      ${venue.cover_image ? `<img src="${escapeHtml(venue.cover_image)}" alt="Espace principal de ${escapeHtml(venue.title)} à ${escapeHtml(venue.city)}" width="1200" height="800" fetchpriority="high" loading="eager" decoding="async" style="width:100%;height:auto;border-radius:8px;">` : ""}
      <section><h2>Présentation</h2><p><strong>${escapeHtml(venue.tagline || "")}</strong></p><p style="max-width:780px;font-size:17px;line-height:1.8;white-space:pre-line;">${escapeHtml(venue.description || "")}</p></section>
      <section><h2>Détails du lieu</h2>${venueList("Type de lieu", venue.venue_types)}${venueList("Type d'espace", venue.space_types)}${venueList("Type de privatisation", venue.privatization_types)}${venueList("Disposition des invités", venue.guest_dispositions)}${venueList("Options du lieu", venue.option_features)}${venue.closing_time ? `<h3>Horaires</h3><p>Fermeture : ${escapeHtml(venue.closing_time === "03:00" ? "Après 2h" : venue.closing_time)}</p>` : ""}</section>
      ${arrayValue(venue.spaces).length ? `<section><h2>Options et espaces</h2>${arrayValue(venue.spaces).map((space) => `<article><h3>${escapeHtml(space.name)}</h3><p>${Number(space.capacity || 0)} personnes${Number(space.squareMeters || 0) > 0 ? ` · ${Number(space.squareMeters)} m²` : ""}</p><p>${escapeHtml(space.description || "")}</p></article>`).join("")}</section>` : ""}
      ${venueList("Ambiance & activités", venue.ambiance_types)}
      ${venueList("Ce que vous pouvez apporter", venue.external_options)}
      <section><h2>Informations utiles</h2>${venueList("Équipements & services", venue.services)}${venueEventLinks(venue.event_categories)}${venueList("À savoir", venue.useful_information)}</section>
      <section><h2>Accès</h2><p>${escapeHtml(address)}</p>${venue.metro_access ? `<p>Métro / accès : ${escapeHtml(venue.metro_access)}</p>` : ""}<p><a href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(address)}">Voir sur la carte</a></p></section>
      ${reviews.length ? `<section><h2>Avis clients Wearevents</h2>${reviews.map((review) => `<article><h3>${escapeHtml(review.author_name)} · ${Number(review.rating)}/5</h3><p>${escapeHtml(review.comment)}</p></article>`).join("")}</section>` : ""}
      <section><h2>Questions fréquentes sur ${escapeHtml(venue.title)}</h2>${faq.map((item) => `<article><h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p></article>`).join("")}</section>
      <section><h2>Lieux similaires</h2>${nearbyVenues.filter((candidate) => candidate.id !== venue.id).slice(0, 6).map((candidate) => `<article><h3><a href="/salle/${escapeHtml(candidate.slug)}">${escapeHtml(candidate.title)}</a></h3></article>`).join("")}</section>
      <nav aria-label="Recherches associées"><a href="${location.path}">Lieux à ${escapeHtml(location.label)}</a> · <a href="${typePath}">${escapeHtml(venueTypes[0] || "Lieux événementiels")} à privatiser</a>${eventCategories.filter((item) => SEO_EVENT_TYPES.includes(item)).map((item) => ` · <a href="${escapeHtml(getEventSeoPath(item))}">${escapeHtml(item)}</a>`).join("")}</nav>
      <p><a href="/recherche">Voir les autres lieux disponibles</a></p>
    </article>
  </main>`;

  return {
    title: String(venue.seo_title || "").trim() || `${venue.title} | Réservez rapidement`,
    description: String(venue.meta_description || "").trim() || `${address}. ${capacity} Retrouvez le reste des informations utiles sur la page de l'établissement.`,
    image: venue.cover_image || defaultImage,
    runtimeBody,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [venueSchema,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: siteUrl },
          { "@type": "ListItem", position: 2, name: location.label, item: `${siteUrl}${location.path}` },
          { "@type": "ListItem", position: 3, name: venue.title, item: `${siteUrl}${path}` },
        ],
      },
      { "@type": "FAQPage", mainEntity: faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
    ]},
  };
};

const fetchBlogMetadata = async (slug) => {
  const [post] = await fetchSupabaseRows("blog_posts", {
    select: "title,slug,excerpt,content,image,published_at,updated_at,seo_title,meta_description",
    slug: `eq.${slug}`,
    published: "eq.true",
    limit: "1",
  });

  if (!post) return null;

  const path = `/blog/${post.slug}`;
  const description = String(post.meta_description || "").trim() || post.excerpt || "";

  return {
    title: String(post.seo_title || "").trim() || `${post.title} - Blog Wearevents`,
    description,
    image: post.image || defaultImage,
    type: "article",
    runtimeBody: `<main style="font-family:Arial,sans-serif;max-width:1120px;margin:0 auto;padding:64px 24px;color:#171717;">
      <nav aria-label="Fil d'Ariane" style="font-size:13px;margin-bottom:26px;"><a href="/">Accueil</a> / <a href="/blog">Blog</a> / ${escapeHtml(post.title)}</nav>
      <article><h1 style="font-family:Georgia,serif;font-size:56px;line-height:1;">${escapeHtml(post.title)}</h1>
      ${post.image ? `<img src="${escapeHtml(post.image)}" alt="Illustration de l'article ${escapeHtml(post.title)}" width="1200" height="675" style="width:100%;height:auto;border-radius:8px;">` : ""}
      <p style="font-size:18px;line-height:1.7;">${escapeHtml(post.excerpt || "")}</p>
      <div style="max-width:760px;font-size:17px;line-height:1.8;">${sanitizeBlogHtml(post.content)}</div></article>
    </main>`,
    jsonLd: [
      { "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description, image: post.image || defaultImage, datePublished: post.published_at, dateModified: post.updated_at, mainEntityOfPage: `${siteUrl}${path}`, publisher: { "@type": "Organization", name: "Wearevents", url: siteUrl } },
      { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: siteUrl }, { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/blog` }, { "@type": "ListItem", position: 3, name: post.title, item: `${siteUrl}${path}` }] },
    ],
  };
};

const getBaseRouteMetadata = async (path, requestedPage = 1) => {
  if (noindexPaths.has(path)) {
    const fallback = path === "/admin"
      ? { title: "Back office - Wearevents", description: "Espace privé Wearevents." }
      : staticMetadata[path];

    return {
      ...fallback,
      noindex: true,
      status: 200,
    };
  }

  const venueMatch = path.match(/^\/salle\/([^/]+)$/);
  if (venueMatch) {
    if (!isSupabaseServerConfigured) return null;

    const venueMetadata = await fetchVenueMetadata(decodeURIComponent(venueMatch[1]));
    return venueMetadata ?? {
      title: "Salle introuvable - Wearevents",
      description: "Cette salle n'existe pas ou n'est plus disponible.",
      noindex: true,
      status: 404,
    };
  }

  const blogMatch = path.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) {
    if (!isSupabaseServerConfigured) return null;

    const blogMetadata = await fetchBlogMetadata(decodeURIComponent(blogMatch[1]));
    return blogMetadata ?? {
      title: "Article introuvable - Wearevents",
      description: "Cet article n'existe pas ou n'est plus publié.",
      noindex: true,
      status: 404,
    };
  }

  if (seoLandingPaths.has(path)) {
    if (!isSupabaseServerConfigured) return null;
    return fetchSeoLandingMetadata(path, requestedPage);
  }

  if (staticMetadata[path]) return staticMetadata[path];

  if (staticIndexablePaths.has(path) || seoLandingPaths.has(path)) {
    return null;
  }

  return {
    title: "Page introuvable - Wearevents",
    description: "Cette page n'existe pas ou a été déplacée.",
    noindex: true,
    status: 404,
  };
};

const resolveMetadata = async (path, requestedPage = 1) => {
  const [baseMetadata, override] = await Promise.all([
    getBaseRouteMetadata(path, requestedPage).catch((error) => {
      console.warn(error);
      return null;
    }),
    fetchSeoMetadata(path).catch((error) => {
      console.warn(error);
      return null;
    }),
  ]);

  if (baseMetadata?.noindex) return baseMetadata;
  if (!baseMetadata && !override) return null;

  return {
    ...(baseMetadata ?? {}),
    ...(override?.title ? { title: override.title } : {}),
    ...(override?.description ? { description: override.description } : {}),
  };
};

const sendHtml = (response, status, html, method = "GET") => {
  response.statusCode = status;
  response.setHeader("Content-Type", "text/html; charset=utf-8");
  response.setHeader("Cache-Control", "no-store, max-age=0");
  response.setHeader("X-Wearevents-SEO-Renderer", "1");
  response.end(method === "HEAD" ? "" : html);
};

export default async function handler(request, response) {
  if (!["GET", "HEAD"].includes(request.method)) {
    response.setHeader("Allow", "GET, HEAD");
    response.statusCode = 405;
    response.end("Method Not Allowed");
    return;
  }

  const rawPath = Array.isArray(request.query.path) ? request.query.path[0] : request.query.path;
  let decodedRawPath = rawPath || "/";
  try {
    decodedRawPath = decodeURIComponent(decodedRawPath);
  } catch {
    // Keep the original value when an incoming URL contains malformed encoding.
  }
  const path = normalizeSeoPath(decodedRawPath);
  const requestedPage = Math.max(1, Number.parseInt(String(request.query.page || "1"), 10) || 1);

  if (decodedRawPath.length > 1 && decodedRawPath.endsWith("/")) {
    const query = requestedPage > 1 ? `?page=${requestedPage}` : "";
    response.statusCode = 301;
    response.setHeader("Location", `${path}${query}`);
    response.setHeader("Cache-Control", "public, max-age=0, s-maxage=86400");
    response.end();
    return;
  }

  if (["/salle/l'étage-du-mirasol", "/salle/l’étage-du-mirasol"].includes(path.toLowerCase())) {
    response.statusCode = 301;
    response.setHeader("Location", "/salle/letage-du-mirasol");
    response.setHeader("Cache-Control", "public, max-age=0, s-maxage=86400");
    response.end();
    return;
  }

  try {
    const [documentResult, metadata] = await Promise.all([
      readHtmlForPath(path),
      resolveMetadata(path, requestedPage),
    ]);
    const metadataHtml = metadata ? applyHtmlMetadata(documentResult.html, { path, ...metadata }) : documentResult.html;
    const nextHtml = metadata?.runtimeBody
      ? applyRuntimeContent(metadataHtml, metadata.runtimeBody, metadata.jsonLd)
      : metadataHtml;
    sendHtml(response, metadata?.status ?? 200, nextHtml, request.method);
  } catch (error) {
    console.error(error);
    const documentResult = await readHtmlForPath("/").catch(() => ({ html: "<!doctype html><html><head></head><body></body></html>", prerendered: false }));
    sendHtml(
      response,
      500,
      applyHtmlMetadata(documentResult.html, {
        path,
        title: "Erreur serveur - Wearevents",
        description: "Une erreur est survenue.",
        noindex: true,
      }),
      request.method,
    );
  }
}
