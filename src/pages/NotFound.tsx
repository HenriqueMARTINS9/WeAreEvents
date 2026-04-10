import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center max-w-md">
        <h1 className="font-heading text-7xl font-bold text-primary mb-4">404</h1>
        <h2 className="font-heading text-2xl font-semibold mb-3">Page introuvable</h2>
        <p className="text-muted-foreground font-body text-sm mb-8">
          Cette page n'existe pas ou a été déplacée. Pas de panique, votre prochaine salle vous attend !
        </p>
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-body font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          <Home className="w-4 h-4" />
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
};

export default NotFound;
