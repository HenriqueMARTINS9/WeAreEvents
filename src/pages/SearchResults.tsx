import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, MapPin, Users, SlidersHorizontal, Tag, ShieldCheck, ArrowRight } from "lucide-react";
import { searchVenues, mockVenues, getVenueByCode } from "@/data/venues";
import { EVENT_TYPES } from "@/types/venue";
import DesktopNav from "@/components/DesktopNav";
import FilterSelect from "@/components/FilterSelect";
import VenueGridCard from "@/components/VenueGridCard";
import { useEffect } from "react";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [eventType, setEventType] = useState(searchParams.get("type") || "");
  const [guests, setGuests] = useState(searchParams.get("guests") || "");
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [codeInput, setCodeInput] = useState(searchParams.get("code") || "");
  const [codeError, setCodeError] = useState("");
  const codeParam = searchParams.get("code");
  const cityOptions = [...new Set(mockVenues.map((v) => v.city))];

  useEffect(() => {
    if (codeParam) {
      const v = getVenueByCode(codeParam);
      if (v) {
        navigate(`/salle/${v.slug}`, { replace: true });
      } else {
        setCodeInput(codeParam.toUpperCase());
        setCodeError("Aucun lieu actif ne correspond à ce code TikTok.");
      }
    }
  }, [codeParam, navigate]);

  const handleCodeSearch = () => {
    if (!codeInput.trim()) return;
    const venue = getVenueByCode(codeInput.trim());
    if (venue) {
      navigate(`/salle/${venue.slug}`);
    } else {
      setCodeError("Aucun lieu actif ne correspond à ce code TikTok.");
    }
  };

  const results = useMemo(() => {
    return searchVenues({
      query: query || undefined,
      city: city || undefined,
      eventType: eventType || undefined,
      minGuests: guests ? parseInt(guests) : undefined,
    });
  }, [query, city, eventType, guests]);

  return (
    <div className="min-h-screen bg-background">
      <DesktopNav />

      <div className="pt-32 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
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
              <span className="font-semibold text-foreground">{results.length}</span> salle{results.length !== 1 ? "s" : ""} trouvée{results.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="mb-4 rounded-lg border border-border bg-foreground p-3 text-primary-foreground luxury-shadow">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[auto_1fr_auto] md:items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-body font-semibold text-primary-foreground/60">Accès direct par code TikTok</p>
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => {
                    setCodeInput(e.target.value.toUpperCase());
                    setCodeError("");
                  }}
                  placeholder="Ex: WE-ROOF01 ou TT-PARIS-ROOF"
                  className="mt-1 w-full bg-transparent text-sm font-body font-semibold text-primary-foreground placeholder:text-primary-foreground/45 focus:outline-none"
                  onKeyDown={(e) => e.key === "Enter" && handleCodeSearch()}
                />
                {codeError && (
                  <p className="mt-1 text-[11px] font-body text-luxe-gold">{codeError}</p>
                )}
              </div>
              <button
                onClick={handleCodeSearch}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-body font-semibold text-primary-foreground hover:bg-primary-foreground hover:text-foreground transition-colors"
              >
                Ouvrir la fiche
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="rounded-lg border border-border bg-card px-3 py-1 text-[11px] font-body font-semibold text-muted-foreground">
              ou
            </span>
            <div className="h-px flex-1 bg-border" />
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
            Sélection affinée en temps réel
          </div>

          {results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((venue) => (
                <VenueGridCard key={venue.id} venue={venue} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 rounded-lg border border-border bg-card">
              <p className="font-heading text-2xl font-semibold mb-2">Aucune salle trouvée</p>
              <p className="text-muted-foreground font-body text-sm">Essayez une autre ville, un autre format ou un volume d'invités différent.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
