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

const matchesOne = (selected = [], available = []) =>
  !selected.length || selected.some((item) => {
    const normalizedItem = normalize(item);
    return available.some((value) => normalize(value) === normalizedItem);
  });

export const venueMatchesSeoFilters = (venue, filters = {}) => {
  if (venue.active === false) return false;
  if (filters.venueSlugs?.length && !filters.venueSlugs.includes(venue.slug)) return false;

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
  const hasExact = (available, value) => available.some((item) => normalize(item) === normalize(value));

  if (filters.locationQuery) {
    const location = normalize(`${venue.city ?? ""} ${venue.address ?? ""}`);
    const query = normalize(filters.locationQuery);
    const isParis16Query = ["75016", "75116", "paris 16", "paris 16e"].includes(query);
    const isParis16Venue = /\b(?:75016|75116)\b/.test(location);
    if (!(isParis16Query && isParis16Venue) && !location.includes(query)) return false;
  }
  if (filters.eventType) {
    if (!eventCategories.some((item) => normalize(item) === normalize(filters.eventType))) return false;
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

  if (!matchesOne(filters.venueTypes, venueTypes)) return false;
  if (!matchesOne(filters.ambianceTypes, ambianceTypes)) return false;
  if (!matchesOne(filters.privatizationTypes, privatizationTypes)) return false;
  if (!matchesOne(filters.guestDispositions, guestDispositions)) return false;
  if (!matchesOne(filters.spaceTypes, spaceTypes)) return false;

  for (const option of filters.optionFilters ?? []) {
    if (!hasExact([...optionFeatures, ...externalOptions], option)) return false;
  }

  if ((filters.equipmentFilters ?? []).some((item) => !hasExact(services, item))) return false;
  return true;
};

const stablePageScore = (pageSlug, venueSlug) => {
  const value = `${pageSlug}:${venueSlug}`;
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export const getMatchingSeoVenues = (venues, page) =>
  venues
    .filter((venue) => venueMatchesSeoFilters(venue, page.filters))
    .sort((left, right) =>
      stablePageScore(page.slug, left.slug) - stablePageScore(page.slug, right.slug),
    );

export const getIndexableSeoPages = (venues, pages, minimumVenueCount = 3) =>
  pages.filter((page) => page.indexable !== false && getMatchingSeoVenues(venues, page).length >= minimumVenueCount);
