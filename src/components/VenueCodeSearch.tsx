import { useState } from "react";
import { X, Search, ArrowRight } from "lucide-react";
import { getVenueByCode, mockTikTokCodeMappings } from "@/data/venues";
import type { Venue } from "@/types/venue";

interface VenueCodeSearchProps {
  onClose: () => void;
  onVenueFound: (venue: Venue) => void;
  mode?: "default" | "entry";
}

const VenueCodeSearch = ({ onClose, onVenueFound, mode = "default" }: VenueCodeSearchProps) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const exampleCodes = mockTikTokCodeMappings.slice(0, 2).map((mapping) => mapping.code).join(" ou ");
  const isEntryMode = mode === "entry";

  const copy = isEntryMode
    ? {
        eyebrow: "Accès direct depuis les réseaux",
        title: "Tu viens d'Insta ou TikTok ?",
        description: "Voici où entrer ton code pour retrouver immédiatement le lieu, le tarif indicatif et la demande de disponibilité.",
        helper: "Sinon, continue simplement vers la découverte.",
        buttonLabel: "Accéder au lieu",
      }
    : {
        eyebrow: "Accès direct au lieu",
        title: "Entrer un code TikTok",
        description: "Entrez le code aperçu dans la vidéo pour retrouver la fiche, le tarif indicatif et la demande de disponibilité.",
        helper: "",
        buttonLabel: "",
      };

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
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-x-hidden sm:items-center">
      <div className="absolute inset-0 bg-foreground/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full overflow-x-hidden rounded-t-lg bg-background p-6 pb-8 animate-slide-up luxury-shadow sm:max-w-md sm:rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="font-body text-xs font-semibold text-primary mb-1">{copy.eyebrow}</p>
            <h3 className="font-heading text-2xl font-semibold">{copy.title}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isEntryMode && (
          <div className="mb-5 flex flex-wrap gap-2">
            {["Instagram", "TikTok"].map((source) => (
              <span
                key={source}
                className="inline-flex items-center rounded-lg border border-primary/20 bg-secondary px-3 py-2 text-xs font-body font-semibold text-foreground"
              >
                {source}
              </span>
            ))}
          </div>
        )}

        <p className="text-muted-foreground text-sm font-body leading-relaxed mb-5">
          {copy.description}
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
            className="brand-primary-button inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-primary-foreground transition-all hover:brightness-95"
          >
            {isEntryMode && <span className="hidden text-sm font-body font-semibold sm:inline">{copy.buttonLabel}</span>}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <p className="text-destructive text-xs font-body mt-2">{error}</p>
        )}

        {isEntryMode && (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 text-sm font-body font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {copy.helper}
          </button>
        )}
      </div>
    </div>
  );
};

export default VenueCodeSearch;
