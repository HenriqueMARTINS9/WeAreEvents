import type { Venue } from "@/types/venue";
import { EVENT_TYPES } from "@/types/venue";

export const hasVenueRating = (venue: Pick<Venue, "rating" | "reviewCount">) =>
  Number.isFinite(venue.rating) && venue.rating > 0 && venue.reviewCount > 0;

export const formatVenueCapacity = (venue: Pick<Venue, "maxCapacity">, suffix = "personnes") =>
  venue.maxCapacity > 0 ? `Jusqu'à ${venue.maxCapacity} ${suffix}` : "Capacité sur demande";

export const formatVenuePrice = (
  venue: Pick<Venue, "priceAmount" | "priceType" | "pricingText" | "priceTier">,
) => {
  const amount = Number(venue.priceAmount ?? 0);

  if (amount > 0) {
    const formattedAmount = new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);

    if (venue.priceType === "per_person") return `À partir de ${formattedAmount} € / pers.`;
    if (venue.priceType === "minimum_spend") return `Minimum de consommation : ${formattedAmount} €`;
    return `Location à partir de ${formattedAmount} €`;
  }

  const tierLabels: Record<Venue["priceTier"], string> = {
    "€": "budget économique",
    "€€": "budget moyen",
    "€€€": "budget élevé",
    "€€€€": "budget premium",
  };

  return `${venue.priceTier} · ${tierLabels[venue.priceTier]}`;
};

const slugifyEvent = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/&/g, " et ")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const eventSeoPaths = new Map<string, string>(
  EVENT_TYPES.map((eventType) => [eventType, `/salle-${slugifyEvent(eventType)}-paris`]),
);

export const getVenueEventSeoLinks = (venue: Pick<Venue, "eventCategories">) =>
  venue.eventCategories
    .map((label) => ({ label, path: eventSeoPaths.get(label) }))
    .filter((item): item is { label: string; path: string } => Boolean(item.path));

export const getVenueImageAlt = (venue: Pick<Venue, "title" | "city">, index = 0) =>
  index === 0
    ? `Espace principal de ${venue.title} à ${venue.city}`
    : `Espace événementiel de ${venue.title} à ${venue.city}, photo ${index + 1}`;

export const getVenuePostalCode = (address: string) => address.match(/\b\d{5}\b/)?.[0] ?? "";

const getParisArrondissement = (address: string) => {
  const postalCode = getVenuePostalCode(address);
  if (postalCode === "75116") return 16;

  const arrondissement = postalCode.match(/^750(0[1-9]|1\d|20)$/)?.[1];
  return arrondissement ? Number(arrondissement) : null;
};

export const getVenueLocationSeoPath = (venue: Pick<Venue, "address" | "city">) => {
  const arrondissement = getParisArrondissement(venue.address);

  if (arrondissement !== null) {
    return `/location-salle-paris-${arrondissement === 1 ? "1er" : `${arrondissement}e`}`;
  }

  return venue.city.toLowerCase().includes("paris") ? "/location-salle-paris" : "/inspirations";
};

export const getVenueLocationLabel = (venue: Pick<Venue, "address" | "city">) => {
  const arrondissement = getParisArrondissement(venue.address);

  if (arrondissement === null) return venue.city || "Lieux";
  return `Paris ${arrondissement === 1 ? "1er" : `${arrondissement}e`}`;
};

const venueTypeSeoPaths: Record<string, string> = {
  Bar: "/bar-privatisable-paris",
  Restaurant: "/restaurant-privatisable-paris",
  Discothèque: "/discotheque-paris",
  Rooftop: "/rooftop-a-privatiser-paris",
  Villa: "/villa-evenement-paris",
  Loft: "/loft-evenementiel-paris",
};

export const getVenueTypeSeoPath = (venue: Pick<Venue, "venueTypes">) => {
  const venueType = venue.venueTypes.find((type) => venueTypeSeoPaths[type]);
  return venueType ? venueTypeSeoPaths[venueType] : "/location-salle-paris";
};

export const getSimilarVenues = (venue: Venue, venues: Venue[], limit = 4) => {
  const postalCode = getVenuePostalCode(venue.address);
  const normalizedCity = venue.city.trim().toLowerCase();

  return venues
    .filter((candidate) => candidate.id !== venue.id && candidate.active)
    .map((candidate) => {
      let score = 0;
      if (postalCode && getVenuePostalCode(candidate.address) === postalCode) score += 8;
      if (candidate.city.trim().toLowerCase() === normalizedCity) score += 4;
      score += candidate.venueTypes.filter((type) => venue.venueTypes.includes(type)).length * 3;
      score += candidate.eventCategories.filter((event) => venue.eventCategories.includes(event)).length;
      if (Math.abs(candidate.maxCapacity - venue.maxCapacity) <= 50) score += 2;
      return { candidate, score };
    })
    .sort((left, right) => right.score - left.score || right.candidate.reviewCount - left.candidate.reviewCount)
    .slice(0, limit)
    .map(({ candidate }) => candidate);
};
