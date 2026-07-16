import { createClient } from "@supabase/supabase-js";

const imageBucket = "wearevents-images";
const maxHtmlChars = 220_000;
const maxTextChars = 70_000;
const maxImageCandidates = 36;
const maxUploadedImages = 8;
const maxRemoteImageSizeBytes = 12 * 1024 * 1024;

const eventTypes = [
  "Mariage",
  "Anniversaire",
  "Corporate",
  "Soirée privée",
  "Gala",
  "Séminaire",
  "Cocktail",
  "Lancement",
  "Afterwork",
  "EVJF / EVG",
  "Baptême",
  "Bar mitzvah",
  "Remise de diplôme",
  "Événement étudiant",
  "Team building",
  "Conférence",
  "Formation",
  "Dîner d'affaires",
  "Shooting / tournage",
];

const venueTypes = [
  "Péniche",
  "Rooftop",
  "Discothèque",
  "Bar",
  "Salle de réception",
  "Espace extérieur",
  "Appartement",
  "Loft",
  "Villa",
  "Restaurant",
  "Château",
  "Domaine",
  "Hôtel",
  "Jardin",
  "Showroom",
];

const services = [
  "TV",
  "Climatisation",
  "Accès PMR",
  "Micro",
  "Wi-Fi",
  "Terrasse",
  "Projecteur",
  "Système son",
  "Mobilier",
  "Table de mixage",
  "Parking",
  "Vestiaire",
  "Cuisine équipée",
  "Bar équipé",
  "Lumières",
  "Scène",
  "Personnel sur place",
  "Sécurité",
  "Hébergement",
];

const priceTiers = ["€", "€€", "€€€", "€€€€"];
const closingTimes = ["", "00:00", "02:00", "03:00"];
const ambianceTypes = [
  "Calme",
  "Animé",
  "Festif",
  "Élégant",
  "Corporate",
  "Intimiste",
  "Atypique",
  "Chic",
  "Convivial",
  "Lounge",
  "Premium",
  "Décontracté",
  "Bohème",
  "Moderne",
  "Industriel",
  "Romantique",
  "Rooftop",
  "Club",
];
const externalOptions = [
  "Possibilité de ramener sa nourriture",
  "Possibilité de ramener ses boissons",
  "Possibilité de ramener son gâteau",
];
const privatizationTypes = [
  "Forfait consommation (budget par personne)",
  "Location sèche (budget location)",
];
const guestDispositions = ["Debout", "Assis"];
const spaceTypes = ["Espace clos", "Espace ouvert"];
const optionFeatures = [
  "Possibilité de mettre sa musique",
  "Possibilité de danser",
  "Décoration personnalisable",
  "Jeux (baby-foot / ping-pong / etc.)",
  "Heures supplémentaires possibles",
];

