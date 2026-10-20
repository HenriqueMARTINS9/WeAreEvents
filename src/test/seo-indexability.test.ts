import { describe, expect, it } from "vitest";
import { seoLandingPages } from "@/data/seo-landings";
import { getIndexableSeoPages } from "@/data/seo-venue-filter.js";
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
});

describe("responsive image URLs", () => {
  it("builds a srcset for generated storage variants", () => {
    const props = getResponsiveImageProps(
      "https://project.supabase.co/storage/v1/object/public/wearevents-images/lieu.webp",
      "100vw",
    );

    expect(props.src).toContain("/storage/v1/render/image/public/wearevents-images/lieu.webp?width=1200&quality=76");
    expect(props.srcSet).toContain("width=480&quality=76 480w");
    expect(props.srcSet).toContain("width=800&quality=76 800w");
    expect(props.srcSet).toContain("width=1200&quality=76 1200w");
  });

  it("does not invent variants for legacy images", () => {
    expect(getResponsiveImageProps("https://cdn.example.com/lieu.webp", "100vw")).toEqual({
      src: "https://cdn.example.com/lieu.webp",
      sizes: "100vw",
    });
  });
});
