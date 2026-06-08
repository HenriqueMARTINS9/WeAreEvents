import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Building2, CalendarDays, FileText, Home, Map as MapIcon, MapPin, Menu, Search, SlidersHorizontal, Sparkles, Users, X } from "lucide-react";
import { fetchVenues, filterVenues, findVenueByCode, getVenueLocationSuggestionsFromVenues } from "@/lib/supabase-data";
import {
  AMBIANCE_TYPES,
  CLOSING_TIME_OPTIONS,
  EVENT_TYPES,
  EXTERNAL_OPTIONS,
  GUEST_DISPOSITIONS,
  OPTION_FEATURES,
  PRICE_TIERS,
  PRIVATIZATION_TYPES,
  SERVICES,
  SPACE_TYPES,
  VENUE_TYPES,
} from "@/types/venue";
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

const shuffleList = <T,>(items: T[]) => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
};

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

const splitParamValues = (values: string[]) =>
  Array.from(
    new Set(
      values
        .flatMap((value) => value.split(","))
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );

const getParamValue = (params: URLSearchParams, ...keys: string[]) => {
  for (const key of keys) {
    const value = params.get(key);
    if (value) return value;
  }

  return "";
};

const getParamList = (params: URLSearchParams, ...keys: string[]) =>
  splitParamValues(keys.flatMap((key) => params.getAll(key)));

const readSearchFiltersFromParams = (params: URLSearchParams) => ({
  locationQuery: getParamValue(params, "location", "city"),
  eventType: getParamValue(params, "type", "event"),
  eventDate: getParamValue(params, "date"),
  guests: getParamValue(params, "guests"),
  guestRangeMin: getParamValue(params, "guestsMin"),
  guestRangeMax: getParamValue(params, "guestsMax"),
  priceTier: getParamValue(params, "price"),
  closingFilter: getParamValue(params, "closing"),
  eventCategoryFilters: getParamList(params, "events", "eventTypes", "eventCategories"),
  ambianceFilters: getParamList(params, "ambiance", "ambiences"),
  venueTypes: getParamList(params, "venueTypes", "venueType", "venue"),
  privatizationTypes: getParamList(params, "privatization", "privatizationTypes"),
  optionFilters: getParamList(params, "options", "option"),
  equipmentFilters: getParamList(params, "equipment", "services"),
  guestDispositions: getParamList(params, "disposition", "guestDispositions"),
  spaceTypes: getParamList(params, "space", "spaceTypes"),
});

const appendSearchParam = (params: URLSearchParams, key: string, value?: string | string[]) => {
  if (!value) return;

  const values = Array.isArray(value) ? value : [value];
  values.forEach((item) => {
    if (item) params.append(key, item);
  });
};

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const searchParamKey = searchParams.toString();
  const parsedSearchFilters = useMemo(
    () => readSearchFiltersFromParams(new URLSearchParams(searchParamKey)),
    [searchParamKey],
  );
  const navigate = useNavigate();
  const { openModal } = useEstablishmentReferralModal();
  const [locationQuery, setLocationQuery] = useState(parsedSearchFilters.locationQuery);
  const [eventType, setEventType] = useState(parsedSearchFilters.eventType);
  const [eventDate, setEventDate] = useState(parsedSearchFilters.eventDate);
  const [guests, setGuests] = useState(parsedSearchFilters.guests);
  const [guestRangeMin, setGuestRangeMin] = useState(parsedSearchFilters.guestRangeMin);
  const [guestRangeMax, setGuestRangeMax] = useState(parsedSearchFilters.guestRangeMax);
  const [priceTier, setPriceTier] = useState(parsedSearchFilters.priceTier);
  const [closingFilter, setClosingFilter] = useState(parsedSearchFilters.closingFilter);
  const [eventCategoryFilters, setEventCategoryFilters] = useState<string[]>(parsedSearchFilters.eventCategoryFilters);
  const [ambianceFilters, setAmbianceFilters] = useState<string[]>(parsedSearchFilters.ambianceFilters);
  const [venueTypes, setVenueTypes] = useState<string[]>(parsedSearchFilters.venueTypes);
  const [privatizationTypes, setPrivatizationTypes] = useState<string[]>(parsedSearchFilters.privatizationTypes);
  const [optionFilters, setOptionFilters] = useState<string[]>(parsedSearchFilters.optionFilters);
  const [equipmentFilters, setEquipmentFilters] = useState<string[]>(parsedSearchFilters.equipmentFilters);
  const [guestDispositions, setGuestDispositions] = useState<string[]>(parsedSearchFilters.guestDispositions);
  const [spaceTypes, setSpaceTypes] = useState<string[]>(parsedSearchFilters.spaceTypes);
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
    setLocationQuery(parsedSearchFilters.locationQuery);
    setEventType(parsedSearchFilters.eventType);
    setEventDate(parsedSearchFilters.eventDate);
    setGuests(parsedSearchFilters.guests);
    setGuestRangeMin(parsedSearchFilters.guestRangeMin);
    setGuestRangeMax(parsedSearchFilters.guestRangeMax);
    setPriceTier(parsedSearchFilters.priceTier);
    setClosingFilter(parsedSearchFilters.closingFilter);
    setEventCategoryFilters(parsedSearchFilters.eventCategoryFilters);
    setAmbianceFilters(parsedSearchFilters.ambianceFilters);
    setVenueTypes(parsedSearchFilters.venueTypes);
    setPrivatizationTypes(parsedSearchFilters.privatizationTypes);
    setOptionFilters(parsedSearchFilters.optionFilters);
    setEquipmentFilters(parsedSearchFilters.equipmentFilters);
    setGuestDispositions(parsedSearchFilters.guestDispositions);
    setSpaceTypes(parsedSearchFilters.spaceTypes);
  }, [parsedSearchFilters]);

  useEffect(() => {
    if (codeParam) {
      findVenueByCode(codeParam).then((venue) => {
        if (venue) {
          navigate(`/salle/${venue.slug}`, { replace: true });
        }
      });
    }
  }, [codeParam, navigate]);

  useEffect(() => {
    if (codeParam) return;

    const nextParams = new URLSearchParams();
    appendSearchParam(nextParams, "location", locationQuery.trim());
    appendSearchParam(nextParams, "type", eventType);
    appendSearchParam(nextParams, "date", eventDate);
    appendSearchParam(nextParams, "guests", guests);
    appendSearchParam(nextParams, "guestsMin", guestRangeMin);
    appendSearchParam(nextParams, "guestsMax", guestRangeMax);
    appendSearchParam(nextParams, "price", priceTier);
    appendSearchParam(nextParams, "closing", closingFilter);
    appendSearchParam(nextParams, "events", eventCategoryFilters);
    appendSearchParam(nextParams, "ambiance", ambianceFilters);
    appendSearchParam(nextParams, "venueTypes", venueTypes);
    appendSearchParam(nextParams, "privatization", privatizationTypes);
    appendSearchParam(nextParams, "space", spaceTypes);
    appendSearchParam(nextParams, "options", optionFilters);
    appendSearchParam(nextParams, "equipment", equipmentFilters);
    appendSearchParam(nextParams, "disposition", guestDispositions);

    const nextSearch = nextParams.toString();
    if (nextSearch === searchParamKey) return;

    navigate(
      {
        pathname: "/recherche",
        search: nextSearch ? `?${nextSearch}` : "",
        hash: window.location.hash,
      },
      { replace: true },
    );
  }, [
    ambianceFilters,
    closingFilter,
    codeParam,
    equipmentFilters,
    eventCategoryFilters,
    eventDate,
    eventType,
    guestDispositions,
    guests,
    guestRangeMax,
    guestRangeMin,
    locationQuery,
    navigate,
    optionFilters,
    priceTier,
    privatizationTypes,
    searchParamKey,
    spaceTypes,
    venueTypes,
  ]);

  const filteredResults = useMemo(() => {
    return filterVenues(venues, {
      locationQuery: locationQuery || undefined,
      eventType: eventType || undefined,
      eventTypes: eventCategoryFilters,
      minGuests: guests ? parseInt(guests, 10) : undefined,
      guestRangeMin: guestRangeMin ? parseInt(guestRangeMin, 10) : undefined,
      guestRangeMax: guestRangeMax ? parseInt(guestRangeMax, 10) : undefined,
      priceTier: priceTier || undefined,
      closingTimeFilter: closingFilter || undefined,
      ambianceTypes: ambianceFilters,
      venueTypes,
      privatizationTypes,
      spaceTypes,
      optionFilters,
      equipmentFilters,
      guestDispositions,
    });
  }, [locationQuery, eventType, eventCategoryFilters, guests, guestRangeMin, guestRangeMax, priceTier, closingFilter, ambianceFilters, venueTypes, privatizationTypes, spaceTypes, optionFilters, equipmentFilters, guestDispositions, venues]);
  const hasActiveVenueFilters = Boolean(
    locationQuery.trim() ||
      eventType ||
      guests ||
      guestRangeMin ||
      guestRangeMax ||
      priceTier ||
      closingFilter ||
      eventCategoryFilters.length ||
      ambianceFilters.length ||
      venueTypes.length ||
      privatizationTypes.length ||
      spaceTypes.length ||
      optionFilters.length ||
      equipmentFilters.length ||
      guestDispositions.length,
  );
  const orderedFilteredResults = useMemo(
    () => (hasActiveVenueFilters ? filteredResults : shuffleList(filteredResults)),
    [filteredResults, hasActiveVenueFilters],
  );

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
    if (isMobile || visibleVenueIds === null) return orderedFilteredResults;

    const visibleSet = new Set(visibleVenueIds);
    return orderedFilteredResults.filter((venue) => visibleSet.has(venue.id));
  }, [orderedFilteredResults, isMobile, visibleVenueIds]);

  const isMapZoneFilteringActive =
    !isMobile && visibleVenueIds !== null && results.length !== filteredResults.length;
  const activeAdvancedFilterCount = [
    ...eventCategoryFilters,
    ...venueTypes,
    priceTier,
    ...ambianceFilters,
    ...privatizationTypes,
    closingFilter,
    ...spaceTypes,
    ...guestDispositions,
    ...optionFilters,
    ...equipmentFilters,
  ].filter(Boolean).length;
  const mobileDateLabel = formatMobileDate(eventDate);
  const guestRangeLabel =
    guestRangeMin && guestRangeMax
      ? `${guestRangeMin}–${guestRangeMax} invités`
      : guestRangeMax
        ? `Moins de ${Number(guestRangeMax) + 1} invités`
        : guestRangeMin
          ? `Plus de ${Number(guestRangeMin) - 1} invités`
          : "";
  const mobileSearchSummary = [
    mobileDateLabel || "Date",
    guests ? `${guests} invités` : guestRangeLabel || "Invités",
    eventType || "Type d'événement",
  ].join(" · ");
  const handleGuestsChange = (value: string) => {
    setGuests(value);
    setGuestRangeMin("");
    setGuestRangeMax("");
  };
  const resetAdvancedFilters = () => {
    setEventCategoryFilters([]);
    setVenueTypes([]);
    setPriceTier("");
    setAmbianceFilters([]);
    setPrivatizationTypes([]);
    setClosingFilter("");
    setSpaceTypes([]);
    setOptionFilters([]);
    setEquipmentFilters([]);
    setGuestDispositions([]);
  };
  const toggleVenueType = (value: string) => {
    setVenueTypes((current) => toggleValue(current, value));
  };
  const toggleEventCategoryFilter = (value: string) => {
    setEventCategoryFilters((current) => toggleValue(current, value));
  };
  const toggleAmbianceFilter = (value: string) => {
    setAmbianceFilters((current) => toggleValue(current, value));
  };
  const togglePrivatizationType = (value: string) => {
    setPrivatizationTypes((current) => toggleValue(current, value));
  };
  const toggleOptionFilter = (value: string) => {
    setOptionFilters((current) => toggleValue(current, value));
  };
  const toggleSpaceType = (value: string) => {
    setSpaceTypes((current) => toggleValue(current, value));
  };
  const toggleEquipmentFilter = (value: string) => {
    setEquipmentFilters((current) => toggleValue(current, value));
  };
  const toggleGuestDisposition = (value: string) => {
    setGuestDispositions((current) => toggleValue(current, value));
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
        title="Trouver une salle événementielle - Recherche Wearevents"
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
              <img src={logoBlack} alt="Wearevents" className="h-7 xl:h-8" />
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
                        onChange={(event) => handleGuestsChange(event.target.value)}
                        placeholder={guestRangeLabel || "Nombre"}
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
                    onChange={(event) => handleGuestsChange(event.target.value)}
                    placeholder={guestRangeLabel || "Nombre d'invités"}
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
              <FilterGroup title="Catégories d'événements" options={EVENT_TYPES} values={eventCategoryFilters} onToggle={toggleEventCategoryFilter} />
              <FilterGroup title="Type de lieu" options={VENUE_TYPES} values={venueTypes} onToggle={toggleVenueType} />
              <FilterGroup title="Prix" options={PRICE_TIERS} value={priceTier} onSelect={setPriceTier} />
              <FilterGroup title="Ambiances" options={AMBIANCE_TYPES} values={ambianceFilters} onToggle={toggleAmbianceFilter} />
              <FilterGroup title="Type de privatisation" options={PRIVATIZATION_TYPES} values={privatizationTypes} onToggle={togglePrivatizationType} />
              <FilterGroup title="Horaires" options={CLOSING_TIME_OPTIONS} value={closingFilter} onSelect={setClosingFilter} />
              <FilterGroup title="Type d'espace" options={SPACE_TYPES} values={spaceTypes} onToggle={toggleSpaceType} />
              <FilterGroup title="Options" options={[...EXTERNAL_OPTIONS, ...OPTION_FEATURES]} values={optionFilters} onToggle={toggleOptionFilter} />
              <FilterGroup title="Disposition des invités" options={GUEST_DISPOSITIONS} values={guestDispositions} onToggle={toggleGuestDisposition} />
              <FilterGroup title="Équipements & services" options={SERVICES} values={equipmentFilters} onToggle={toggleEquipmentFilter} />
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
