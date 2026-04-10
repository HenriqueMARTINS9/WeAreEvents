import { useState } from "react";
import { Search, MapPin, Users, Calendar, Tag, Star, ArrowRight, ChevronRight, Sparkles, Building2, CheckCircle } from "lucide-react";
import { mockVenues, getVenueByCode } from "@/data/venues";
import { EVENT_TYPES } from "@/types/venue";
import type { Venue } from "@/types/venue";
import { useNavigate } from "react-router-dom";
import logoBlack from "@/assets/logo-black.svg";
import DesktopNav from "./DesktopNav";
import VenueGridCard from "./VenueGridCard";

const DesktopHome = () => {
  const navigate = useNavigate();
  const [codeInput, setCodeInput] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [searchEventType, setSearchEventType] = useState("");
  const [searchGuests, setSearchGuests] = useState("");
  const featured = mockVenues.filter((v) => v.featured && v.active);

  const handleCodeSearch = () => {
    if (!codeInput.trim()) return;
    const venue = getVenueByCode(codeInput.trim());
    if (venue) {
      navigate(`/salle/${venue.slug}`);
    } else {
      navigate(`/recherche?code=${codeInput.trim()}`);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchCity) params.set("city", searchCity);
    if (searchEventType) params.set("type", searchEventType);
    if (searchGuests) params.set("guests", searchGuests);
    navigate(`/recherche?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <DesktopNav />

      {/* Hero */}
      <section className="relative h-[85vh] min-h-[600px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1920&q=80"
          alt="WeAreEvents hero"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/40 via-foreground/30 to-foreground/70" />

        <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
          <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl text-primary-foreground font-bold leading-tight mb-4 max-w-4xl">
            Trouvez la salle parfaite pour votre événement
          </h1>
          <p className="text-primary-foreground/80 text-lg md:text-xl font-body mb-10 max-w-2xl">
            Découvrez des lieux d'exception à travers la France. Du rooftop parisien au château de la Loire.
          </p>

          {/* Search card */}
          <div className="w-full max-w-4xl bg-background/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl">
            {/* Code search */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
              <Tag className="w-5 h-5 text-primary shrink-0" />
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="Entrez un code TikTok (ex: WE-ROOF01)"
                className="flex-1 text-sm font-body bg-transparent focus:outline-none placeholder:text-muted-foreground"
                onKeyDown={(e) => e.key === "Enter" && handleCodeSearch()}
              />
              <button
                onClick={handleCodeSearch}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-body font-semibold hover:bg-primary/90 transition-colors"
              >
                Trouver
              </button>
            </div>

            {/* Multi-filter search */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/50 border border-border">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <select
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="flex-1 bg-transparent text-sm font-body focus:outline-none"
                >
                  <option value="">Toutes les villes</option>
                  {[...new Set(mockVenues.map((v) => v.city))].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/50 border border-border">
                <Sparkles className="w-4 h-4 text-muted-foreground shrink-0" />
                <select
                  value={searchEventType}
                  onChange={(e) => setSearchEventType(e.target.value)}
                  className="flex-1 bg-transparent text-sm font-body focus:outline-none"
                >
                  <option value="">Type d'événement</option>
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/50 border border-border">
                <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="number"
                  value={searchGuests}
                  onChange={(e) => setSearchGuests(e.target.value)}
                  placeholder="Nb de personnes"
                  className="flex-1 bg-transparent text-sm font-body focus:outline-none"
                />
              </div>
              <button
                onClick={handleSearch}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-body font-semibold hover:bg-primary/90 transition-colors"
              >
                <Search className="w-4 h-4" />
                Rechercher
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-muted-foreground font-body mb-12 max-w-xl mx-auto">
            Du TikTok à la réservation, en quelques clics.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Tag className="w-8 h-8" />, title: "Découvrez sur TikTok", desc: "Repérez une salle dans nos vidéos et notez son code unique." },
              { icon: <Search className="w-8 h-8" />, title: "Retrouvez la salle", desc: "Entrez le code sur notre site pour accéder directement à la fiche complète." },
              { icon: <CheckCircle className="w-8 h-8" />, title: "Réservez", desc: "Envoyez votre demande en quelques secondes. On s'occupe du reste." },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center p-6 rounded-2xl bg-muted/30 hover:bg-rose-bg transition-colors">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  {step.icon}
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm font-body">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured venues */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-2">
                Salles à la une
              </h2>
              <p className="text-muted-foreground font-body">
                Nos lieux les plus demandés ce mois-ci.
              </p>
            </div>
            <button
              onClick={() => navigate("/recherche")}
              className="hidden md:flex items-center gap-1 text-primary font-body font-semibold text-sm hover:gap-2 transition-all"
            >
              Voir toutes les salles
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((venue) => (
              <VenueGridCard key={venue.id} venue={venue} />
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <button
              onClick={() => navigate("/recherche")}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-body font-semibold text-sm"
            >
              Voir toutes les salles
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-12">
            Ils nous font confiance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Sophie M.", text: "Un service exceptionnel ! La salle était encore plus belle que sur TikTok. Merci WeAreEvents !", rating: 5 },
              { name: "Thomas D.", text: "Réservation ultra simple, réponse en 24h. Notre séminaire d'entreprise était parfait.", rating: 5 },
              { name: "Julie R.", text: "On a trouvé notre lieu de mariage grâce à un code TikTok. Le concept est génial !", rating: 5 },
            ].map((t, i) => (
              <div key={i} className="p-6 rounded-2xl bg-muted/30 text-left">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm font-body text-foreground/80 mb-4 italic">"{t.text}"</p>
                <p className="font-body font-semibold text-sm">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-rose text-primary-foreground text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Prêt à organiser votre événement ?
          </h2>
          <p className="font-body text-primary-foreground/80 mb-8">
            Parcourez nos salles ou entrez votre code TikTok pour commencer.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate("/recherche")}
              className="px-8 py-3 rounded-xl bg-background text-foreground font-body font-semibold text-sm hover:bg-background/90 transition-colors"
            >
              Trouver ma salle
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-foreground text-primary-foreground">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img src={logoBlack} alt="WeAreEvents" className="h-6 mb-4 brightness-0 invert" />
            <p className="text-primary-foreground/60 text-sm font-body">
              La plateforme de découverte et réservation de salles événementielles en France.
            </p>
          </div>
          <div>
            <h4 className="font-body font-semibold text-sm mb-3">Navigation</h4>
            <div className="space-y-2 text-primary-foreground/60 text-sm font-body">
              <p className="hover:text-primary-foreground cursor-pointer">Accueil</p>
              <p className="hover:text-primary-foreground cursor-pointer">Toutes les salles</p>
              <p className="hover:text-primary-foreground cursor-pointer">Comment ça marche</p>
            </div>
          </div>
          <div>
            <h4 className="font-body font-semibold text-sm mb-3">Légal</h4>
            <div className="space-y-2 text-primary-foreground/60 text-sm font-body">
              <p className="hover:text-primary-foreground cursor-pointer">Mentions légales</p>
              <p className="hover:text-primary-foreground cursor-pointer">CGU</p>
              <p className="hover:text-primary-foreground cursor-pointer">Politique de confidentialité</p>
            </div>
          </div>
          <div>
            <h4 className="font-body font-semibold text-sm mb-3">Contact</h4>
            <div className="space-y-2 text-primary-foreground/60 text-sm font-body">
              <p>contact@wearevents.fr</p>
              <p>Paris, France</p>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-primary-foreground/10 text-center text-primary-foreground/40 text-xs font-body">
          © 2026 WeAreEvents. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
};

export default DesktopHome;
