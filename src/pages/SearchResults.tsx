import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Clock3, Euro, MapPin, Music2, SlidersHorizontal, Tag, UtensilsCrossed, Users, ShieldCheck } from "lucide-react";
import { fetchVenues, filterVenues, findVenueByCode, getVenueLocationSuggestionsFromVenues } from "@/lib/supabase-data";
import { AMBIANCE_TYPES, EVENT_TYPES, EXTERNAL_OPTIONS, PRICE_TIERS } from "@/types/venue";
import DesktopNav from "@/components/DesktopNav";
import FilterSelect from "@/components/FilterSelect";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import SiteFooter from "@/components/SiteFooter";
import SearchResultsMap from "@/components/SearchResultsMap";
import VenueGridCard from "@/components/VenueGridCard";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [locationQuery, setLocationQuery] = useState(searchParams.get("location") || searchParams.get("city") || "");
  const [eventType, setEventType] = useState(searchParams.get("type") || "");
  const [guests, setGuests] = useState(searchParams.get("guests") || "");
  const [priceTier, setPriceTier] = useState(searchParams.get("price") || "");
  const [closingFilter, setClosingFilter] = useState(searchParams.get("closing") || "");
  const [ambianceType, setAmbianceType] = useState(searchParams.get("ambiance") || "");
  const [externalOption, setExternalOption] = useState(searchParams.get("external") || "");
  const [visibleVenueIds, setVisibleVenueIds] = useState<string[] | null>(null);
  const codeParam = searchParams.get("code");
  const { data: venues = [] } = useQuery({ queryKey: ["venues"], queryFn: fetchVenues });
  const locationOptions = getVenueLocationSuggestionsFromVenues(venues);

  useEffect(() => {
    if (codeParam) {
      findVenueByCode(codeParam).then((venue) => {
        if (venue) {
          navigate(`/salle/${venue.slug}`, { replace: true });
        }
      });
    }
  }, [codeParam, navigate]);

  const filteredResults = useMemo(() => {
    return filterVenues(venues, {
      locationQuery: locationQuery || undefined,
      eventType: eventType || undefined,
      minGuests: guests ? parseInt(guests, 10) : undefined,
      priceTier: priceTier || undefined,
      closesAfterTwo: closingFilter === "Après 2h",
      ambianceType: ambianceType || undefined,
      externalOption: externalOption || undefined,
    });
  }, [locationQuery, eventType, guests, priceTier, closingFilter, ambianceType, externalOption, venues]);

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
                Filtrez les lieux par ville ou code postal, capacité et format d'événement, puis envoyez une demande qualifiée.
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
          <div className="mb-8 grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-3 luxury-shadow lg:grid-cols-3 xl:grid-cols-[minmax(0,1.25fr)_repeat(6,minmax(0,0.86fr))] lg:items-stretch">
            <LocationAutocomplete
              value={locationQuery}
              onChange={setLocationQuery}
              options={locationOptions}
              placeholder="Ville ou code postal"
              className="h-12 bg-muted"
              icon={<MapPin className="w-4 h-4" />}
            />
            <FilterSelect
              value={eventType}
              onChange={setEventType}
              placeholder="Type d'événement"
              emptyLabel="Tous les types"
              options={EVENT_TYPES}
              icon={<Tag className="w-4 h-4" />}
              className="h-12 bg-muted"
            />
            <div className="flex h-12 items-center gap-2 rounded-lg border border-border bg-muted px-3">
              <Users className="w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                placeholder="Nombre d'invités"
                className="min-w-0 flex-1 bg-transparent text-sm font-body focus:outline-none"
              />
            </div>
            <FilterSelect
              value={priceTier}
              onChange={setPriceTier}
              placeholder="Prix"
              emptyLabel="Tous les prix"
              options={PRICE_TIERS}
              icon={<Euro className="w-4 h-4" />}
              className="h-12 bg-muted"
            />
            <FilterSelect
              value={closingFilter}
              onChange={setClosingFilter}
              placeholder="Fermeture"
              emptyLabel="Toute fermeture"
              options={["Après 2h"]}
              icon={<Clock3 className="w-4 h-4" />}
              className="h-12 bg-muted"
            />
            <FilterSelect
              value={ambianceType}
              onChange={setAmbianceType}
              placeholder="Ambiance"
              emptyLabel="Toutes ambiances"
              options={AMBIANCE_TYPES}
              icon={<Music2 className="w-4 h-4" />}
              className="h-12 bg-muted"
            />
            <FilterSelect
              value={externalOption}
              onChange={setExternalOption}
              placeholder="Options externes"
              emptyLabel="Toutes options"
              options={EXTERNAL_OPTIONS}
              icon={<UtensilsCrossed className="w-4 h-4" />}
              className="h-12 bg-muted"
            />
          </div>

          <div className="grid grid-cols-1 gap-8 xl:h-[calc(100vh-22rem)] xl:min-h-[620px] xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] xl:items-stretch">
            <div className="order-2 flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card luxury-shadow xl:order-1 xl:h-full">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-body text-muted-foreground">
                <SlidersHorizontal className="w-4 h-4 shrink-0 text-primary" />
                <span>
                  {isMapZoneFilteringActive
                    ? "Résultats ajustés à la zone actuellement visible sur la carte"
                    : "Sélection affinée en temps réel"}
                </span>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4 xl:p-5">
                {results.length > 0 ? (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {results.map((venue) => (
                      <VenueGridCard key={venue.id} venue={venue} />
                    ))}
                  </div>
                ) : filteredResults.length > 0 ? (
                  <div className="rounded-lg border border-border bg-background py-20 text-center">
                    <p className="mb-2 font-heading text-2xl font-semibold">Aucune salle dans la zone affichée</p>
                    <p className="mx-auto max-w-md text-sm font-body text-muted-foreground">
                      Déplacez la carte ou cliquez sur “Recentrer” pour revoir l'ensemble des lieux correspondant à vos filtres.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-background py-20 text-center">
                    <p className="mb-2 font-heading text-2xl font-semibold">Aucune salle trouvée</p>
                    <p className="mx-auto max-w-md text-sm font-body text-muted-foreground">
                      Essayez une autre ville, un autre format ou un volume d'invités différent.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <aside className="order-1 min-h-0 xl:order-2 xl:h-full">
              <SearchResultsMap
                venues={filteredResults}
                onVisibleVenuesChange={setVisibleVenueIds}
                className="xl:h-full"
              />
            </aside>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
};

export default SearchResults;
