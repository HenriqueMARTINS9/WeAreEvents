import { describe, it, expect } from "vitest";
import { getVenueByCode, getVenueLocationSuggestions, mockTikTokCodeMappings, mockVenues, searchVenues } from "@/data/venues";
import {
  buildBookingEmailTemplates,
  createBookingRequest,
  type BookingFormValues,
  validateBookingForm,
} from "@/lib/booking";
import { filterVenues } from "@/lib/supabase-data";
import { formatVenuePrice, getVenueEventSeoLinks } from "@/lib/venue-display";

describe("venue code lookup", () => {
  it("maps primary TikTok codes to venue records", () => {
    expect(getVenueByCode("1001")?.slug).toBe("le-rooftop-etoile");
  });

  it("maps campaign alias codes to venue records", () => {
    expect(getVenueByCode("TT-PARIS-ROOF")?.slug).toBe("le-rooftop-etoile");
  });

  it("accepts forgiving code formatting", () => {
    expect(getVenueByCode("tt paris roof")?.slug).toBe("le-rooftop-etoile");
  });

  it("keeps mock TikTok mappings connected to active venues", () => {
    expect(mockTikTokCodeMappings.every((mapping) => Boolean(getVenueByCode(mapping.code)))).toBe(true);
  });

  it("supports searching venues by postal code", () => {
    expect(searchVenues({ locationQuery: "75008" }).map((venue) => venue.slug)).toContain("le-rooftop-etoile");
  });

  it("builds city suggestions with matching postal codes", () => {
    const parisSuggestion = getVenueLocationSuggestions().find((item) => item.city === "Paris");

    expect(parisSuggestion?.postalCodes).toContain("75008");
  });

  it("only matches event categories explicitly selected in the back office", () => {
    const results = filterVenues(mockVenues, { eventType: "Repas d'entreprise" });

    expect(results).toHaveLength(0);
  });
});

describe("booking workflow", () => {
  const venue = mockVenues[0];
  const validForm: BookingFormValues = {
    firstName: "Camille",
    lastName: "Durand",
    email: "camille@example.com",
    phone: "+33 6 12 34 56 78",
    desiredDate: "2099-06-12",
    startTime: "18:00",
    endTime: "23:30",
    guestCount: "120",
    eventType: "Gala",
    budgetRange: "30–50 € / pers.",
    requestedSpaces: ["roof-main"],
    message: "Cocktail dinatoire suivi d'une soirée privée.",
  };

  it("validates required booking fields", () => {
    const errors = validateBookingForm({ ...validForm, email: "camille", guestCount: "9999", budgetRange: "" }, venue);

    expect(errors.email).toBe("Indiquez une adresse email valide.");
    expect(errors.guestCount).toContain("Ce lieu accueille");
    expect(errors.budgetRange).toBe("Sélectionnez un budget approximatif.");
  });

  it("accepts an end time after midnight", () => {
    const errors = validateBookingForm({ ...validForm, startTime: "22:00", endTime: "02:00" }, venue);

    expect(errors.startTime).toBeUndefined();
    expect(errors.endTime).toBeUndefined();
  });

  it("creates a request with the selected venue prefilled", () => {
    const request = createBookingRequest(validForm, venue);

    expect(request.venueId).toBe(venue.id);
    expect(request.venueTitle).toBe(venue.title);
    expect(request.venueCode).toBe(venue.venueCode);
    expect(request.startTime).toBe("18:00");
    expect(request.budgetRange).toBe("30–50 € / pers.");
    expect(request.venueResponseToken).toMatch(/^[0-9a-f-]{36}$/i);
    expect(request.requestedSpaces).toContain("Terrasse principale");
    expect(request.status).toBe("sent");
  });

  it("prepares customer, admin, and venue email templates", () => {
    const request = createBookingRequest(validForm, venue);
    const templates = buildBookingEmailTemplates(request, venue);

    expect(templates.customerConfirmation.to).toBe(validForm.email);
    expect(templates.customerConfirmation.subject).toBe("Nous avons bien reçu votre demande");
    expect(templates.adminNotification.to).toBe("reservation@wearevents.fr");
    expect(templates.venueContactNotification.to).toBe(venue.contactEmail);
    expect(templates.venueContactNotification.subject).toBe(`Demande Wearevents – ${venue.title} – ven. 12/06, 120 pers.`);
    expect(templates.venueContactNotification.preview).toBe("Gala · 120 invités");
    expect(templates.customerConfirmation.text).toContain(venue.title);
    expect(templates.customerConfirmation.text).toContain("Votre demande pour");
    expect(templates.customerConfirmation.text).toContain("Vous recevrez un retour personnalisé sous 24h ouvrées.");
    expect(templates.customerConfirmation.text).not.toContain(request.email);
    expect(templates.customerConfirmation.text).not.toContain(request.phone);
    expect(templates.adminNotification.text).toContain(request.phone);
    expect(templates.adminNotification.text).toContain("Budget approximatif : 30–50 € / pers.");
    expect(templates.venueContactNotification.text).toContain("Un client souhaite privatiser votre établissement");
    expect(templates.venueContactNotification.text).toContain("Date : 12 juin 2099");
    expect(templates.venueContactNotification.text).toContain("Horaires : 18:00 – 23:30");
    expect(templates.venueContactNotification.text).toContain("Espace demandé : Terrasse principale");
    expect(templates.venueContactNotification.text).toContain("Budget approximatif : 30–50 € / pers.");
    expect(templates.venueContactNotification.text).toContain(`Référence : ${request.id}`);
    expect(templates.venueContactNotification.text).toContain("Wearevents s'occupe du client");
    expect(templates.venueContactNotification.text).toContain("Merci de nous répondre sous 24 h");
    expect(templates.venueContactNotification.text).toContain("dans le cadre de notre partenariat");
    expect(templates.venueContactNotification.text).toContain("Anselme – Wearevents");
    expect(templates.venueContactNotification.text).toContain("reservation@wearevents.fr");
    expect(templates.venueContactNotification.text).not.toContain(request.phone);
    expect(templates.venueContactNotification.text).not.toContain(request.email);
    expect(templates.postEventReviewFollowUp.to).toBe(validForm.email);
    expect(templates.postEventReviewFollowUp.scheduledFor).toContain("2099-06-14");
    expect(templates.postEventReviewFollowUp.text).toContain("https://g.page/r/Cb3yTIoVykRuEBM/review");
  });

  it("keeps map coordinates available for every active venue", () => {
    expect(
      mockVenues.every(
        (item) =>
          Number.isFinite(item.location.lat) &&
          Number.isFinite(item.location.lng),
      ),
    ).toBe(true);
  });
});

describe("venue commercial information", () => {
  const venue = mockVenues[0];

  it("shows the price tier when no exact price is available", () => {
    expect(formatVenuePrice({ ...venue, priceAmount: undefined, priceTier: "€€" })).toBe("€€ · budget moyen");
  });

  it("links explicit event categories to their SEO pages", () => {
    expect(getVenueEventSeoLinks({ eventCategories: ["Anniversaire", "Séminaire"] })).toEqual([
      { label: "Anniversaire", path: "/salle-anniversaire-paris" },
      { label: "Séminaire", path: "/salle-seminaire-paris" },
    ]);
  });
});
