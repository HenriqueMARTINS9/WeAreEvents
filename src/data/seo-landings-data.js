export const SEO_EVENT_TYPES = [
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
  { key: "moins-20", label: "Moins de 20", intent: "moins de 20 personnes", maxCapacityLimit: 20 },
  { key: "20-50", label: "20–50", intent: "20 à 50 personnes", maxCapacityGreaterThan: 20, maxCapacityLimit: 50 },
  { key: "50-100", label: "50–100", intent: "50 à 100 personnes", maxCapacityGreaterThan: 50, maxCapacityLimit: 100 },
  { key: "100-150", label: "100–150", intent: "100 à 150 personnes", maxCapacityGreaterThan: 100, maxCapacityLimit: 150 },
  { key: "150-200", label: "150–200", intent: "150 à 200 personnes", maxCapacityGreaterThan: 150, maxCapacityLimit: 200 },
  { key: "200-500", label: "200–500", intent: "200 à 500 personnes", maxCapacityGreaterThan: 200, maxCapacityLimit: 500 },
  { key: "plus-500", label: "Plus de 500", intent: "plus de 500 personnes", maxCapacityGreaterThan: 500 },
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
    capacityGt: filters.maxCapacityGreaterThan,
    maxCapacity: filters.maxCapacityLimit,
    price: filters.priceTier,
    closing: filters.closingTimeFilter,
    venueTypes: filters.venueTypes,
    ambiance: filters.ambianceTypes,
    privatization: filters.privatizationTypes,
    space: filters.spaceTypes,
    options: filters.optionFilters,
    equipment: filters.equipmentFilters,
    disposition: filters.guestDispositions,
  }),
  faq: buildFaq(intentLabel, locationLabel),
  relatedSlugs,
});

const parisRelated = [
  "salle-anniversaire-paris",
  "salle-mariage-paris",
  "bar-privatisable-paris",
  "restaurant-privatisable-paris",
  "discotheque-paris",
];

const parisMainPage = createPage({
  slug: "location-salle-paris",
  h1: "Location de salle à Paris",
  intentLabel: "Location de salle",
  locationLabel: "Paris",
  filters: { locationQuery: "Paris" },
  intro: "Paris concentre une grande diversité de lieux événementiels : bars privatisables, restaurants, clubs, lofts et salles de réception. Wearevents vous aide à trouver rapidement une adresse adaptée à votre événement, votre nombre d'invités et votre budget.",
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
    filters: {
      locationQuery: "Paris",
      maxCapacityGreaterThan: range.maxCapacityGreaterThan,
      maxCapacityLimit: range.maxCapacityLimit,
    },
    intro: `Vous cherchez une salle pour ${range.intent} à Paris ? Découvrez des lieux dont la capacité maximale correspond à cette fourchette, comparez les configurations, les ambiances et les conditions de privatisation, puis envoyez gratuitement votre demande de disponibilité.`,
    relatedSlugs: [
      "location-salle-paris",
      "salle-anniversaire-paris",
      "salle-soiree-privee-paris",
    ],
  }),
);

const createParisFilterPage = (page) =>
  createPage({
    ...page,
    locationLabel: "Paris",
    filters: {
      locationQuery: "Paris",
      ...page.filters,
    },
    relatedSlugs: page.relatedSlugs ?? [
      "location-salle-paris",
      "salle-anniversaire-paris",
      "salle-soiree-privee-paris",
    ],
  });