const requestHeaders = {
  "User-Agent": "Mozilla/5.0 (compatible; WeareventsVenueImporter/1.0; +https://www.wearevents.fr)",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

const jsonResponse = (response, status, body) => {
  response.status(status).json(body);
};

const fail = (response, status, message, details) =>
  jsonResponse(response, status, { error: message, details });

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " et ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const isPrivateHost = (hostname) => {
  const host = hostname.toLowerCase();
  if (["localhost", "0.0.0.0", "::1"].includes(host)) return true;
  if (/^127\./.test(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  const private172 = host.match(/^172\.(\d+)\./);
  return Boolean(private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31);
};

const parseSourceUrl = (value) => {
  const sourceUrl = new URL(value);
  if (!["http:", "https:"].includes(sourceUrl.protocol)) throw new Error("Le lien doit commencer par http:// ou https://.");
  if (isPrivateHost(sourceUrl.hostname)) throw new Error("Ce domaine ne peut pas être importé.");
  return sourceUrl;
};

const parseAttributes = (tag) => {
  const attributes = {};
  const pattern = /([:\w-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let match;

  while ((match = pattern.exec(tag))) {
    attributes[match[1].toLowerCase()] = match[3] ?? match[4] ?? match[5] ?? "";
  }

  return attributes;
};

const decodeHtml = (value = "") =>
  value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_match, code) => String.fromCharCode(parseInt(code, 16)));

const unique = (values) => Array.from(new Set(values.filter(Boolean)));

const toAbsoluteUrl = (value, baseUrl) => {
  if (!value) return "";
  const cleaned = decodeHtml(String(value).trim());
  if (!cleaned || cleaned.startsWith("data:") || cleaned.startsWith("blob:")) return "";

  try {
    return new URL(cleaned, baseUrl).toString();
  } catch {
    return "";
  }
};

const getFirstSrcsetUrl = (srcset = "") => {
  const firstCandidate = srcset.split(",")[0]?.trim();
  return firstCandidate?.split(/\s+/)[0] ?? "";
};

const extractMeta = (html) => {
  const metas = {};
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];

  tags.forEach((tag) => {
    const attributes = parseAttributes(tag);
    const key = attributes.property || attributes.name || attributes.itemprop;
    if (!key || !attributes.content) return;
    metas[key.toLowerCase()] = decodeHtml(attributes.content);
  });

  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  if (title) metas.title = decodeHtml(title.replace(/<[^>]+>/g, " "));

  return metas;
};

const extractJsonLd = (html) => {
  const scripts = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const values = [];

  scripts.forEach((script) => {
    const raw = decodeHtml(script[1].trim());
    if (!raw) return;

    try {
      values.push(JSON.parse(raw));
    } catch {
      const jsonCandidate = raw.match(/\{[\s\S]*\}/)?.[0];
      if (!jsonCandidate) return;
      try {
        values.push(JSON.parse(jsonCandidate));
      } catch {
        // Ignore malformed structured data.
      }
    }
  });

  return values.slice(0, 8);
};

const collectImagesFromJsonLd = (value, output = []) => {
  if (!value) return output;

  if (typeof value === "string") {
    output.push(value);
    return output;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectImagesFromJsonLd(item, output));
    return output;
  }

  if (typeof value === "object") {
    if (value.image) collectImagesFromJsonLd(value.image, output);
    if (value.photo) collectImagesFromJsonLd(value.photo, output);
    if (value.thumbnailUrl) collectImagesFromJsonLd(value.thumbnailUrl, output);
    if (value.contentUrl) collectImagesFromJsonLd(value.contentUrl, output);
    if (value.url && /image/i.test(String(value["@type"] ?? ""))) output.push(value.url);
  }

  return output;
};

