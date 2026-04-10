import { Search } from "lucide-react";
import logoWhite from "@/assets/logo-white.svg";

interface MobileHeaderProps {
  onCodeSearch: () => void;
}

const MobileHeader = ({ onCodeSearch }: MobileHeaderProps) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 p-4 flex items-center justify-between">
      <img src={logoWhite} alt="WeAreEvents" className="h-7" />

      <button
        onClick={onCodeSearch}
        className="flex items-center gap-2 px-3 py-2 rounded-full glass text-primary-foreground text-xs font-body font-medium"
      >
        <Search className="w-4 h-4" />
        Code TikTok
      </button>
    </div>
  );
};

export default MobileHeader;
