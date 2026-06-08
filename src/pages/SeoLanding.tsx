import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
import { useIsMobile } from "@/hooks/use-mobile";

const shuffleVenues = <T,>(items: T[]) => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
};

const SeoLanding = () => {
  const { seoSlug } = useParams();
  const page = getSeoLandingPage(seoSlug);
  const isMobile = useIsMobile();
  const [showCodeSearch, setShowCodeSearch] = useState(false);
  const { data: venues = [] } = useQuery({ queryKey: ["venues"], queryFn: fetchVenues });

  const matchingVenues = useMemo(() => {
    if (!page) return [];

    return filterVenues(venues, {
      locationQuery: page.filters.locationQuery,
      eventType: page.filters.eventType,
      minGuests: page.filters.minGuests,
      guestRangeMin: page.filters.guestRangeMin,
      guestRangeMax: page.filters.guestRangeMax,
      venueTypes: page.filters.venueTypes,
      ambianceTypes: page.filters.ambianceTypes,
      privatizationTypes: page.filters.privatizationTypes,
      spaceTypes: page.filters.spaceTypes,
      optionFilters: page.filters.optionFilters,
    });
  }, [page, venues]);

  const fallbackVenues = useMemo(() => {
    if (!page || matchingVenues.length > 0) return [];

    return filterVenues(venues, {
      locationQuery: page.locationLabel.startsWith("Paris") ? "Paris" : page.filters.locationQuery,
      minGuests: page.filters.minGuests,
      guestRangeMin: page.filters.guestRangeMin,
      guestRangeMax: page.filters.guestRangeMax,
    });
  }, [matchingVenues.length, page, venues]);

  const venuesToDisplay = useMemo(
    () => shuffleVenues(matchingVenues.length ? matchingVenues : fallbackVenues).slice(0, 12),
    [fallbackVenues, matchingVenues, page?.slug],
  );

  if (!page) return <NotFound />;
  const relatedPages = getRelatedSeoLandingPages(page);
  const image = getPrimaryVenueImage(venuesToDisplay);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title={page.title}
        description={page.description}
        path={`/${page.slug}`}
        image={image}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: page.h1,
            description: page.description,
            url: `${siteUrl}/${page.slug}`,
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
            mainEntity: page.faq.map((item) => ({
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
        <section className="bg-foreground px-6 py-20 text-primary-foreground">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end xl:px-2">
            <div>
              <p className="font-body text-sm font-semibold text-primary">{page.eyebrow}</p>
              <h1 className="mt-4 max-w-4xl font-heading text-5xl font-semibold leading-none md:text-6xl">
                {page.h1}
              </h1>
              <p className="mt-6 max-w-3xl font-body text-lg leading-relaxed text-primary-foreground/75">
                {page.intro}
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
                  {matchingVenues.length || fallbackVenues.length} lieu{(matchingVenues.length || fallbackVenues.length) !== 1 ? "x" : ""} à découvrir
                </h2>
              </div>
              <p className="max-w-xl font-body text-sm leading-relaxed text-muted-foreground">
                Les résultats sont filtrés selon cette page SEO. Vous pouvez affiner ensuite par capacité, prix, ambiance ou équipements.
              </p>
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
          </div>
        </section>

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
              {page.faq.map((item) => (
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
