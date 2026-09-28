const normalize = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const values = (venue, key) => Array.isArray(venue[key]) ? venue[key] : [];

const parseClosingTime = (time = "") => {
  const [hours, minutes = "0"] = String(time).split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return (hours < 8 ? hours + 24 : hours) * 60 + minutes;
};

const matchesOne = (selected = [], available = [], searchable = "") =>
  !selected.length || selected.some((item) => {
    const normalizedItem = normalize(item);
    return available.some((value) => normalize(value) === normalizedItem) || searchable.includes(normalizedItem);
  });

const eventAliases = {
  "Lancement de produit": ["Lancement"],
  "Repas d'entreprise": ["Corporate", "Dîner d'affaires"],
  Tournage: ["Shooting / tournage"],
  Shooting: ["Shooting / tournage"],
  "Événement étudiant": ["Gala", "Concert"],
};

export const venueMatchesSeoFilters = (venue, filters = {}) => {
  if (venue.active === false) return false;

  const minCapacity = Number(venue.min_capacity ?? venue.minCapacity ?? 0);
  const maxCapacity = Number(venue.max_capacity ?? venue.maxCapacity ?? 0);
  const eventCategories = values(venue, "event_categories").length ? values(venue, "event_categories") : values(venue, "eventCategories");
  const venueTypes = values(venue, "venue_types").length ? values(venue, "venue_types") : values(venue, "venueTypes");
  const services = values(venue, "services");
  const ambianceTypes = values(venue, "ambiance_types").length ? values(venue, "ambiance_types") : values(venue, "ambianceTypes");
  const externalOptions = values(venue, "external_options").length ? values(venue, "external_options") : values(venue, "externalOptions");
  const privatizationTypes = values(venue, "privatization_types").length ? values(venue, "privatization_types") : values(venue, "privatizationTypes");
  const guestDispositions = values(venue, "guest_dispositions").length ? values(venue, "guest_dispositions") : values(venue, "guestDispositions");
  const spaceTypes = values(venue, "space_types").length ? values(venue, "space_types") : values(venue, "spaceTypes");
  const optionFeatures = values(venue, "option_features").length ? values(venue, "option_features") : values(venue, "optionFeatures");
  const spaces = values(venue, "spaces");
  const searchable = normalize([
    venue.title,
    venue.tagline,
    venue.description,
    venue.pricing_text ?? venue.pricingText,
    ...eventCategories,
    ...venueTypes,
    ...services,
    ...ambianceTypes,
    ...externalOptions,
    ...privatizationTypes,
    ...guestDispositions,
    ...spaceTypes,
    ...optionFeatures,
    ...spaces.map((space) => `${space?.name ?? ""} ${space?.description ?? ""}`),
  ].join(" "));
  const hasText = (value) => searchable.includes(normalize(value));

  if (filters.locationQuery) {
    const location = normalize(`${venue.city ?? ""} ${venue.address ?? ""}`);
    if (!location.includes(normalize(filters.locationQuery))) return false;
  }
  if (filters.eventType) {
    const acceptedEvents = [filters.eventType, ...(eventAliases[filters.eventType] ?? [])].map(normalize);
    if (!eventCategories.some((item) => acceptedEvents.includes(normalize(item)))) return false;
  }
  if (filters.minGuests && (minCapacity > filters.minGuests || maxCapacity < filters.minGuests)) return false;
  if (filters.guestRangeMin && maxCapacity < filters.guestRangeMin) return false;
  if (filters.guestRangeMax && minCapacity > filters.guestRangeMax) return false;
  if (filters.maxCapacityGreaterThan !== undefined && maxCapacity <= filters.maxCapacityGreaterThan) return false;
  if (filters.maxCapacityLimit !== undefined && maxCapacity > filters.maxCapacityLimit) return false;
  if (filters.priceTier && (venue.price_tier ?? venue.priceTier) !== filters.priceTier) return false;

  const closingMinutes = parseClosingTime(venue.closing_time ?? venue.closingTime);
  if (filters.closingTimeFilter === "Jusqu'à minuit" && (closingMinutes === null || closingMinutes >= 24 * 60 + 1)) return false;
  if (filters.closingTimeFilter === "Jusqu'à 2h" && (closingMinutes === null || closingMinutes >= 26 * 60 + 1)) return false;
  if (filters.closingTimeFilter === "Après 2h" && (closingMinutes === null || closingMinutes < 26 * 60 + 1)) return false;

  if (!matchesOne(filters.venueTypes, venueTypes, searchable)) return false;
  if (!matchesOne(filters.ambianceTypes, ambianceTypes, searchable)) return false;
  if (!matchesOne(filters.privatizationTypes, privatizationTypes, searchable)) return false;
  if (!matchesOne(filters.guestDispositions, guestDispositions, searchable)) return false;
  if (!matchesOne(filters.spaceTypes, spaceTypes, searchable)) return false;

  for (const option of filters.optionFilters ?? []) {
    if (option === "Possibilité de mettre sa musique" && !["dj", "musique"].some(hasText)) return false;
    if (option === "Possibilité de ramener sa nourriture" && !externalOptions.includes(option) && !hasText("traiteur externe")) return false;
    if (option === "Possibilité de ramener ses boissons" && !externalOptions.includes(option) && !hasText("boissons externes")) return false;
    if (option === "Possibilité de ramener son gâteau" && !externalOptions.includes(option) && !hasText("gateau externe") && !hasText("gâteau externe")) return false;
    if (option === "Possibilité de danser" && !["festif", "anime", "animé", "dj", "musique", "piste de danse"].some(hasText)) return false;
    if (option === "Matériel de projection" && !["projecteur", "projection", "écran"].some(hasText)) return false;
    if (option === "Jeux (baby-foot / ping-pong / etc.)" && !["jeu", "baby-foot", "ping-pong"].some(hasText)) return false;
    if (!["Possibilité de mettre sa musique", "Possibilité de ramener sa nourriture", "Possibilité de ramener ses boissons", "Possibilité de ramener son gâteau", "Possibilité de danser", "Matériel de projection", "Jeux (baby-foot / ping-pong / etc.)"].includes(option) && !hasText(option)) return false;
  }

  if ((filters.equipmentFilters ?? []).some((item) => !hasText(item))) return false;
  return true;
};

export const getMatchingSeoVenues = (venues, page) =>
  venues.filter((venue) => venueMatchesSeoFilters(venue, page.filters));

export const getIndexableSeoPages = (venues, pages, minimumVenueCount = 3) =>
  pages.filter((page) => getMatchingSeoVenues(venues, page).length >= minimumVenueCount);
