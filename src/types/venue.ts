export interface VenueSpace {
  id: string;
  name: string;
  capacity: number;
  description: string;
  imageUrl?: string;
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
  venueTypes: string[];
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
  privatizationTypes: string[];
  guestDispositions: string[];
  spaceTypes: string[];
  optionFeatures: string[];
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
  "Afterwork",
  "EVJF / EVG",
  "Baptême",
  "Bar mitzvah",
  "Remise de diplôme",
  "Team building",
  "Conférence",
  "Formation",
  "Dîner d'affaires",
  "Shooting / tournage",
] as const;

export const VENUE_TYPES = [
  "Péniche",
  "Rooftop",
  "Discothèque",
  "Bar",
  "Salle de réception",
  "Espace extérieur",
  "Appartement",
  "Loft",
  "Villa",
  "Restaurant",
  "Château",
  "Domaine",
  "Hôtel",
  "Jardin",
  "Showroom",
] as const;

export const SERVICES = [
  "TV",
  "Climatisation",
  "Accès PMR",
  "Micro",
  "Wi-Fi",
  "Terrasse",
  "Projecteur",
  "Système son",
  "Mobilier",
  "Table de mixage",
  "Parking",
  "Vestiaire",
  "Cuisine équipée",
  "Bar équipé",
  "Lumières",
  "Scène",
  "Personnel sur place",
  "Sécurité",
  "Hébergement",
] as const;

export const PRICE_TIERS = ["€", "€€", "€€€", "€€€€"] as const;

export const AMBIANCE_TYPES = [
  "Calme",
  "Animé",
  "Festif",
  "Élégant",
  "Corporate",
  "Intimiste",
  "Atypique",
  "Chic",
  "Convivial",
  "Lounge",
  "Premium",
  "Décontracté",
  "Bohème",
  "Moderne",
  "Industriel",
  "Romantique",
  "Rooftop",
  "Club",
] as const;

export const EXTERNAL_OPTIONS = [
  "Possibilité de ramener sa nourriture",
  "Possibilité de ramener ses boissons",
  "Possibilité de ramener son gâteau",
] as const;

export const PRIVATIZATION_TYPES = [
  "Forfait consommation (budget par personne)",
  "Location sèche (budget location)",
] as const;

export const GUEST_DISPOSITIONS = [
  "Debout",
  "Assis",
  "Les deux",
] as const;

export const SPACE_TYPES = [
  "Espace clos",
  "Espace ouvert",
] as const;

export const OPTION_FEATURES = [
  "Possibilité de mettre sa musique",
  "Possibilité de danser",
  "Décoration personnalisable",
  "Jeux (baby-foot, ping-pong, ...)",
  "Heures supplémentaires possibles",
] as const;

export const CLOSING_TIME_OPTIONS = [
  "Jusqu'à minuit",
  "Jusqu'à 2h",
  "Après 2h",
] as const;

export const CLOSING_TIME_PRESETS = [
  { label: "Jusqu'à minuit", value: "00:00" },
  { label: "Jusqu'à 2h", value: "02:00" },
  { label: "Après 2h", value: "03:00" },
] as const;
