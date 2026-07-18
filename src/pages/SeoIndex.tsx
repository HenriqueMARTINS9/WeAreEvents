import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import Seo, { siteUrl } from "@/components/Seo";
import SiteFooter from "@/components/SiteFooter";
import VenueCodeSearch from "@/components/VenueCodeSearch";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  getCapacitySeoPath,
  getEventSeoPath,
  SEO_CAPACITY_RANGES,
  SEO_EVENT_TYPES,
  seoLandingPages,
} from "@/data/seo-landings";

type SeoLink = {
  slug: string;
  h1: string;
  description: string;
};

type SeoGroup = {
  title: string;
  description: string;
  tone: "light" | "dark";
  links: SeoLink[];
};

const stripPath = (path: string) => path.replace(/^\//, "");

const getArrondissementNumber = (slug: string) => {
  const value = slug.match(/location-salle-paris-(\d+|1er)e?$/)?.[1];
  if (!value) return 0;
  return value === "1er" ? 1 : Number(value);
};

const pickPages = (slugs: string[], pagesBySlug: Map<string, SeoLink>) =>
  slugs.map((slug) => pagesBySlug.get(slug)).filter((page): page is SeoLink => Boolean(page));

const SeoIndex = () => {
  const isMobile = useIsMobile();
  const [showCodeSearch, setShowCodeSearch] = useState(false);

  const groups = useMemo<SeoGroup[]>(() => {
    const pagesBySlug = new Map(
      seoLandingPages.map((page) => [
        page.slug,
        { slug: page.slug, h1: page.h1, description: page.description },
      ]),
    );

    const arrondissementPages = seoLandingPages
      .filter((page) => /^location-salle-paris-(1er|\d+e)$/.test(page.slug))
      .sort((a, b) => getArrondissementNumber(a.slug) - getArrondissementNumber(b.slug))
      .map((page) => ({ slug: page.slug, h1: page.h1, description: page.description }));

    return [
      {
        title: "Les recherches principales",
        description: "Les pages les plus utiles pour commencer une recherche de salle à Paris.",
        tone: "light",
        links: pickPages(
          [
            "location-salle-paris",
            "bar-privatisable-paris",
            "restaurant-privatisable-paris",
            "discotheque-paris",
            "salle-reception-paris",
            "salle-anniversaire-paris",
            "salle-mariage-paris",
            "salle-soiree-privee-paris",
          ],
          pagesBySlug,
        ),
      },
      {
        title: "Paris et ses arrondissements",
        description: "Accédez directement aux pages locales pour cibler un arrondissement précis.",
        tone: "dark",
        links: arrondissementPages,
      },
      {
        title: "Par type d'événement",
        description: "Mariage, anniversaire, afterwork, séminaire, tournage ou gala : trouvez une page adaptée à votre besoin.",
        tone: "light",
        links: pickPages(SEO_EVENT_TYPES.map((eventType) => stripPath(getEventSeoPath(eventType))), pagesBySlug),
      },
      {
        title: "Par nombre de personnes",
        description: "Des recherches par capacité maximale pour identifier rapidement les lieux au bon format.",
        tone: "dark",
        links: pickPages(SEO_CAPACITY_RANGES.map((range) => stripPath(getCapacitySeoPath(range.key))), pagesBySlug),
      },
      {
        title: "Par type de lieu",
        description: "Bars, restaurants, discothèques, péniches, espaces extérieurs et autres formats de lieux.",
        tone: "light",
        links: pickPages(
          [
            "bar-privatisable-paris",
            "restaurant-privatisable-paris",
            "discotheque-paris",
            "salle-reception-paris",
            "espace-exterieur-paris",
            "peniche-evenement-paris",
            "loft-evenement-paris",
            "hotel-evenement-paris",
            "jardin-evenement-paris",
          ],
          pagesBySlug,
        ),
      },
      {
        title: "Par budget",
        description: "Filtrez selon le niveau de prix attendu pour votre événement.",
        tone: "dark",
        links: pickPages(
          ["salle-pas-chere-paris", "salle-budget-abordable-paris", "salle-budget-modere-paris", "salle-premium-paris"],
          pagesBySlug,
        ),
      },
      {
        title: "Par ambiance",
        description: "Calme, animée, festive, élégante ou corporate : partez de l'atmosphère souhaitée.",
        tone: "light",
        links: pickPages(
          [
            "salle-ambiance-calme-paris",
            "salle-ambiance-animee-paris",
            "salle-ambiance-festive-paris",
            "salle-ambiance-corporate-paris",
            "salle-ambiance-elegante-paris",
          ],
          pagesBySlug,
        ),
      },
      {
        title: "Par conditions de privatisation",
        description: "Comparez les formats de réservation, les horaires et les configurations possibles.",
        tone: "dark",
        links: pickPages(
          [
            "salle-forfait-consommation-paris",
            "location-seche-salle-paris",
            "salle-ouverte-jusqua-minuit-paris",
            "salle-ouverte-jusqua-2h-paris",
            "salle-ouverte-apres-2h-paris",
            "salle-espace-clos-paris",
            "salle-espace-ouvert-paris",
            "salle-reception-debout-paris",
            "salle-repas-assis-paris",
          ],
          pagesBySlug,
        ),
      },
      {
        title: "Par options",
        description: "Musique, danse, décoration, gâteau ou traiteur externe : trouvez les lieux compatibles.",
        tone: "light",
        links: pickPages(
          [
            "salle-avec-musique-paris",
            "salle-ou-danser-paris",
            "salle-decoration-personnalisable-paris",
            "salle-avec-jeux-paris",
            "salle-heures-supplementaires-paris",
            "salle-traiteur-externe-paris",
            "salle-boissons-externes-paris",
            "salle-gateau-externe-paris",
          ],
          pagesBySlug,
        ),
      },
      {
        title: "Par équipements et services",
        description: "Terrasse, projecteur, micro, Wi-Fi, système son, vestiaire ou accès PMR.",
        tone: "dark",
        links: pickPages(
          [
            "salle-avec-tv-paris",
            "salle-climatisee-paris",
            "salle-acces-pmr-paris",
            "salle-avec-micro-paris",
            "salle-avec-wifi-paris",
            "salle-avec-terrasse-paris",
            "salle-avec-projecteur-paris",
            "salle-avec-systeme-son-paris",
            "salle-avec-mobilier-paris",
            "salle-avec-table-de-mixage-paris",
            "salle-avec-parking-paris",
            "salle-avec-vestiaire-paris",
            "salle-avec-cuisine-equipee-paris",
            "salle-avec-bar-equipe-paris",
            "salle-avec-lumieres-paris",
            "salle-avec-scene-paris",
            "salle-avec-personnel-sur-place-paris",
            "salle-avec-securite-paris",
          ],
          pagesBySlug,
        ),
      },
    ];
  }, []);

  const allLinks = Array.from(new Map(groups.flatMap((group) => group.links).map((link) => [link.slug, link])).values());

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title="Inspirations lieux événementiels à Paris | Wearevents"
        description="Toutes les recherches utiles pour trouver une salle à Paris : événement, capacité, ambiance, budget, équipements, horaires et options."
        path="/inspirations"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Inspirations lieux événementiels à Paris",
          description: "Toutes les pages de recherche Wearevents pour trouver le bon lieu événementiel à Paris.",
          url: `${siteUrl}/inspirations`,
          mainEntity: {
            "@type": "ItemList",
            itemListElement: allLinks.map((link, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: link.h1,
              url: `${siteUrl}/${link.slug}`,
            })),
          },
        }}
      />
      {isMobile ? (
        <MobileHeader onCodeSearch={() => setShowCodeSearch(true)} withBackground />
      ) : (
        <DesktopNav />
      )}

      <main className="pt-24">
        <section className="bg-foreground px-6 py-20 text-primary-foreground">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.55fr)] xl:items-end xl:px-2">
            <div>
              <p className="font-body text-sm font-semibold text-primary">Inspirations</p>
              <h1 className="mt-4 max-w-5xl font-heading text-5xl font-semibold leading-none md:text-6xl">
                Toutes les recherches pour trouver le bon lieu à Paris.
              </h1>
              <p className="mt-6 max-w-3xl font-body text-lg leading-relaxed text-primary-foreground/72">
                Explorez les pages Wearevents par événement, arrondissement, capacité, budget, ambiance, horaires, options et équipements.
              </p>
            </div>

            <div className="rounded-lg border border-primary-foreground/10 bg-primary-foreground/[0.06] p-5">
              <p className="font-heading text-4xl font-semibold text-primary-foreground">{allLinks.length}</p>
              <p className="mt-2 font-body text-sm leading-relaxed text-primary-foreground/65">
                recherches prêtes à lancer, reliées aux salles disponibles et mises à jour avec le catalogue.
              </p>
            </div>
          </div>
        </section>

        {groups.map((group) => (
          <section
            key={group.title}
            data-header-theme={group.tone === "dark" ? "light" : undefined}
            className={`px-6 py-16 ${
              group.tone === "dark"
                ? "bg-foreground text-primary-foreground"
                : "bg-background text-foreground"
            }`}
          >
            <div className="mx-auto max-w-7xl xl:px-2">
              <div className="mb-8 max-w-3xl">
                <p className="font-body text-sm font-semibold text-primary">Recherches SEO</p>
                <h2 className="mt-3 font-heading text-4xl font-semibold leading-tight">{group.title}</h2>
                <p className={`mt-4 font-body leading-relaxed ${group.tone === "dark" ? "text-primary-foreground/62" : "text-muted-foreground"}`}>
                  {group.description}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {group.links.map((link) => (
                  <Link
                    key={link.slug}
                    to={`/${link.slug}`}
                    className={`group flex min-h-24 items-center justify-between gap-4 rounded-lg border p-4 transition-transform hover:-translate-y-0.5 ${
                      group.tone === "dark"
                        ? "border-primary-foreground/10 bg-primary-foreground/[0.06] text-primary-foreground hover:border-primary/45"
                        : "border-border bg-card text-foreground hover:border-primary/45"
                    }`}
                  >
                    <span>
                      <span className="block font-body text-sm font-semibold leading-snug">{link.h1}</span>
                      <span className={`mt-2 line-clamp-2 block font-body text-xs leading-relaxed ${group.tone === "dark" ? "text-primary-foreground/52" : "text-muted-foreground"}`}>
                        {link.description}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ))}

        <section className="px-6 py-16">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-lg border border-border bg-card p-6 md:flex-row md:items-center md:justify-between xl:px-8">
            <div>
              <p className="font-body text-sm font-semibold text-primary">Recherche personnalisée</p>
              <h2 className="mt-2 font-heading text-3xl font-semibold">Vous voulez combiner plusieurs critères ?</h2>
              <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-muted-foreground">
                Utilisez la recherche complète pour croiser date, ville, nombre d'invités, ambiance, budget et équipements.
              </p>
            </div>
            <Link
              to="/recherche"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-5 py-3 font-body text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary"
            >
              Trouver ma salle
              <Search className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter variant="light" />
      {showCodeSearch && (
        <VenueCodeSearch
          onClose={() => setShowCodeSearch(false)}
          onVenueFound={() => setShowCodeSearch(false)}
        />
      )}
    </div>
  );
};

export default SeoIndex;
