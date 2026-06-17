import { blogPosts, type BlogPost } from "@/data/blog";
import { mockVenues } from "@/data/venues";
import { OPTION_FEATURES, SPACE_TYPES, type Venue } from "@/types/venue";
import { supabase } from "@/lib/supabase";
import { venueCanHostGuestCount, venueMaxCapacityFitsBounds, venueOverlapsGuestRange } from "@/lib/venue-capacity";

const normalizeVenueCode = (code: string) => code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
const normalizeSearchValue = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
const getPostalCodeFromAddress = (address: string) => address.match(/\b\d{5}\b/)?.[0] ?? "";
const parseClosingTime = (time: string) => {
  const [hours = "0", minutes = "0"] = time.split(":");
  const numericHours = Number(hours);
  const numericMinutes = Number(minutes);

  if (!Number.isFinite(numericHours) || !Number.isFinite(numericMinutes)) return null;

  return (numericHours < 8 ? numericHours + 24 : numericHours) * 60 + numericMinutes;
};
const closesAtOrAfter = (time: string, threshold: string) => {
  const venueTime = parseClosingTime(time);
  const thresholdTime = parseClosingTime(threshold);

  if (venueTime === null || thresholdTime === null) return false;

  return venueTime >= thresholdTime;
};
const getLegacySpaceTypes = (options: string[] = []) =>
  options.filter((option) => ["Espace clos", "Espace ouvert"].includes(option));
const normalizeKnownValues = (values: string[] = [], options: readonly string[]) => {
  const joinedValues = values.join(", ");
  return options.filter((option) => values.includes(option) || joinedValues.includes(option));
};

const mapVenue = (row: any): Venue => ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  tagline: row.tagline ?? "",
  description: row.description ?? "",
  city: row.city ?? "",
  address: row.address ?? "",
  location: row.location ?? { lat: 0, lng: 0 },
  venueCode: row.venue_code ?? "",
  minCapacity: row.min_capacity ?? 0,
  maxCapacity: row.max_capacity ?? 0,
  eventCategories: row.event_categories ?? [],
  venueTypes: row.venue_types ?? [],
  services: row.services ?? [],
  spaces: row.spaces ?? [],
  accessDetails: row.access_details ?? [],
  usefulInformation: row.useful_information ?? [],
  pricingText: row.pricing_text ?? "",
  coverImage: row.cover_image ?? "",
  gallery: row.gallery ?? [],
  videoUrl: row.video_url ?? undefined,
  videoStartSeconds: row.video_start_seconds ?? 0,
  videoEndSeconds: row.video_end_seconds ?? undefined,
  tiktokUrl: row.tiktok_url ?? undefined,
  googleReviewUrl: row.google_review_url ?? "",
  priceTier: row.price_tier ?? "€€",
  closingTime: row.closing_time ?? "",
  ambianceTypes: row.ambiance_types ?? [],
  externalOptions: row.external_options ?? [],
  privatizationTypes: row.privatization_types ?? [],
  guestDispositions: row.guest_dispositions ?? [],
  spaceTypes: row.space_types?.length ? normalizeKnownValues(row.space_types, SPACE_TYPES) : getLegacySpaceTypes(row.option_features ?? []),
  optionFeatures: normalizeKnownValues(
    (row.option_features ?? []).filter((option: string) => !["Espace clos", "Espace ouvert"].includes(option)),
    OPTION_FEATURES,
  ),
  metroAccess: row.metro_access ?? undefined,
  featured: row.featured ?? false,
  active: row.active ?? true,
  contactEmail: row.contact_email ?? "",
  rating: Number(row.rating ?? 0),
  reviewCount: row.review_count ?? 0,
});

const mapBlogPost = (row: any): BlogPost => ({
  slug: row.slug,
  category: row.category ?? "",
  title: row.title,
  excerpt: row.excerpt ?? "",
  content: row.content ?? "",
  readTime: row.read_time ?? "",
  image: row.image ?? "",
  publishedAt: row.published_at ?? undefined,
});

