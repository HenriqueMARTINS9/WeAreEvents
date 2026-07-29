import { Link } from "react-router-dom";
import { Instagram, Linkedin, Music2 } from "lucide-react";
import logoBlack from "@/assets/logo-black.svg";
import { socialLinks, type SocialPlatform } from "@/data/social-links";
import { useEstablishmentReferralModal } from "@/lib/establishment-referral-modal";
import { resetGoogleConsentChoice } from "@/lib/analytics";

interface SiteFooterProps {
  variant?: "light" | "dark";
}

const SiteFooter = ({ variant = "light" }: SiteFooterProps) => {
  const { openModal } = useEstablishmentReferralModal();
  const isDark = variant === "dark";
  const getSocialIcon = (platform: SocialPlatform) => {
    if (platform === "instagram") return <Instagram className="h-4 w-4" />;
    if (platform === "linkedin") return <Linkedin className="h-4 w-4" />;
    return <Music2 className="h-4 w-4" />;
  };

  return (
    <footer className={`py-12 px-6 ${isDark ? "bg-foreground text-primary-foreground" : "bg-background text-foreground"}`}>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-4 xl:px-2">
        <div>
          <img src={logoBlack} alt="Wearevents" className={`mb-4 h-8 md:h-9 ${isDark ? "brightness-0 invert" : ""}`} />
          <div className="flex items-center gap-2">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`Suivre Wearevents sur ${link.label}`}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                  isDark
                    ? "border-primary-foreground/15 text-primary-foreground/75 hover:bg-primary-foreground hover:text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                }`}
              >
                {getSocialIcon(link.platform)}
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-body font-semibold text-sm mb-3">Navigation</h4>
          <div className={`space-y-2 text-sm font-body ${isDark ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
            <Link to="/" className={`transition-colors ${isDark ? "hover:text-primary-foreground" : "hover:text-foreground"}`}>Accueil</Link>
            <Link to="/inspirations" className={`block transition-colors ${isDark ? "hover:text-primary-foreground" : "hover:text-foreground"}`}>Inspirations</Link>
            <Link to="/blog" className={`block transition-colors ${isDark ? "hover:text-primary-foreground" : "hover:text-foreground"}`}>Blog</Link>
            <Link to="/faq" className={`block transition-colors ${isDark ? "hover:text-primary-foreground" : "hover:text-foreground"}`}>FAQ</Link>
            <Link to="/reseaux-sociaux" className={`block transition-colors ${isDark ? "hover:text-primary-foreground" : "hover:text-foreground"}`}>Réseaux sociaux</Link>
            <button type="button" onClick={openModal} className={`block transition-colors ${isDark ? "hover:text-primary-foreground" : "hover:text-foreground"}`}>
              Référencer mon établissement
            </button>
          </div>
        </div>
        <div>
          <h4 className="font-body font-semibold text-sm mb-3">Légal</h4>
          <div className={`space-y-2 text-sm font-body ${isDark ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
            <Link to="/mentions-legales" className={`block transition-colors ${isDark ? "hover:text-primary-foreground" : "hover:text-foreground"}`}>Mentions légales</Link>
            <Link to="/cgu" className={`block transition-colors ${isDark ? "hover:text-primary-foreground" : "hover:text-foreground"}`}>CGU</Link>
            <Link to="/politique-confidentialite" className={`block transition-colors ${isDark ? "hover:text-primary-foreground" : "hover:text-foreground"}`}>Confidentialité</Link>
            <button type="button" onClick={resetGoogleConsentChoice} className={`block text-left transition-colors ${isDark ? "hover:text-primary-foreground" : "hover:text-foreground"}`}>
              Préférences cookies
            </button>
          </div>
        </div>
        <div>
          <h4 className="font-body font-semibold text-sm mb-3">Contact</h4>
          <div className={`space-y-2 text-sm font-body ${isDark ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
            <a
              href="mailto:contact@wearevents.fr"
              className={`block transition-colors ${isDark ? "hover:text-primary-foreground" : "hover:text-foreground"}`}
            >
              contact@wearevents.fr
            </a>
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
        © 2026 Wearevents. Tous droits réservés.
      </div>
    </footer>
  );
};

export default SiteFooter;
