import { describe, expect, it } from "vitest";
import { seoLandingPages } from "@/data/seo-landings";
import { getIndexableSeoPages, getMatchingSeoVenues } from "@/data/seo-venue-filter.js";
import { getResponsiveImageProps } from "@/lib/responsive-image";

describe("SEO landing indexability", () => {
  it("indexes the cheap venue page even before applying the venue-count threshold", () => {
    const page = seoLandingPages.find((candidate) => candidate.slug === "salle-pas-chere-paris");

    expect(page).toMatchObject({ indexable: true, forceIndex: true });
    expect(getIndexableSeoPages([], [page])).toEqual([page]);
  });

  it("keeps duplicate secondary pages accessible but non-indexable", () => {
    const duplicateSlugs = [
      "salle-avec-terrasse-paris",
      "salle-avec-jardin-paris",
      "salle-ou-danser-paris",
      "salle-ouverte-apres-2h-paris",
      "salle-traiteur-externe-paris",
    ];

    duplicateSlugs.forEach((slug) => {
      expect(seoLandingPages.find((page) => page.slug === slug)?.indexable).toBe(false);
    });
  });

  it("matches student-event pages with bars that can host at least 100 guests", () => {
    const page = seoLandingPages.find((candidate) => candidate.slug === "salle-evenement-etudiant-paris");
    const venues = [
      { slug: "bar-etudiant", active: true, city: "Paris", address: "10 rue Test 75011 Paris", venue_types: ["Bar"], min_capacity: 20, max_capacity: 150 },
      { slug: "petit-bar", active: true, city: "Paris", address: "11 rue Test 75011 Paris", venue_types: ["Bar"], min_capacity: 10, max_capacity: 80 },
    ];

    expect(page).toBeDefined();
    expect(getMatchingSeoVenues(venues, page).map((venue) => venue.slug)).toEqual(["bar-etudiant"]);
  });
});

describe("responsive image URLs", () => {
  it("keeps Supabase Storage images on their original public URL", () => {
    const src = "https://project.supabase.co/storage/v1/object/public/wearevents-images/lieu.webp";

    expect(getResponsiveImageProps(src, "100vw")).toEqual({ src, sizes: "100vw" });
  });

  it("does not invent variants for legacy images", () => {
    expect(getResponsiveImageProps("https://cdn.example.com/lieu.webp", "100vw")).toEqual({
      src: "https://cdn.example.com/lieu.webp",
      sizes: "100vw",
    });
  });
});
