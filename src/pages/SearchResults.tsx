import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CalendarDays, Clock3, Euro, MapPin, Music2, SlidersHorizontal, Sparkles, Tag, UtensilsCrossed, Users, ShieldCheck, X } from "lucide-react";
import { fetchVenues, filterVenues, findVenueByCode, getVenueLocationSuggestionsFromVenues } from "@/lib/supabase-data";
import { EVENT_TYPES } from "@/types/venue";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import FilterSelect from "@/components/FilterSelect";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import SiteFooter from "@/components/SiteFooter";
import SearchResultsMap from "@/components/SearchResultsMap";
import VenueGridCard from "@/components/VenueGridCard";
import VenueCodeSearch from "@/components/VenueCodeSearch";
import { useIsMobile } from "@/hooks/use-mobile";

const SEARCH_BACKGROUND_VIDEO = "https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4";
const PRICE_FILTERS = ["€", "€€", "€€€", "€€€€"] as const;
const VENUE_TYPE_FILTERS = ["Bar", "Restaurant", "Salle"] as const;
const AMBIANCE_FILTERS = ["Calme", "Animée", "Festive"] as const;
const PRIVATIZATION_FILTERS = ["Quelques tables", "Espace clos"] as const;
const OFFER_FILTERS = ["Promotions exclusives", "Happy Hours"] as const;
const HOUR_FILTERS = ["Ouvert après minuit", "Ouvert après 2h"] as const;
const OPTION_FILTERS = ["Mettre ma musique", "Possibilité de danser", "Apporter mon gâteau", "Matériel de projection", "Jeux (baby-foot, ping-pong, ...)"] as const;
const EQUIPMENT_FILTERS = ["Matériel de karaoké", "Terrasse"] as const;
const FOOD_FILTERS = ["Planches et tapas"] as const;

type FilterGroupProps = {
  title: string;
  options: readonly string[];
  value?: string;
  values?: string[];
  onSelect?: (value: string) => void;
  onToggle?: (value: string) => void;
};

