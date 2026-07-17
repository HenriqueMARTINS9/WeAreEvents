import { EVENT_TYPES } from "@/types/venue";
import type { BookingEmailTemplates, BookingRequest, Venue } from "@/types/venue";
import { supabase } from "@/lib/supabase";

export interface BookingFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  desiredDate: string;
  startTime: string;
  endTime: string;
  guestCount: string;
  eventType: string;
  requestedSpaces: string[];
  message: string;
}

export type BookingFieldErrors = Partial<Record<keyof BookingFormValues, string>>;

export interface BookingSubmissionResult {
  request: BookingRequest;
  emails: BookingEmailTemplates;
}

const ADMIN_EMAIL = "reservations@wearevents.fr";
const WEAREVENTS_GOOGLE_REVIEW_URL = "https://g.page/r/Cb3yTIoVykRuEBM/review";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+()\d\s.-]{8,}$/;

const trimForm = (form: BookingFormValues): BookingFormValues => ({
  firstName: form.firstName.trim(),
  lastName: form.lastName.trim(),
  email: form.email.trim().toLowerCase(),
  phone: form.phone.trim(),
  desiredDate: form.desiredDate,
  startTime: form.startTime,
  endTime: form.endTime,
  guestCount: form.guestCount.trim(),
  eventType: form.eventType,
  requestedSpaces: form.requestedSpaces,
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

const getRequestedCapacity = (requestedSpaces: string[], venue: Venue) => {
  if (requestedSpaces.length === 0) return venue.maxCapacity;
  return venue.spaces
    .filter((space) => requestedSpaces.includes(space.id))
    .reduce((total, space) => total + space.capacity, 0);
};

const buildReviewFollowUpDate = (dateValue: string) => {
  const nextDay = new Date(`${dateValue}T10:00:00`);
  nextDay.setDate(nextDay.getDate() + 1);
  return nextDay.toISOString();
};

const formatEventTypePhrase = (eventType: string) => {
  if (eventType === "Soirée privée") return "une soirée privée";
  if (eventType === "Repas d'entreprise") return "un repas d'entreprise";
  return `un ${eventType.toLowerCase()}`;
};

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

  if (!values.startTime) {
    errors.startTime = "Indiquez un horaire de début.";
  }

  if (!values.endTime) {
    errors.endTime = "Indiquez un horaire de fin.";
  }

  if (!values.guestCount) {
    errors.guestCount = "Indiquez le nombre d'invités.";
  } else if (!Number.isInteger(guestCount) || guestCount <= 0) {
    errors.guestCount = "Indiquez un nombre d'invités valide.";
  } else if (guestCount < venue.minCapacity || guestCount > venue.maxCapacity) {
    errors.guestCount = `Ce lieu accueille entre ${venue.minCapacity} et ${venue.maxCapacity} invités.`;
  } else if (guestCount > getRequestedCapacity(values.requestedSpaces, venue)) {
    errors.guestCount = `Les espaces sélectionnés accueillent jusqu'à ${getRequestedCapacity(values.requestedSpaces, venue)} invités.`;
  }

  if (values.requestedSpaces.length === 0) {
    errors.requestedSpaces = "Sélectionnez au moins un espace.";
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
    startTime: values.startTime,
    endTime: values.endTime,
    guestCount: Number(values.guestCount),
    eventType: values.eventType,
    requestedSpaces: venue.spaces
      .filter((space) => values.requestedSpaces.includes(space.id))
      .map((space) => space.name),
    message: values.message || undefined,
    status: "sent",
    createdAt: new Date().toISOString(),
  };
};

export const buildBookingEmailTemplates = (request: BookingRequest, venue: Venue): BookingEmailTemplates => {
  const customerName = `${request.firstName} ${request.lastName}`;
  const formattedDate = formatDate(request.desiredDate);
  const guests = formatGuestCount(request.guestCount);
  const eventTypePhrase = formatEventTypePhrase(request.eventType);
  const message = request.message || "Aucun message complémentaire.";
  const requestedSpaces = request.requestedSpaces.join(", ");
  const platformReviewUrl = WEAREVENTS_GOOGLE_REVIEW_URL;

  return {
    customerConfirmation: {
      to: request.email,
      subject: "Nous avons bien reçu votre demande",
      preview: "Notre équipe vérifie actuellement la disponibilité du lieu.",
      text: `Bonjour ${request.firstName},

Votre demande pour ${venue.title} a bien été transmise à notre équipe.

Nous prenons maintenant contact avec le lieu afin de vérifier :

les disponibilités,
les conditions de privatisation,
et les éléments nécessaires à votre projet.

Vous recevrez un retour personnalisé sous 24h ouvrées.

— L'équipe Wearevents`,
    },
    adminNotification: {
      to: ADMIN_EMAIL,
      subject: `Nouvelle demande ${request.id} · ${venue.title}`,
      preview: `${customerName} souhaite ${venue.title} le ${formattedDate}.`,
      text: `Nouvelle demande de disponibilité

Référence : ${request.id}
Lieu : ${venue.title}
Ville : ${venue.city}
Adresse : ${venue.address}
Contact : ${customerName}
Email : ${request.email}
Téléphone : ${request.phone}
Date souhaitée : ${formattedDate}
Horaires : ${request.startTime} - ${request.endTime}
Espaces demandés : ${requestedSpaces}
Format : ${request.eventType}
Nombre d'invités : ${guests}
Message : ${message}

Action recommandée : vérifier la disponibilité, qualifier le besoin et répondre sous 24h.`,
    },
    venueContactNotification: {
      to: venue.contactEmail,
      subject: `Nouvelle demande reçue pour ${venue.title}`,
      preview: `${request.eventType} · ${guests}`,
      text: `Bonjour,

Un client souhaite privatiser votre établissement pour ${eventTypePhrase} réunissant environ ${request.guestCount} invités.

Afin que nous puissions lui adresser une proposition rapidement, merci de nous confirmer :

la disponibilité du lieu,
les modalités de privatisation,
et les conditions applicables.

Nous restons disponibles si des précisions sont nécessaires.

— L'équipe Wearevents`,
    },
    postEventReviewFollowUp: {
      to: request.email,
      subject: `Votre retour après ${venue.title}`,
      preview: "Un mot sur le lieu et sur Wearevents nous serait précieux.",
      scheduledFor: buildReviewFollowUpDate(request.desiredDate),
      text: `Bonjour ${request.firstName},

Nous espérons que votre événement chez ${venue.title} s'est parfaitement déroulé.

Si vous avez apprécié l'expérience, vous pouvez nous aider en laissant deux avis :

Avis Google du lieu : ${venue.googleReviewUrl}
Avis Wearevents : ${platformReviewUrl}

Quelques lignes suffisent et aident autant l'établissement que les prochains organisateurs.

Merci encore pour votre confiance,
L'équipe Wearevents`,
    },
  };
};

const sendBookingEmails = async (request: BookingRequest, emails: BookingEmailTemplates) => {
  if (!supabase) {
    throw new Error("Supabase n'est pas configuré pour envoyer la demande.");
  }

  const { error } = await supabase.functions.invoke("send-booking-request", {
    body: { request, emails },
  });

  if (error) {
    throw new Error(error.message || "L'envoi des emails a échoué.");
  }
};

export const submitBookingRequest = async (
  form: BookingFormValues,
  venue: Venue,
): Promise<BookingSubmissionResult> => {
  const errors = validateBookingForm(form, venue);
  if (Object.keys(errors).length > 0) {
    throw new Error("VALIDATION_ERROR");
  }

  const request = createBookingRequest(form, venue);
  const emails = buildBookingEmailTemplates(request, venue);
  await sendBookingEmails(request, emails);

  return { request, emails };
};
