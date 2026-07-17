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
  "Soirée privée",
  "EVJF / EVG",
  "Baptême",
  "Communion",
  "Bar mitzvah",
  "Baby shower",
  "Gala",
  "Cocktail",
  "Séminaire",
  "Journée d'étude",
  "Team building",
  "Conférence",
  "Lancement de produit",
  "Afterwork",
  "Repas d'entreprise",
  "Fête de fin d'année",
  "Arbre de Noël",
  "Assemblée générale",
  "Salon professionnel",
  "Exposition",
  "Pop-up store",
  "Tournage",
  "Shooting",
  "Défilé",
  "Concert",
];

const venueTypes = [
  "Péniche",
  "Rooftop",
  "Discothèque",
  "Bar",
  "Salle de réception",
  "Salle de réunion",
  "Salle de conférence",
  "Espace extérieur",
  "Appartement",
  "Maison",
  "Loft",
  "Villa",
  "Restaurant",
  "Château",
  "Domaine",
  "Hôtel",
  "Jardin",
  "Terrasse",
  "Plage privée",
  "Hangar",
  "Showroom",
];

const services = [
  "TV",
  "Climatisation",
  "Accès PMR",
  "Micro",
  "Wi-Fi",
  "Terrasse",
  "Jardin",
  "Piscine",
  "Projecteur",
  "Écran",
  "Système son",
  "Mobilier",
  "Table de mixage",
  "Piste de danse",
  "Parking",
  "Vestiaire",
  "Loge",
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

const normalizeTextForMatching = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const getNumbersFromText = (value = "") => {
  const normalizedValue = String(value)
    .replace(/(\d)\s+(?=\d{3}\b)/g, "$1")
    .replace(/,/g, ".");
  return (normalizedValue.match(/\d+(?:\.\d+)?/g) ?? [])
    .map(Number)
    .filter((number) => Number.isFinite(number));
};

const getMinNumberText = (value = "") => {
  const numbers = getNumbersFromText(value);
  return numbers.length ? String(Math.round(Math.min(...numbers))) : "";
};

const getMaxNumberText = (value = "") => {
  const numbers = getNumbersFromText(value);
  return numbers.length ? String(Math.round(Math.max(...numbers))) : "";
};

const cleanAddressPart = (value = "") =>
  String(value)
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/^[,\s]+|[,\s]+$/g, "")
    .trim();

const getPostalCode = (value = "") => String(value).match(/\b\d{5}\b/)?.[0] ?? "";

const getParisArrondissementFromPostalCode = (postalCode = "") => {
  const match = String(postalCode).match(/^750(0[1-9]|1\d|20)$/);
  if (!match) return "";
  return String(Number(match[1]));
};

const formatImportedCity = (city = "", postalCode = "") => {
  const cleanedCity = cleanAddressPart(city).replace(/\b\d{5}\b/g, "").trim();
  const parisArrondissement = getParisArrondissementFromPostalCode(postalCode);

  if (parisArrondissement && /\bparis\b/i.test(`${cleanedCity} Paris`)) {
    return `Paris ${parisArrondissement}`;
  }

  return cleanedCity;
};

const extractCityAfterPostalCode = (address = "", postalCode = "") => {
  if (!postalCode) return "";
  const postalCodeIndex = address.indexOf(postalCode);
  if (postalCodeIndex < 0) return "";

  return cleanAddressPart(address.slice(postalCodeIndex + postalCode.length));
};

const formatImportedAddressAndCity = (address = "", city = "") => {
  const cleanedAddress = cleanAddressPart(address);
  const cleanedCity = cleanAddressPart(city);
  const postalCode = getPostalCode(cleanedAddress) || getPostalCode(cleanedCity);
  const cityFromAddress = extractCityAfterPostalCode(cleanedAddress, postalCode);
  const formattedCity = formatImportedCity(cityFromAddress || cleanedCity, postalCode);

  if (!postalCode) {
    return {
      address: cleanedAddress,
      city: formattedCity || cleanedCity,
    };
  }

  const postalCodeIndex = cleanedAddress.indexOf(postalCode);
  const streetAddress = postalCodeIndex >= 0
    ? cleanAddressPart(cleanedAddress.slice(0, postalCodeIndex))
    : cleanedAddress;

  return {
    address: [streetAddress, postalCode, formattedCity].filter(Boolean).join(", "),
    city: formattedCity,
  };
};

