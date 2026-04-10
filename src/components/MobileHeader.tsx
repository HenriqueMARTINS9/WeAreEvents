import { Search } from "lucide-react";
import logoWhite from "@/assets/logo-white.svg";

interface MobileHeaderProps {
  onCodeSearch: () => void;
}

const MobileHeader = ({ onCodeSearch }: MobileHeaderProps) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 px-4 pt-4 pb-3 flex items-center justify-between">
      <div className="min-w-0">
        <img src={logoWhite} alt="WeAreEvents" className="h-7 drop-shadow" />
        <p className="mt-1 truncate text-[10px] font-body text-primary-foreground/70">
          Lieux sélectionnés, réponse sous 24h
        </p>
      </div>

      <button
        onClick={onCodeSearch}
        className="flex items-center gap-2 rounded-lg glass px-3 py-2 text-xs font-body font-semibold text-primary-foreground shadow-lg active:scale-[0.98] transition-transform"
      >
        <Search className="w-4 h-4" />
        Code lieu
      </button>
    </div>
  );
};

export default MobileHeader;
