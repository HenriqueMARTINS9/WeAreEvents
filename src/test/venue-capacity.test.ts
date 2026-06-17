import { describe, expect, it } from "vitest";
import { venueCanHostGuestCount, venueMaxCapacityFitsBounds, venueOverlapsGuestRange } from "@/lib/venue-capacity";

describe("venue capacity filtering", () => {
  const venue = { minCapacity: 30, maxCapacity: 100 };

  it("rejects a guest count below the venue minimum", () => {
    expect(venueCanHostGuestCount(venue, 20)).toBe(false);
  });

  it("accepts guest counts inside the venue range", () => {
    expect(venueCanHostGuestCount(venue, 30)).toBe(true);
    expect(venueCanHostGuestCount(venue, 75)).toBe(true);
    expect(venueCanHostGuestCount(venue, 100)).toBe(true);
  });

  it("rejects a guest count above the venue maximum", () => {
    expect(venueCanHostGuestCount(venue, 101)).toBe(false);
  });

  it("does not apply a capacity constraint when no count is provided", () => {
    expect(venueCanHostGuestCount(venue)).toBe(true);
  });

  it("matches capacity ranges that overlap the venue range", () => {
    expect(venueOverlapsGuestRange(venue, 20, 50)).toBe(true);
    expect(venueOverlapsGuestRange(venue, 50, 100)).toBe(true);
    expect(venueOverlapsGuestRange(venue, 101, 150)).toBe(false);
  });

  it("supports open-ended capacity ranges", () => {
    expect(venueOverlapsGuestRange(venue, undefined, 20)).toBe(false);
    expect(venueOverlapsGuestRange(venue, 80)).toBe(true);
    expect(venueOverlapsGuestRange(venue, 500)).toBe(false);
  });

  it("filters SEO capacity buckets by venue maximum capacity", () => {
    expect(venueMaxCapacityFitsBounds({ minCapacity: 10, maxCapacity: 20 }, undefined, 20)).toBe(true);
    expect(venueMaxCapacityFitsBounds({ minCapacity: 10, maxCapacity: 30 }, undefined, 20)).toBe(false);
    expect(venueMaxCapacityFitsBounds({ minCapacity: 30, maxCapacity: 50 }, 20, 50)).toBe(true);
    expect(venueMaxCapacityFitsBounds({ minCapacity: 30, maxCapacity: 100 }, 20, 50)).toBe(false);
    expect(venueMaxCapacityFitsBounds({ minCapacity: 100, maxCapacity: 600 }, 500)).toBe(true);
  });
});