const formatListWithEt = (values = []) => {
  const uniqueValues = unique(values.map((value) => String(value).trim()).filter(Boolean));
  if (uniqueValues.length <= 1) return uniqueValues[0] || "";
  if (uniqueValues.length === 2) return `${uniqueValues[0]} et ${uniqueValues[1]}`;
  return `${uniqueValues.slice(0, -1).join(", ")} et ${uniqueValues[uniqueValues.length - 1]}`;
};

const extractMetroLines = (value = "") => {
  const lineSections = [
    ...String(value).matchAll(/(?:ligne|lignes|metro|métro|rer)\s*([0-9a-zA-Z,\s&et-]+)/gi),
  ].map((match) => match[1]);
  const parenthesisSections = [...String(value).matchAll(/\(([^)]*)\)/g)].map((match) => match[1]);
  const source = [...lineSections, ...parenthesisSections].join(" ");

  return unique((source.match(/\b(?:\d{1,2}(?:bis)?|[A-Z])\b/gi) ?? []).map((line) => line.toUpperCase()));
};

const formatMetroAccess = (value = "") => {
  const rawValue = cleanAddressPart(value);
  if (!rawValue) return "";

  const lines = extractMetroLines(rawValue);
  let station = rawValue
    .replace(/^(?:metro|métro|station)\s*:?\s*/i, "")
    .replace(/\([^)]*(?:\d|ligne|lignes|metro|métro|rer)[^)]*\)/gi, "")
    .replace(/\s*,?\s*(?:ligne|lignes|metro|métro|rer)\s+[0-9a-zA-Z,\s&et-]+$/i, "")
    .replace(/\s*[-–]\s*(?:ligne|lignes|metro|métro|rer)\s+[0-9a-zA-Z,\s&et-]+$/i, "");

  station = cleanAddressPart(station).replace(/,$/, "").trim();
  if (!station) return rawValue;
  if (!lines.length) return station;

  return `${station}, ligne ${formatListWithEt(lines)}`;
};

const escapeRegExp = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getSourceReferenceLabels = (sourceUrl = "") => {
  const labels = ["privateaser"];

  try {
    const url = new URL(sourceUrl);
    const host = url.hostname.replace(/^www\./i, "");
    const brand = host.split(".")[0];
    labels.push(host, brand, url.toString());
  } catch {
    if (sourceUrl) labels.push(sourceUrl);
  }

  return unique(labels.filter(Boolean));
};

