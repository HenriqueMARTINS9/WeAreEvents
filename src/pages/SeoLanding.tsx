import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, MapPin, Search, ShieldCheck, Sparkles } from "lucide-react";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import NotFound from "@/pages/NotFound";
import Seo, { siteUrl } from "@/components/Seo";
import SiteFooter from "@/components/SiteFooter";
import VenueCodeSearch from "@/components/VenueCodeSearch";
import VenueGridCard from "@/components/VenueGridCard";
import {
  getPrimaryVenueImage,
  getRelatedSeoLandingPages,
  getSeoLandingPage,
} from "@/data/seo-landings";
import { fetchVenues, filterVenues } from "@/lib/supabase-data";
import { fetchSeoMetadataByPath } from "@/lib/seo-metadata";
import { useIsMobile } from "@/hooks/use-mobile";

const seededShuffle = <T,>(items: T[], seedValue: string) => {
  const shuffled = [...items];
  let seed = Array.from(seedValue).reduce((value, character) => ((value * 31) + character.charCodeAt(0)) >>> 0, 2166136261);

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const randomIndex = seed % (index + 1);
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
};

const SeoLanding = () => {
  const { seoSlug } = useParams();
  const page = getSeoLandingPage(seoSlug);
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [showCodeSearch, setShowCodeSearch] = useState(false);
  const { data: venues = [], isLoading: venuesLoading } = useQuery({ queryKey: ["venues"], queryFn: fetchVenues });
  const pagePath = page ? `/${page.slug}` : "/";
  const { data: seoMetadata } = useQuery({
    queryKey: ["seo-metadata", pagePath],
    queryFn: () => fetchSeoMetadataByPath(pagePath),
    enabled: Boolean(page),
    staleTime: 60_000,
  });

  const matchingVenues = useMemo(() => {
    if (!page) return [];

    return filterVenues(venues, {
      locationQuery: page.filters.locationQuery,
      eventType: page.filters.eventType,
      minGuests: page.filters.minGuests,
      guestRangeMin: page.filters.guestRangeMin,
      guestRangeMax: page.filters.guestRangeMax,
      maxCapacityGreaterThan: page.filters.maxCapacityGreaterThan,
      maxCapacityLimit: page.filters.maxCapacityLimit,
      priceTier: page.filters.priceTier,
      closingTimeFilter: page.filters.closingTimeFilter,
      venueTypes: page.filters.venueTypes,
      ambianceTypes: page.filters.ambianceTypes,
      privatizationTypes: page.filters.privatizationTypes,
      spaceTypes: page.filters.spaceTypes,
      optionFilters: page.filters.optionFilters,
      equipmentFilters: page.filters.equipmentFilters,
      guestDispositions: page.filters.guestDispositions,
      venueSlugs: page.filters.venueSlugs,
      strictTags: true,
    });
  }, [page, venues]);

  const pageNumber = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = 24;
  const orderedVenues = useMemo(() => seededShuffle(matchingVenues, page?.slug ?? "wearevents"), [matchingVenues, page?.slug]);
  const pageCount = Math.max(1, Math.ceil(orderedVenues.length / pageSize));
  const currentPage = Math.min(pageNumber, pageCount);
  const venuesToDisplay = orderedVenues.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (!page?.slug) return;

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [page?.slug, currentPage]);

  if (!page) return <NotFound />;
  const relatedPages = getRelatedSeoLandingPages(page);
  const image = getPrimaryVenueImage(venuesToDisplay);
  const intro = seoMetadata?.intro?.trim() || page.intro;
  const guide = seoMetadata?.guide?.trim() || "";
  const faq = seoMetadata?.faq?.length ? seoMetadata.faq : page.faq;
  const canonicalPath = currentPage > 1 ? `/${page.slug}?page=${currentPage}` : `/${page.slug}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title={page.title}
        description={page.description}
        path={canonicalPath}
        image={image}
        noindex={page.indexable === false || (!venuesLoading && matchingVenues.length < 3)}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: page.h1,
            description: page.description,
            url: `${siteUrl}${canonicalPath}`,
            mainEntity: {
              "@type": "ItemList",
              itemListElement: venuesToDisplay.map((venue, index) => ({
                "@type": "ListItem",
                position: index + 1,
                url: `${siteUrl}/salle/${venue.slug}`,
              })),
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
              },
            })),
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Accueil", item: siteUrl },
              { "@type": "ListItem", position: 2, name: page.h1, item: `${siteUrl}/${page.slug}` },
            ],
          },
        ]}
      />
      {isMobile ? (
        <MobileHeader onCodeSearch={() => setShowCodeSearch(true)} withBackground />
      ) : (
        <DesktopNav />
      )}

      <main className="pt-24">
        <nav aria-label="Fil d'Ariane" className="mx-auto flex max-w-7xl items-center gap-2 px-6 pb-4 font-body text-xs text-muted-foreground xl:px-8">
          <Link to="/" className="transition-colors hover:text-foreground">Accueil</Link>
          <span aria-hidden="true">/</span>
          <Link to="/inspirations" className="transition-colors hover:text-foreground">Inspirations</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="line-clamp-1 text-foreground">{page.h1}</span>
        </nav>
        <section className="bg-foreground px-6 py-20 text-primary-foreground">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end xl:px-2">
            <div>
              <p className="font-body text-sm font-semibold text-primary">{page.eyebrow}</p>
              <h1 className="mt-4 max-w-4xl font-heading text-5xl font-semibold leading-none md:text-6xl">
                {page.h1}
              </h1>
              <p className="mt-6 max-w-3xl font-body text-lg leading-relaxed text-primary-foreground/75">
                {intro}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to={page.searchUrl}
                  className="brand-primary-button inline-flex items-center gap-2 rounded-lg px-5 py-3 font-body text-sm font-semibold text-primary-foreground"
                >
                  Voir les lieux disponibles
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/recherche"
                  className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/20 px-5 py-3 font-body text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground hover:text-foreground"
                >
                  Recherche personnalisée
                  <Search className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-primary-foreground/10 bg-primary-foreground/[0.06] p-5">
              <div className="grid grid-cols-1 gap-4">
                {[
                  { icon: <ShieldCheck className="h-4 w-4" />, label: "Lieux vérifiés", value: "Sélection Wearevents" },
                  { icon: <MapPin className="h-4 w-4" />, label: "Zone", value: page.locationLabel },
                  { icon: <Sparkles className="h-4 w-4" />, label: "Besoin", value: page.intentLabel },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10 text-primary">
                      {item.icon}
                    </span>
                    <div>
                      <p className="font-body text-xs text-primary-foreground/50">{item.label}</p>
                      <p className="font-body text-sm font-semibold text-primary-foreground">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-7xl xl:px-2">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="font-body text-sm font-semibold text-primary">Sélection de lieux</p>
                <h2 className="mt-2 font-heading text-4xl font-semibold leading-tight">
                  {matchingVenues.length} lieu{matchingVenues.length !== 1 ? "x" : ""} à découvrir
                </h2>
              </div>
            </div>

            {venuesToDisplay.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {venuesToDisplay.map((venue) => (
                  <VenueGridCard key={venue.id} venue={venue} variant="search" />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card p-10 text-center">
                <p className="font-heading text-2xl font-semibold">Sélection en cours d'actualisation</p>
                <p className="mx-auto mt-3 max-w-xl font-body text-sm leading-relaxed text-muted-foreground">
                  Nous ajoutons régulièrement de nouveaux lieux. Lancez une recherche personnalisée pour recevoir des alternatives adaptées.
                </p>
              </div>
            )}

            {pageCount > 1 && (
              <nav aria-label="Pagination des lieux" className="mt-10 flex flex-wrap justify-center gap-2">
                {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
                  <Link
                    key={number}
                    to={number === 1 ? `/${page.slug}` : `/${page.slug}?page=${number}`}
                    aria-current={number === currentPage ? "page" : undefined}
                    className={`flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 font-body text-sm font-semibold transition-colors ${
                      number === currentPage
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background hover:border-foreground"
                    }`}
                  >
                    {number}
                  </Link>
                ))}
              </nav>
            )}
          </div>
        </section>

        {guide && (
          <section className="border-t border-border bg-background px-6 py-16">
            <div className="mx-auto max-w-4xl xl:px-2">
              <h2 className="font-heading text-4xl font-semibold leading-tight">
                Bien choisir votre lieu
              </h2>
              <div className="mt-6 whitespace-pre-line font-body leading-relaxed text-muted-foreground">
                {guide}
              </div>
            </div>
          </section>
        )}

        <section data-header-theme="light" className="bg-foreground px-6 py-16 text-primary-foreground">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 xl:grid-cols-[0.78fr_1.22fr] xl:px-2">
            <div>
              <p className="font-body text-sm font-semibold text-primary">Pourquoi passer par Wearevents ?</p>
              <h2 className="mt-3 font-heading text-4xl font-semibold leading-tight">
                Une demande simple, un retour qualifié.
              </h2>
              <p className="mt-5 font-body leading-relaxed text-primary-foreground/65">
                Nous centralisons les informations essentielles pour éviter les échanges inutiles : disponibilité, format, conditions de privatisation, horaires, restauration, musique et capacité.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                "Demande gratuite et sans engagement",
                "Lieux sélectionnés et informations vérifiées",
                "Accompagnement jusqu'à la confirmation",
              ].map((item) => (
                <div key={item} className="rounded-lg border border-primary-foreground/10 bg-primary-foreground/[0.06] p-5">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <p className="mt-4 font-body text-sm font-semibold leading-relaxed text-primary-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-4xl xl:px-2">
            <p className="font-body text-sm font-semibold text-primary">Questions fréquentes</p>
            <h2 className="mt-3 font-heading text-4xl font-semibold leading-tight">
              Avant de réserver
            </h2>
            <div className="mt-8 space-y-3">
              {faq.map((item) => (
                <article key={item.question} className="rounded-lg border border-border bg-card p-5">
                  <h3 className="font-body text-base font-semibold">{item.question}</h3>
                  <p className="mt-3 font-body text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {relatedPages.length > 0 && (
          <section className="bg-foreground px-6 py-16 text-primary-foreground">
            <div className="mx-auto max-w-7xl xl:px-2">
              <p className="font-body text-sm font-semibold text-primary">Recherches associées</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {relatedPages.map((relatedPage) => (
                  <Link
                    key={relatedPage.slug}
                    to={`/${relatedPage.slug}`}
                    className="rounded-full border border-primary-foreground/10 bg-primary-foreground/[0.06] px-3 py-1.5 font-body text-xs font-semibold text-primary-foreground/70 transition-colors hover:border-primary/50 hover:text-primary-foreground"
                  >
                    {relatedPage.h1}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <SiteFooter variant="light" />
      {showCodeSearch && (
        <VenueCodeSearch
          onClose={() => setShowCodeSearch(false)}
          onVenueFound={() => setShowCodeSearch(false)}
        />
      )}
    </div>
  );
};

export default SeoLanding;
