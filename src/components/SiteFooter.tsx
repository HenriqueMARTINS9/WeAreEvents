import { Link } from "react-router-dom";
import logoBlack from "@/assets/logo-black.svg";
import { useEstablishmentReferralModal } from "@/lib/establishment-referral-modal";

const SiteFooter = () => {
  const { openModal } = useEstablishmentReferralModal();

  return (
    <footer className="py-12 px-6 bg-foreground text-primary-foreground">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-4 xl:px-2">
        <div>
          <img src={logoBlack} alt="WeAreEvents" className="mb-4 h-8 md:h-9 brightness-0 invert" />
          <p className="text-primary-foreground/60 text-sm font-body leading-relaxed">
            La conciergerie de réservation de lieux événementiels pour les marques, entreprises et événements privés.
          </p>
        </div>
        <div>
          <h4 className="font-body font-semibold text-sm mb-3">Navigation</h4>
          <div className="space-y-2 text-primary-foreground/60 text-sm font-body">
            <Link to="/" className="hover:text-primary-foreground transition-colors">Accueil</Link>
            <button type="button" onClick={openModal} className="block hover:text-primary-foreground transition-colors">
              Référencer mon établissement
            </button>
          </div>
        </div>
        <div>
          <h4 className="font-body font-semibold text-sm mb-3">Légal</h4>
          <div className="space-y-2 text-primary-foreground/60 text-sm font-body">
            <p>Mentions légales</p>
            <p>CGU</p>
            <p>Confidentialité</p>
          </div>
        </div>
        <div>
          <h4 className="font-body font-semibold text-sm mb-3">Contact</h4>
          <div className="space-y-2 text-primary-foreground/60 text-sm font-body">
            <p>contact@wearevents.fr</p>
            <p>Paris, France</p>
            <button
              type="button"
              onClick={openModal}
              className="inline-flex rounded-lg border border-primary-foreground/15 px-3 py-2 text-primary-foreground transition-colors hover:bg-primary-foreground hover:text-foreground"
            >
              Référencer mon établissement
            </button>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-7xl border-t border-primary-foreground/10 pt-6 text-center text-xs font-body text-primary-foreground/40 xl:px-2">
        © 2026 WeAreEvents. Tous droits réservés.
      </div>
    </footer>
  );
};

export default SiteFooter;
