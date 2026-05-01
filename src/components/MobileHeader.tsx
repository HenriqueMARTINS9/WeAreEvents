import { Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import logoWhite from "@/assets/logo-white.svg";

interface MobileHeaderProps {
  onCodeSearch: () => void;
}

const MobileHeader = ({ onCodeSearch }: MobileHeaderProps) => {
  return (
    <div className="fixed inset-x-0 top-0 z-[1000] flex items-center justify-between px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
      <Link to="/" className="min-w-0" aria-label="Retour à l'accueil">
        <img src={logoWhite} alt="WeAreEvents" className="h-8 drop-shadow" />
      </Link>

      <div className="flex flex-col items-end gap-2">
        <button
          onClick={onCodeSearch}
          className="flex items-center gap-2 rounded-lg glass px-3 py-2 text-xs font-body font-semibold text-primary-foreground shadow-lg active:scale-[0.98] transition-transform"
        >
          <Search className="w-4 h-4" />
          Code lieu
        </button>
        <Link
          to="/recherche"
          className="flex items-center gap-2 rounded-lg glass px-3 py-2 text-xs font-body font-semibold text-primary-foreground shadow-lg active:scale-[0.98] transition-transform"
        >
          <Sparkles className="w-4 h-4" />
          Trouver ma salle
        </Link>
      </div>
    </div>
  );
};

export default MobileHeader;