const venueTypePages = [
  {
    slug: "bar-privatisable-paris",
    h1: "Bar privatisable à Paris",
    intentLabel: "Bar privatisable",
    filters: { venueTypes: ["Bar"] },
    intro: "Privatiser un bar à Paris permet d'organiser une soirée conviviale sans louer une salle classique. Wearevents vous aide à comparer les bars selon l'ambiance, la capacité, la musique, les horaires et les formules de consommation.",
  },
  {
    slug: "restaurant-privatisable-paris",
    h1: "Restaurant privatisable à Paris",
    intentLabel: "Restaurant privatisable",
    filters: { venueTypes: ["Restaurant"] },
    intro: "Un restaurant privatisable à Paris est idéal pour un dîner d'entreprise, un anniversaire, un cocktail ou un repas de groupe. Retrouvez des adresses vérifiées avec espaces dédiés, menus, boissons et conditions de réservation.",
  },
  {
    slug: "discotheque-paris",
    h1: "Discothèque à privatiser à Paris",
    intentLabel: "Discothèque à privatiser",
    filters: { venueTypes: ["Discothèque"] },
    intro: "Pour une soirée festive, une remise de diplôme, un anniversaire ou un événement de nuit, une discothèque privatisable à Paris offre musique, piste de danse et horaires adaptés.",
  },
  {
    slug: "salle-reception-paris",
    h1: "Salle de réception à Paris",
    intentLabel: "Salle de réception",
    filters: { venueTypes: ["Salle de réception"] },
    intro: "Les salles de réception à Paris conviennent aux mariages, galas, conférences et grands événements. Comparez les capacités, configurations, accès, équipements et conditions de réservation.",
  },
  {
    slug: "salle-reunion-paris",
    h1: "Salle de réunion à Paris",
    intentLabel: "Salle de réunion",
    filters: { venueTypes: ["Salle de réunion"] },
    intro: "Une salle de réunion à Paris permet d'organiser un comité, un atelier, une présentation client ou un rendez-vous d'équipe dans un cadre adapté, accessible et bien équipé.",
  },
  {
    slug: "salle-de-conference-paris",
    h1: "Salle de conférence à Paris",
    intentLabel: "Salle de conférence",
    filters: { venueTypes: ["Salle de conférence"] },
    intro: "Pour une prise de parole, une table ronde, une formation ou un événement professionnel, comparez les salles de conférence à Paris selon la capacité, la projection, le son et l'accessibilité.",
  },
  {
    slug: "espace-exterieur-paris",
    h1: "Espace extérieur événementiel à Paris",
    intentLabel: "Espace extérieur événementiel",
    filters: { venueTypes: ["Espace extérieur"], spaceTypes: ["Espace ouvert"] },
    intro: "Terrasses, jardins, patios et espaces ouverts permettent d'organiser un événement plus respirant à Paris. Wearevents vous aide à trouver les lieux adaptés à la saison, au format et aux invités.",
  },
  {
    slug: "peniche-evenement-paris",
    h1: "Péniche événementielle à Paris",
    intentLabel: "Péniche événementielle",
    filters: { venueTypes: ["Péniche"] },
    intro: "Une péniche événementielle à Paris permet de recevoir dans un cadre original, idéal pour une soirée privée, un cocktail, un anniversaire ou un événement professionnel avec vue sur la Seine.",
  },
  {
    slug: "loft-evenement-paris",
    h1: "Loft événementiel à Paris",
    intentLabel: "Loft événementiel",
    filters: { venueTypes: ["Loft"] },
    intro: "Un loft événementiel à Paris offre un cadre modulable pour un lancement, un shooting, une soirée privée ou un événement d'entreprise avec une atmosphère plus confidentielle.",
  },
  {
    slug: "maison-evenement-paris",
    h1: "Maison événementielle à Paris",
    intentLabel: "Maison événementielle",
    filters: { venueTypes: ["Maison"] },
    intro: "Une maison événementielle à Paris offre un cadre plus chaleureux et confidentiel pour organiser un dîner, une réception, un événement privé ou un rendez-vous professionnel.",
  },
  {
    slug: "hotel-evenement-paris",
    h1: "Hôtel événementiel à Paris",
    intentLabel: "Hôtel événementiel",
    filters: { venueTypes: ["Hôtel"] },
    intro: "Un hôtel événementiel à Paris facilite l'organisation d'un séminaire, d'une conférence, d'un cocktail ou d'un événement professionnel avec services sur place.",
  },
  {
    slug: "jardin-evenement-paris",
    h1: "Jardin événementiel à Paris",
    intentLabel: "Jardin événementiel",
    filters: { venueTypes: ["Jardin"], spaceTypes: ["Espace ouvert"] },
    intro: "Un jardin événementiel à Paris apporte une respiration extérieure pour organiser un cocktail, une réception ou une soirée privée dans un cadre plus végétal.",
  },
  {
    slug: "terrasse-evenement-paris",
    h1: "Terrasse événementielle à Paris",
    intentLabel: "Terrasse événementielle",
    filters: { venueTypes: ["Terrasse"], spaceTypes: ["Espace ouvert"] },
    intro: "Une terrasse événementielle à Paris permet de recevoir en extérieur pour un cocktail, un afterwork, un anniversaire ou une réception avec une ambiance plus ouverte.",
  },
  {
    slug: "plage-privee-evenement-paris",
    h1: "Plage privée événementielle à Paris",
    intentLabel: "Plage privée événementielle",
    filters: { venueTypes: ["Plage privée"], spaceTypes: ["Espace ouvert"] },
    intro: "Une plage privée événementielle permet d'imaginer un format plus estival et original pour un cocktail, une soirée privée ou un événement d'entreprise dans un décor dépaysant.",
  },
  {
    slug: "hangar-evenement-paris",
    h1: "Hangar événementiel à Paris",
    intentLabel: "Hangar événementiel",
    filters: { venueTypes: ["Hangar"] },
    intro: "Un hangar événementiel à Paris offre de grands volumes modulables pour un lancement, une scénographie immersive, un salon, un tournage ou une soirée privée au format atypique.",
  },
  {
    slug: "rooftop-evenement-paris",
    h1: "Rooftop événementiel à Paris",
    intentLabel: "Rooftop événementiel",
    filters: { venueTypes: ["Rooftop"] },
    intro: "Un rooftop événementiel à Paris est idéal pour organiser un cocktail, un lancement ou une soirée avec vue. Comparez les capacités, horaires et conditions de privatisation.",
  },
].map(createParisFilterPage);

