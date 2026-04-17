import { describe, it, expect } from "vitest";
import { getVenueByCode, getVenueLocationSuggestions, mockTikTokCodeMappings, mockVenues, searchVenues } from "@/data/venues";
import {
  buildBookingEmailTemplates,
  createBookingRequest,
  type BookingFormValues,
  validateBookingForm,
} from "@/lib/booking";

describe("venue code lookup", () => {
  it("maps primary TikTok codes to venue records", () => {
    expect(getVenueByCode("WE-ROOF01")?.slug).toBe("le-rooftop-etoile");
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
    requestedSpaces: ["roof-main"],
    message: "Cocktail dinatoire suivi d'une soirée privée.",
  };

  it("validates required booking fields", () => {
    const errors = validateBookingForm({ ...validForm, email: "camille", guestCount: "9999" }, venue);

    expect(errors.email).toBe("Indiquez une adresse email valide.");
    expect(errors.guestCount).toContain("Ce lieu accueille");
  });

  it("creates a request with the selected venue prefilled", () => {
    const request = createBookingRequest(validForm, venue);

    expect(request.venueId).toBe(venue.id);
    expect(request.venueTitle).toBe(venue.title);
    expect(request.venueCode).toBe(venue.venueCode);
    expect(request.startTime).toBe("18:00");
    expect(request.requestedSpaces).toContain("Terrasse principale");
    expect(request.status).toBe("sent");
  });

  it("prepares customer, admin, and venue email templates", () => {
    const request = createBookingRequest(validForm, venue);
    const templates = buildBookingEmailTemplates(request, venue);

    expect(templates.customerConfirmation.to).toBe(validForm.email);
    expect(templates.adminNotification.to).toBe("reservations@wearevents.fr");
    expect(templates.venueContactNotification.to).toBe(venue.contactEmail);
    expect(templates.customerConfirmation.text).toContain(venue.title);
    expect(templates.venueContactNotification.text).toContain(request.phone);
    expect(templates.postEventReviewFollowUp.to).toBe(validForm.email);
    expect(templates.postEventReviewFollowUp.scheduledFor).toContain("2099-06-13");
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
