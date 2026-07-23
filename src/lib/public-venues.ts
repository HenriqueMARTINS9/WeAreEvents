import { OPTION_FEATURES, SPACE_TYPES, type Venue } from "@/types/venue";

type PublicVenueRow = {
  id: string;
  title: string;
  slug: string;
  tagline?: string | null;
  description?: string | null;
  city?: string | null;
  address?: string | null;
  location?: { lat: number; lng: number } | null;
  venue_code?: string | null;
  min_capacity?: number | null;
  max_capacity?: number | null;
  event_categories?: string[] | null;
  venue_types?: string[] | null;
  services?: string[] | null;
  spaces?: Venue["spaces"] | null;
  access_details?: string[] | null;
  useful_information?: string[] | null;
  pricing_text?: string | null;
  cover_image?: string | null;
  gallery?: string[] | null;
  video_url?: string | null;
  video_start_seconds?: number | null;
  video_end_seconds?: number | null;
  tiktok_url?: string | null;
  google_review_url?: string | null;
  price_tier?: Venue["priceTier"] | null;
  closing_time?: string | null;
  ambiance_types?: string[] | null;
  external_options?: string[] | null;
  privatization_types?: string[] | null;
  guest_dispositions?: string[] | null;
  space_types?: string[] | null;
  option_features?: string[] | null;
  metro_access?: string | null;
  featured?: boolean | null;
  active?: boolean | null;
  contact_email?: string | null;
  rating?: number | string | null;
  review_count?: number | null;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishable = import.meta.env.VITE_SUPABASE_PUBLISHABLE || import.meta.env.VITE_SUPABASE_ANON_KEY;

const getLegacySpaceTypes = (options: string[] = []) =>
  options.filter((option) => ["Espace clos", "Espace ouvert"].includes(option));

const normalizeKnownValues = (values: string[] = [], options: readonly string[]) => {
  const joinedValues = values.join(", ");
  return options.filter((option) => values.includes(option) || joinedValues.includes(option));
};

const mapPublicVenue = (row: PublicVenueRow): Venue => ({
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
  spaceTypes: row.space_types?.length
    ? normalizeKnownValues(row.space_types, SPACE_TYPES)
    : getLegacySpaceTypes(row.option_features ?? []),
  optionFeatures: normalizeKnownValues(
    (row.option_features ?? []).filter((option) => !["Espace clos", "Espace ouvert"].includes(option)),
    OPTION_FEATURES,
  ),
  metroAccess: row.metro_access ?? undefined,
  featured: row.featured ?? false,
  active: row.active ?? true,
  contactEmail: row.contact_email ?? "",
  rating: Number(row.rating ?? 0),
  reviewCount: row.review_count ?? 0,
});

const loadMockVenues = async () => {
  const { mockVenues } = await import("@/data/venues");
  return mockVenues;
};

export const fetchPublicVenues = async (): Promise<Venue[]> => {
  if (!supabaseUrl || !supabasePublishable) return loadMockVenues();

  const query = new URLSearchParams({
    select: "*",
    active: "eq.true",
    order: "created_at.desc",
  });

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/venues?${query.toString()}`, {
      headers: {
        apikey: supabasePublishable,
        Authorization: `Bearer ${supabasePublishable}`,
      },
    });

    if (!response.ok) return loadMockVenues();

    const data = (await response.json()) as PublicVenueRow[];
    if (!data.length) return loadMockVenues();

    return data.map(mapPublicVenue);
  } catch {
    return loadMockVenues();
  }
};
