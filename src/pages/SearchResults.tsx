import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, MapPin, Users, SlidersHorizontal, Tag } from "lucide-react";
import { searchVenues, mockVenues, getVenueByCode } from "@/data/venues";
import { EVENT_TYPES } from "@/types/venue";
import DesktopNav from "@/components/DesktopNav";
import VenueGridCard from "@/components/VenueGridCard";
import { useEffect } from "react";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [eventType, setEventType] = useState(searchParams.get("type") || "");
  const [guests, setGuests] = useState(searchParams.get("guests") || "");
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const codeParam = searchParams.get("code");

  useEffect(() => {
    if (codeParam) {
      const v = getVenueByCode(codeParam);
      if (v) navigate(`/salle/${v.slug}`, { replace: true });
    }
  }, [codeParam, navigate]);

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

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-heading text-3xl font-bold mb-6">Toutes les salles</h1>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-8">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted border border-border">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher..."
                className="bg-transparent text-sm font-body focus:outline-none w-32"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted border border-border">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <select value={city} onChange={(e) => setCity(e.target.value)} className="bg-transparent text-sm font-body focus:outline-none">
                <option value="">Ville</option>
                {[...new Set(mockVenues.map((v) => v.city))].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted border border-border">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="bg-transparent text-sm font-body focus:outline-none">
                <option value="">Type</option>
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted border border-border">
              <Users className="w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                placeholder="Personnes"
                className="bg-transparent text-sm font-body focus:outline-none w-24"
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground font-body mb-6">
            {results.length} salle{results.length !== 1 ? "s" : ""} trouvée{results.length !== 1 ? "s" : ""}
          </p>

          {results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((venue) => (
                <VenueGridCard key={venue.id} venue={venue} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="font-heading text-xl font-semibold mb-2">Aucune salle trouvée</p>
              <p className="text-muted-foreground font-body text-sm">Essayez de modifier vos critères de recherche.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
