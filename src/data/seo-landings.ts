import type { Venue } from "@/types/venue";
import {
  getEventSeoPath,
  getLocationSeoPath,
  seoLandingPageSlugs,
  seoLandingPages,
} from "./seo-landings-data";

export type SeoLandingFilters = {
  locationQuery?: string;
  eventType?: string;
  venueTypes?: string[];
  ambianceTypes?: string[];
  privatizationTypes?: string[];
  spaceTypes?: string[];
  optionFilters?: string[];
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
};

const typedSeoLandingPages = seoLandingPages as SeoLandingPage[];

const getSeoLandingPage = (slug = "") =>
  typedSeoLandingPages.find((page) => page.slug === slug);

const getRelatedSeoLandingPages = (page: SeoLandingPage) =>
  page.relatedSlugs
    .map((slug) => getSeoLandingPage(slug))
    .filter((item): item is SeoLandingPage => Boolean(item))
    .filter((item) => item.slug !== page.slug);

const getPrimaryVenueImage = (venues: Venue[]) =>
  venues.find((venue) => venue.coverImage)?.coverImage;

export {
  getEventSeoPath,
  getLocationSeoPath,
  getPrimaryVenueImage,
  getRelatedSeoLandingPages,
  getSeoLandingPage,
  seoLandingPageSlugs,
  typedSeoLandingPages as seoLandingPages,
};
