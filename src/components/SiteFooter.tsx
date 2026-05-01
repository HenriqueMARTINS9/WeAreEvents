import { Link } from "react-router-dom";
import logoBlack from "@/assets/logo-black.svg";
import { useEstablishmentReferralModal } from "@/lib/establishment-referral-modal";

const SiteFooter = () => {
  const { openModal } = useEstablishmentReferralModal();

  return (
    <footer className="py-12 px-6 bg-background text-foreground">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-4 xl:px-2">
        <div>
          <img src={logoBlack} alt="WeAreEvents" className="mb-4 h-8 md:h-9" />
        </div>
        <div>
          <h4 className="font-body font-semibold text-sm mb-3">Navigation</h4>
          <div className="space-y-2 text-muted-foreground text-sm font-body">
            <Link to="/" className="hover:text-foreground transition-colors">Accueil</Link>
            <Link to="/blog" className="block hover:text-foreground transition-colors">Blog</Link>
            <button type="button" onClick={openModal} className="block hover:text-foreground transition-colors">
              Référencer mon établissement
            </button>
          </div>
        </div>
        <div>
          <h4 className="font-body font-semibold text-sm mb-3">Légal</h4>
          <div className="space-y-2 text-muted-foreground text-sm font-body">
            <p>Mentions légales</p>
            <p>CGU</p>
            <p>Confidentialité</p>
          </div>
        </div>
        <div>
          <h4 className="font-body font-semibold text-sm mb-3">Contact</h4>
          <div className="space-y-2 text-muted-foreground text-sm font-body">
            <p>contact@wearevents.fr</p>
            <p>Paris, France</p>
            <button
              type="button"
              onClick={openModal}
              className="inline-flex rounded-lg border border-border px-3 py-2 text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              Référencer mon établissement
            </button>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-7xl border-t border-border pt-6 text-center text-xs font-body text-muted-foreground xl:px-2">
        © 2026 WeAreEvents. Tous droits réservés.
      </div>
    </footer>
  );
};

export default SiteFooter;
