import { Link } from "react-router-dom";
import logoBlack from "@/assets/logo-black.svg";
import { useEstablishmentReferralModal } from "@/lib/establishment-referral-modal";

interface SiteFooterProps {
  variant?: "light" | "dark";
}

const SiteFooter = ({ variant = "light" }: SiteFooterProps) => {
  const { openModal } = useEstablishmentReferralModal();
  const isDark = variant === "dark";

  return (
    <footer className={`py-12 px-6 ${isDark ? "bg-foreground text-primary-foreground" : "bg-background text-foreground"}`}>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-4 xl:px-2">
        <div>
          <img src={logoBlack} alt="wearevents" className={`mb-4 h-8 md:h-9 ${isDark ? "brightness-0 invert" : ""}`} />
        </div>
        <div>
          <h4 className="font-body font-semibold text-sm mb-3">Navigation</h4>
          <div className={`space-y-2 text-sm font-body ${isDark ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
            <Link to="/" className={`transition-colors ${isDark ? "hover:text-primary-foreground" : "hover:text-foreground"}`}>Accueil</Link>
            <Link to="/blog" className={`block transition-colors ${isDark ? "hover:text-primary-foreground" : "hover:text-foreground"}`}>Blog</Link>
            <button type="button" onClick={openModal} className={`block transition-colors ${isDark ? "hover:text-primary-foreground" : "hover:text-foreground"}`}>
              Référencer mon établissement
            </button>
          </div>
        </div>
        <div>
          <h4 className="font-body font-semibold text-sm mb-3">Légal</h4>
          <div className={`space-y-2 text-sm font-body ${isDark ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
            <p>Mentions légales</p>
            <p>CGU</p>
            <p>Confidentialité</p>
          </div>
        </div>
        <div>
          <h4 className="font-body font-semibold text-sm mb-3">Contact</h4>
          <div className={`space-y-2 text-sm font-body ${isDark ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
            <p>contact@wearevents.fr</p>
            <p>Paris, France</p>
            <button
              type="button"
              onClick={openModal}
              className={`inline-flex rounded-lg border px-3 py-2 transition-colors ${
                isDark
                  ? "border-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground hover:text-foreground"
                  : "border-border text-foreground hover:border-primary/40 hover:text-primary"
              }`}
            >
              Référencer mon établissement
            </button>
          </div>
        </div>
      </div>
      <div className={`mx-auto mt-8 max-w-7xl border-t pt-6 text-center text-xs font-body xl:px-2 ${
        isDark ? "border-primary-foreground/10 text-primary-foreground/40" : "border-border text-muted-foreground"
      }`}>
        © 2026 wearevents. Tous droits réservés.
      </div>
    </footer>
  );
};

export default SiteFooter;
