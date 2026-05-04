import { ArrowRight, Building2, FileText, Home, Menu, Search, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import logoBlack from "@/assets/logo-black.svg";
import logoWhite from "@/assets/logo-white.svg";
import { useEstablishmentReferralModal } from "@/lib/establishment-referral-modal";

interface MobileHeaderProps {
  onCodeSearch: () => void;
}

const MobileHeader = ({ onCodeSearch }: MobileHeaderProps) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [useLightChrome, setUseLightChrome] = useState(false);
  const { openModal } = useEstablishmentReferralModal();

  useEffect(() => {
    const updateChrome = () => {
      const header = headerRef.current;
      if (!header) return;

      const rect = header.getBoundingClientRect();
      const sampleY = Math.min(window.innerHeight - 1, Math.max(0, rect.bottom - 8));
      const sampleXs = [0.2, 0.5, 0.8].map((ratio) => window.innerWidth * ratio);

      const lightThemeHits = sampleXs.filter((x) => {
        const elements = document.elementsFromPoint(x, sampleY);
        return elements.some((element) => {
          if (header.contains(element)) return false;
          return Boolean(element.closest('[data-header-theme="light"]'));
        });
      }).length;

      setUseLightChrome(lightThemeHits >= 1);
    };

    updateChrome();
    window.addEventListener("scroll", updateChrome, { passive: true });
    window.addEventListener("resize", updateChrome);

    return () => {
      window.removeEventListener("scroll", updateChrome);
      window.removeEventListener("resize", updateChrome);
    };
  }, []);

  return (
    <>
      <div ref={headerRef} className="fixed inset-x-0 top-0 z-[1000] flex items-center justify-between px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/" className="min-w-0" aria-label="Retour à l'accueil">
          <img
            src={useLightChrome ? logoWhite : logoBlack}
            alt="wearevents"
            className="h-8 drop-shadow transition-opacity duration-300"
          />
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className={`flex h-10 w-10 items-center justify-center rounded-lg shadow-lg transition-all active:scale-[0.98] ${
            useLightChrome
              ? "glass text-primary-foreground"
              : "border border-border bg-background/80 text-foreground backdrop-blur-xl"
          }`}
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-[2200] bg-foreground/78 backdrop-blur-md" onClick={() => setMenuOpen(false)}>
          <div
            className="ml-auto flex h-full w-[86vw] max-w-sm flex-col bg-background text-foreground luxury-shadow animate-slide-up"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bg-foreground px-5 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))] text-primary-foreground">
            <div className="flex items-center justify-between">
              <img src={logoWhite} alt="wearevents" className="h-8" />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary-foreground/15 bg-primary-foreground/10 text-primary-foreground"
                aria-label="Fermer le menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
              <p className="mt-6 max-w-xs font-heading text-3xl font-semibold leading-tight">
                Trouvez un lieu, réservez sans perdre de temps.
              </p>
              <p className="mt-3 text-sm font-body leading-relaxed text-primary-foreground/68">
                Des salles vérifiées, des demandes simples et des réponses rapides.
              </p>
            </div>

            <nav className="flex flex-col gap-2 px-5 py-5 font-body">
              <MobileMenuLink to="/" label="Accueil" icon={<Home className="h-4 w-4" />} onClick={() => setMenuOpen(false)} />
              <MobileMenuLink to="/recherche" label="Trouver ma salle" icon={<Sparkles className="h-4 w-4" />} onClick={() => setMenuOpen(false)} />
              <MobileMenuLink to="/blog" label="Blog" icon={<FileText className="h-4 w-4" />} onClick={() => setMenuOpen(false)} />
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  openModal();
                }}
                className="group flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors active:scale-[0.99]"
              >
                <span className="flex items-center gap-3 text-sm font-semibold">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
                    <Building2 className="h-4 w-4" />
                  </span>
                  Référencer mon établissement
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </button>
            </nav>

            <div className="mt-auto px-5 pb-6">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onCodeSearch();
                }}
                className="group flex w-full items-center justify-between rounded-lg bg-foreground px-4 py-3 text-left text-primary-foreground transition-transform active:scale-[0.98]"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/10 text-primary">
                    <Search className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-body font-semibold">Code lieu</span>
                    <span className="mt-0.5 block text-xs font-body text-primary-foreground/60">Accéder à une salle vue sur mobile</span>
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 text-primary-foreground/50 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const MobileMenuLink = ({ to, label, icon, onClick }: { to: string; label: string; icon: React.ReactNode; onClick: () => void }) => (
  <Link
    to={to}
    onClick={onClick}
    className="group flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-colors active:scale-[0.99]"
  >
    <span className="flex items-center gap-3 text-sm font-body font-semibold">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
        {icon}
      </span>
      {label}
    </span>
    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
  </Link>
);

export default MobileHeader;
