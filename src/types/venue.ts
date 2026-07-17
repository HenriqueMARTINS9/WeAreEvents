export interface VenueSpace {
  id: string;
  name: string;
  capacity: number;
  squareMeters?: number;
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
  "Soirée privée",
  "EVJF / EVG",
  "Baptême",
  "Communion",
  "Bar mitzvah",
  "Baby shower",
  "Gala",
  "Cocktail",
  "Séminaire",
  "Journée d'étude",
  "Team building",
  "Conférence",
  "Lancement de produit",
  "Afterwork",
  "Repas d'entreprise",
  "Fête de fin d'année",
  "Arbre de Noël",
  "Assemblée générale",
  "Salon professionnel",
  "Exposition",
  "Pop-up store",
  "Tournage",
  "Shooting",
  "Défilé",
  "Concert",
] as const;

export const VENUE_TYPES = [
  "Péniche",
  "Rooftop",
  "Discothèque",
  "Bar",
  "Salle de réception",
  "Salle de réunion",
  "Salle de conférence",
  "Espace extérieur",
  "Appartement",
  "Maison",
  "Loft",
  "Villa",
  "Restaurant",
  "Château",
  "Domaine",
  "Hôtel",
  "Jardin",
  "Terrasse",
  "Plage privée",
  "Hangar",
  "Showroom",
] as const;

export const SERVICES = [
  "TV",
  "Climatisation",
  "Accès PMR",
  "Micro",
  "Wi-Fi",
  "Terrasse",
  "Jardin",
  "Piscine",
  "Projecteur",
  "Écran",
  "Système son",
  "Mobilier",
  "Table de mixage",
  "Piste de danse",
  "Parking",
  "Vestiaire",
  "Loge",
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
] as const;

export const SPACE_TYPES = [
  "Espace clos",
  "Espace ouvert",
] as const;

export const OPTION_FEATURES = [
  "Possibilité de mettre sa musique",
  "Possibilité de danser",
  "Décoration personnalisable",
  "Jeux (baby-foot / ping-pong / etc.)",
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
