import { useState } from "react";
import {
  Search,
  MapPin,
  Users,
  Tag,
  Star,
  ChevronRight,
  Sparkles,
  CheckCircle,
  ShieldCheck,
  Clock3,
  Gem,
  ArrowRight,
} from "lucide-react";
import { mockVenues, mockTikTokCodeMappings, getVenueByCode } from "@/data/venues";
import { EVENT_TYPES } from "@/types/venue";
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
  const [codeError, setCodeError] = useState("");
  const featured = mockVenues.filter((v) => v.featured && v.active);
  const cityOptions = [...new Set(mockVenues.map((v) => v.city))];
  const codeExamples = mockTikTokCodeMappings.slice(0, 2).map((mapping) => mapping.code).join(" ou ");

  const handleCodeSearch = () => {
    if (!codeInput.trim()) return;
    const venue = getVenueByCode(codeInput.trim());
    if (venue) {
      navigate(`/salle/${venue.slug}`);
    } else {
      setCodeError("Ce code ne correspond à aucun lieu actif.");
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
    <div className="min-h-screen bg-background text-foreground">
      <DesktopNav />

      <section className="relative h-[82vh] min-h-[560px] max-h-[760px] overflow-hidden bg-foreground">
        <img
          src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1920&q=80"
          alt="Reception élégante dans un lieu événementiel"
          className="absolute inset-0 w-full h-full object-cover image-grade-luxe"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/50 to-foreground/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-transparent to-foreground/40" />

        <div className="relative z-10 h-full max-w-6xl mx-auto px-6 pt-28 pb-10 flex flex-col justify-center">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-xs font-body font-semibold text-primary-foreground/90">
              <Gem className="w-3.5 h-3.5 text-luxe-gold" />
              Conciergerie événementielle privée
            </p>
            <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl text-primary-foreground font-semibold leading-none mb-6">
              Trouvez un lieu qui signe votre événement.
            </h1>
            <p className="text-primary-foreground/80 text-lg md:text-xl font-body leading-relaxed max-w-2xl">
              Salles confidentielles, rooftops, domaines et châteaux sélectionnés pour des mariages, galas et soirées de marque.
            </p>
          </div>

          <div className="mt-8 w-full max-w-5xl rounded-lg border border-primary-foreground/20 bg-foreground/50 p-3 shadow-2xl backdrop-blur-xl hairline-top">
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-3">
              <div className="flex items-center gap-3 rounded-lg bg-background p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Tag className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-body font-semibold text-muted-foreground">
                    Code TikTok dédié
                  </p>
                  <input
                    type="text"
                    value={codeInput}
                    onChange={(e) => {
                      setCodeInput(e.target.value.toUpperCase());
                      setCodeError("");
                    }}
                    placeholder={`Ex: ${codeExamples}`}
                    className="w-full bg-transparent text-sm font-body font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none"
                    onKeyDown={(e) => e.key === "Enter" && handleCodeSearch()}
                  />
                  {codeError && (
                    <p className="mt-1 text-[11px] font-body text-destructive">{codeError}</p>
                  )}
                </div>
                <button
                  onClick={handleCodeSearch}
                  className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-body font-semibold text-primary-foreground hover:bg-primary transition-colors"
                >
                  Accéder
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <select
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm font-body focus:outline-none"
                  >
                    <option value="">Ville</option>
                    {cityOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  <select
                    value={searchEventType}
                    onChange={(e) => setSearchEventType(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm font-body focus:outline-none"
                  >
                    <option value="">Type</option>
                    {EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
                  <Users className="w-4 h-4 text-primary shrink-0" />
                  <input
                    type="number"
                    value={searchGuests}
                    onChange={(e) => setSearchGuests(e.target.value)}
                    placeholder="Invités"
                    className="min-w-0 flex-1 bg-transparent text-sm font-body focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-body font-semibold text-primary-foreground hover:bg-foreground transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Rechercher
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { icon: <ShieldCheck className="w-4 h-4" />, label: "Lieux vérifiés" },
              { icon: <Clock3 className="w-4 h-4" />, label: "Réponse sous 24h" },
              { icon: <Star className="w-4 h-4" />, label: "4,8/5 sur les demandes" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-2 text-sm font-body text-primary-foreground/80 backdrop-blur-md">
                <span className="text-luxe-gold">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-end">
            <div>
              <p className="font-body text-sm font-semibold text-primary mb-3">Du code à la visite privée</p>
              <h2 className="font-heading text-3xl md:text-5xl font-semibold leading-tight">
                Une recherche courte, une sélection plus exigeante.
              </h2>
            </div>
            <p className="font-body text-muted-foreground leading-relaxed">
              WeAreEvents filtre les lieux, clarifie les capacités et centralise votre demande pour vous faire gagner du temps dès le premier contact.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Tag className="w-6 h-6" />, title: "Repérez le code", desc: "Gardez le code du lieu aperçu dans nos vidéos." },
              { icon: <Search className="w-6 h-6" />, title: "Accédez au lieu", desc: "Retrouvez la fiche, la capacité, les usages et le tarif indicatif." },
              { icon: <CheckCircle className="w-6 h-6" />, title: "Demandez une visite", desc: "Envoyez votre brief et recevez un retour qualifié sous 24h." },
            ].map((step, i) => (
              <div key={step.title} className="border-t border-border pt-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-foreground text-primary-foreground">
                    {step.icon}
                  </div>
                  <span className="font-heading text-3xl text-muted-foreground/30">0{i + 1}</span>
                </div>
                <h3 className="font-heading text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm font-body leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 bg-foreground text-primary-foreground">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-10">
            <div>
              <p className="font-body text-sm font-semibold text-luxe-gold mb-3">Sélection du moment</p>
              <h2 className="font-heading text-3xl md:text-5xl font-semibold mb-3">
                Lieux à forte demande
              </h2>
              <p className="text-primary-foreground/70 font-body max-w-2xl">
                Des adresses visuelles, lisibles et prêtes à accueillir des moments qui comptent.
              </p>
            </div>
            <button
              onClick={() => navigate("/recherche")}
              className="hidden md:flex items-center gap-2 rounded-lg border border-primary-foreground/20 px-4 py-2.5 text-primary-foreground font-body font-semibold text-sm hover:bg-primary-foreground hover:text-foreground transition-colors"
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
              className="rounded-lg bg-primary-foreground px-6 py-3 text-foreground font-body font-semibold text-sm"
            >
              Voir toutes les salles
            </button>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 max-w-2xl">
            <p className="font-body text-sm font-semibold text-primary mb-3">Confiance</p>
            <h2 className="font-heading text-3xl md:text-5xl font-semibold">
              Des demandes plus claires, des lieux mieux qualifiés.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Sophie M.", text: "La salle était encore plus belle que sur la vidéo. Le premier échange a été précis et rassurant.", rating: 5 },
              { name: "Thomas D.", text: "Réponse rapide, informations claires, et un lieu parfaitement aligné avec notre séminaire.", rating: 5 },
              { name: "Julie R.", text: "On a trouvé notre lieu de mariage grâce au code. La demande était simple, le suivi très sérieux.", rating: 5 },
            ].map((t) => (
              <div key={t.name} className="rounded-lg border border-border bg-card p-6 luxury-shadow">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm font-body text-foreground/80 leading-relaxed mb-5">"{t.text}"</p>
                <p className="font-body font-semibold text-sm">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 bg-gradient-editorial text-primary-foreground">
        <div className="max-w-6xl mx-auto grid grid-cols-1 gap-10 md:grid-cols-[1fr_auto] md:items-center">
          <div className="max-w-2xl">
            <p className="font-body text-sm font-semibold text-luxe-gold mb-3">Votre prochain lieu</p>
            <h2 className="font-heading text-3xl md:text-5xl font-semibold mb-4">
              Recevez une première réponse qualifiée.
            </h2>
            <p className="font-body text-primary-foreground/70 leading-relaxed">
              Partagez votre date, votre format et votre volume d'invités. Nous orientons la demande vers le lieu adapté.
            </p>
          </div>
          <button
            onClick={() => navigate("/recherche")}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-foreground px-8 py-3.5 text-foreground font-body font-semibold text-sm hover:bg-accent transition-colors"
          >
            Trouver ma salle
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <footer className="py-12 px-6 bg-foreground text-primary-foreground">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img src={logoBlack} alt="WeAreEvents" className="h-6 mb-4 brightness-0 invert" />
            <p className="text-primary-foreground/60 text-sm font-body leading-relaxed">
              La conciergerie de découverte et réservation de salles événementielles en France.
            </p>
          </div>
          <div>
            <h4 className="font-body font-semibold text-sm mb-3">Navigation</h4>
            <div className="space-y-2 text-primary-foreground/60 text-sm font-body">
              <p className="hover:text-primary-foreground cursor-pointer">Accueil</p>
              <p className="hover:text-primary-foreground cursor-pointer">Toutes les salles</p>
              <p className="hover:text-primary-foreground cursor-pointer">Code lieu</p>
            </div>
          </div>
          <div>
            <h4 className="font-body font-semibold text-sm mb-3">Légal</h4>
            <div className="space-y-2 text-primary-foreground/60 text-sm font-body">
              <p className="hover:text-primary-foreground cursor-pointer">Mentions légales</p>
              <p className="hover:text-primary-foreground cursor-pointer">CGU</p>
              <p className="hover:text-primary-foreground cursor-pointer">Confidentialité</p>
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