const pricePages = [
  {
    slug: "salle-pas-chere-paris",
    h1: "Salle pas chère à Paris",
    intentLabel: "Salle pas chère",
    filters: { priceTier: "€" },
    intro: "Vous cherchez une salle pas chère à Paris ? Wearevents regroupe des lieux au budget économique pour organiser un événement simple, clair et adapté à vos invités.",
  },
  {
    slug: "salle-budget-abordable-paris",
    h1: "Salle au budget abordable à Paris",
    intentLabel: "Salle au budget abordable",
    filters: { priceTier: "€€" },
    intro: "Les salles au budget abordable à Paris permettent d'organiser un anniversaire, un afterwork, un cocktail ou une soirée privée avec un bon équilibre entre cadre, services et prix.",
  },
  {
    slug: "salle-budget-modere-paris",
    h1: "Salle au budget modéré à Paris",
    intentLabel: "Salle au budget modéré",
    filters: { priceTier: "€€€" },
    intro: "Pour un événement plus structuré, les salles au budget modéré à Paris offrent davantage de services, d'équipements et de conditions de privatisation adaptées.",
  },
  {
    slug: "salle-premium-paris",
    h1: "Salle premium à Paris",
    intentLabel: "Salle premium",
    filters: { priceTier: "€€€€" },
    intro: "Les salles premium à Paris conviennent aux événements exigeants : réception, gala, événement d'entreprise, lancement ou soirée privée avec un cadre plus haut de gamme.",
  },
].map(createParisFilterPage);

