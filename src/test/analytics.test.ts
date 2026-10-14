import { beforeEach, describe, expect, it, vi } from "vitest";

const getDataLayerCalls = () => (window.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>));

describe("Google Consent Mode conversions", () => {
  beforeEach(() => {
    vi.resetModules();
    window.localStorage.clear();
    delete window.dataLayer;
    delete window.gtag;
    document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]').forEach((script) => script.remove());
  });

  it("sends anonymous lead and Ads conversion signals when consent is denied", async () => {
    const { initializeGoogleTag, setGoogleConsentChoice, trackBookingRequestConversion } = await import("@/lib/analytics");
    initializeGoogleTag();
    setGoogleConsentChoice("denied");

    await trackBookingRequestConversion({
      id: "WAE-TEST",
      venueId: "venue-id",
      venueCode: "0123",
      venueTitle: "Lieu test",
      venueCity: "Paris",
      firstName: "Camille",
      lastName: "Durand",
      email: "client@example.com",
      phone: "0612345678",
      desiredDate: "2099-06-12",
      startTime: "18:00",
      endTime: "23:00",
      eventType: "Anniversaire",
      guestCount: 50,
      requestedSpaces: ["Salle principale"],
      status: "sent",
      createdAt: "2099-01-01T00:00:00.000Z",
    }, {
      email: "client@example.com",
      phone: "0612345678",
    });

    const calls = getDataLayerCalls();
    expect(calls).toContainEqual(expect.arrayContaining(["event", "generate_lead", expect.objectContaining({ send_to: "G-KKQD9XCBVN" })]));
    expect(calls).toContainEqual(expect.arrayContaining(["event", "conversion", expect.objectContaining({ send_to: "AW-10977680047/lGYbCPCwvZQdEK-1yPIo" })]));
    expect(calls.some((call) => call[0] === "set" && call[1] === "user_data")).toBe(false);
  });
});
