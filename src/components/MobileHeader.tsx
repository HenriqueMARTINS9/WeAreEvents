import { Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import logoWhite from "@/assets/logo-white.svg";
import { useEstablishmentReferralModal } from "@/lib/establishment-referral-modal";

interface MobileHeaderProps {
  onCodeSearch: () => void;
}

const MobileHeader = ({ onCodeSearch }: MobileHeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { openModal } = useEstablishmentReferralModal();

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[1000] flex items-center justify-between px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/" className="min-w-0" aria-label="Retour à l'accueil">
          <img src={logoWhite} alt="wearevents" className="h-8 drop-shadow" />
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg glass text-primary-foreground shadow-lg active:scale-[0.98] transition-transform"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-[2200] bg-foreground/78 backdrop-blur-md">
          <div className="ml-auto flex h-full w-[82vw] max-w-sm flex-col bg-background px-5 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))] text-foreground luxury-shadow animate-slide-up">
            <div className="flex items-center justify-between">
              <img src={logoWhite} alt="wearevents" className="h-8 brightness-0" />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground"
                aria-label="Fermer le menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="mt-10 flex flex-col gap-3 font-body text-lg font-semibold">
              <Link to="/" onClick={() => setMenuOpen(false)} className="rounded-lg border border-border px-4 py-3">
                Accueil
              </Link>
              <Link to="/recherche" onClick={() => setMenuOpen(false)} className="rounded-lg border border-border px-4 py-3">
                Trouver ma salle
              </Link>
              <Link to="/blog" onClick={() => setMenuOpen(false)} className="rounded-lg border border-border px-4 py-3">
                Blog
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  openModal();
                }}
                className="rounded-lg border border-border px-4 py-3 text-left"
              >
                Référencer mon établissement
              </button>
            </nav>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onCodeSearch();
              }}
              className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-3 text-sm font-body font-semibold text-primary-foreground"
            >
              <Search className="h-4 w-4" />
              Code lieu
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileHeader;
