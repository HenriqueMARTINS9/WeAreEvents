import { useState } from "react";
import { X, Search, ArrowRight } from "lucide-react";
import { getVenueByCode } from "@/data/venues";
import type { Venue } from "@/types/venue";

interface VenueCodeSearchProps {
  onClose: () => void;
  onVenueFound: (venue: Venue) => void;
}

const VenueCodeSearch = ({ onClose, onVenueFound }: VenueCodeSearchProps) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

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
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-background rounded-t-2xl sm:rounded-2xl p-6 pb-8 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-heading text-xl font-bold">Entrer un code TikTok</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-muted-foreground text-sm font-body mb-4">
          Entrez le code affiché dans la vidéo TikTok pour retrouver la salle exacte.
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
              placeholder="Ex: WE-ROOF01"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-muted/50 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              autoFocus
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-3 rounded-xl bg-primary text-primary-foreground"
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
