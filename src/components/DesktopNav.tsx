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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/70">
        <div className="mx-auto flex h-[4.5rem] min-h-16 max-w-7xl items-center justify-between gap-4 px-6 xl:px-8">
          <Link to="/" className="shrink-0">
            <img src={logoBlack} alt="WeAreEvents" className="h-6" />
          </Link>
          <div className="flex items-center gap-3 xl:gap-5">
            <Link to="/recherche" className="text-sm font-body font-medium text-foreground/70 hover:text-foreground transition-colors">
              Toutes les salles
            </Link>
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
              className="px-4 py-2 rounded-lg bg-foreground text-primary-foreground text-sm font-body font-semibold hover:bg-primary transition-colors"
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
