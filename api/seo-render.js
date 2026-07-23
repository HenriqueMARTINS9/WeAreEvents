import { readFile, stat } from "node:fs/promises";
import { join, normalize, sep } from "node:path";
import { seoLandingPages } from "../src/data/seo-landings-data.js";

const distDir = join(process.cwd(), "dist");
const siteUrl = (process.env.VITE_SITE_URL || process.env.PUBLIC_SITE_URL || "https://www.wearevents.fr").replace(/\/$/, "");
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const isSupabaseServerConfigured = Boolean(supabaseUrl && supabaseKey);
const defaultImage = `${siteUrl}/og-image.svg`;

const staticIndexablePaths = new Set([
  "/",
  "/recherche",
  "/blog",
  "/inspirations",
  "/faq",
  "/reseaux-sociaux",
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
const noindexPaths = new Set(["/admin"]);
const seoLandingPaths = new Set(seoLandingPages.map((page) => `/${page.slug}`));

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

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
      return readFile(staticPagePath, "utf8");
    }
  }

  return readFile(join(distDir, "index.html"), "utf8");
};

const replaceOrInsertHeadTag = (html, matcher, tag) => {
  if (matcher.test(html)) return html.replace(matcher, tag);
  return html.replace("</head>", `    ${tag}\n  </head>`);
};

const applyHtmlMetadata = (html, metadata) => {
  const {
    path,
    title,
    description,
    image = defaultImage,
    type = "website",
    noindex = false,
  } = metadata;
  const canonical = canonicalUrl(path);
  let nextHtml = html;

  nextHtml = nextHtml.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  nextHtml = replaceOrInsertHeadTag(nextHtml, /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${escapeHtml(canonical)}" />`);
  nextHtml = replaceOrInsertHeadTag(nextHtml, /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${escapeHtml(description)}">`);
  nextHtml = replaceOrInsertHeadTag(nextHtml, /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i, `<meta name="robots" content="${noindex ? "noindex, nofollow" : "index, follow"}" />`);
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
  });

  if (!response.ok) throw new Error(`Supabase ${table} fetch failed with ${response.status}`);

  return response.json();
};

const fetchSeoMetadata = async (path) => {
  const [row] = await fetchSupabaseRows("seo_metadata", {
    select: "title,description",
    page_path: `eq.${path}`,
    active: "eq.true",
    limit: "1",
  });

  if (!row) return null;

  return {
    title: String(row.title || "").trim(),
    description: String(row.description || "").trim(),
  };
};

const fetchVenueMetadata = async (slug) => {
  const [venue] = await fetchSupabaseRows("venues", {
    select: "title,address,city,max_capacity,cover_image",
    slug: `eq.${slug}`,
    active: "eq.true",
    limit: "1",
  });

  if (!venue) return null;

  const address = venue.address || venue.city || "";
  const maxCapacity = Number(venue.max_capacity ?? 0);
  const capacity = maxCapacity > 0 ? `Jusqu'à ${maxCapacity} personnes.` : "Capacité sur demande.";

  return {
    title: `${venue.title} | Réservez rapidement`,
    description: `${address}. ${capacity} Retrouvez le reste des informations utiles sur la page de l'établissement.`,
    image: venue.cover_image || defaultImage,
  };
};

const fetchBlogMetadata = async (slug) => {
  const [post] = await fetchSupabaseRows("blog_posts", {
    select: "title,excerpt,image,seo_title,meta_description",
    slug: `eq.${slug}`,
    published: "eq.true",
    limit: "1",
  });

  if (!post) return null;

  return {
    title: String(post.seo_title || "").trim() || `${post.title} - Blog Wearevents`,
    description: String(post.meta_description || "").trim() || post.excerpt || "",
    image: post.image || defaultImage,
    type: "article",
  };
};

const getBaseRouteMetadata = async (path) => {
  if (noindexPaths.has(path)) {
    return {
      title: "Back office - Wearevents",
      description: "Espace privé Wearevents.",
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

const resolveMetadata = async (path) => {
  const [baseMetadata, override] = await Promise.all([
    getBaseRouteMetadata(path).catch((error) => {
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
  response.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
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
  const path = normalizeSeoPath(rawPath || "/");

  try {
    const [html, metadata] = await Promise.all([
      readHtmlForPath(path),
      resolveMetadata(path),
    ]);
    const nextHtml = metadata ? applyHtmlMetadata(html, { path, ...metadata }) : html;
    sendHtml(response, metadata?.status ?? 200, nextHtml, request.method);
  } catch (error) {
    console.error(error);
    const html = await readHtmlForPath("/").catch(() => "<!doctype html><html><head></head><body></body></html>");
    sendHtml(
      response,
      500,
      applyHtmlMetadata(html, {
        path,
        title: "Erreur serveur - Wearevents",
        description: "Une erreur est survenue.",
        noindex: true,
      }),
      request.method,
    );
  }
}
