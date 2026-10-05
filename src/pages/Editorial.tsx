import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import Seo from "@/components/Seo";
import SiteFooter from "@/components/SiteFooter";
import { useIsMobile } from "@/hooks/use-mobile";

type EditorialKind = "about" | "business";

const content = {
  about: {
    title: "Qui sommes-nous ? | Wearevents",
    description: "Découvrez Wearevents, notre sélection de lieux événementiels et l'accompagnement proposé aux organisateurs à Paris et en Île-de-France.",
    path: "/qui-sommes-nous",
    eyebrow: "À propos",
    h1: "Wearevents simplifie la recherche de lieux événementiels.",
    intro: "Nous aidons particuliers, entreprises et agences à trouver un lieu fiable, adapté et disponible à Paris et en Île-de-France.",
    sections: [
      ["Une sélection exigeante", "Chaque établissement est étudié selon sa capacité, ses équipements, son ambiance et la clarté de ses conditions de privatisation."],
      ["Un accompagnement humain", "Notre équipe qualifie les demandes, échange avec les lieux et accompagne les organisateurs jusqu'à la confirmation de leur réservation."],
      ["Un modèle transparent", "La demande est gratuite pour l'organisateur. Wearevents est rémunéré par l'établissement uniquement lorsqu'une réservation est confirmée."],
    ],
  },
  business: {
    title: "Événements d'entreprise à Paris | Wearevents",
    description: "Trouvez un lieu pour votre séminaire, conférence, cocktail, lancement de produit ou soirée d'entreprise à Paris.",
    path: "/entreprises",
    eyebrow: "Entreprises",
    h1: "Un lieu adapté à chaque événement professionnel.",
    intro: "Séminaire, conférence, cocktail, lancement de produit ou soirée d'équipe : recevez des propositions cohérentes avec votre format, votre capacité et votre budget.",
    sections: [
      ["Des lieux adaptés à votre cahier des charges", "Capacité, localisation, projection, sonorisation, restauration et horaires sont pris en compte dès votre demande."],
      ["Une réponse qualifiée", "Nous vérifions les disponibilités et les conditions auprès des établissements afin de vous faire gagner du temps."],
      ["Une demande sans engagement", "Présentez votre projet gratuitement et échangez avec notre équipe avant de confirmer le lieu retenu."],
    ],
  },
} as const;

const Editorial = ({ kind }: { kind: EditorialKind }) => {
  const page = content[kind];
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo title={page.title} description={page.description} path={page.path} />
      {isMobile ? <MobileHeader withBackground /> : <DesktopNav />}
      <main className="pt-20 md:pt-24">
        <section className="bg-foreground px-6 py-20 text-primary-foreground md:py-28">
          <div className="mx-auto max-w-5xl">
            <p className="font-body text-sm font-semibold text-primary">{page.eyebrow}</p>
            <h1 className="mt-4 max-w-4xl font-heading text-5xl font-semibold leading-none md:text-6xl">{page.h1}</h1>
            <p className="mt-7 max-w-3xl font-body text-lg leading-relaxed text-primary-foreground/75">{page.intro}</p>
          </div>
        </section>
        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 md:grid-cols-3">
            {page.sections.map(([heading, text], index) => (
              <article key={heading}>
                <p className="font-heading text-2xl text-primary">{String(index + 1).padStart(2, "0")}</p>
                <h2 className="mt-3 font-heading text-3xl font-semibold leading-tight">{heading}</h2>
                <p className="mt-4 font-body leading-relaxed text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter variant="dark" />
    </div>
  );
};

export default Editorial;
