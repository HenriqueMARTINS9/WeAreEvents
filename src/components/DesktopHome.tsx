import { useEffect, useMemo, useState } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { searchInspirationLinks } from "@/data/search-inspiration";
import { getCapacitySeoPath, getEventSeoPath, getLocationSeoPath, SEO_CAPACITY_RANGES } from "@/data/seo-landings";
import { fetchBlogPosts, fetchVenues, getVenueLocationSuggestionsFromVenues } from "@/lib/supabase-data";
import { EVENT_TYPES } from "@/types/venue";
import DesktopNav from "./DesktopNav";
import EstablishmentReferralSection from "./EstablishmentReferralSection";
import FaqSection from "./FaqSection";
import FilterSelect from "./FilterSelect";
import LocationAutocomplete from "./LocationAutocomplete";
import SiteFooter from "./SiteFooter";
import VenueGridCard from "./VenueGridCard";

const HERO_MOMENTS = [
  {
    label: "Mariage",
    noun: "mariage",
  },
  {
    label: "Gala",
    noun: "gala",
  },
  {
    label: "Séminaire",
    noun: "séminaire",
  },
  {
    label: "Lancement",
    noun: "lancement",
  },
] as const;

const HERO_BACKGROUND_VIDEO = "https://www.pexels.com/fr-fr/download/video/3188991/";

const ARRONDISSEMENT_CITY_PREFIXES: Record<string, string> = {
  lyon: "690",
  marseille: "130",
  paris: "750",
};

const ARRONDISSEMENT_CITY_LABELS: Record<string, string> = {
  lyon: "Lyon",
  marseille: "Marseille",
  paris: "Paris",
};

const normalizeLocationName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getArrondissementNumber = (city: string, postalCode: string) => {
  const prefix = ARRONDISSEMENT_CITY_PREFIXES[normalizeLocationName(city)];
  if (!prefix || !postalCode.startsWith(prefix)) return null;

  const arrondissement = Number(postalCode.slice(-2));
  return arrondissement > 0 ? arrondissement : null;
};

const formatArrondissementLabel = (city: string, arrondissement: number) =>
  `${city} ${arrondissement === 1 ? "1er" : `${arrondissement}e`}`;

const getCanonicalLocationCity = (city: string, postalCodes: string[]) => {
  const normalizedCity = normalizeLocationName(city);
  const matchingCityKey = Object.entries(ARRONDISSEMENT_CITY_PREFIXES).find(([cityKey, postalPrefix]) => {
    return (
      normalizedCity === cityKey ||
      normalizedCity.startsWith(`${cityKey} `) ||
      postalCodes.some((postalCode) => postalCode.startsWith(postalPrefix))
    );
  })?.[0];

  return matchingCityKey ? ARRONDISSEMENT_CITY_LABELS[matchingCityKey] : city;
};