const ambiancePages = [
  ["salle-ambiance-calme-paris", "Salle avec ambiance calme à Paris", "Salle avec ambiance calme", "Calme", "Trouvez une salle avec ambiance calme à Paris pour un dîner, une réunion, un événement professionnel ou une réception plus posée."],
  ["salle-ambiance-animee-paris", "Salle avec ambiance animée à Paris", "Salle avec ambiance animée", "Animé", "Une salle avec ambiance animée à Paris convient aux anniversaires, afterworks, cocktails et soirées privées qui doivent rester vivantes sans forcément devenir clubbing."],
  ["salle-ambiance-festive-paris", "Salle avec ambiance festive à Paris", "Salle avec ambiance festive", "Festif", "Pour une soirée dansante, un anniversaire ou un événement de nuit, comparez les salles avec ambiance festive à Paris et leurs options de musique, danse et horaires."],
  ["salle-ambiance-corporate-paris", "Salle avec ambiance corporate à Paris", "Salle avec ambiance corporate", "Corporate", "Les salles avec ambiance corporate à Paris sont pensées pour les séminaires, lancements, cocktails professionnels et événements d'entreprise."],
  ["salle-ambiance-elegante-paris", "Salle avec ambiance élégante à Paris", "Salle avec ambiance élégante", "Élégant", "Une salle avec ambiance élégante à Paris permet d'organiser une réception, un dîner ou un événement premium dans un cadre plus soigné."],
].map(([slug, h1, intentLabel, ambiance, intro]) =>
  createParisFilterPage({
    slug,
    h1,
    intentLabel,
    filters: { ambianceTypes: [ambiance] },
    intro,
  }),
);

const privatizationPages = [
  {
    slug: "salle-forfait-consommation-paris",
    h1: "Salle avec forfait consommation à Paris",
    intentLabel: "Salle avec forfait consommation",
    filters: { privatizationTypes: ["Forfait consommation (budget par personne)"] },
    intro: "Le forfait consommation permet souvent d'organiser un événement sans location sèche : vous définissez un budget par personne ou un minimum de consommation avec le lieu.",
  },
  {
    slug: "location-seche-salle-paris",
    h1: "Location sèche de salle à Paris",
    intentLabel: "Location sèche de salle",
    filters: { privatizationTypes: ["Location sèche (budget location)"] },
    intro: "La location sèche de salle à Paris convient aux événements où vous souhaitez louer l'espace puis organiser séparément les prestations, la restauration ou certains services.",
  },
].map(createParisFilterPage);

const closingPages = [
  {
    slug: "salle-ouverte-jusqua-minuit-paris",
    h1: "Salle ouverte jusqu'à minuit à Paris",
    intentLabel: "Salle ouverte jusqu'à minuit",
    filters: { closingTimeFilter: "Jusqu'à minuit" },
    intro: "Pour un événement en journée ou une soirée courte, comparez les salles ouvertes jusqu'à minuit à Paris avec des informations claires sur les horaires et conditions.",
  },
  {
    slug: "salle-ouverte-jusqua-2h-paris",
    h1: "Salle ouverte jusqu'à 2h à Paris",
    intentLabel: "Salle ouverte jusqu'à 2h",
    filters: { closingTimeFilter: "Jusqu'à 2h" },
    intro: "Les salles ouvertes jusqu'à 2h à Paris sont adaptées aux anniversaires, cocktails et soirées privées qui doivent durer plus longtemps sans aller jusqu'au format nuit complète.",
  },
  {
    slug: "salle-ouverte-apres-2h-paris",
    h1: "Salle ouverte après 2h à Paris",
    intentLabel: "Salle ouverte après 2h",
    filters: { closingTimeFilter: "Après 2h" },
    intro: "Pour une soirée festive ou un événement de nuit, découvrez les salles ouvertes après 2h à Paris avec musique, danse et conditions de privatisation adaptées.",
  },
].map(createParisFilterPage);

