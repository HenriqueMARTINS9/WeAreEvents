import { EVENT_TYPES } from "@/types/venue";
import type { BookingEmailTemplates, BookingRequest, Venue } from "@/types/venue";

export interface BookingFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  desiredDate: string;
  guestCount: string;
  eventType: string;
  message: string;
}

export type BookingFieldErrors = Partial<Record<keyof BookingFormValues, string>>;

export interface BookingSubmissionResult {
  request: BookingRequest;
  emails: BookingEmailTemplates;
}

const ADMIN_EMAIL = "reservations@wearevents.fr";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+()\d\s.-]{8,}$/;

const trimForm = (form: BookingFormValues): BookingFormValues => ({
  firstName: form.firstName.trim(),
  lastName: form.lastName.trim(),
  email: form.email.trim().toLowerCase(),
  phone: form.phone.trim(),
  desiredDate: form.desiredDate,
  guestCount: form.guestCount.trim(),
  eventType: form.eventType,
  message: form.message.trim(),
});

const isPastDate = (dateValue: string) => {
  const date = new Date(`${dateValue}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Number.isNaN(date.getTime()) || date < today;
};

const formatDate = (dateValue: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${dateValue}T00:00:00`));

const formatGuestCount = (guestCount: number) => `${guestCount} invité${guestCount > 1 ? "s" : ""}`;

const buildRequestId = () => `WAE-${Date.now().toString(36).toUpperCase()}`;

export const validateBookingForm = (form: BookingFormValues, venue: Venue): BookingFieldErrors => {
  const values = trimForm(form);
  const errors: BookingFieldErrors = {};
  const guestCount = Number(values.guestCount);

  if (!values.firstName) errors.firstName = "Indiquez votre prénom.";
  if (!values.lastName) errors.lastName = "Indiquez votre nom.";

  if (!values.email) {
    errors.email = "Indiquez votre adresse email.";
  } else if (!emailPattern.test(values.email)) {
    errors.email = "Indiquez une adresse email valide.";
  }

  if (!values.phone) {
    errors.phone = "Indiquez un numéro de téléphone.";
  } else if (!phonePattern.test(values.phone)) {
    errors.phone = "Indiquez un numéro de téléphone valide.";
  }

  if (!values.desiredDate) {
    errors.desiredDate = "Sélectionnez une date souhaitée.";
  } else if (isPastDate(values.desiredDate)) {
    errors.desiredDate = "Sélectionnez une date à venir.";
  }

  if (!values.guestCount) {
    errors.guestCount = "Indiquez le nombre d'invités.";
  } else if (!Number.isInteger(guestCount) || guestCount <= 0) {
    errors.guestCount = "Indiquez un nombre d'invités valide.";
  } else if (guestCount < venue.minCapacity || guestCount > venue.maxCapacity) {
    errors.guestCount = `Ce lieu accueille entre ${venue.minCapacity} et ${venue.maxCapacity} invités.`;
  }

  if (!values.eventType) {
    errors.eventType = "Sélectionnez un type d'événement.";
  } else if (!EVENT_TYPES.includes(values.eventType as (typeof EVENT_TYPES)[number])) {
    errors.eventType = "Sélectionnez un type d'événement proposé.";
  }

  if (values.message.length > 900) {
    errors.message = "Votre message doit rester sous 900 caractères.";
  }

  return errors;
};

export const createBookingRequest = (form: BookingFormValues, venue: Venue): BookingRequest => {
  const values = trimForm(form);

  return {
    id: buildRequestId(),
    venueId: venue.id,
    venueCode: venue.venueCode,
    venueTitle: venue.title,
    venueCity: venue.city,
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    phone: values.phone,
    desiredDate: values.desiredDate,
    guestCount: Number(values.guestCount),
    eventType: values.eventType,
    message: values.message || undefined,
    status: "sent",
    createdAt: new Date().toISOString(),
  };
};

export const buildBookingEmailTemplates = (request: BookingRequest, venue: Venue): BookingEmailTemplates => {
  const customerName = `${request.firstName} ${request.lastName}`;
  const formattedDate = formatDate(request.desiredDate);
  const guests = formatGuestCount(request.guestCount);
  const message = request.message || "Aucun message complémentaire.";

  return {
    customerConfirmation: {
      to: request.email,
      subject: `Votre demande pour ${venue.title}`,
      preview: "Nous avons bien reçu votre demande de disponibilité.",
      text: `Bonjour ${request.firstName},

Votre demande pour ${venue.title} a bien été reçue.

Récapitulatif
Lieu : ${venue.title}, ${venue.city}
Code TikTok : ${venue.venueCode}
Date souhaitée : ${formattedDate}
Format : ${request.eventType}
Nombre d'invités : ${guests}

Notre équipe vérifie la disponibilité et les conditions du lieu. Vous recevrez un retour qualifié sous 24h ouvrées.

Merci pour votre confiance,
L'équipe WeAreEvents`,
    },
    adminNotification: {
      to: ADMIN_EMAIL,
      subject: `Nouvelle demande ${request.id} · ${venue.title}`,
      preview: `${customerName} souhaite ${venue.title} le ${formattedDate}.`,
      text: `Nouvelle demande de disponibilité

Référence : ${request.id}
Lieu : ${venue.title}
Code TikTok : ${venue.venueCode}
Ville : ${venue.city}
Contact : ${customerName}
Email : ${request.email}
Téléphone : ${request.phone}
Date souhaitée : ${formattedDate}
Format : ${request.eventType}
Nombre d'invités : ${guests}
Message : ${message}

Action recommandée : vérifier la disponibilité, qualifier le besoin et répondre sous 24h.`,
    },
    venueContactNotification: {
      to: venue.contactEmail,
      subject: `Demande qualifiée WeAreEvents · ${formattedDate}`,
      preview: `${request.eventType} pour ${guests}, demande reçue via WeAreEvents.`,
      text: `Bonjour,

Nous vous transmettons une demande qualifiée pour ${venue.title}.

Référence WeAreEvents : ${request.id}
Date souhaitée : ${formattedDate}
Format : ${request.eventType}
Nombre d'invités : ${guests}
Client : ${customerName}
Email : ${request.email}
Téléphone : ${request.phone}
Message : ${message}

Merci de nous confirmer la disponibilité et les conditions applicables afin que nous puissions accompagner le client avec le niveau de service attendu.

L'équipe WeAreEvents`,
    },
  };
};

export const submitBookingRequest = async (
  form: BookingFormValues,
  venue: Venue,
): Promise<BookingSubmissionResult> => {
  const errors = validateBookingForm(form, venue);
  if (Object.keys(errors).length > 0) {
    throw new Error("VALIDATION_ERROR");
  }

  await new Promise((resolve) => setTimeout(resolve, 900));

  const request = createBookingRequest(form, venue);
  const emails = buildBookingEmailTemplates(request, venue);

  return { request, emails };
};
