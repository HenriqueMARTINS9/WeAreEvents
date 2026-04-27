import type { Venue } from "@/types/venue";

const DEFAULT_WHATSAPP_PHONE = import.meta.env.VITE_WHATSAPP_PHONE ?? "";

export const buildWhatsAppUrl = (message: string, phone = DEFAULT_WHATSAPP_PHONE) => {
  const normalizedPhone = phone.replace(/[^\d]/g, "");
  const encodedMessage = encodeURIComponent(message);

  return normalizedPhone
    ? `https://wa.me/${normalizedPhone}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`;
};

export const buildVenueWhatsAppUrl = (venue: Venue) => {
  const url = typeof window !== "undefined" ? `${window.location.origin}/salle/${venue.slug}` : `/salle/${venue.slug}`;

  return buildWhatsAppUrl(
    `Bonjour, je souhaite avoir plus d'informations sur ${venue.title} à ${venue.city}. ${url}`,
  );
};
