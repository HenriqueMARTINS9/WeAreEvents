import { Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import logoWhite from "@/assets/logo-white.svg";

interface MobileHeaderProps {
  onCodeSearch: () => void;
}

const MobileHeader = ({ onCodeSearch }: MobileHeaderProps) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 px-4 pt-4 pb-3 flex items-center justify-between">
      <div className="min-w-0">
        <img src={logoWhite} alt="WeAreEvents" className="h-8 drop-shadow" />
      </div>

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