const stripSourceReferences = (value = "", sourceUrl = "") => {
  let text = String(value || "");
  const labels = getSourceReferenceLabels(sourceUrl);

  text = text.replace(/^.*source import\s*:.*$/gim, "");
  text = text.replace(/^.*site source\s*:.*$/gim, "");
  text = text.replace(/^.*(?:import|source)\s*:?\s*https?:\/\/\S+.*$/gim, "");
  text = text.replace(/https?:\/\/\S+/gi, "");

  labels.forEach((label) => {
    text = text.replace(new RegExp(escapeRegExp(label), "gi"), "");
  });

  return text
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const cleanSourceFreeList = (values = [], sourceUrl = "") =>
  unique(
    values
      .map((item) => stripSourceReferences(item, sourceUrl))
      .filter(Boolean),
  );

const externalOptionEvidence = {
  "Possibilité de ramener sa nourriture": [
    /\btraiteur externe\b/,
    /\bnourriture externe\b/,
    /\bapporter (sa|votre|de la) nourriture\b/,
    /\bramener (sa|votre|de la) nourriture\b/,
    /\brestauration externe\b/,
    /\bcaterer externe\b/,
  ],
  "Possibilité de ramener ses boissons": [
    /\bboissons? externes?\b/,
    /\bapporter (ses|vos|des) boissons?\b/,
    /\bramener (ses|vos|des) boissons?\b/,
    /\bvos propres boissons?\b/,
    /\bdroit de bouchon\b/,
  ],
  "Possibilité de ramener son gâteau": [
    /\bgateau externe\b/,
    /\bapporter (son|votre|un) gateau\b/,
    /\bramener (son|votre|un) gateau\b/,
    /\bpiece montee externe\b/,
  ],
};

const categoryEvidence = {
  eventCategories: {
    Mariage: [/\bmariage(s)?\b/],
    Anniversaire: [/\banniversaire(s)?\b/, /\banniv\b/],
    "Soirée privée": [/\bsoiree privee\b/, /\bevenement prive\b/],
    "EVJF / EVG": [/\bevjf\b/, /\bevg\b/, /\benterrement de vie\b/],
    Baptême: [/\bbapteme(s)?\b/],
    Communion: [/\bcommunion(s)?\b/],
    "Bar mitzvah": [/\bbar mitzvah\b/, /\bbat mitzvah\b/],
    "Baby shower": [/\bbaby shower(s)?\b/],
    Gala: [/\bgala(s)?\b/],
    Cocktail: [/\bcocktail(s)?\b/],
    Séminaire: [/\bseminaire(s)?\b/],
    "Journée d'étude": [/\bjournee d'etude(s)?\b/, /\bjournee etude(s)?\b/, /\bstudy day\b/],
    "Team building": [/\bteam building\b/, /\bteambuilding\b/],
    Conférence: [/\bconference(s)?\b/],
    "Lancement de produit": [/\blancement de produit\b/, /\blancement(s)?\b/, /\bproduct launch\b/],
    Afterwork: [/\bafterwork(s)?\b/],
    "Repas d'entreprise": [/\brepas d'entreprise\b/, /\bdiner d'affaires\b/, /\brepas d'affaires\b/, /\bdejeuner d'entreprise\b/],
    "Fête de fin d'année": [/\bfete de fin d'annee\b/, /\bsoiree de fin d'annee\b/],
    "Arbre de Noël": [/\barbre de noel\b/, /\bnoel\b/, /\bchristmas party\b/],
    "Assemblée générale": [/\bassemblee generale\b/, /\bag\b/],
    "Salon professionnel": [/\bsalon professionnel\b/, /\btrade show\b/],
    Exposition: [/\bexposition(s)?\b/, /\bexpo(s)?\b/],
    "Pop-up store": [/\bpop[- ]?up store\b/, /\bboutique ephemere\b/],
    Tournage: [/\btournage(s)?\b/, /\bfilm(ing)?\b/, /\bvideo shoot\b/],
    Shooting: [/\bshooting(s)?\b/, /\bshoot photo\b/, /\bphotoshoot\b/, /\bprise de vue(s)?\b/],
    Défilé: [/\bdefile(s)?\b/, /\bfashion show\b/],
    Concert: [/\bconcert(s)?\b/, /\blive music\b/],
  },
  venueTypes: {
    Péniche: [/\bpeniche(s)?\b/, /\bbateau(x)?\b/],
    Rooftop: [/\brooftop(s)?\b/, /\btoit terrasse\b/],
    Discothèque: [/\bdiscotheque(s)?\b/, /\bclub(s)?\b/, /\bnight[- ]?club\b/],
    Bar: [/\bbar(s)?\b/],
    "Salle de réception": [/\bsalle de reception\b/, /\bsalle evenementielle\b/],
    "Salle de réunion": [/\bsalle de reunion\b/, /\breunion(s)?\b/, /\bmeeting room\b/],
    "Salle de conférence": [/\bsalle de conference\b/, /\bconference room\b/, /\bauditorium\b/],
    "Espace extérieur": [/\bespace exterieur\b/, /\bexterieur(s)?\b/, /\bterrasse(s)?\b/, /\bjardin(s)?\b/, /\bpatio(s)?\b/],
    Appartement: [/\bappartement(s)?\b/],
    Maison: [/\bmaison(s)?\b/],
    Loft: [/\bloft(s)?\b/],
    Villa: [/\bvilla(s)?\b/],
    Restaurant: [/\brestaurant(s)?\b/],
    Château: [/\bchateau(x)?\b/],
    Domaine: [/\bdomaine(s)?\b/],
    Hôtel: [/\bhotel(s)?\b/],
    Jardin: [/\bjardin(s)?\b/],
    Terrasse: [/\bterrasse(s)?\b/],
    "Plage privée": [/\bplage privee\b/, /\bbeach club\b/, /\bplage\b/],
    Hangar: [/\bhangar(s)?\b/, /\bentrepot(s)?\b/, /\bwarehouse\b/],
    Showroom: [/\bshowroom(s)?\b/],
  },
  services: {
    TV: [/\btv\b/, /\btelevision(s)?\b/],
    Climatisation: [/\bclimatisation\b/, /\bclimatise(e|es|s)?\b/, /\bclim\b/],
    "Accès PMR": [/\bpmr\b/, /\bpersonnes a mobilite reduite\b/, /\bacces handicape\b/],
    Micro: [/\bmicro(s)?\b/, /\bmicrophone(s)?\b/],
    "Wi-Fi": [/\bwi[- ]?fi\b/, /\bwifi\b/],
    Terrasse: [/\bterrasse(s)?\b/],
    Jardin: [/\bjardin(s)?\b/],
    Piscine: [/\bpiscine(s)?\b/],
    Projecteur: [/\bprojecteur(s)?\b/, /\bvideo[- ]?projecteur(s)?\b/, /\bprojection\b/],
    Écran: [/\becran(s)?\b/, /\bscreen(s)?\b/],
    "Système son": [/\bsysteme son\b/, /\bsonorisation\b/, /\bsound system\b/],
    Mobilier: [/\bmobilier\b/, /\btable(s)?\b/, /\bchaise(s)?\b/],
    "Table de mixage": [/\btable de mixage\b/, /\bmixage\b/],
    "Piste de danse": [/\bpiste de danse\b/, /\bdancefloor\b/],
    Parking: [/\bparking(s)?\b/, /\bstationnement\b/],
    Vestiaire: [/\bvestiaire(s)?\b/],
    Loge: [/\bloge(s)?\b/, /\bcoulisse(s)?\b/, /\bdressing room\b/],
    "Cuisine équipée": [/\bcuisine equipee\b/, /\bcuisine\b/],
    "Bar équipé": [/\bbar equipe\b/, /\bcomptoir\b/, /\bbar a\b/],
    Lumières: [/\blumiere(s)?\b/, /\beclairage(s)?\b/, /\blight(s)?\b/],
    Scène: [/\bscene(s)?\b/],
    "Personnel sur place": [/\bpersonnel sur place\b/, /\bequipe sur place\b/, /\bstaff\b/],
    Sécurité: [/\bsecurite\b/, /\bagent(s)? de securite\b/, /\bvigile(s)?\b/],
    Hébergement: [/\bhebergement\b/, /\bchambre(s)?\b/, /\bnuit(s)? sur place\b/],
  },
  ambianceTypes: {
    Calme: [/\bcalme\b/, /\bpose(e|es|s)?\b/],
    Animé: [/\banime(e|es|s)?\b/, /\bvivant(e|es|s)?\b/],
    Festif: [/\bfestif(s|ve|ves)?\b/, /\bfete\b/, /\bfaire la fete\b/],
    Élégant: [/\belegant(e|es|s)?\b/, /\braffine(e|es|s)?\b/],
    Corporate: [/\bcorporate\b/, /\bprofessionnel(s|le|les)?\b/],
    Intimiste: [/\bintimiste\b/, /\bconfidentiel(le|les)?\b/],
    Atypique: [/\batypique(s)?\b/, /\binsolite(s)?\b/],
    Chic: [/\bchic\b/],
    Convivial: [/\bconvivial(e|es|s)?\b/],
    Lounge: [/\blounge\b/],
    Premium: [/\bpremium\b/, /\bhaut de gamme\b/],
    Décontracté: [/\bdecontracte(e|es|s)?\b/],
    Bohème: [/\bboheme\b/],
    Moderne: [/\bmoderne(s)?\b/, /\bcontemporain(e|es|s)?\b/],
    Industriel: [/\bindustriel(le|les)?\b/],
    Romantique: [/\bromantique(s)?\b/],
  },
  externalOptions: externalOptionEvidence,
  privatizationTypes: {
    "Forfait consommation (budget par personne)": [/\bforfait consommation\b/, /\bminimum de consommation\b/, /\bminimum consommation\b/, /\bconsommation minimum\b/],
    "Location sèche (budget location)": [/\blocation seche\b/, /\bprix de location\b/, /\bfrais de location\b/, /\blocation de salle\b/],
  },
  guestDispositions: {
    Debout: [/\bdebout\b/, /\bcocktail\b/, /\bstanding\b/],
    Assis: [/\bassis\b/, /\bdiner assis\b/, /\brepas assis\b/, /\bbanquet\b/],
  },
  spaceTypes: {
    "Espace clos": [/\bespace clos\b/, /\bespace prive\b/, /\bsalon prive\b/, /\bsalle privee\b/],
    "Espace ouvert": [/\bespace ouvert\b/, /\bterrasse\b/, /\bjardin\b/, /\bpatio\b/, /\bexterieur\b/],
  },
  optionFeatures: {
    "Possibilité de mettre sa musique": [/\bmettre sa musique\b/, /\bvotre musique\b/, /\bplaylist\b/, /\bdj\b/],
    "Possibilité de danser": [/\bdanser\b/, /\bpiste de danse\b/, /\bsoiree dansante\b/],
    "Décoration personnalisable": [/\bdecoration personnalisable\b/, /\bdecoration autorisee\b/, /\bpersonnaliser la decoration\b/],
    "Jeux (baby-foot / ping-pong / etc.)": [/\bbaby[- ]?foot\b/, /\bping[- ]?pong\b/, /\bjeux\b/, /\bborne d'arcade\b/],
    "Heures supplémentaires possibles": [/\bheures supplementaires\b/, /\bprolongation\b/, /\bprolonger\b/],
  },
};

const filterValuesWithEvidence = (selectedOptions = [], sourceText = "", evidence = {}) => {
  const normalizedSource = normalizeTextForMatching(sourceText);

  return selectedOptions.filter((option) => {
    const patterns = evidence[option];
    if (!patterns) return false;
    return patterns.some((pattern) => pattern.test(normalizedSource));
  });
};

const getNextVenueCode = async (supabase) => {
  const { data, error } = await supabase.from("venues").select("venue_code");
  if (error) throw error;

  const maxCode = (data ?? []).reduce((max, venue) => {
    const numericCode = Number(String(venue.venue_code ?? "").replace(/\D/g, ""));
    return Number.isFinite(numericCode) ? Math.max(max, numericCode) : max;
  }, 0);

  return String(maxCode + 1).padStart(4, "0").slice(-4);
};

const getVenueWritingExamples = async (supabase) => {
  const { data, error } = await supabase
    .from("venues")
    .select("title,tagline,description")
    .eq("active", true)
    .order("updated_at", { ascending: false })
    .limit(12);

  if (error) throw error;

  return (data ?? [])
    .map((venue) => ({
      title: String(venue.title || "").trim(),
      tagline: String(venue.tagline || "").trim(),
      description: String(venue.description || "").trim(),
    }))
    .filter((venue) => venue.title && venue.tagline && venue.description)
    .slice(0, 5);
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
        required: ["name", "capacity", "squareMeters", "description", "imageUrl"],
        properties: {
          name: { type: "string" },
          capacity: { type: "string" },
          squareMeters: { type: "string" },
          description: { type: "string" },
          imageUrl: { type: "string" },
        },
      },
    },
    notes: { type: "array", items: { type: "string" } },
  },
});

