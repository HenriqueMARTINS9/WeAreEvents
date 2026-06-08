export const SEO_EVENT_TYPES = [
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
  "Team building",
  "Conférence",
  "Formation",
  "Dîner d'affaires",
  "Shooting / tournage",
];

export const slugifySeoValue = (value) =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " et ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const buildSearchUrl = (filters = {}, hash = "salles") => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.filter(Boolean).forEach((item) => params.append(key, item));
      return;
    }

    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return `/recherche${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
};

const formatArrondissement = (arrondissement) =>
  arrondissement === 1 ? "1er" : `${arrondissement}e`;

export const getLocationSeoPath = (label) => `/location-salle-${slugifySeoValue(label)}`;
export const getEventSeoPath = (eventType, city = "Paris") =>
  `/salle-${slugifySeoValue(eventType)}-${slugifySeoValue(city)}`;
export const getCapacitySeoPath = (rangeKey, city = "Paris") =>
  `/location-salle-${rangeKey}-personnes-${slugifySeoValue(city)}`;

export const SEO_CAPACITY_RANGES = [
  { key: "moins-20", label: "Moins de 20", intent: "moins de 20 personnes", min: 1, max: 19 },
  { key: "20-50", label: "20–50", intent: "20 à 50 personnes", min: 20, max: 50 },
  { key: "50-100", label: "50–100", intent: "50 à 100 personnes", min: 50, max: 100 },
  { key: "100-150", label: "100–150", intent: "100 à 150 personnes", min: 100, max: 150 },
  { key: "150-200", label: "150–200", intent: "150 à 200 personnes", min: 150, max: 200 },
  { key: "200-500", label: "200–500", intent: "200 à 500 personnes", min: 200, max: 500 },
  { key: "plus-500", label: "Plus de 500", intent: "plus de 500 personnes", min: 501 },
];

const buildFaq = (intentLabel, locationLabel) => [
  {
    question: `Comment trouver ${intentLabel.toLowerCase()} à ${locationLabel} ?`,
    answer: `Sélectionnez une salle qui correspond à votre capacité, votre date et l'ambiance recherchée, puis envoyez une demande gratuite. L'équipe Wearevents qualifie votre besoin et vous accompagne jusqu'à la réservation.`,
  },
  {
    question: `La demande pour ${intentLabel.toLowerCase()} est-elle gratuite ?`,
    answer: "Oui, la demande est gratuite pour les organisateurs. Wearevents est rémunéré par les établissements partenaires uniquement lorsqu'une réservation est confirmée.",
  },
  {
    question: `Peut-on comparer plusieurs lieux à ${locationLabel} ?`,
    answer: "Oui, vous pouvez comparer plusieurs lieux, vérifier les capacités, les options de privatisation, les horaires et les services disponibles avant d'avancer.",
  },
];

const createPage = ({
  slug,
  h1,
  intentLabel,
  locationLabel,
  filters,
  intro,
  relatedSlugs = [],
}) => ({
  slug,
  title: `${h1} | Wearevents`,
  description: `${intentLabel} à ${locationLabel} : découvrez des lieux vérifiés, comparez les options et envoyez une demande de disponibilité gratuite avec Wearevents.`,
  eyebrow: "Guide lieux événementiels",
  h1,
  intro,
  locationLabel,
  intentLabel,
  filters,
  searchUrl: buildSearchUrl({
    location: filters.locationQuery,
    type: filters.eventType,
    guests: filters.minGuests,
    guestsMin: filters.guestRangeMin,
    guestsMax: filters.guestRangeMax,
    venueTypes: filters.venueTypes,
    ambiance: filters.ambianceTypes,
    privatization: filters.privatizationTypes,
    space: filters.spaceTypes,
    options: filters.optionFilters,
  }),
  faq: buildFaq(intentLabel, locationLabel),
  relatedSlugs,
});

const parisRelated = [
  "salle-anniversaire-paris",
  "salle-mariage-paris",
  "bar-privatisable-paris",
  "rooftop-paris",
  "loft-evenement-paris",
];

const parisMainPage = createPage({
  slug: "location-salle-paris",
  h1: "Location de salle à Paris",
  intentLabel: "Location de salle",
  locationLabel: "Paris",
  filters: { locationQuery: "Paris" },
  intro: "Paris concentre une grande diversité de lieux événementiels : bars privatisables, restaurants, rooftops, clubs, lofts et salles de réception. Wearevents vous aide à trouver rapidement une adresse adaptée à votre événement, votre nombre d'invités et votre budget.",
  relatedSlugs: parisRelated,
});

const parisArrondissementPages = Array.from({ length: 20 }, (_, index) => {
  const arrondissement = index + 1;
  const label = `Paris ${formatArrondissement(arrondissement)}`;
  const postalCode = `750${String(arrondissement).padStart(2, "0")}`;

  return createPage({
    slug: `location-salle-paris-${formatArrondissement(arrondissement)}`,
    h1: `Location de salle à ${label}`,
    intentLabel: "Location de salle",
    locationLabel: label,
    filters: { locationQuery: postalCode },
    intro: `${label} offre un emplacement central pour organiser un anniversaire, une soirée privée, un cocktail ou un événement professionnel. Cette sélection vous aide à repérer les lieux disponibles dans l'arrondissement, avec des informations claires sur les capacités, les ambiances et les options de privatisation.`,
    relatedSlugs: ["location-salle-paris", ...parisRelated.slice(0, 3)],
  });
});

