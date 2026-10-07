import { beforeEach, describe, expect, it } from "vitest";
import { getBookingAttribution, getBookingPrefillFromUrl } from "@/lib/booking-attribution";

describe("booking search context", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/salle/le-biz?type=Anniversaire&date=2026-11-14&guests=35&utm_source=google&utm_medium=cpc");
  });

  it("prefills the booking form from the search query", () => {
    expect(getBookingPrefillFromUrl()).toEqual({
      desiredDate: "2026-11-14",
      guestCount: "35",
      eventType: "Anniversaire",
    });
  });

  it("stores the landing page and acquisition source", () => {
    const attribution = getBookingAttribution("venue_detail_desktop");

    expect(attribution.landingPage).toBe("/salle/le-biz?type=Anniversaire&date=2026-11-14&guests=35&utm_source=google&utm_medium=cpc");
    expect(attribution.trafficSource).toBe("google");
    expect(attribution.utmMedium).toBe("cpc");
    expect(attribution.interactionSource).toBe("venue_detail_desktop");
  });
});
