import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Building2, CalendarDays, FileText, Home, Map as MapIcon, MapPin, Menu, Search, SlidersHorizontal, Sparkles, Users, X } from "lucide-react";
import { fetchVenues, filterVenues, findVenueByCode, getVenueLocationSuggestionsFromVenues } from "@/lib/supabase-data";
import { EVENT_TYPES } from "@/types/venue";
import MobileHeader from "@/components/MobileHeader";
import FilterSelect from "@/components/FilterSelect";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import SiteFooter from "@/components/SiteFooter";
import SearchResultsMap from "@/components/SearchResultsMap";
import VenueGridCard from "@/components/VenueGridCard";
import VenueCodeSearch from "@/components/VenueCodeSearch";
import { useIsMobile } from "@/hooks/use-mobile";
import logoBlack from "@/assets/logo-black.svg";
import { useEstablishmentReferralModal } from "@/lib/establishment-referral-modal";
import Seo, { siteUrl } from "@/components/Seo";

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

const SearchMenuLink = ({ to, label, icon, onClick }: { to: string; label: string; icon: ReactNode; onClick: () => void }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-body font-semibold transition-colors hover:bg-muted"
  >
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary">
      {icon}
    </span>
    {label}
  </Link>
);

const formatMobileDate = (value: string) => {
  if (!value) return "";

  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(date);
};

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { openModal } = useEstablishmentReferralModal();
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
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
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

  useEffect(() => {
    if (!isMobile || !mobileSearchOpen) return;

    const scrollY = window.scrollY;
    const originalStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
    };

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.position = originalStyles.position;
      document.body.style.top = originalStyles.top;
      document.body.style.left = originalStyles.left;
      document.body.style.right = originalStyles.right;
      document.body.style.width = originalStyles.width;
      document.body.style.overflow = originalStyles.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [isMobile, mobileSearchOpen]);

  const results = useMemo(() => {
    if (isMobile || visibleVenueIds === null) return filteredResults;

    const visibleSet = new Set(visibleVenueIds);
    return filteredResults.filter((venue) => visibleSet.has(venue.id));
  }, [filteredResults, isMobile, visibleVenueIds]);

  const isMapZoneFilteringActive =
    !isMobile && visibleVenueIds !== null && results.length !== filteredResults.length;
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
  const mobileDateLabel = formatMobileDate(eventDate);
  const mobileSearchSummary = [
    mobileDateLabel || "Date",
    guests ? `${guests} invités` : "Invités",
    eventType || "Type d'événement",
  ].join(" · ");
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
    <div className={`min-h-screen ${isMobile ? "bg-background" : "bg-card"}`}>
      <Seo
        title="Trouver une salle événementielle - Recherche wearevents"
        description="Recherchez une salle par ville, capacité, type d'événement, ambiance et budget. Comparez les lieux et envoyez une demande gratuite."
        path="/recherche"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Recherche de salles événementielles",
          description: "Salles, restaurants, bars et lieux événementiels disponibles à la privatisation.",
          url: `${siteUrl}/recherche`,
          numberOfItems: filteredResults.length,
        }}
      />
      {isMobile ? (
        <MobileHeader onCodeSearch={() => setShowCodeSearch(true)} withBackground />
      ) : (
        <header className="fixed inset-x-0 top-0 z-[1000] border-b border-border bg-background/95 backdrop-blur-xl">
          <div className="mx-auto grid h-20 max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 xl:px-6">
            <Link to="/" className="shrink-0" aria-label="Retour à l'accueil">
              <img src={logoBlack} alt="wearevents" className="h-7 xl:h-8" />
            </Link>

            <div className="mx-auto flex w-full max-w-4xl items-center justify-center gap-2">
              <div className="min-w-0 flex-1 rounded-full border border-border bg-background p-1.5 shadow-lg">
                <div className="grid grid-cols-[minmax(190px,1.2fr)_minmax(145px,0.75fr)_minmax(150px,0.85fr)_minmax(130px,0.65fr)_auto] items-center">
                  <div className="min-w-0 px-3">
                    <p className="mb-0.5 text-[11px] font-body font-semibold text-foreground">Lieu</p>
                    <LocationAutocomplete
                      value={locationQuery}
                      onChange={setLocationQuery}
                      options={locationOptions}
                      placeholder="Ville ou code postal"
                      className="h-8 border-0 bg-transparent px-0 hover:border-transparent focus-within:border-transparent focus-within:ring-0"
                      icon={<MapPin className="w-4 h-4" />}
                    />
                  </div>
                  <div className="min-w-0 border-l border-border px-3">
                    <p className="mb-0.5 text-[11px] font-body font-semibold text-foreground">Date</p>
                    <label className="flex h-8 items-center gap-2">
                      <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                      <input
                        type="date"
                        value={eventDate}
                        onChange={(event) => setEventDate(event.target.value)}
                        className="min-w-0 flex-1 bg-transparent text-sm font-body text-muted-foreground outline-none [color-scheme:light]"
                        aria-label="Date de l'événement"
                      />
                    </label>
                  </div>
                  <div className="min-w-0 border-l border-border px-3">
                    <p className="mb-0.5 text-[11px] font-body font-semibold text-foreground">Événement</p>
                    <FilterSelect
                      value={eventType}
                      onChange={setEventType}
                      placeholder="Type"
                      emptyLabel="Tous les types"
                      options={EVENT_TYPES}
                      icon={<Sparkles className="w-4 h-4" />}
                      className="h-8 border-0 bg-transparent px-0 hover:border-transparent focus:ring-0"
                    />
                  </div>
                  <div className="min-w-0 border-l border-border px-3">
                    <p className="mb-0.5 text-[11px] font-body font-semibold text-foreground">Invités</p>
                    <div className="flex h-8 items-center gap-2">
                      <Users className="h-4 w-4 shrink-0 text-primary" />
                      <input
                        type="number"
                        value={guests}
                        onChange={(event) => setGuests(event.target.value)}
                        placeholder="Nombre"
                        className="min-w-0 flex-1 bg-transparent text-sm font-body outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => document.getElementById("salles")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    className="mr-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-[0.98]"
                    aria-label="Lancer la recherche"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAllFilters(true)}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-border bg-background px-3 text-sm font-body font-semibold text-foreground shadow-sm transition-colors hover:border-foreground"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Tous les filtres{activeAdvancedFilterCount ? ` (${activeAdvancedFilterCount})` : ""}
              </button>
            </div>

            <div className="relative flex justify-end">
              <button
                type="button"
                onClick={() => setDesktopMenuOpen((current) => !current)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:border-foreground"
                aria-label="Ouvrir le menu"
                aria-expanded={desktopMenuOpen}
              >
                <Menu className="h-5 w-5" />
              </button>

              {desktopMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+0.75rem)] z-[1200] w-72 overflow-hidden rounded-2xl border border-border bg-background p-2 text-foreground shadow-2xl">
                  <SearchMenuLink to="/" label="Accueil" icon={<Home className="h-4 w-4" />} onClick={() => setDesktopMenuOpen(false)} />
                  <SearchMenuLink to="/recherche" label="Trouver ma salle" icon={<Sparkles className="h-4 w-4" />} onClick={() => setDesktopMenuOpen(false)} />
                  <SearchMenuLink to="/blog" label="Blog" icon={<FileText className="h-4 w-4" />} onClick={() => setDesktopMenuOpen(false)} />
                  <button
                    type="button"
                    onClick={() => {
                      setDesktopMenuOpen(false);
                      openModal();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-body font-semibold transition-colors hover:bg-muted"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary">
                      <Building2 className="h-4 w-4" />
                    </span>
                    Référencer mon établissement
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDesktopMenuOpen(false);
                      setShowCodeSearch(true);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-body font-semibold transition-colors hover:bg-muted"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary">
                      <Search className="h-4 w-4" />
                    </span>
                    Code lieu
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {isMobile && (
        <section className="bg-background pb-28 pt-[calc(4.5rem+env(safe-area-inset-top))] md:hidden">
          <div className="sticky top-[calc(4.25rem+env(safe-area-inset-top))] z-[900] border-b border-border bg-background/95 pb-3 pt-1 backdrop-blur-xl">
            <div className="px-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileSearchOpen(true)}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-border bg-card px-3 py-2.5 text-left shadow-lg active:scale-[0.99]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-primary-foreground">
                    <Search className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-body font-semibold text-foreground">
                      {locationQuery || "Où recherchez-vous ?"}
                    </span>
                    <span className="mt-0.5 block truncate text-xs font-body text-muted-foreground">
                      {mobileSearchSummary}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAllFilters(true)}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-md active:scale-[0.97]"
                  aria-label="Tous les filtres"
                >
                  <SlidersHorizontal className="h-5 w-5" />
                </button>
              </div>

            </div>
          </div>

          <div id="salles" className="scroll-mt-40 px-4 pt-5">
            <div className="mb-5">
              <div>
                <p className="text-xs font-body font-semibold uppercase text-primary">
                  Lieux vérifiés
                </p>
                <h1 className="mt-1 font-heading text-2xl font-semibold text-foreground">
                  {results.length} salle{results.length !== 1 ? "s" : ""}
                </h1>
              </div>
            </div>

            {results.length > 0 ? (
              <div className="space-y-8">
                {results.map((venue) => (
                  <VenueGridCard key={venue.id} venue={venue} variant="mobile" />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card px-5 py-16 text-center">
                <p className="mb-2 font-heading text-2xl font-semibold">Aucune salle trouvée</p>
                <p className="text-sm font-body text-muted-foreground">
                  Essayez une autre ville, un autre format ou un volume d'invités différent.
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMapOpen(true)}
            className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-[950] inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-body font-semibold text-primary-foreground shadow-2xl active:scale-[0.97]"
          >
            Carte
            <MapIcon className="h-4 w-4" />
          </button>
        </section>
      )}

      {!isMobile && (
        <div id="salles" className="scroll-mt-24 bg-card px-4 py-6 md:px-6 md:pb-6 md:pt-24">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 gap-8 md:h-[calc(100vh-12rem)] md:min-h-[560px] md:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] md:items-stretch lg:grid-cols-[minmax(0,1.05fr)_minmax(440px,0.95fr)]">
              <div className="order-1 min-h-0 bg-card md:h-full md:overflow-y-auto md:px-2 md:py-2 xl:px-3">
                {isMapZoneFilteringActive && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-sm font-body text-muted-foreground">
                    <SlidersHorizontal className="w-4 h-4 shrink-0 text-primary" />
                    <span>Résultats ajustés à la zone actuellement visible sur la carte</span>
                  </div>
                )}
                  {results.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 pb-8 xl:grid-cols-2">
                      {results.map((venue) => (
                        <VenueGridCard key={venue.id} venue={venue} size="large" variant="search" />
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
      )}

      {mobileSearchOpen && (
        <div className="fixed inset-0 z-[2200] flex items-end bg-foreground/70 backdrop-blur-md md:hidden" onClick={() => setMobileSearchOpen(false)}>
          <div
            className="flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-background text-foreground luxury-shadow animate-slide-up"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <p className="text-xs font-body font-semibold text-primary">Recherche</p>
                <h2 className="font-heading text-3xl font-semibold">Trouver une salle</h2>
              </div>
              <button
                type="button"
                onClick={() => setMobileSearchOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground active:bg-muted"
                aria-label="Fermer la recherche"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <div>
                <p className="mb-2 text-xs font-body font-semibold uppercase text-muted-foreground">Lieu</p>
                <LocationAutocomplete
                  value={locationQuery}
                  onChange={setLocationQuery}
                  options={locationOptions}
                  placeholder="Ville ou code postal"
                  className="h-12"
                  icon={<MapPin className="w-4 h-4" />}
                />
              </div>

              <div>
                <p className="mb-2 text-xs font-body font-semibold uppercase text-muted-foreground">Date</p>
                <label className="flex h-12 items-center gap-2 rounded-lg border border-border bg-background px-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
                  <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(event) => setEventDate(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm font-body font-semibold focus:outline-none [color-scheme:light]"
                    aria-label="Date de l'événement"
                  />
                </label>
              </div>

              <div>
                <p className="mb-2 text-xs font-body font-semibold uppercase text-muted-foreground">Type d'événement</p>
                <FilterSelect
                  value={eventType}
                  onChange={setEventType}
                  placeholder="Type d'événement"
                  emptyLabel="Tous les types"
                  options={EVENT_TYPES}
                  icon={<Sparkles className="w-4 h-4" />}
                  className="h-12"
                />
              </div>

              <div>
                <p className="mb-2 text-xs font-body font-semibold uppercase text-muted-foreground">Invités</p>
                <div className="flex h-12 items-center gap-2 rounded-lg border border-border bg-background px-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
                  <Users className="w-4 h-4 text-primary shrink-0" />
                  <input
                    type="number"
                    value={guests}
                    onChange={(event) => setGuests(event.target.value)}
                    placeholder="Nombre d'invités"
                    className="min-w-0 flex-1 bg-transparent text-sm font-body font-semibold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border p-5">
              <button
                type="button"
                onClick={() => {
                  setMobileSearchOpen(false);
                  document.getElementById("salles")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-body font-semibold text-primary-foreground active:scale-[0.98]"
              >
                <Search className="h-4 w-4" />
                Voir {filteredResults.length} salle{filteredResults.length !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      {mobileMapOpen && (
        <div className="fixed inset-0 z-[2300] bg-background md:hidden">
          <div className="absolute inset-x-0 top-0 z-[700] flex justify-end px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
            <button
              type="button"
              onClick={() => setMobileMapOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-background text-foreground shadow-xl active:scale-[0.97]"
              aria-label="Retour à la liste"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <SearchResultsMap
            venues={filteredResults}
            onVisibleVenuesChange={setVisibleVenueIds}
            className="h-full rounded-none border-0 shadow-none"
            fullHeight
            interactiveOnMobile
            hideBadge
          />
        </div>
      )}

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