const callOpenAi = async ({ sourceUrl, finalUrl, metas, jsonLd, pageText, imageCandidates, writingExamples }) => {
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
            "Tu es un assistant de back office Wearevents. Tu extrais uniquement les informations factuelles d'une page de lieu événementiel, puis tu les convertis vers le formulaire Wearevents. N'invente pas d'email, d'adresse, de capacité, de métro, d'avis ou de coordonnées si la source ne les contient pas. Pour les textes marketing, rédige en français naturel, premium et concis, en t'inspirant du style des exemples Wearevents fournis sans recopier de formulation. Ne mentionne jamais le nom du site source, Privateaser, une URL source, ni le fait que les informations proviennent d'un autre site.",
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
            writingExamples,
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
              "address: reprends l'adresse postale telle qu'elle est écrite sur le site source, avec rue, code postal et ville quand disponibles. Ne transforme pas l'adresse en résumé.",
              "city: ville affichée. Pour Paris, utilise le code postal pour retourner Paris + numéro d'arrondissement, par exemple 75011 => Paris 11.",
              "metroAccess: si une station est trouvée, retourne exactement le format \"Nom de station, ligne X, Y et Z\". Exemple : \"République, ligne 3, 5, 8, 9 et 11\". Ne mets pas de préfixe Métro. Si aucune station claire n'est indiquée, retourne une chaîne vide.",
              "Ne mets aucune référence au site utilisé pour l'import dans title, tagline, description, usefulInformation, spaces ou notes. Ne mentionne jamais Privateaser ni une URL source.",
              "tagline: courte accroche commerciale en une phrase, dans le ton des exemples Wearevents.",
              "description: 2 à 4 phrases prêtes pour une fiche Wearevents, inspirées du rythme et du niveau de détail des exemples, sans copier.",
              "minCapacity/maxCapacity: nombres en texte si trouvés.",
              "pricingText et priceTier: retourne Sur devis et €€. Le prix est géré manuellement dans le back office, ne l'extrais pas depuis la source.",
              "closingTime: 00:00 pour jusqu'à minuit, 02:00 pour jusqu'à 2h, 03:00 pour après 2h, sinon chaîne vide.",
              "Pour tous les champs de catégories en tableau, sélectionne uniquement les valeurs explicitement indiquées ou clairement justifiées par la page source. En cas de doute, laisse la catégorie vide.",
              "externalOptions: coche une option uniquement si la page indique explicitement que nourriture, boissons ou gâteau externes sont autorisés. En cas de doute, retourne un tableau vide.",
              "spaces: crée au moins une option de réservation si une capacité est connue, sinon Salle principale avec champs vides. Pour capacity, retourne uniquement la capacité maximum : si la source indique 10-20, retourne 20. Pour imageUrl, utilise uniquement une URL exacte présente dans imageCandidates si elle correspond clairement à l'option, sinon chaîne vide.",
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

const normalizeUrlForMatch = (value = "") => {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString();
  } catch {
    return String(value || "").trim();
  }
};