export const filterVenues = (
  venues: Venue[],
  filters: {
    locationQuery?: string;
    eventType?: string;
    eventTypes?: string[];
    minGuests?: number;
    guestRangeMin?: number;
    guestRangeMax?: number;
    maxCapacityGreaterThan?: number;
    maxCapacityLimit?: number;
    priceTier?: string;
    closesAfterTwo?: boolean;
    closesAfterMidnight?: boolean;
    closingTimeFilter?: string;
    ambianceType?: string;
    ambianceTypes?: string[];
    externalOption?: string;
    venueTypes?: string[];
    privatizationTypes?: string[];
    spaceTypes?: string[];
    optionFilters?: string[];
    equipmentFilters?: string[];
    guestDispositions?: string[];
  },
) =>
  venues.filter((venue) => {
    if (!venue.active) return false;
    if (filters.locationQuery) {
      const locationQuery = normalizeSearchValue(filters.locationQuery);
      const city = normalizeSearchValue(venue.city);
      const address = normalizeSearchValue(venue.address);
      const postalCode = getPostalCodeFromAddress(venue.address);

      if (!city.includes(locationQuery) && !address.includes(locationQuery) && !postalCode.startsWith(locationQuery)) {
        return false;
      }
    }
    const selectedEventTypes = Array.from(new Set([filters.eventType, ...(filters.eventTypes ?? [])].filter(Boolean)));

    if (
      selectedEventTypes.length &&
      !selectedEventTypes.some((eventType) =>
        venue.eventCategories.some((category) => normalizeSearchValue(category) === normalizeSearchValue(eventType ?? "")),
      )
    ) return false;
    if (!venueCanHostGuestCount(venue, filters.minGuests)) return false;
    if (!venueOverlapsGuestRange(venue, filters.guestRangeMin, filters.guestRangeMax)) return false;
    if (!venueMaxCapacityFitsBounds(venue, filters.maxCapacityGreaterThan, filters.maxCapacityLimit)) return false;
    if (filters.priceTier && venue.priceTier !== filters.priceTier) return false;
    if (filters.closesAfterMidnight && (!venue.closingTime || !closesAtOrAfter(venue.closingTime, "00:00"))) return false;
    if (filters.closesAfterTwo && (!venue.closingTime || !closesAtOrAfter(venue.closingTime, "02:00"))) return false;
    if (filters.closingTimeFilter === "Jusqu'à minuit" && (!venue.closingTime || closesAtOrAfter(venue.closingTime, "00:01"))) return false;
    if (filters.closingTimeFilter === "Jusqu'à 2h" && (!venue.closingTime || closesAtOrAfter(venue.closingTime, "02:01"))) return false;
    if (filters.closingTimeFilter === "Après 2h" && (!venue.closingTime || !closesAtOrAfter(venue.closingTime, "02:01"))) return false;
    const selectedAmbianceTypes = Array.from(new Set([filters.ambianceType, ...(filters.ambianceTypes ?? [])].filter(Boolean)));

    if (
      selectedAmbianceTypes.length &&
      !selectedAmbianceTypes.some((ambianceType) =>
        venue.ambianceTypes.some((ambiance) => normalizeSearchValue(ambiance) === normalizeSearchValue(ambianceType ?? "")),
      )
    ) return false;
    if (filters.externalOption && !venue.externalOptions.includes(filters.externalOption)) return false;

    const searchable = normalizeSearchValue(
      [
        venue.title,
        venue.tagline,
        venue.description,
        venue.pricingText,
        ...venue.eventCategories,
        ...venue.venueTypes,
        ...venue.services,
        ...venue.ambianceTypes,
        ...venue.externalOptions,
        ...venue.privatizationTypes,
        ...venue.guestDispositions,
        ...venue.spaceTypes,
        ...venue.optionFeatures,
        ...venue.spaces.map((space) => `${space.name} ${space.description}`),
      ].join(" "),
    );
    const hasText = (value: string) => searchable.includes(normalizeSearchValue(value));
    const hasAnyExactOrText = (selected: string[] | undefined, values: string[]) =>
      !selected?.length ||
      selected.some((item) =>
        values.some((value) => normalizeSearchValue(value) === normalizeSearchValue(item)) || hasText(item),
      );

    if (!hasAnyExactOrText(filters.venueTypes, venue.venueTypes)) return false;
    if (!hasAnyExactOrText(filters.privatizationTypes, venue.privatizationTypes)) return false;
    if (!hasAnyExactOrText(filters.guestDispositions, venue.guestDispositions)) return false;
    if (!hasAnyExactOrText(filters.spaceTypes, venue.spaceTypes)) return false;

    if (filters.optionFilters?.includes("Possibilité de mettre sa musique") && !["dj", "musique"].some(hasText)) return false;
    if (filters.optionFilters?.includes("Possibilité de ramener sa nourriture") && !venue.externalOptions.includes("Possibilité de ramener sa nourriture") && !hasText("traiteur externe")) return false;
    if (filters.optionFilters?.includes("Possibilité de ramener ses boissons") && !venue.externalOptions.includes("Possibilité de ramener ses boissons") && !hasText("boissons externes")) return false;
    if (filters.optionFilters?.includes("Possibilité de ramener son gâteau") && !venue.externalOptions.includes("Possibilité de ramener son gâteau") && !hasText("gateau externe") && !hasText("gâteau externe")) return false;
    if (filters.optionFilters?.includes("Possibilité de danser") && !["festif", "anime", "animé", "dj", "musique"].some(hasText)) return false;
    if (filters.optionFilters?.includes("Matériel de projection") && !["projecteur", "projection"].some(hasText)) return false;
    if (filters.optionFilters?.includes("Jeux (baby-foot / ping-pong / etc.)") && !["jeu", "baby-foot", "ping-pong"].some(hasText)) return false;
    if (filters.equipmentFilters?.some((item) => !hasText(item))) return false;
    return true;
  });

