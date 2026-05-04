export interface VenueSpace {
  id: string;
  name: string;
  capacity: number;
  description: string;
}

export interface VenueLocation {
  lat: number;
  lng: number;
}

export interface Venue {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  city: string;
  address: string;
  location: VenueLocation;
  venueCode: string;
  minCapacity: number;
  maxCapacity: number;
  eventCategories: string[];
  services: string[];
  spaces: VenueSpace[];
  accessDetails: string[];
  usefulInformation: string[];
  pricingText: string;
  coverImage: string;
  gallery: string[];
  videoUrl?: string;
  videoStartSeconds?: number;
  videoEndSeconds?: number;
  tiktokUrl?: string;
  googleReviewUrl: string;
  priceTier: "€" | "€€" | "€€€" | "€€€€";
  closingTime: string;
  ambianceTypes: string[];
  externalOptions: string[];
  metroAccess?: string;
  featured: boolean;
  active: boolean;
  contactEmail: string;
  rating: number;
  reviewCount: number;
}

export interface BookingRequest {
  id: string;
  venueId: string;
  venueCode: string;
  venueTitle: string;
  venueCity: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  desiredDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  eventType: string;
  requestedSpaces: string[];
  message?: string;
  status: "pending" | "sent" | "failed";
  createdAt: string;
}

export interface BookingEmailTemplate {
  to: string;
  subject: string;
  preview: string;
  text: string;
  scheduledFor?: string;
}

export interface BookingEmailTemplates {
  customerConfirmation: BookingEmailTemplate;
  adminNotification: BookingEmailTemplate;
  venueContactNotification: BookingEmailTemplate;
  postEventReviewFollowUp: BookingEmailTemplate;
}

export interface Review {
  id: string;
  venueId: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface TikTokVenueCodeMapping {
  code: string;
  venueId: string;
  campaignName: string;
  active: boolean;
}

export const EVENT_TYPES = [
  "Mariage",
  "Anniversaire",
  "Corporate",
  "Soirée privée",
  "Gala",
  "Séminaire",
  "Cocktail",
  "Lancement",
] as const;

export const SERVICES = [
  "Traiteur",
  "DJ / Musique",
  "Décoration",
  "Photographe",
  "Parking privé",
  "Terrasse",
  "Piscine",
  "Cuisine équipée",
  "Wi-Fi",
  "Climatisation",
  "Projecteur",
  "Vestiaire",
] as const;

export const PRICE_TIERS = ["€", "€€", "€€€", "€€€€"] as const;

export const AMBIANCE_TYPES = [
  "Calme",
  "Animé",
  "Festif",
  "Élégant",
  "Corporate",
  "Intimiste",
] as const;

export const EXTERNAL_OPTIONS = [
  "Traiteur externe",
  "Boissons externes",
  "Gâteau externe",
] as const;