const eventPages = SEO_EVENT_TYPES.map((eventType) =>
  createPage({
    slug: `salle-${slugifySeoValue(eventType)}-paris`,
    h1: `Salle pour ${eventType.toLowerCase()} à Paris`,
    intentLabel: `Salle pour ${eventType.toLowerCase()}`,
    locationLabel: "Paris",
    filters: { locationQuery: "Paris", eventType },
    intro: `Vous organisez un ${eventType.toLowerCase()} à Paris ? Wearevents sélectionne des lieux adaptés à votre format : capacité, ambiance, horaires, restauration, musique et conditions de privatisation. Envoyez une demande gratuite et recevez un retour qualifié.`,
    relatedSlugs: ["location-salle-paris", "bar-privatisable-paris", "restaurant-privatisable-paris"],
  }),
);

const capacityPages = SEO_CAPACITY_RANGES.map((range) =>
  createPage({
    slug: `location-salle-${range.key}-personnes-paris`,
    h1: `Location de salle pour ${range.intent} à Paris`,
    intentLabel: `Salle pour ${range.intent}`,
    locationLabel: "Paris",
    filters: { locationQuery: "Paris", guestRangeMin: range.min, guestRangeMax: range.max },
    intro: `Vous cherchez une salle pour ${range.intent} à Paris ? Découvrez des lieux dont la capacité correspond à cette fourchette, comparez les configurations, les ambiances et les conditions de privatisation, puis envoyez gratuitement votre demande de disponibilité.`,
    relatedSlugs: [
      "location-salle-paris",
      "salle-anniversaire-paris",
      "salle-soiree-privee-paris",
    ],
  }),
);

const venueTypePages = [
  {
    slug: "bar-privatisable-paris",
    h1: "Bar privatisable à Paris",
    intentLabel: "Bar privatisable",
    venueTypes: ["Bar"],
    intro: "Privatiser un bar à Paris permet d'organiser une soirée conviviale sans louer une salle classique. Wearevents vous aide à comparer les bars selon l'ambiance, la capacité, la musique, les horaires et les formules de consommation.",
  },
  {
    slug: "restaurant-privatisable-paris",
    h1: "Restaurant privatisable à Paris",
    intentLabel: "Restaurant privatisable",
    venueTypes: ["Restaurant"],
    intro: "Un restaurant privatisable à Paris est idéal pour un dîner d'entreprise, un anniversaire, un cocktail ou un repas de groupe. Retrouvez des adresses vérifiées avec espaces dédiés, menus, boissons et conditions de réservation.",
  },
  {
    slug: "rooftop-paris",
    h1: "Rooftop à privatiser à Paris",
    intentLabel: "Rooftop à privatiser",
    venueTypes: ["Rooftop"],
    intro: "Les rooftops parisiens sont recherchés pour les cocktails, soirées d'entreprise, anniversaires et événements premium. Wearevents vous aide à identifier les lieux avec vue, terrasse, capacité adaptée et conditions de privatisation.",
  },
  {
    slug: "discotheque-paris",
    h1: "Discothèque à privatiser à Paris",
    intentLabel: "Discothèque à privatiser",
    venueTypes: ["Discothèque"],
    intro: "Pour une soirée festive, une remise de diplôme, un anniversaire ou un événement de nuit, une discothèque privatisable à Paris offre musique, piste de danse et horaires adaptés.",
  },
  {
    slug: "loft-evenement-paris",
    h1: "Loft événementiel à Paris",
    intentLabel: "Loft événementiel",
    venueTypes: ["Loft"],
    intro: "Un loft événementiel à Paris permet d'organiser un format plus flexible : cocktail, shooting, lancement, dîner assis ou soirée privée. Wearevents vous accompagne dans la sélection du lieu le plus cohérent.",
  },
  {
    slug: "salle-reception-paris",
    h1: "Salle de réception à Paris",
    intentLabel: "Salle de réception",
    venueTypes: ["Salle de réception"],
    intro: "Les salles de réception à Paris conviennent aux mariages, galas, conférences et grands événements. Comparez les capacités, configurations, accès, équipements et conditions de réservation.",
  },
  {
    slug: "espace-exterieur-paris",
    h1: "Espace extérieur événementiel à Paris",
    intentLabel: "Espace extérieur événementiel",
    venueTypes: ["Espace extérieur"],
    spaceTypes: ["Espace ouvert"],
    intro: "Terrasses, jardins, patios et espaces ouverts permettent d'organiser un événement plus respirant à Paris. Wearevents vous aide à trouver les lieux adaptés à la saison, au format et aux invités.",
  },
  {
    slug: "appartement-evenement-paris",
    h1: "Appartement événementiel à Paris",
    intentLabel: "Appartement événementiel",
    venueTypes: ["Appartement"],
    intro: "Un appartement événementiel à Paris est une option intime et élégante pour une soirée privée, un shooting, un lancement ou un dîner d'affaires dans un cadre confidentiel.",
  },
  {
    slug: "villa-evenement-paris",
    h1: "Villa événementielle à Paris",
    intentLabel: "Villa événementielle",
    venueTypes: ["Villa"],
    intro: "Les villas événementielles offrent un cadre premium pour recevoir dans de bonnes conditions. Wearevents vous aide à vérifier la capacité, les espaces, les horaires et les services inclus.",
  },
].map((page) =>
  createPage({
    ...page,
    locationLabel: "Paris",
    filters: {
      locationQuery: "Paris",
      venueTypes: page.venueTypes,
      spaceTypes: page.spaceTypes,
    },
    relatedSlugs: ["location-salle-paris", "salle-anniversaire-paris", "salle-soiree-privee-paris"],
  }),
);

export const seoLandingPages = [
  parisMainPage,
  ...parisArrondissementPages,
  ...eventPages,
  ...capacityPages,
  ...venueTypePages,
];

export const seoLandingPageSlugs = seoLandingPages.map((page) => page.slug);