export const getVenueLocationSuggestionsFromVenues = (venues: Venue[]) => {
  const locations = new Map<string, Set<string>>();

  venues.forEach((venue) => {
    if (!venue.active) return;

    const cityPostcodes = locations.get(venue.city) ?? new Set<string>();
    const postalCode = getPostalCodeFromAddress(venue.address);

    if (postalCode) {
      cityPostcodes.add(postalCode);
    }

    locations.set(venue.city, cityPostcodes);
  });

  return Array.from(locations.entries())
    .map(([city, postalCodes]) => ({
      city,
      postalCodes: Array.from(postalCodes).sort(),
    }))
    .sort((a, b) => a.city.localeCompare(b.city, "fr"));
};

export const fetchVenues = async (): Promise<Venue[]> => {
  if (!supabase) return mockVenues;

  const { data, error } = await supabase.from("venues").select("*").eq("active", true).order("created_at", { ascending: false });

  if (error || !data?.length) {
    return mockVenues;
  }

  return data.map(mapVenue);
};

export const fetchBlogPosts = async (): Promise<BlogPost[]> => {
  if (!supabase) return blogPosts;

  const { data, error } = await supabase.from("blog_posts").select("*").eq("published", true).order("published_at", { ascending: false });

  if (error || !data?.length) {
    return blogPosts;
  }

  return data.map(mapBlogPost);
};

export const fetchBlogPostBySlug = async (slug: string): Promise<BlogPost | undefined> => {
  if (!supabase) return blogPosts.find((post) => post.slug === slug);

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .eq("slug", slug)
    .maybeSingle();

  if (!error && data) {
    return mapBlogPost(data);
  }

  return blogPosts.find((post) => post.slug === slug);
};

export const findVenueByCode = async (code: string): Promise<Venue | undefined> => {
  if (!supabase) {
    return mockVenues.find((venue) => normalizeVenueCode(venue.venueCode) === normalizeVenueCode(code) && venue.active);
  }

  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("active", true)
    .ilike("venue_code", code.trim())
    .maybeSingle();

  if (!error && data) {
    return mapVenue(data);
  }

  return mockVenues.find((venue) => normalizeVenueCode(venue.venueCode) === normalizeVenueCode(code) && venue.active);
};
