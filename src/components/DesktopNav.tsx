import { Link } from "react-router-dom";
import logoBlack from "@/assets/logo-black.svg";

const DesktopNav = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/70">
      <div className="max-w-6xl mx-auto px-6 h-[4.5rem] min-h-16 flex items-center justify-between">
        <Link to="/">
          <img src={logoBlack} alt="WeAreEvents" className="h-6" />
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/recherche" className="text-sm font-body font-medium text-foreground/70 hover:text-foreground transition-colors">
            Toutes les salles
          </Link>
          <span className="hidden lg:inline text-sm font-body text-muted-foreground">
            Réponse sous 24h
          </span>
          <Link
            to="/recherche"
            className="px-4 py-2 rounded-lg bg-foreground text-primary-foreground text-sm font-body font-semibold hover:bg-primary transition-colors"
          >
            Trouver ma salle
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default DesktopNav;