const spacePages = [
  {
    slug: "salle-espace-clos-paris",
    h1: "Salle avec espace clos à Paris",
    intentLabel: "Salle avec espace clos",
    filters: { spaceTypes: ["Espace clos"] },
    intro: "Un espace clos permet d'organiser un événement dans une zone dédiée, plus confidentielle et plus facile à gérer pour vos invités.",
  },
  {
    slug: "salle-espace-ouvert-paris",
    h1: "Salle avec espace ouvert à Paris",
    intentLabel: "Salle avec espace ouvert",
    filters: { spaceTypes: ["Espace ouvert"] },
    intro: "Les espaces ouverts à Paris conviennent aux cocktails, réceptions, terrasses, jardins et événements où la circulation des invités est essentielle.",
  },
].map(createParisFilterPage);

const dispositionPages = [
  {
    slug: "salle-reception-debout-paris",
    h1: "Salle pour réception debout à Paris",
    intentLabel: "Salle pour réception debout",
    filters: { guestDispositions: ["Debout"] },
    intro: "Une réception debout permet de faciliter les échanges, les cocktails, les afterworks et les soirées privées avec une circulation fluide des invités.",
  },
  {
    slug: "salle-repas-assis-paris",
    h1: "Salle pour repas assis à Paris",
    intentLabel: "Salle pour repas assis",
    filters: { guestDispositions: ["Assis"] },
    intro: "Une salle pour repas assis à Paris convient aux dîners, mariages intimistes, repas d'entreprise et événements nécessitant une vraie configuration de table.",
  },
].map(createParisFilterPage);

const optionPages = [
  ["salle-avec-musique-paris", "Salle où mettre sa musique à Paris", "Salle où mettre sa musique", "Possibilité de mettre sa musique", "Trouvez une salle à Paris où vous pouvez mettre votre musique pour personnaliser l'ambiance de votre soirée, anniversaire ou événement privé."],
  ["salle-ou-danser-paris", "Salle où danser à Paris", "Salle où danser", "Possibilité de danser", "Pour une soirée festive, comparez les salles où danser à Paris avec piste, système son, ambiance adaptée et horaires cohérents."],
  ["salle-decoration-personnalisable-paris", "Salle avec décoration personnalisable à Paris", "Salle avec décoration personnalisable", "Décoration personnalisable", "Une décoration personnalisable permet d'adapter la salle à votre thème, votre marque, votre mariage ou votre événement privé."],
  ["salle-avec-jeux-paris", "Salle avec jeux à Paris", "Salle avec jeux", "Jeux (baby-foot / ping-pong / etc.)", "Les salles avec jeux à Paris apportent une touche conviviale pour un afterwork, un anniversaire, un team building ou une soirée détendue."],
  ["salle-heures-supplementaires-paris", "Salle avec heures supplémentaires possibles à Paris", "Salle avec heures supplémentaires possibles", "Heures supplémentaires possibles", "Pour garder de la flexibilité, comparez les salles où des heures supplémentaires peuvent être envisagées selon les conditions du lieu."],
  ["salle-traiteur-externe-paris", "Salle avec nourriture externe autorisée à Paris", "Salle avec nourriture externe autorisée", "Possibilité de ramener sa nourriture", "Certaines salles à Paris permettent de ramener sa nourriture ou de travailler avec un traiteur externe, selon les conditions de privatisation."],
  ["salle-boissons-externes-paris", "Salle avec boissons externes autorisées à Paris", "Salle avec boissons externes autorisées", "Possibilité de ramener ses boissons", "Comparez les salles où les boissons externes peuvent être acceptées selon le format de l'événement et les règles de l'établissement."],
  ["salle-gateau-externe-paris", "Salle où apporter son gâteau à Paris", "Salle où apporter son gâteau", "Possibilité de ramener son gâteau", "Pour un anniversaire, un mariage ou une célébration, trouvez une salle à Paris où apporter votre gâteau est possible."],
].map(([slug, h1, intentLabel, option, intro]) =>
  createParisFilterPage({
    slug,
    h1,
    intentLabel,
    filters: { optionFilters: [option] },
    intro,
  }),
);

