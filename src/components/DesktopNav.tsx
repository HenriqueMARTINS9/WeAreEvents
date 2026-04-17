import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import logoBlack from "@/assets/logo-black.svg";
import { useEstablishmentReferralModal } from "@/lib/establishment-referral-modal";
import VenueCodeSearch from "./VenueCodeSearch";

const DesktopNav = () => {
  const navigate = useNavigate();
  const { openModal } = useEstablishmentReferralModal();
  const [showCodeSearch, setShowCodeSearch] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/20 backdrop-blur-xl">
        <div className="mx-auto flex h-20 min-h-20 max-w-7xl items-center justify-between gap-4 px-6 xl:px-8">
          <Link to="/" className="shrink-0">
            <img src={logoBlack} alt="WeAreEvents" className="h-8 xl:h-9" />
          </Link>
          <div className="flex items-center gap-3 xl:gap-5">
            <button
              type="button"
              onClick={openModal}
              className="hidden xl:inline text-sm font-body font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              Référencer mon établissement
            </button>
            <button
              onClick={() => setShowCodeSearch(true)}
              className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-body font-semibold text-foreground hover:border-primary/40 transition-colors"
            >
              <Search className="w-4 h-4 text-primary" />
              Code lieu
            </button>
            <Link
              to="/recherche"
              className="brand-primary-button inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-body font-semibold text-primary-foreground transition-all hover:brightness-95"
            >
              Trouver ma salle
            </Link>
          </div>
        </div>
      </nav>

      {showCodeSearch && (
        <VenueCodeSearch
          onClose={() => setShowCodeSearch(false)}
          onVenueFound={(venue) => {
            setShowCodeSearch(false);
            navigate(`/salle/${venue.slug}`);
          }}
        />
      )}
    </>
  );
};

export default DesktopNav;
