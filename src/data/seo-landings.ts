import type { Venue } from "@/types/venue";
import {
  getCapacitySeoPath,
  getEventSeoPath,
  getLocationSeoPath,
  SEO_CAPACITY_RANGES,
  SEO_EVENT_TYPES,
  seoLandingPageSlugs,
  seoLandingPages,
} from "./seo-landings-data";

export type SeoLandingFilters = {
  locationQuery?: string;
  eventType?: string;
  minGuests?: number;
  guestRangeMin?: number;
  guestRangeMax?: number;
  maxCapacityGreaterThan?: number;
  maxCapacityLimit?: number;
  priceTier?: string;
  closingTimeFilter?: string;
  venueTypes?: string[];
  ambianceTypes?: string[];
  privatizationTypes?: string[];
  spaceTypes?: string[];
  optionFilters?: string[];
  equipmentFilters?: string[];
  guestDispositions?: string[];
  venueSlugs?: string[];
};

export type SeoLandingPage = {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  locationLabel: string;
  intentLabel: string;
  filters: SeoLandingFilters;
  searchUrl: string;
  faq: Array<{ question: string; answer: string }>;
  relatedSlugs: string[];
  indexable: boolean;
};

const typedSeoLandingPages = seoLandingPages as SeoLandingPage[];

const getSeoLandingPage = (slug = "") =>
  typedSeoLandingPages.find((page) => page.slug === slug);

const getAdjacentSeoSlugs = (page: SeoLandingPage) => {
  const arrondissementMatch = page.slug.match(/^location-salle-paris-(\d{1,2})(?:er|e)$/);
  if (arrondissementMatch) {
    const arrondissement = Number(arrondissementMatch[1]);
    return [arrondissement - 1, arrondissement + 1]
      .filter((value) => value >= 1 && value <= 20)
      .map((value) => `location-salle-paris-${value}${value === 1 ? "er" : "e"}`);
  }

  const capacityIndex = SEO_CAPACITY_RANGES.findIndex(
    (range) => page.slug === `location-salle-${range.key}-personnes-paris`,
  );
  if (capacityIndex >= 0) {
    return [SEO_CAPACITY_RANGES[capacityIndex - 1], SEO_CAPACITY_RANGES[capacityIndex + 1]]
      .filter(Boolean)
      .map((range) => `location-salle-${range.key}-personnes-paris`);
  }

  const eventRelations: Record<string, string[]> = {
    "salle-anniversaire-paris": ["salle-evjf-evg-paris", "salle-soiree-privee-paris"],
    "salle-evjf-evg-paris": ["salle-anniversaire-paris", "salle-soiree-privee-paris"],
    "salle-soiree-privee-paris": ["salle-anniversaire-paris", "salle-evjf-evg-paris"],
  };

  return eventRelations[page.slug] ?? [];
};

const getRelatedSeoLandingPages = (page: SeoLandingPage) =>
  Array.from(new Set([...page.relatedSlugs, ...getAdjacentSeoSlugs(page)]))
    .map((slug) => getSeoLandingPage(slug))
    .filter((item): item is SeoLandingPage => Boolean(item))
    .filter((item) => item.indexable !== false)
    .filter((item) => item.slug !== page.slug);

const getPrimaryVenueImage = (venues: Venue[]) =>
  venues.find((venue) => venue.coverImage)?.coverImage;

export {
  getCapacitySeoPath,
  getEventSeoPath,
  getLocationSeoPath,
  SEO_CAPACITY_RANGES,
  SEO_EVENT_TYPES,
  getPrimaryVenueImage,
  getRelatedSeoLandingPages,
  getSeoLandingPage,
  seoLandingPageSlugs,
  typedSeoLandingPages as seoLandingPages,
};
