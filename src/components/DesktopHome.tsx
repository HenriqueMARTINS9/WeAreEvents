import { useEffect, useState } from "react";
import {
  Search,
  MapPin,
  Users,
  Star,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Clock3,
  CheckCircle2,
  BadgeCheck,
  Zap,
} from "lucide-react";
import { getVenueLocationSuggestions, mockVenues } from "@/data/venues";
import { EVENT_TYPES } from "@/types/venue";
import { useNavigate } from "react-router-dom";
import DesktopNav from "./DesktopNav";
import EstablishmentReferralSection from "./EstablishmentReferralSection";
import FilterSelect from "./FilterSelect";
import LocationAutocomplete from "./LocationAutocomplete";
import SiteFooter from "./SiteFooter";
import VenueGridCard from "./VenueGridCard";

const HERO_MOMENTS = [
  {
    label: "Mariage",
    noun: "mariage",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1920&q=80",
  },
  {
    label: "Gala",
    noun: "gala",
    image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1920&q=80",
  },
  {
    label: "Séminaire",
    noun: "séminaire",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80",
  },
  {
    label: "Lancement",
    noun: "lancement",
    image: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=1920&q=80",
  },
] as const;

const HERO_BACKGROUND_VIDEO = "https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4";

const DesktopHome = () => {
  const navigate = useNavigate();
  const [searchLocation, setSearchLocation] = useState("");
  const [searchEventType, setSearchEventType] = useState("");
  const [searchGuests, setSearchGuests] = useState("");
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const featured = mockVenues.filter((v) => v.featured && v.active);
  const locationOptions = getVenueLocationSuggestions();
  const activeHero = HERO_MOMENTS[activeHeroIndex];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveHeroIndex((current) => (current + 1) % HERO_MOMENTS.length);
    }, 4600);

    return () => window.clearInterval(interval);
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchLocation) params.set("location", searchLocation);
    if (searchEventType) params.set("type", searchEventType);
    if (searchGuests) params.set("guests", searchGuests);
    navigate(`/recherche?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DesktopNav />

      <section className="relative h-[78vh] min-h-[620px] max-h-[760px] overflow-hidden bg-foreground">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={activeHero.image}
          className="absolute inset-0 h-full w-full object-cover image-grade-luxe hero-video-active"
        >
          <source src={HERO_BACKGROUND_VIDEO} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/50 to-foreground/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-transparent to-foreground/40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_22%,rgba(218,86,110,0.22),transparent_30%),radial-gradient(circle_at_78%_24%,rgba(216,180,96,0.2),transparent_24%)]" />

        <div className="relative z-10 flex h-full max-w-7xl mx-auto flex-col justify-center px-6 pb-14 pt-24 xl:px-8">
          <div className="max-w-4xl">
            <h1 className="font-heading text-5xl xl:text-6xl 2xl:text-7xl text-primary-foreground font-semibold leading-[0.92] mb-6">
              Des lieux qui signent
              <br />
              votre{" "}
              <span key={activeHero.label} className="hero-copy-enter text-primary">
                {activeHero.noun}.
              </span>
            </h1>
            <p className="max-w-3xl text-lg font-body leading-relaxed text-primary-foreground/80 xl:text-xl">
              Une sélection premium de lieux clairs, visuels et immédiatement réservables pour vos moments qui comptent.
            </p>
          </div>

          <div className="mt-8 w-full max-w-6xl rounded-lg border border-primary-foreground/20 bg-foreground/50 p-4 shadow-2xl backdrop-blur-xl hairline-top">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.18fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-stretch">
              <LocationAutocomplete
                value={searchLocation}
                onChange={setSearchLocation}
                options={locationOptions}
                placeholder="Ville ou code postal"
                className="h-12 bg-background"
                icon={<MapPin className="w-4 h-4" />}
              />
              <FilterSelect
                value={searchEventType}
                onChange={setSearchEventType}
                placeholder="Type d'événement"
                emptyLabel="Tous les types"
                options={EVENT_TYPES}
                icon={<Sparkles className="w-4 h-4" />}
                className="h-12"
              />
              <div className="flex h-12 items-center gap-2 rounded-lg border border-border bg-background px-3">
                <Users className="w-4 h-4 text-primary shrink-0" />
                <input
                  type="number"
                  value={searchGuests}
                  onChange={(e) => setSearchGuests(e.target.value)}
                  placeholder="Nombre d'invités"
                  className="min-w-0 flex-1 bg-transparent text-sm font-body focus:outline-none"
                />
              </div>
              <button
                onClick={handleSearch}
                className="brand-primary-button flex h-12 items-center justify-center gap-2 rounded-lg px-5 text-sm font-body font-semibold text-primary-foreground transition-all hover:brightness-95"
              >
                <Search className="w-4 h-4" />
                Rechercher
              </button>
            </div>
          </div>

          <div className="mt-6 grid max-w-5xl grid-cols-1 gap-3 lg:grid-cols-3">
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
        <div className="max-w-7xl mx-auto xl:px-2">
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] xl:items-end xl:gap-12">
            <div className="max-w-3xl">
              <p className="font-body text-sm font-semibold text-primary mb-3">Pourquoi WeAreEvents</p>
              <h2 className="font-heading text-4xl 2xl:text-5xl font-semibold leading-[1.02]">
                Une sélection premium, une réservation plus fluide.
              </h2>
            </div>
            <p className="max-w-xl font-body text-muted-foreground leading-relaxed xl:justify-self-end">
              Nous mettons en avant des lieux clairs, rapidement joignables et pensés pour des demandes sérieuses, sans friction inutile.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 xl:grid-cols-3">
            {[
              { icon: <BadgeCheck className="w-6 h-6" />, title: "Lieux vérifiés", desc: "Adresses sélectionnées, informations utiles et capacités clairement indiquées." },
              { icon: <Zap className="w-6 h-6" />, title: "Demande 100 % gratuite", desc: "Aucun frais pour envoyer une demande, comparer et affiner votre brief." },
              { icon: <CheckCircle2 className="w-6 h-6" />, title: "Réponse rapide", desc: "Premiers retours qualifiés en moins de 24h ouvrées sur les demandes sérieuses." },
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
        <div className="max-w-7xl mx-auto xl:px-2">
          <div className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="font-body text-sm font-semibold text-primary mb-3">Sélection du moment</p>
              <h2 className="font-heading text-4xl 2xl:text-5xl font-semibold mb-3 leading-[1.02]">
                Lieux à forte demande
              </h2>
              <p className="text-primary-foreground/70 font-body max-w-2xl">
                Des adresses visuelles, lisibles et prêtes à accueillir des moments qui comptent.
              </p>
            </div>
            <button
              onClick={() => navigate("/recherche")}
              className="hidden xl:flex items-center gap-2 rounded-lg border border-primary-foreground/20 px-4 py-2.5 text-primary-foreground font-body font-semibold text-sm hover:bg-primary-foreground hover:text-foreground transition-colors"
            >
              Voir toutes les salles
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-4">
            {featured.map((venue) => (
              <VenueGridCard key={venue.id} venue={venue} />
            ))}
          </div>

          <div className="mt-8 text-center xl:hidden">
            <button
              onClick={() => navigate("/recherche")}
              className="rounded-lg bg-primary-foreground px-6 py-3 text-foreground font-body font-semibold text-sm"
            >
              Voir toutes les salles
            </button>
          </div>
        </div>
      </section>

      <EstablishmentReferralSection />

      <SiteFooter />
    </div>
  );
};

export default DesktopHome;
