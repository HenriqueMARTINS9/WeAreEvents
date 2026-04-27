import { blogPosts, type BlogPost } from "@/data/blog";
import { mockVenues } from "@/data/venues";
import type { Venue } from "@/types/venue";
import { supabase } from "@/lib/supabase";

const normalizeVenueCode = (code: string) => code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
const normalizeSearchValue = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
const getPostalCodeFromAddress = (address: string) => address.match(/\b\d{5}\b/)?.[0] ?? "";

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
  readTime: row.read_time ?? "",
  image: row.image ?? "",
});

export const filterVenues = (
  venues: Venue[],
  filters: {
    locationQuery?: string;
    eventType?: string;
    minGuests?: number;
    priceTier?: string;
    closesAfterTwo?: boolean;
    ambianceType?: string;
    externalOption?: string;
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
    if (filters.eventType && !venue.eventCategories.includes(filters.eventType)) return false;
    if (filters.minGuests && venue.maxCapacity < filters.minGuests) return false;
    if (filters.priceTier && venue.priceTier !== filters.priceTier) return false;
    if (filters.closesAfterTwo && venue.closingTime && venue.closingTime < "02:00") return false;
    if (filters.ambianceType && !venue.ambianceTypes.includes(filters.ambianceType)) return false;
    if (filters.externalOption && !venue.externalOptions.includes(filters.externalOption)) return false;
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