const servicePages = [
  ["salle-avec-tv-paris", "Salle avec TV à Paris", "Salle avec TV", "TV"],
  ["salle-climatisee-paris", "Salle climatisée à Paris", "Salle climatisée", "Climatisation"],
  ["salle-acces-pmr-paris", "Salle avec accès PMR à Paris", "Salle avec accès PMR", "Accès PMR"],
  ["salle-avec-micro-paris", "Salle avec micro à Paris", "Salle avec micro", "Micro"],
  ["salle-avec-wifi-paris", "Salle avec Wi-Fi à Paris", "Salle avec Wi-Fi", "Wi-Fi"],
  ["salle-avec-terrasse-paris", "Salle avec terrasse à Paris", "Salle avec terrasse", "Terrasse"],
  ["salle-avec-jardin-paris", "Salle avec jardin à Paris", "Salle avec jardin", "Jardin"],
  ["salle-avec-piscine-paris", "Salle avec piscine à Paris", "Salle avec piscine", "Piscine"],
  ["salle-avec-projecteur-paris", "Salle avec projecteur à Paris", "Salle avec projecteur", "Projecteur"],
  ["salle-avec-ecran-paris", "Salle avec écran à Paris", "Salle avec écran", "Écran"],
  ["salle-avec-systeme-son-paris", "Salle avec système son à Paris", "Salle avec système son", "Système son"],
  ["salle-avec-mobilier-paris", "Salle avec mobilier à Paris", "Salle avec mobilier", "Mobilier"],
  ["salle-avec-table-de-mixage-paris", "Salle avec table de mixage à Paris", "Salle avec table de mixage", "Table de mixage"],
  ["salle-avec-piste-de-danse-paris", "Salle avec piste de danse à Paris", "Salle avec piste de danse", "Piste de danse"],
  ["salle-avec-parking-paris", "Salle avec parking à Paris", "Salle avec parking", "Parking"],
  ["salle-avec-vestiaire-paris", "Salle avec vestiaire à Paris", "Salle avec vestiaire", "Vestiaire"],
  ["salle-avec-loge-paris", "Salle avec loge à Paris", "Salle avec loge", "Loge"],
  ["salle-avec-cuisine-equipee-paris", "Salle avec cuisine équipée à Paris", "Salle avec cuisine équipée", "Cuisine équipée"],
  ["salle-avec-bar-equipe-paris", "Salle avec bar équipé à Paris", "Salle avec bar équipé", "Bar équipé"],
  ["salle-avec-lumieres-paris", "Salle avec lumières à Paris", "Salle avec lumières", "Lumières"],
  ["salle-avec-scene-paris", "Salle avec scène à Paris", "Salle avec scène", "Scène"],
  ["salle-avec-personnel-sur-place-paris", "Salle avec personnel sur place à Paris", "Salle avec personnel sur place", "Personnel sur place"],
  ["salle-avec-securite-paris", "Salle avec sécurité à Paris", "Salle avec sécurité", "Sécurité"],
].map(([slug, h1, intentLabel, equipment]) =>
  createParisFilterPage({
    slug,
    h1,
    intentLabel,
    filters: { equipmentFilters: [equipment] },
    intro: `${h1} : comparez les lieux équipés, vérifiez les capacités, les conditions de privatisation et envoyez une demande de disponibilité gratuite avec Wearevents.`,
  }),
);

export const seoLandingPages = [
  parisMainPage,
  ...parisArrondissementPages,
  ...eventPages,
  ...capacityPages,
  ...venueTypePages,
  ...pricePages,
  ...ambiancePages,
  ...privatizationPages,
  ...closingPages,
  ...spacePages,
  ...dispositionPages,
  ...optionPages,
  ...servicePages,
];

export const seoLandingPageSlugs = seoLandingPages.map((page) => page.slug);