const toggleValue = (values: string[], value: string) =>
  values.includes(value) ? values.filter((item) => item !== value) : [...values, value];

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [locationQuery, setLocationQuery] = useState(searchParams.get("location") || searchParams.get("city") || "");
  const [eventType, setEventType] = useState(searchParams.get("type") || "");
  const [eventDate, setEventDate] = useState(searchParams.get("date") || "");
  const [guests, setGuests] = useState(searchParams.get("guests") || "");
  const [priceTier, setPriceTier] = useState(searchParams.get("price") || "");
  const [closingFilter, setClosingFilter] = useState(searchParams.get("closing") || "");
  const [ambianceType, setAmbianceType] = useState(searchParams.get("ambiance") || "");
  const [venueType, setVenueType] = useState("");
  const [privatizationType, setPrivatizationType] = useState("");
  const [offerType, setOfferType] = useState("");
  const [optionFilters, setOptionFilters] = useState<string[]>([]);
  const [equipmentFilters, setEquipmentFilters] = useState<string[]>([]);
  const [foodFilter, setFoodFilter] = useState("");
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [showCodeSearch, setShowCodeSearch] = useState(false);
  const [visibleVenueIds, setVisibleVenueIds] = useState<string[] | null>(null);
  const isMobile = useIsMobile();
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
      closesAfterMidnight: closingFilter === "Après minuit",
      ambianceType: ambianceType || undefined,
      venueType: venueType || undefined,
      privatizationType: privatizationType || undefined,
      offerType: offerType || undefined,
      optionFilters,
      equipmentFilters,
      foodFilter: foodFilter || undefined,
    });
  }, [locationQuery, eventType, guests, priceTier, closingFilter, ambianceType, venueType, privatizationType, offerType, optionFilters, equipmentFilters, foodFilter, venues]);

  useEffect(() => {
    setVisibleVenueIds(null);
  }, [filteredResults]);

  useEffect(() => {
    if (window.location.hash !== "#salles") return;

    window.setTimeout(() => {
      document.getElementById("salles")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }, []);

  const results = useMemo(() => {
    if (visibleVenueIds === null) return filteredResults;

    const visibleSet = new Set(visibleVenueIds);
    return filteredResults.filter((venue) => visibleSet.has(venue.id));
  }, [filteredResults, visibleVenueIds]);

  const isMapZoneFilteringActive =
    visibleVenueIds !== null && results.length !== filteredResults.length;
  const activeAdvancedFilterCount = [
    venueType,
    priceTier,
    ambianceType,
    privatizationType,
    offerType,
    closingFilter,
    foodFilter,
    ...optionFilters,
    ...equipmentFilters,
  ].filter(Boolean).length;
  const resetAdvancedFilters = () => {
    setVenueType("");
    setPriceTier("");
    setAmbianceType("");
    setPrivatizationType("");
    setOfferType("");
    setClosingFilter("");
    setOptionFilters([]);
    setEquipmentFilters([]);
    setFoodFilter("");
  };
  const toggleOptionFilter = (value: string) => {
    setOptionFilters((current) => toggleValue(current, value));
  };
  const toggleEquipmentFilter = (value: string) => {
    setEquipmentFilters((current) => toggleValue(current, value));
  };

  const FilterGroup = ({ title, options, value, values, onSelect, onToggle }: FilterGroupProps) => (
    <div>
      <h3 className="mb-3 font-body text-sm font-semibold text-foreground">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = values ? values.includes(option) : value === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => {
                if (onToggle) {
                  onToggle(option);
                  return;
                }

                onSelect?.(selected ? "" : option);
              }}
              className={`rounded-lg border px-3 py-2 text-sm font-body font-semibold transition-colors ${
                selected
                  ? "border-foreground bg-foreground text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? (
        <MobileHeader onCodeSearch={() => setShowCodeSearch(true)} />
      ) : (
        <DesktopNav />
      )}

      <section data-header-theme="light" className="relative overflow-visible bg-foreground px-4 pb-6 pt-32 text-primary-foreground md:flex md:min-h-screen md:items-center md:px-6 md:pb-10 xl:pb-12">
        {!isMobile && (
          <>
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="absolute inset-0 h-full w-full object-cover image-grade-luxe hero-video-active"
            >
              <source src={SEARCH_BACKGROUND_VIDEO} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/50 to-foreground/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-transparent to-foreground/40" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_22%,rgba(218,86,110,0.22),transparent_30%),radial-gradient(circle_at_78%_24%,rgba(216,180,96,0.2),transparent_24%)]" />
          </>
        )}

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col justify-center">
          <div className="mb-6 grid grid-cols-1 gap-4 md:mb-10 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-xs font-body font-semibold text-primary backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5" />
                Lieux vérifiés
              </p>
              <h1 className="font-heading text-4xl md:text-6xl font-semibold leading-[0.98] mb-3 md:mb-4">
                Trouvez le lieu idéal pour votre événement.
              </h1>
              <p className="max-w-2xl text-sm font-body leading-relaxed text-primary-foreground/76 md:text-base">
                Recherchez par ville ou code postal, capacité et type d'événement, puis envoyez votre demande en quelques clics.
              </p>
            </div>
            <div className="w-fit rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-3 text-sm font-body text-primary-foreground/78 backdrop-blur-md">
              <span className="font-semibold text-primary-foreground">{results.length}</span>{" "}
              salle{results.length !== 1 ? "s" : ""} {isMapZoneFilteringActive ? "dans la zone" : "trouvée"}{results.length !== 1 ? "s" : ""}
              {isMapZoneFilteringActive && (
                <span className="ml-1 text-primary-foreground/68">sur {filteredResults.length}</span>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-primary-foreground/20 bg-foreground/50 p-4 text-foreground shadow-2xl backdrop-blur-xl hairline-top">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.18fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] lg:items-stretch">
              <LocationAutocomplete
                value={locationQuery}
                onChange={setLocationQuery}
                options={locationOptions}
                placeholder="Ville ou code postal"
                className="h-12 bg-background"
                icon={<MapPin className="w-4 h-4" />}
              />
              <FilterSelect
                value={eventType}
                onChange={setEventType}
                placeholder="Type d'événement"
                emptyLabel="Tous les types"
                options={EVENT_TYPES}
                icon={<Sparkles className="w-4 h-4" />}
                className="h-12"
              />
              <div className="flex h-12 items-center gap-2 rounded-lg border border-border bg-background px-3">
                <Users className="w-4 h-4 text-primary shrink-0" />
                <input
                  type="number"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  placeholder="Nombre d'invités"
                  className="min-w-0 flex-1 bg-transparent text-sm font-body focus:outline-none"
                />
              </div>
              <label className="flex h-12 items-center gap-2 rounded-lg border border-border bg-background px-3">
                <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                <input
                  type="date"
                  value={eventDate}
                  onChange={(event) => setEventDate(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm font-body focus:outline-none [color-scheme:light]"
                  aria-label="Date de l'événement"
                />
              </label>
            </div>

            <div className="mt-4 flex gap-3 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0">
              <button
                type="button"
                onClick={() => setShowAllFilters(true)}
                className="inline-flex h-12 shrink-0 items-center gap-2 rounded-lg border border-foreground/70 bg-background px-4 text-sm font-body font-semibold text-foreground transition-colors hover:bg-foreground hover:text-primary-foreground"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Tous les filtres{activeAdvancedFilterCount ? ` (${activeAdvancedFilterCount})` : ""}
              </button>
              <div className="w-[8.5rem] shrink-0">
                <FilterSelect value={priceTier} onChange={setPriceTier} placeholder="Prix" emptyLabel="Tous les prix" options={PRICE_FILTERS} icon={<Euro className="w-4 h-4" />} className="h-12" />
              </div>
              <div className="w-40 shrink-0">
                <FilterSelect value={offerType} onChange={setOfferType} placeholder="Offres" emptyLabel="Toutes offres" options={OFFER_FILTERS} icon={<Tag className="w-4 h-4" />} className="h-12" />
              </div>
              <div className="w-52 shrink-0">
                <FilterSelect value={ambianceType} onChange={setAmbianceType} placeholder="Ambiance" emptyLabel="Toutes ambiances" options={AMBIANCE_FILTERS} icon={<Music2 className="w-4 h-4" />} className="h-12" />
              </div>
              <div className="w-[21rem] max-w-full shrink-0">
                <FilterSelect value={privatizationType} onChange={setPrivatizationType} placeholder="Type de privatisation" emptyLabel="Toute privatisation" options={PRIVATIZATION_FILTERS} icon={<UtensilsCrossed className="w-4 h-4" />} className="h-12" />
              </div>
              <button
                type="button"
                onClick={() => toggleOptionFilter("Possibilité de danser")}
                className={`h-12 shrink-0 rounded-lg border px-4 text-sm font-body font-semibold transition-colors ${
                  optionFilters.includes("Possibilité de danser") ? "border-foreground bg-foreground text-primary-foreground" : "border-foreground/70 bg-background text-foreground hover:bg-muted"
                }`}
              >
                Possibilité de danser
              </button>
              <button
                type="button"
                onClick={() => setClosingFilter(closingFilter === "Après 2h" ? "" : "Après 2h")}
                className={`h-12 shrink-0 rounded-lg border px-4 text-sm font-body font-semibold transition-colors ${
                  closingFilter === "Après 2h" ? "border-foreground bg-foreground text-primary-foreground" : "border-foreground/70 bg-background text-foreground hover:bg-muted"
                }`}
              >
                Ouvert après 2h
              </button>
              <button
                type="button"
                onClick={() => toggleEquipmentFilter("Terrasse")}
                className={`h-12 shrink-0 rounded-lg border px-4 text-sm font-body font-semibold transition-colors ${
                  equipmentFilters.includes("Terrasse") ? "border-foreground bg-foreground text-primary-foreground" : "border-foreground/70 bg-background text-foreground hover:bg-muted"
                }`}
              >
                Terrasse
              </button>
            </div>
          </div>
        </div>
      </section>

      <div id="salles" className="scroll-mt-24 px-4 py-6 md:px-6 md:py-10 xl:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 gap-8 md:h-[calc(100vh-22rem)] md:min-h-[620px] md:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] md:items-stretch lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
            <div className="order-1 flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card luxury-shadow md:h-full">
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
                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
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

            <aside className="order-2 hidden min-h-0 md:block md:h-full">
              <SearchResultsMap
                venues={filteredResults}
                onVisibleVenuesChange={setVisibleVenueIds}
                className="md:h-full"
              />
            </aside>
          </div>
        </div>
      </div>

      {showAllFilters && (
        <div className="fixed inset-0 z-[2200] flex items-end bg-foreground/70 p-0 backdrop-blur-md sm:items-center sm:justify-center sm:p-4">
          <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-lg bg-background text-foreground luxury-shadow animate-scale-in sm:max-h-[90vh] sm:rounded-lg">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <p className="text-xs font-body font-semibold text-primary">Recherche avancée</p>
                <h2 className="font-heading text-3xl font-semibold">Tous les filtres</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAllFilters(false)}
                className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                aria-label="Fermer les filtres"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid flex-1 gap-8 overflow-y-auto p-5 md:grid-cols-2">
              <FilterGroup title="Type de lieu" options={VENUE_TYPE_FILTERS} value={venueType} onSelect={setVenueType} />
              <FilterGroup title="Prix" options={PRICE_FILTERS} value={priceTier} onSelect={setPriceTier} />
              <FilterGroup title="Ambiance" options={AMBIANCE_FILTERS} value={ambianceType} onSelect={setAmbianceType} />
              <FilterGroup title="Type de privatisation" options={PRIVATIZATION_FILTERS} value={privatizationType} onSelect={setPrivatizationType} />
              <FilterGroup title="Offres" options={OFFER_FILTERS} value={offerType} onSelect={setOfferType} />
              <FilterGroup title="Horaire" options={HOUR_FILTERS} value={closingFilter === "Après minuit" ? "Ouvert après minuit" : closingFilter === "Après 2h" ? "Ouvert après 2h" : ""} onSelect={(value) => setClosingFilter(value === "Ouvert après minuit" ? "Après minuit" : value === "Ouvert après 2h" ? "Après 2h" : "")} />
              <FilterGroup title="Options" options={OPTION_FILTERS} values={optionFilters} onToggle={toggleOptionFilter} />
              <FilterGroup title="Équipements" options={EQUIPMENT_FILTERS} values={equipmentFilters} onToggle={toggleEquipmentFilter} />
              <FilterGroup title="Nourriture" options={FOOD_FILTERS} value={foodFilter} onSelect={setFoodFilter} />
            </div>

            <div className="flex flex-col gap-3 border-t border-border p-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={resetAdvancedFilters}
                className="rounded-lg border border-border px-5 py-3 text-sm font-body font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                Réinitialiser
              </button>
              <button
                type="button"
                onClick={() => setShowAllFilters(false)}
                className="rounded-lg bg-foreground px-5 py-3 text-sm font-body font-semibold text-primary-foreground transition-colors hover:bg-primary"
              >
                Voir {filteredResults.length} salle{filteredResults.length !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCodeSearch && (
        <VenueCodeSearch
          onClose={() => setShowCodeSearch(false)}
          onVenueFound={(venue) => {
            setShowCodeSearch(false);
            navigate(`/salle/${venue.slug}`);
          }}
        />
      )}

      {!isMobile && <SiteFooter variant="dark" />}
    </div>
  );
};

export default SearchResults;