const DesktopHome = () => {
  const navigate = useNavigate();
  const [searchLocation, setSearchLocation] = useState("");
  const [searchEventType, setSearchEventType] = useState("");
  const [searchGuests, setSearchGuests] = useState("");
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [heroVideoReady, setHeroVideoReady] = useState(false);
  const { data: venues = [] } = useQuery({ queryKey: ["venues"], queryFn: fetchVenues });
  const { data: posts = [] } = useQuery({ queryKey: ["blog-posts"], queryFn: fetchBlogPosts });
  const featured = [
    ...venues.filter((v) => v.featured && v.active),
    ...venues.filter((v) => !v.featured && v.active),
  ].slice(0, 6);
  const locationOptions = useMemo(() => getVenueLocationSuggestionsFromVenues(venues), [venues]);
  const locationSearchLinks = useMemo(() => {
    const links = locationOptions.flatMap(({ city, postalCodes }) => {
      const displayCity = getCanonicalLocationCity(city, postalCodes);
      const arrondissementLinks = postalCodes
        .map((postalCode) => ({
          arrondissement: getArrondissementNumber(displayCity, postalCode),
          postalCode,
        }))
        .filter((item): item is { arrondissement: number; postalCode: string } => item.arrondissement !== null)
        .sort((a, b) => a.arrondissement - b.arrondissement)
        .map(({ arrondissement, postalCode }) => {
          const label = formatArrondissementLabel(displayCity, arrondissement);

          return {
            arrondissement,
            city: displayCity,
            href: getLocationSeoPath(label),
            label,
            value: postalCode,
          };
        });

      if (arrondissementLinks.length) {
        return [{ arrondissement: 0, city: displayCity, href: getLocationSeoPath(displayCity), label: displayCity, value: displayCity }, ...arrondissementLinks];
      }

      return [{ arrondissement: 0, city: displayCity, href: getLocationSeoPath(displayCity), label: displayCity, value: displayCity }];
    });

    return Array.from(new Map(links.map((item) => [item.label.toLowerCase(), item])).values()).sort((a, b) => {
      const cityOrder = a.city.localeCompare(b.city, "fr", { sensitivity: "base" });
      if (cityOrder !== 0) return cityOrder;

      return a.arrondissement - b.arrondissement || a.label.localeCompare(b.label, "fr", { numeric: true });
    });
  }, [locationOptions]);
  const parisLocationSearchLinks = locationSearchLinks.filter((item) => normalizeLocationName(item.city) === "paris");
  const otherLocationSearchLinks = locationSearchLinks.filter((item) => normalizeLocationName(item.city) !== "paris");
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
    navigate(`/recherche?${params.toString()}#salles`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DesktopNav />

      <main>
      <section data-header-theme="light" className="relative h-screen min-h-[620px] overflow-visible bg-foreground">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-foreground" />
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onCanPlay={() => setHeroVideoReady(true)}
            onLoadedData={() => setHeroVideoReady(true)}
            className={`absolute inset-0 h-full w-full object-cover image-grade-luxe hero-video-active transition-opacity duration-500 ${
              heroVideoReady ? "opacity-100" : "opacity-0"
            }`}
          >
            <source src={HERO_BACKGROUND_VIDEO} type="video/mp4" />
            <track kind="captions" src="/captions-empty.vtt" srcLang="fr" label="Français" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/50 to-foreground/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-transparent to-foreground/40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_22%,rgba(218,86,110,0.22),transparent_30%),radial-gradient(circle_at_78%_24%,rgba(216,180,96,0.2),transparent_24%)]" />
        </div>

        <div className="relative z-10 flex h-full max-w-7xl mx-auto flex-col justify-center px-6 pb-14 pt-24 xl:px-8">
          <div className="max-w-4xl">
            <h1 className="font-heading text-5xl xl:text-6xl 2xl:text-7xl text-primary-foreground font-semibold leading-[0.92] mb-6">
              Le lieu idéal
              <br />
              pour votre{" "}
              <span key={activeHero.label} className="hero-copy-enter text-primary">
                {activeHero.noun}.
              </span>
            </h1>
            <p className="max-w-3xl text-lg font-body leading-relaxed text-primary-foreground/80 xl:text-xl">
              Des lieux fiables, réactifs et adaptés à votre événement, avec une réservation simple et rapide.
            </p>
          </div>

          <div className="relative z-30 mt-8 w-full max-w-6xl rounded-lg border border-primary-foreground/20 bg-foreground/50 p-4 shadow-2xl backdrop-blur-xl hairline-top">
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

          <div className="relative z-0 mt-6 grid max-w-5xl grid-cols-1 gap-3 lg:grid-cols-3">
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
              <p className="font-body text-sm font-semibold text-primary mb-3">Pourquoi choisir Wearevents</p>
              <h2 className="font-heading text-4xl 2xl:text-5xl font-semibold leading-[1.02]">
                Des lieux premium, sans perte de temps.
              </h2>
            </div>
            <p className="max-w-xl font-body text-muted-foreground leading-relaxed xl:justify-self-end">
              Nous sélectionnons des lieux fiables, réactifs et adaptés à votre événement, avec une réservation simple et rapide.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 xl:grid-cols-3">
            {[
              { icon: <BadgeCheck className="w-6 h-6" />, title: "Lieux vérifiés", desc: "Informations claires, capacités précises et lieux sélectionnés." },
              { icon: <Zap className="w-6 h-6" />, title: "Demande 100 % gratuite", desc: "Comparez les options et avancez sans engagement." },
              { icon: <CheckCircle2 className="w-6 h-6" />, title: "Réponse rapide", desc: "Premières propositions en moins de 24h ouvrées." },
            ].map((step, i) => (
              <div key={step.title} className="border-t border-border pt-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-foreground text-primary-foreground">
                    {step.icon}
                  </div>
                  <span className="font-heading text-3xl text-muted-foreground">0{i + 1}</span>
                </div>
                <h3 className="font-heading text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm font-body leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-header-theme="light" className="px-6 py-20 bg-foreground text-primary-foreground">
        <div className="max-w-7xl mx-auto xl:px-2">
          <div className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="font-body text-sm font-semibold text-primary mb-3">Nos adresses du moment</p>
              <h2 className="font-heading text-4xl 2xl:text-5xl font-semibold mb-3 leading-[1.02]">
                Une sélection très recherchée
              </h2>
              <p className="text-primary-foreground/70 font-body max-w-2xl">
                Des lieux remarquables, disponibles et pensés pour recevoir dans les meilleures conditions.
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

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
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

      <section data-header-theme="dark" className="border-y border-border bg-background px-6 py-20">
        <div className="mx-auto max-w-7xl xl:px-2">
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] xl:items-end">
            <div>
              <p className="mb-3 font-body text-sm font-semibold text-primary">Une inspiration ?</p>
              <h2 className="font-heading text-4xl font-semibold leading-[1.02] 2xl:text-5xl">
                Trouvez votre lieu par envie, capacité ou quartier.
              </h2>
            </div>
            <p className="max-w-2xl font-body leading-relaxed text-muted-foreground xl:justify-self-end">
              Explorez des recherches déjà préparées ou choisissez directement le nombre d'invités prévu pour votre événement.
            </p>
          </div>

          <div className="mt-12">
            <h3 className="font-heading text-2xl font-semibold">Des recherches prêtes à lancer</h3>
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {searchInspirationLinks.map((item) => (
                <Link
                  key={item.title}
                  to={item.href}
                  className="group rounded-lg border border-border bg-background p-5 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-body text-sm font-semibold text-foreground">{item.title}</h4>
                      <p className="mt-2 font-body text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                    </div>
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-12 border-t border-border pt-8">
            <h3 className="font-body text-sm font-semibold text-foreground">Par nombre de personnes</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
              {SEO_CAPACITY_RANGES.map((range) => (
                <Link
                  key={range.key}
                  to={getCapacitySeoPath(range.key)}
                  className="group flex min-h-20 items-center justify-between rounded-lg border border-border bg-background px-4 py-3 transition-colors hover:border-primary/50"
                >
                  <span>
                    <span className="block font-heading text-xl font-semibold leading-tight text-foreground">{range.label}</span>
                    <span className="mt-1 block font-body text-xs text-muted-foreground">personnes</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-10 border-t border-border pt-8 xl:grid-cols-2">
            <div>
              <h3 className="font-body text-sm font-semibold text-foreground">Par ville et arrondissement</h3>
              <div className="mt-4 space-y-5">
                {parisLocationSearchLinks.length > 0 && (
                  <div>
                    <p className="mb-2 font-body text-xs font-semibold uppercase text-muted-foreground">
                      Paris et ses arrondissements
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {parisLocationSearchLinks.map((item) => (
                        <Link key={item.label} to={item.href} className="rounded-full border border-border bg-background px-3 py-1.5 font-body text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {otherLocationSearchLinks.length > 0 && (
                  <div>
                    <p className="mb-2 font-body text-xs font-semibold uppercase text-muted-foreground">Autres villes</p>
                    <div className="flex flex-wrap gap-2">
                      {otherLocationSearchLinks.map((item) => (
                        <Link key={item.label} to={item.href} className="rounded-full border border-border bg-background px-3 py-1.5 font-body text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-body text-sm font-semibold text-foreground">Par type d'événement</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {EVENT_TYPES.map((eventType) => (
                  <Link key={eventType} to={getEventSeoPath(eventType)} className="rounded-full border border-border bg-background px-3 py-1.5 font-body text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
                    {eventType}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-header-theme="light" className="bg-foreground px-6 py-20 text-primary-foreground">
        <div className="max-w-7xl mx-auto xl:px-2">
          <div className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="font-body text-sm font-semibold text-primary mb-3">Blog</p>
              <h2 className="font-heading text-4xl 2xl:text-5xl font-semibold mb-3 leading-[1.02]">
                Trouvez le bon lieu, mieux préparé.
              </h2>
              <p className="max-w-2xl font-body text-primary-foreground/65">
                Guides pratiques, checklists et conseils concrets pour choisir un lieu adapté à vos invités, votre style et votre budget.
              </p>
            </div>
            <button
              onClick={() => navigate("/blog")}
              className="hidden items-center gap-2 rounded-lg border border-primary-foreground/20 px-4 py-2.5 font-body text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground hover:text-foreground xl:flex"
            >
              Voir le blog
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col overflow-hidden rounded-lg border border-primary-foreground/10 bg-primary-foreground text-foreground transition-transform hover:-translate-y-1"
              >
                <img src={post.image} alt="" className="h-52 w-full object-cover image-grade-luxe" />
                <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
                  <div className="mb-2.5 flex items-center justify-between gap-3 text-xs font-body font-semibold text-muted-foreground">
                    <span className="text-primary">{post.category}</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h3 className="font-heading text-2xl font-semibold leading-tight transition-colors group-hover:text-primary">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-sm font-body leading-relaxed text-muted-foreground">{post.excerpt}</p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-body font-semibold text-foreground transition-colors group-hover:text-primary">
                    Lire l'article
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center xl:hidden">
            <button
              onClick={() => navigate("/blog")}
              className="rounded-lg border border-primary-foreground/20 px-6 py-3 font-body text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground hover:text-foreground"
            >
              Voir le blog
            </button>
          </div>
        </div>
      </section>

      <EstablishmentReferralSection variant="light" />
      <FaqSection variant="dark" />
      </main>

      <SiteFooter variant="light" />
    </div>
  );
};

export default DesktopHome;
