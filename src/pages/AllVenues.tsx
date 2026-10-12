import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import Seo, { siteUrl } from "@/components/Seo";
import SiteFooter from "@/components/SiteFooter";
import VenueCodeSearch from "@/components/VenueCodeSearch";
import { useIsMobile } from "@/hooks/use-mobile";
import { fetchVenues } from "@/lib/supabase-data";
import { formatVenueCapacity, formatVenuePrice } from "@/lib/venue-display";

const AllVenues = () => {
  const isMobile = useIsMobile();
  const [showCodeSearch, setShowCodeSearch] = useState(false);
  const { data: venues = [], isLoading } = useQuery({
    queryKey: ["venues"],
    queryFn: fetchVenues,
  });
  const sortedVenues = useMemo(
    () => [...venues].sort((left, right) => left.title.localeCompare(right.title, "fr", { sensitivity: "base" })),
    [venues],
  );
  const groups = useMemo(() => {
    const result = new Map<string, typeof sortedVenues>();
    sortedVenues.forEach((venue) => {
      const letter = venue.title.trim().charAt(0).toLocaleUpperCase("fr") || "#";
      result.set(letter, [...(result.get(letter) ?? []), venue]);
    });
    return Array.from(result.entries());
  }, [sortedVenues]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title="Tous nos lieux événementiels à Paris | Wearevents"
        description="Découvrez tous les lieux proposés par Wearevents à Paris et en Île-de-France, classés par ordre alphabétique."
        path="/tous-nos-lieux"
        jsonLd={[{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Tous nos lieux événementiels",
          url: `${siteUrl}/tous-nos-lieux`,
          mainEntity: {
            "@type": "ItemList",
            itemListElement: sortedVenues.map((venue, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: venue.title,
              url: `${siteUrl}/salle/${venue.slug}`,
            })),
          },
        }, {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Accueil", item: siteUrl },
            { "@type": "ListItem", position: 2, name: "Tous nos lieux", item: `${siteUrl}/tous-nos-lieux` },
          ],
        }]}
      />
      {isMobile ? <MobileHeader onCodeSearch={() => setShowCodeSearch(true)} withBackground /> : <DesktopNav />}
      <main className="px-6 pb-24 pt-32">
        <div className="mx-auto max-w-7xl xl:px-2">
          <nav aria-label="Fil d'Ariane" className="mb-8 flex items-center gap-2 text-sm font-body text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Accueil</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="text-foreground">Tous nos lieux</span>
          </nav>
          <p className="font-body text-sm font-semibold text-primary">Annuaire</p>
          <h1 className="mt-3 max-w-4xl font-heading text-5xl font-semibold leading-none md:text-7xl">Tous nos lieux événementiels</h1>
          <p className="mt-6 max-w-2xl font-body text-lg leading-relaxed text-muted-foreground">
            Parcourez nos établissements à Paris et en Île-de-France, puis ouvrez leur fiche pour vérifier les capacités, les équipements et les conditions de privatisation.
          </p>
          {!isLoading && <p className="mt-4 font-body text-sm text-muted-foreground">{sortedVenues.length} lieux disponibles</p>}

          <div className="mt-14 space-y-14">
            {groups.map(([letter, letterVenues]) => (
              <section key={letter} aria-labelledby={`venues-${letter}`}>
                <h2 id={`venues-${letter}`} className="border-b border-border pb-3 font-heading text-4xl font-semibold">{letter}</h2>
                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {letterVenues.map((venue) => (
                    <Link
                      key={venue.id}
                      to={`/salle/${venue.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex min-h-28 items-center gap-4 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/50"
                    >
                      {venue.coverImage && (
                        <img
                          src={venue.coverImage}
                          alt=""
                          width={96}
                          height={96}
                          loading="lazy"
                          className="h-24 w-24 shrink-0 rounded-md object-cover"
                        />
                      )}
                      <span className="min-w-0">
                        <strong className="block font-heading text-xl leading-tight group-hover:text-primary">{venue.title}</strong>
                        <span className="mt-2 block font-body text-sm text-muted-foreground">{venue.city} · {formatVenueCapacity(venue)}</span>
                        <span className="mt-1 block font-body text-sm font-semibold text-primary">{formatVenuePrice(venue)}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter variant="dark" />
      {showCodeSearch && (
        <VenueCodeSearch onClose={() => setShowCodeSearch(false)} onVenueFound={() => setShowCodeSearch(false)} />
      )}
    </div>
  );
};

export default AllVenues;
