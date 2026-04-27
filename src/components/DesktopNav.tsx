import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import logoBlack from "@/assets/logo-black.svg";
import logoWhite from "@/assets/logo-white.svg";
import { useEstablishmentReferralModal } from "@/lib/establishment-referral-modal";
import VenueCodeSearch from "./VenueCodeSearch";

const DesktopNav = () => {
  const navRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const { openModal } = useEstablishmentReferralModal();
  const [showCodeSearch, setShowCodeSearch] = useState(false);
  const [useLightChrome, setUseLightChrome] = useState(false);

  useEffect(() => {
    const updateChrome = () => {
      const nav = navRef.current;
      if (!nav) return;

      const rect = nav.getBoundingClientRect();
      const sampleY = Math.min(window.innerHeight - 1, Math.max(0, rect.bottom - 12));
      const sampleXs = [0.16, 0.34, 0.5, 0.66, 0.84].map((ratio) => window.innerWidth * ratio);

      const lightThemeHits = sampleXs.filter((x) => {
        const elements = document.elementsFromPoint(x, sampleY);
        return elements.some((element) => {
          if (nav.contains(element)) return false;
          return Boolean(element.closest('[data-header-theme="light"]'));
        });
      }).length;

      setUseLightChrome(lightThemeHits >= 2);
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
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-[1000] backdrop-blur-xl transition-colors duration-300 ${
          useLightChrome ? "bg-foreground/10" : "bg-background/20"
        }`}
      >
        <div className="mx-auto grid h-20 min-h-20 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 xl:px-8">
          <Link to="/" className="shrink-0">
            <img
              src={useLightChrome ? logoWhite : logoBlack}
              alt="WeAreEvents"
              className="h-8 transition-opacity duration-300 xl:h-9"
            />
          </Link>
          <div className="flex items-center justify-center gap-8 xl:gap-10">
            <Link
              to="/recherche"
              className={`text-sm font-body font-medium transition-colors ${
                useLightChrome
                  ? "text-primary-foreground/75 hover:text-primary-foreground"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              Trouver ma salle
            </Link>
            <Link
              to="/blog"
              className={`text-sm font-body font-medium transition-colors ${
                useLightChrome
                  ? "text-primary-foreground/75 hover:text-primary-foreground"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              Blog
            </Link>
            <button
              type="button"
              onClick={openModal}
              className={`text-sm font-body font-medium transition-colors ${
                useLightChrome
                  ? "text-primary-foreground/75 hover:text-primary-foreground"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              Référencer mon établissement
            </button>
          </div>
          <div className="flex items-center justify-end">
            <button
              onClick={() => setShowCodeSearch(true)}
              className={`hidden items-center gap-2 rounded-lg border px-3 py-2 text-sm font-body font-semibold transition-colors sm:inline-flex ${
                useLightChrome
                  ? "border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:border-primary-foreground/40"
                  : "border-border bg-card text-foreground hover:border-primary/40"
              }`}
            >
              <Search className={`w-4 h-4 ${useLightChrome ? "text-luxe-gold" : "text-primary"}`} />
              Code lieu
            </button>
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