const extractImages = (html, baseUrl, metas, jsonLd) => {
  const images = [
    metas["og:image"],
    metas["og:image:url"],
    metas["twitter:image"],
    ...jsonLd.flatMap((item) => collectImagesFromJsonLd(item)),
  ];

  const imageTags = html.match(/<(img|source)\b[^>]*>/gi) ?? [];

  imageTags.forEach((tag) => {
    const attributes = parseAttributes(tag);
    const source =
      attributes.src ||
      attributes["data-src"] ||
      attributes["data-original"] ||
      attributes["data-lazy-src"] ||
      attributes["data-srcset"] ||
      attributes.srcset ||
      "";
    images.push(source.includes(",") ? getFirstSrcsetUrl(source) : source);
  });

  return unique(
    images
      .map((image) => toAbsoluteUrl(image, baseUrl))
      .filter((image) => {
        const lower = image.toLowerCase();
        if (!image.startsWith("http")) return false;
        if (/\.(svg|gif|ico)(\?|#|$)/i.test(lower)) return false;
        if (/(logo|favicon|sprite|avatar|tracking|pixel|placeholder)/i.test(lower)) return false;
        return true;
      }),
  ).slice(0, maxImageCandidates);
};

const extractText = (html) =>
  decodeHtml(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<svg\b[\s\S]*?<\/svg>/gi, " ")
      .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|section|article|li|h1|h2|h3|h4|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  ).slice(0, maxTextChars);

const getNextVenueCode = async (supabase) => {
  const { data, error } = await supabase.from("venues").select("venue_code");
  if (error) throw error;

  const maxCode = (data ?? []).reduce((max, venue) => {
    const numericCode = Number(String(venue.venue_code ?? "").replace(/\D/g, ""));
    return Number.isFinite(numericCode) ? Math.max(max, numericCode) : max;
  }, 1000);

  return String(maxCode + 1).padStart(4, "0").slice(-4);
};

const createSchema = () => ({
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "tagline",
    "description",
    "city",
    "address",
    "lat",
    "lng",
    "minCapacity",
    "maxCapacity",
    "pricingText",
    "priceTier",
    "closingTime",
    "metroAccess",
    "contactEmail",
    "rating",
    "reviewCount",
    "googleReviewUrl",
    "eventCategories",
    "venueTypes",
    "services",
    "ambianceTypes",
    "externalOptions",
    "privatizationTypes",
    "guestDispositions",
    "spaceTypes",
    "optionFeatures",
    "usefulInformation",
    "spaces",
    "notes",
  ],
  properties: {
    title: { type: "string" },
    tagline: { type: "string" },
    description: { type: "string" },
    city: { type: "string" },
    address: { type: "string" },
    lat: { type: "string" },
    lng: { type: "string" },
    minCapacity: { type: "string" },
    maxCapacity: { type: "string" },
    pricingText: { type: "string" },
    priceTier: { type: "string", enum: priceTiers },
    closingTime: { type: "string", enum: closingTimes },
    metroAccess: { type: "string" },
    contactEmail: { type: "string" },
    rating: { type: "string" },
    reviewCount: { type: "string" },
    googleReviewUrl: { type: "string" },
    eventCategories: { type: "array", items: { type: "string", enum: eventTypes } },
    venueTypes: { type: "array", items: { type: "string", enum: venueTypes } },
    services: { type: "array", items: { type: "string", enum: services } },
    ambianceTypes: { type: "array", items: { type: "string", enum: ambianceTypes } },
    externalOptions: { type: "array", items: { type: "string", enum: externalOptions } },
    privatizationTypes: { type: "array", items: { type: "string", enum: privatizationTypes } },
    guestDispositions: { type: "array", items: { type: "string", enum: guestDispositions } },
    spaceTypes: { type: "array", items: { type: "string", enum: spaceTypes } },
    optionFeatures: { type: "array", items: { type: "string", enum: optionFeatures } },
    usefulInformation: { type: "array", items: { type: "string" } },
    spaces: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "capacity", "squareMeters", "description"],
        properties: {
          name: { type: "string" },
          capacity: { type: "string" },
          squareMeters: { type: "string" },
          description: { type: "string" },
        },
      },
    },
    notes: { type: "array", items: { type: "string" } },
  },
});

const callOpenAi = async ({ sourceUrl, finalUrl, metas, jsonLd, pageText, imageCandidates }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY manquant côté serveur.");

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            "Tu es un assistant de back office Wearevents. Tu extrais uniquement les informations factuelles d'une page de lieu événementiel, puis tu les convertis vers le formulaire Wearevents. N'invente pas d'email, d'adresse, de capacité, de métro, d'avis ou de coordonnées si la source ne les contient pas. Pour les textes marketing, reformule en français naturel et concis, sans copier de longs passages.",
        },
        {
          role: "user",
          content: JSON.stringify({
            sourceUrl,
            finalUrl,
            metas,
            structuredData: jsonLd,
            pageText,
            imageCandidates,
            allowedValues: {
              eventTypes,
              venueTypes,
              services,
              priceTiers,
              closingTimes,
              ambianceTypes,
              externalOptions,
              privatizationTypes,
              guestDispositions,
              spaceTypes,
              optionFeatures,
            },
            instructions: [
              "title: nom public de l'établissement.",
              "tagline: courte accroche commerciale en une phrase.",
              "description: 2 à 4 phrases prêtes pour une fiche Wearevents.",
              "minCapacity/maxCapacity: nombres en texte si trouvés.",
              "priceTier: estime € à €€€€ seulement si des prix sont visibles, sinon €€.",
              "closingTime: 00:00 pour jusqu'à minuit, 02:00 pour jusqu'à 2h, 03:00 pour après 2h, sinon chaîne vide.",
              "spaces: crée au moins une option de réservation si une capacité est connue, sinon Salle principale avec champs vides.",
              "usefulInformation: points courts et vérifiables uniquement.",
            ],
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "wearevents_venue_import",
          strict: true,
          schema: createSchema(),
        },
      },
      max_output_tokens: 4500,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error?.message || `OpenAI a répondu avec le statut ${response.status}.`);
  }

  const outputText =
    payload.output_text ||
    payload.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text || content.output_text || "")
      .join("") ||
    "";

  if (!outputText) throw new Error("OpenAI n'a retourné aucune donnée exploitable.");

  return JSON.parse(outputText);
};

