export interface Venue {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  city: string;
  address?: string;
  venueCode: string;
  minCapacity: number;
  maxCapacity: number;
  eventCategories: string[];
  services: string[];
  pricingText: string;
  coverImage: string;
  gallery: string[];
  videoUrl?: string;
  tiktokUrl?: string;
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
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  desiredDate?: string;
  guestCount?: number;
  eventType?: string;
  message?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  venueId: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
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
