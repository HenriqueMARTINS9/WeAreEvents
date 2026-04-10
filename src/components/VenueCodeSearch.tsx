import { useState } from "react";
import { X, Search, ArrowRight } from "lucide-react";
import { getVenueByCode, mockTikTokCodeMappings } from "@/data/venues";
import type { Venue } from "@/types/venue";

interface VenueCodeSearchProps {
  onClose: () => void;
  onVenueFound: (venue: Venue) => void;
}

const VenueCodeSearch = ({ onClose, onVenueFound }: VenueCodeSearchProps) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const exampleCodes = mockTikTokCodeMappings.slice(0, 2).map((mapping) => mapping.code).join(" ou ");

  const handleSearch = () => {
    if (!code.trim()) return;
    const venue = getVenueByCode(code.trim());
    if (venue) {
      onVenueFound(venue);
    } else {
      setError("Aucune salle trouvée avec ce code. Vérifiez et réessayez.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-foreground/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-background rounded-t-lg sm:rounded-lg p-6 pb-8 animate-slide-up luxury-shadow">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="font-body text-xs font-semibold text-primary mb-1">Accès direct au lieu</p>
            <h3 className="font-heading text-2xl font-semibold">Entrer un code TikTok</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-muted-foreground text-sm font-body leading-relaxed mb-5">
          Entrez le code aperçu dans la vidéo pour retrouver la fiche, le tarif indicatif et la demande de disponibilité.
        </p>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError("");
              }}
              placeholder={`Ex: ${exampleCodes}`}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-card text-sm font-body font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              autoFocus
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-foreground transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <p className="text-destructive text-xs font-body mt-2">{error}</p>
        )}
      </div>
    </div>
  );
};

export default VenueCodeSearch;
