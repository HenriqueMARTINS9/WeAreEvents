import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, MapPin, Users, SlidersHorizontal, Tag, ShieldCheck } from "lucide-react";
import { searchVenues, mockVenues, getVenueByCode } from "@/data/venues";
import { EVENT_TYPES } from "@/types/venue";
import DesktopNav from "@/components/DesktopNav";
import FilterSelect from "@/components/FilterSelect";
import SiteFooter from "@/components/SiteFooter";
import SearchResultsMap from "@/components/SearchResultsMap";
import VenueGridCard from "@/components/VenueGridCard";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [eventType, setEventType] = useState(searchParams.get("type") || "");
  const [guests, setGuests] = useState(searchParams.get("guests") || "");
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [visibleVenueIds, setVisibleVenueIds] = useState<string[] | null>(null);
  const codeParam = searchParams.get("code");
  const cityOptions = [...new Set(mockVenues.map((v) => v.city))];

  useEffect(() => {
    if (codeParam) {
      const v = getVenueByCode(codeParam);
      if (v) {
        navigate(`/salle/${v.slug}`, { replace: true });
      }
    }
  }, [codeParam, navigate]);

  const filteredResults = useMemo(() => {
    return searchVenues({
      query: query || undefined,
      city: city || undefined,
      eventType: eventType || undefined,
      minGuests: guests ? parseInt(guests, 10) : undefined,
    });
  }, [query, city, eventType, guests]);

  useEffect(() => {
    setVisibleVenueIds(null);
  }, [filteredResults]);

  const results = useMemo(() => {
    if (visibleVenueIds === null) return filteredResults;

    const visibleSet = new Set(visibleVenueIds);
    return filteredResults.filter((venue) => visibleSet.has(venue.id));
  }, [filteredResults, visibleVenueIds]);

  const isMapZoneFilteringActive =
    visibleVenueIds !== null && results.length !== filteredResults.length;

  return (
    <div className="min-h-screen bg-background">
      <DesktopNav />

      <div className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-body font-semibold text-primary">
                <ShieldCheck className="w-3.5 h-3.5" />
                Lieux vérifiés
              </p>
              <h1 className="font-heading text-4xl md:text-6xl font-semibold leading-none mb-4">
                Trouvez votre prochaine adresse.
              </h1>
              <p className="max-w-2xl text-muted-foreground font-body leading-relaxed">
                Filtrez les lieux par ville, capacité et format d'événement, puis envoyez une demande qualifiée.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm font-body text-muted-foreground">
              <span className="font-semibold text-foreground">{results.length}</span>{" "}
              salle{results.length !== 1 ? "s" : ""} {isMapZoneFilteringActive ? "dans la zone" : "trouvée"}{results.length !== 1 ? "s" : ""}
              {isMapZoneFilteringActive && (
                <span className="ml-1 text-muted-foreground/80">sur {filteredResults.length}</span>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="mb-8 grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-3 luxury-shadow md:grid-cols-[1.2fr_1fr_1.35fr_0.8fr]">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted border border-border">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nom ou ville"
                className="min-w-0 flex-1 bg-transparent text-sm font-body focus:outline-none"
              />
            </div>
            <FilterSelect
              value={city}
              onChange={setCity}
              placeholder="Ville"
              emptyLabel="Toutes les villes"
              options={cityOptions}
              icon={<MapPin className="w-4 h-4" />}
              className="bg-muted"
            />
            <FilterSelect
              value={eventType}
              onChange={setEventType}
              placeholder="Type d'événement"
              emptyLabel="Tous les types"
              options={EVENT_TYPES}
              icon={<Tag className="w-4 h-4" />}
              className="bg-muted"
            />
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted border border-border">
              <Users className="w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                placeholder="Nombre d'invités"
                className="min-w-0 flex-1 bg-transparent text-sm font-body focus:outline-none"
              />
            </div>
          </div>

          <div className="mb-6 flex items-center gap-2 text-sm font-body text-muted-foreground">
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            {isMapZoneFilteringActive
              ? "Résultats ajustés à la zone actuellement visible sur la carte"
              : "Sélection affinée en temps réel"}
          </div>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
            <div className="order-2 xl:order-1">
              {results.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {results.map((venue) => (
                    <VenueGridCard key={venue.id} venue={venue} />
                  ))}
                </div>
              ) : filteredResults.length > 0 ? (
                <div className="rounded-lg border border-border bg-card py-20 text-center">
                  <p className="mb-2 font-heading text-2xl font-semibold">Aucune salle dans la zone affichée</p>
                  <p className="text-sm font-body text-muted-foreground">
                    Déplacez la carte ou cliquez sur “Recentrer” pour revoir l'ensemble des lieux correspondant à vos filtres.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-card py-20 text-center">
                  <p className="mb-2 font-heading text-2xl font-semibold">Aucune salle trouvée</p>
                  <p className="text-sm font-body text-muted-foreground">Essayez une autre ville, un autre format ou un volume d'invités différent.</p>
                </div>
              )}
            </div>

            <aside className="order-1 xl:order-2 xl:sticky xl:top-24 xl:self-start">
              <SearchResultsMap venues={filteredResults} onVisibleVenuesChange={setVisibleVenueIds} />
            </aside>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
};

export default SearchResults;