const applyUploadedSpaceImages = (spaces = [], uploadedImages = []) => {
  const uploadedBySource = new Map(
    uploadedImages.map((image) => [normalizeUrlForMatch(image.sourceUrl), image.publicUrl]),
  );

  return spaces.map((space) => {
    const sourceImageUrl = normalizeUrlForMatch(space.imageUrl);
    const publicImageUrl = uploadedBySource.get(sourceImageUrl);

    return {
      ...space,
      imageUrl: publicImageUrl || "",
    };
  });
};

const normalizeImportedVenue = (venue, venueCode, sourceUrl, sourceText = "") => {
  const title = String(venue.title || "").trim();
  const slug = slugify(title);
  const addressAndCity = formatImportedAddressAndCity(venue.address, venue.city);

  return {
    title,
    slug,
    venueCode,
    tagline: stripSourceReferences(venue.tagline, sourceUrl),
    description: stripSourceReferences(venue.description, sourceUrl),
    city: addressAndCity.city,
    address: addressAndCity.address,
    lat: String(venue.lat || "").trim(),
    lng: String(venue.lng || "").trim(),
    minCapacity: getMinNumberText(venue.minCapacity),
    maxCapacity: getMaxNumberText(venue.maxCapacity),
    pricingText: String(venue.pricingText || "").trim(),
    priceTier: priceTiers.includes(venue.priceTier) ? venue.priceTier : "€€",
    closingTime: closingTimes.includes(venue.closingTime) ? venue.closingTime : "",
    metroAccess: formatMetroAccess(venue.metroAccess),
    contactEmail: String(venue.contactEmail || "").trim(),
    rating: String(venue.rating || "0").replace(",", "."),
    reviewCount: String(venue.reviewCount || "0").replace(/[^\d]/g, ""),
    googleReviewUrl: String(venue.googleReviewUrl || "").trim(),
    eventCategories: filterValuesWithEvidence(
      (venue.eventCategories || []).filter((item) => eventTypes.includes(item)),
      sourceText,
      categoryEvidence.eventCategories,
    ),
    venueTypes: filterValuesWithEvidence(
      (venue.venueTypes || []).filter((item) => venueTypes.includes(item)),
      sourceText,
      categoryEvidence.venueTypes,
    ),
    services: filterValuesWithEvidence(
      (venue.services || []).filter((item) => services.includes(item)),
      sourceText,
      categoryEvidence.services,
    ),
    ambianceTypes: filterValuesWithEvidence(
      (venue.ambianceTypes || []).filter((item) => ambianceTypes.includes(item)),
      sourceText,
      categoryEvidence.ambianceTypes,
    ),
    externalOptions: filterValuesWithEvidence(
      (venue.externalOptions || []).filter((item) => externalOptions.includes(item)),
      sourceText,
      categoryEvidence.externalOptions,
    ),
    privatizationTypes: filterValuesWithEvidence(
      (venue.privatizationTypes || []).filter((item) => privatizationTypes.includes(item)),
      sourceText,
      categoryEvidence.privatizationTypes,
    ),
    guestDispositions: filterValuesWithEvidence(
      (venue.guestDispositions || []).filter((item) => guestDispositions.includes(item)),
      sourceText,
      categoryEvidence.guestDispositions,
    ),
    spaceTypes: filterValuesWithEvidence(
      (venue.spaceTypes || []).filter((item) => spaceTypes.includes(item)),
      sourceText,
      categoryEvidence.spaceTypes,
    ),
    optionFeatures: filterValuesWithEvidence(
      (venue.optionFeatures || []).filter((item) => optionFeatures.includes(item)),
      sourceText,
      categoryEvidence.optionFeatures,
    ),
    usefulInformation: cleanSourceFreeList(venue.usefulInformation || [], sourceUrl),
    spaces:
      Array.isArray(venue.spaces) && venue.spaces.length
        ? venue.spaces.map((space) => ({
            name: String(space.name || "Salle principale").trim() || "Salle principale",
            capacity: getMaxNumberText(space.capacity),
            squareMeters: getMaxNumberText(space.squareMeters),
            description: stripSourceReferences(space.description, sourceUrl),
            imageUrl: String(space.imageUrl || "").trim(),
          }))
        : [{ name: "Salle principale", capacity: "", squareMeters: "", description: "", imageUrl: "" }],
    notes: cleanSourceFreeList(venue.notes || [], sourceUrl),
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
    const [venueCode, writingExamples, pageResponse] = await Promise.all([
      getNextVenueCode(supabaseAdmin),
      getVenueWritingExamples(supabaseAdmin),
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
    const evidenceText = [
      Object.values(metas).join(" "),
      JSON.stringify(jsonLd),
      pageText,
    ].join(" ");
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
      writingExamples,
    });
    const venue = normalizeImportedVenue(extractedVenue, venueCode, finalUrl, evidenceText);
    const venueSlug = venue.slug || `salle-${venueCode}`;
    const prioritizedImageUrls = unique([
      ...venue.spaces.map((space) => space.imageUrl).filter(Boolean),
      ...imageCandidates,
    ]);
    const imageImport = await uploadRemoteImages({
      supabase: supabaseAdmin,
      imageUrls: prioritizedImageUrls,
      venueSlug,
      referer: finalUrl,
    });
    const [coverImage, ...gallery] = imageImport.uploaded.map((image) => image.publicUrl);
    const spaces = applyUploadedSpaceImages(venue.spaces, imageImport.uploaded);
    const warnings = cleanSourceFreeList([...(venue.notes || []), ...imageImport.warnings], finalUrl);

    return jsonResponse(response, 200, {
      venue: {
        ...venue,
        spaces,
        slug: venueSlug,
        coverImage: coverImage || "",
        gallery,
      },
      source: {
        imageCandidatesCount: imageCandidates.length,
      },
      warnings,
    });
  } catch (error) {
    return fail(response, 500, error instanceof Error ? error.message : "Import impossible.");
  }
}