const getImageExtension = (url, contentType) => {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("avif")) return "avif";
  const extension = new URL(url).pathname.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "webp", "avif"].includes(extension)) return extension === "jpeg" ? "jpg" : extension;
  return "jpg";
};

const uploadRemoteImages = async ({ supabase, imageUrls, venueSlug, referer }) => {
  const uploaded = [];
  const warnings = [];

  for (const imageUrl of imageUrls) {
    if (uploaded.length >= maxUploadedImages) break;

    try {
      const response = await fetch(imageUrl, {
        headers: {
          ...requestHeaders,
          Referer: referer,
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
      });

      if (!response.ok) {
        warnings.push(`Image ignorée (${response.status}) : ${imageUrl}`);
        continue;
      }

      const contentType = response.headers.get("content-type")?.split(";")[0]?.toLowerCase() || "";
      if (!contentType.startsWith("image/") || contentType.includes("svg") || contentType.includes("gif")) {
        warnings.push(`Format image ignoré (${contentType || "inconnu"}) : ${imageUrl}`);
        continue;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      if (!buffer.length || buffer.length > maxRemoteImageSizeBytes) {
        warnings.push(`Image trop lourde ou vide : ${imageUrl}`);
        continue;
      }

      const target = uploaded.length === 0 ? "principale" : "secondaires";
      const extension = getImageExtension(imageUrl, contentType);
      const path = `venues/${venueSlug}/${target}/${Date.now()}-${uploaded.length + 1}-import.${extension}`;
      const { error } = await supabase.storage.from(imageBucket).upload(path, buffer, {
        cacheControl: "31536000",
        contentType,
        upsert: false,
      });

      if (error) {
        warnings.push(`Upload Supabase impossible pour ${imageUrl} : ${error.message}`);
        continue;
      }

      uploaded.push({
        sourceUrl: imageUrl,
        publicUrl: supabase.storage.from(imageBucket).getPublicUrl(path).data.publicUrl,
        target,
      });
    } catch (error) {
      warnings.push(`Image ignorée : ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { uploaded, warnings };
};

const normalizeImportedVenue = (venue, venueCode, sourceUrl) => {
  const title = String(venue.title || "").trim();
  const slug = slugify(title);

  return {
    title,
    slug,
    venueCode,
    tagline: String(venue.tagline || "").trim(),
    description: String(venue.description || "").trim(),
    city: String(venue.city || "").trim(),
    address: String(venue.address || "").trim(),
    lat: String(venue.lat || "").trim(),
    lng: String(venue.lng || "").trim(),
    minCapacity: String(venue.minCapacity || "").replace(/[^\d]/g, ""),
    maxCapacity: String(venue.maxCapacity || "").replace(/[^\d]/g, ""),
    pricingText: String(venue.pricingText || "").trim(),
    priceTier: priceTiers.includes(venue.priceTier) ? venue.priceTier : "€€",
    closingTime: closingTimes.includes(venue.closingTime) ? venue.closingTime : "",
    metroAccess: String(venue.metroAccess || "").trim(),
    contactEmail: String(venue.contactEmail || "").trim(),
    rating: String(venue.rating || "0").replace(",", "."),
    reviewCount: String(venue.reviewCount || "0").replace(/[^\d]/g, ""),
    googleReviewUrl: String(venue.googleReviewUrl || "").trim(),
    eventCategories: (venue.eventCategories || []).filter((item) => eventTypes.includes(item)),
    venueTypes: (venue.venueTypes || []).filter((item) => venueTypes.includes(item)),
    services: (venue.services || []).filter((item) => services.includes(item)),
    ambianceTypes: (venue.ambianceTypes || []).filter((item) => ambianceTypes.includes(item)),
    externalOptions: (venue.externalOptions || []).filter((item) => externalOptions.includes(item)),
    privatizationTypes: (venue.privatizationTypes || []).filter((item) => privatizationTypes.includes(item)),
    guestDispositions: (venue.guestDispositions || []).filter((item) => guestDispositions.includes(item)),
    spaceTypes: (venue.spaceTypes || []).filter((item) => spaceTypes.includes(item)),
    optionFeatures: (venue.optionFeatures || []).filter((item) => optionFeatures.includes(item)),
    usefulInformation: unique([
      ...(venue.usefulInformation || []).map((item) => String(item).trim()).filter(Boolean),
      `Source import : ${sourceUrl}`,
    ]),
    spaces:
      Array.isArray(venue.spaces) && venue.spaces.length
        ? venue.spaces.map((space) => ({
            name: String(space.name || "Salle principale").trim() || "Salle principale",
            capacity: String(space.capacity || "").replace(/[^\d]/g, ""),
            squareMeters: String(space.squareMeters || "").replace(/[^\d]/g, ""),
            description: String(space.description || "").trim(),
          }))
        : [{ name: "Salle principale", capacity: "", squareMeters: "", description: "" }],
    notes: venue.notes || [],
  };
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return fail(response, 405, "Méthode non autorisée.");
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabasePublishable = process.env.VITE_SUPABASE_PUBLISHABLE || process.env.SUPABASE_ANON_KEY;
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabasePublishable || !supabaseServiceRole) {
    return fail(response, 500, "Configuration Supabase serveur incomplète.", {
      required: ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE", "SUPABASE_SERVICE_ROLE_KEY"],
    });
  }

  const authorization = request.headers.authorization || "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token) return fail(response, 401, "Session Supabase manquante.");

  const authClient = createClient(supabaseUrl, supabasePublishable);
  const { data: userData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !userData.user) return fail(response, 401, "Session Supabase invalide.");

  let body;

  try {
    body = typeof request.body === "string"
      ? JSON.parse(request.body || "{}")
      : request.body || {};
  } catch {
    return fail(response, 400, "Le corps de la requête est invalide.");
  }

  const rawUrl = String(body.url || "").trim();
  if (!rawUrl) return fail(response, 400, "Renseigne un lien à importer.");

  let sourceUrl;
  try {
    sourceUrl = parseSourceUrl(rawUrl);
  } catch (error) {
    return fail(response, 400, error instanceof Error ? error.message : "Lien invalide.");
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, {
    auth: { persistSession: false },
  });

  try {
    const [venueCode, pageResponse] = await Promise.all([
      getNextVenueCode(supabaseAdmin),
      fetch(sourceUrl.toString(), { headers: requestHeaders, redirect: "follow" }),
    ]);

    if (!pageResponse.ok) {
      return fail(response, 422, `La page source répond avec le statut ${pageResponse.status}.`);
    }

    const html = (await pageResponse.text()).slice(0, maxHtmlChars);
    const finalUrl = pageResponse.url || sourceUrl.toString();
    const metas = extractMeta(html);
    const jsonLd = extractJsonLd(html);
    const pageText = extractText(html);
    const imageCandidates = extractImages(html, finalUrl, metas, jsonLd);

    if (!pageText && !metas.title) {
      return fail(response, 422, "Impossible de lire suffisamment de contenu sur cette page.");
    }

    const extractedVenue = await callOpenAi({
      sourceUrl: sourceUrl.toString(),
      finalUrl,
      metas,
      jsonLd,
      pageText,
      imageCandidates,
    });
    const venue = normalizeImportedVenue(extractedVenue, venueCode, finalUrl);
    const venueSlug = venue.slug || `salle-${venueCode}`;
    const imageImport = await uploadRemoteImages({
      supabase: supabaseAdmin,
      imageUrls: imageCandidates,
      venueSlug,
      referer: finalUrl,
    });
    const [coverImage, ...gallery] = imageImport.uploaded.map((image) => image.publicUrl);

    return jsonResponse(response, 200, {
      venue: {
        ...venue,
        slug: venueSlug,
        coverImage: coverImage || "",
        gallery,
      },
      source: {
        requestedUrl: sourceUrl.toString(),
        finalUrl,
        imageCandidatesCount: imageCandidates.length,
      },
      warnings: [...(venue.notes || []), ...imageImport.warnings],
    });
  } catch (error) {
    return fail(response, 500, error instanceof Error ? error.message : "Import impossible.");
  }
}
