import { useState } from "react";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import SiteFooter from "@/components/SiteFooter";
import VenueCodeSearch from "@/components/VenueCodeSearch";
import Seo from "@/components/Seo";
import { useIsMobile } from "@/hooks/use-mobile";

type LegalPageKind = "mentions" | "cgu";

type LegalSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

const lastUpdated = "16 mai 2026";

const editorDetails = [
  "Éditeur du site : Wearevents",
  "Raison sociale : WEAREVENTS",
  "Forme juridique : SAS, société par actions simplifiée",
  "Capital social : 1 000 €",
  "Siège social : 49 rue Victor Hugo, 92800 Puteaux, France",
  "Site internet : https://www.wearevents.fr",
  "Email : contact@wearevents.fr",
  "SIREN : 898 845 151",
  "SIRET : 898 845 151 00023",
  "RCS : 898 845 151 R.C.S. Nanterre",
  "Numéro de TVA intracommunautaire : FR67 898 845 151",
  "Code NAF / APE : 82.30Z - Organisation de foires, salons professionnels et congrès",
  "Président : AR INVEST",
  "Directeur de la publication : AR INVEST, en qualité de président de Wearevents",
];

const hostingDetails = [
  "Hébergeur du site : Vercel Inc.",
  "Adresse de l'hébergeur : 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
  "Contact de l'hébergeur : https://vercel.com/help",
  "Nom de domaine : OVH SAS, 2 rue Kellermann, 59100 Roubaix, France",
  "Base de données et stockage : Supabase, projet hébergé en région France / Paris (eu-west-3)",
];

const mentionsSections: LegalSection[] = [
  {
    title: "Éditeur du site",
    items: editorDetails,
  },
  {
    title: "Hébergement",
    items: hostingDetails,
  },
  {
    title: "Activité du site",
    paragraphs: [
      "Wearevents présente des lieux événementiels et permet aux utilisateurs d'envoyer des demandes de disponibilité pour des événements privés ou professionnels.",
      "Les informations relatives aux établissements, aux capacités, aux équipements, aux tarifs indicatifs et aux disponibilités sont communiquées à titre informatif et peuvent évoluer.",
    ],
  },
  {
    title: "Propriété intellectuelle",
    paragraphs: [
      "L'ensemble des contenus présents sur le site, notamment les textes, interfaces, éléments graphiques, logos, photographies, vidéos et contenus éditoriaux, est protégé par le droit de la propriété intellectuelle.",
      "Toute reproduction, représentation, modification ou exploitation non autorisée, totale ou partielle, est interdite.",
    ],
  },
  {
    title: "Données personnelles",
    paragraphs: [
      "Les données transmises via les formulaires du site sont utilisées pour traiter les demandes de disponibilité, répondre aux utilisateurs et assurer le suivi commercial nécessaire.",
      "Les données nécessaires au fonctionnement du service sont stockées via Supabase, dans une région d'hébergement située en France lorsque le projet est configuré en région France / Paris.",
      "Les utilisateurs peuvent demander l'accès, la rectification ou la suppression de leurs données en écrivant à contact@wearevents.fr.",
    ],
  },
  {
    title: "Cookies et mesure d'audience",
    paragraphs: [
      "Le site peut utiliser des cookies ou technologies similaires nécessaires à son fonctionnement, à la mesure d'audience ou à l'amélioration de l'expérience utilisateur.",
      "Lorsque le consentement est requis, l'utilisateur peut accepter, refuser ou modifier ses choix selon les modalités affichées sur le site.",
    ],
  },
  {
    title: "Contact",
    paragraphs: [
      "Pour toute question relative au site, à son contenu ou à une demande de disponibilité, vous pouvez écrire à contact@wearevents.fr.",
    ],
  },
];

const cguSections: LegalSection[] = [
  {
    title: "Objet",
    paragraphs: [
      "Les présentes conditions générales d'utilisation encadrent l'accès et l'utilisation du site Wearevents, accessible à l'adresse https://www.wearevents.fr.",
      "En utilisant le site, l'utilisateur accepte les présentes CGU. S'il ne les accepte pas, il lui appartient de ne pas utiliser le service.",
    ],
  },
  {
    title: "Service proposé",
    paragraphs: [
      "Wearevents permet aux utilisateurs de découvrir des lieux événementiels et d'envoyer des demandes de disponibilité.",
      "L'envoi d'une demande ne constitue pas une réservation ferme. La réservation dépend de la disponibilité du lieu, de la validation des conditions applicables et, le cas échéant, de la signature d'un accord séparé.",
    ],
  },
  {
    title: "Accès au site",
    paragraphs: [
      "Le site est accessible gratuitement aux utilisateurs disposant d'un accès à internet.",
      "Wearevents s'efforce d'assurer l'accès au service, mais ne garantit pas une disponibilité permanente, notamment en cas de maintenance, d'incident technique ou de force majeure.",
    ],
  },
  {
    title: "Demandes de disponibilité",
    paragraphs: [
      "L'utilisateur s'engage à fournir des informations exactes, complètes et à jour lorsqu'il remplit un formulaire.",
      "Wearevents peut contacter l'utilisateur et/ou l'établissement concerné afin de qualifier la demande et faciliter le traitement du projet événementiel.",
    ],
  },
  {
    title: "Informations sur les lieux",
    paragraphs: [
      "Les fiches établissements sont établies à partir des informations disponibles et/ou transmises par les lieux.",
      "Les capacités, horaires, équipements, tarifs indicatifs, photographies, vidéos et conditions de privatisation sont susceptibles d'être modifiés. Ils doivent être confirmés avant toute réservation.",
    ],
  },
  {
    title: "Responsabilité",
    paragraphs: [
      "Wearevents agit comme service de présentation et de mise en relation. Sauf mention contraire, Wearevents n'est pas propriétaire des lieux affichés et ne garantit pas la conclusion d'une réservation.",
      "L'utilisateur reste responsable de la cohérence de son projet, de la vérification des conditions du lieu et du respect des règles applicables à son événement.",
    ],
  },
  {
    title: "Comportements interdits",
    items: [
      "Transmettre des informations fausses, trompeuses ou usurpées.",
      "Utiliser le site à des fins frauduleuses, illicites ou contraires aux droits de tiers.",
      "Tenter de perturber le fonctionnement du site, d'accéder à des espaces non autorisés ou d'extraire massivement les contenus.",
    ],
  },
  {
    title: "Propriété intellectuelle",
    paragraphs: [
      "Les contenus du site sont protégés. Toute utilisation non autorisée des éléments du site est interdite.",
      "Les marques, logos, photographies, vidéos et contenus appartenant à des tiers restent la propriété de leurs titulaires respectifs.",
    ],
  },
  {
    title: "Données personnelles",
    paragraphs: [
      "Les données personnelles collectées via le site sont utilisées pour traiter les demandes, assurer le suivi des échanges et améliorer le service.",
      "L'utilisateur peut exercer ses droits en écrivant à contact@wearevents.fr.",
    ],
  },
  {
    title: "Modification des CGU",
    paragraphs: [
      "Wearevents peut modifier les présentes CGU afin de tenir compte de l'évolution du site, du service ou de la réglementation.",
      "La version applicable est celle publiée sur le site au moment de l'utilisation du service.",
    ],
  },
  {
    title: "Droit applicable",
    paragraphs: [
      "Les présentes CGU sont soumises au droit français. En cas de litige, les parties chercheront d'abord une solution amiable.",
    ],
  },
];

const pageContent = {
  mentions: {
    title: "Mentions légales",
    eyebrow: "Informations légales",
    description: "Informations relatives à l'éditeur, à l'hébergement, à la propriété intellectuelle et aux données personnelles du site Wearevents.",
    seoTitle: "Mentions légales - Wearevents",
    path: "/mentions-legales",
    sections: mentionsSections,
  },
  cgu: {
    title: "Conditions générales d'utilisation",
    eyebrow: "CGU",
    description: "Conditions d'accès et d'utilisation du site Wearevents et de ses services de recherche de lieux événementiels.",
    seoTitle: "Conditions générales d'utilisation - Wearevents",
    path: "/cgu",
    sections: cguSections,
  },
} satisfies Record<LegalPageKind, {
  title: string;
  eyebrow: string;
  description: string;
  seoTitle: string;
  path: string;
  sections: LegalSection[];
}>;

const Legal = ({ kind }: { kind: LegalPageKind }) => {
  const page = pageContent[kind];
  const isMobile = useIsMobile();
  const [showCodeSearch, setShowCodeSearch] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo title={page.seoTitle} description={page.description} path={page.path} />
      {isMobile ? (
        <MobileHeader onCodeSearch={() => setShowCodeSearch(true)} withBackground />
      ) : (
        <DesktopNav />
      )}

      <main className="px-6 pb-20 pt-32">
        <section className="mx-auto max-w-4xl">
          <p className="font-body text-sm font-semibold text-primary">{page.eyebrow}</p>
          <h1 className="mt-3 font-heading text-5xl font-semibold leading-none md:text-6xl">
            {page.title}
          </h1>
          <p className="mt-5 max-w-3xl font-body text-base leading-relaxed text-muted-foreground md:text-lg">
            {page.description}
          </p>
          <p className="mt-4 font-body text-sm text-muted-foreground">
            Dernière mise à jour : {lastUpdated}
          </p>
        </section>

        <section className="mx-auto mt-10 max-w-4xl space-y-5">
          {page.sections.map((section) => (
            <article key={section.title} className="rounded-lg border border-border bg-card p-6">
              <h2 className="font-heading text-2xl font-semibold">{section.title}</h2>
              {section.paragraphs && (
                <div className="mt-4 space-y-3">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="font-body text-sm leading-relaxed text-foreground/75 md:text-base">
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}
              {section.items && (
                <ul className="mt-4 space-y-3">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3 font-body text-sm leading-relaxed text-foreground/75 md:text-base">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>
      </main>

      <SiteFooter variant="dark" />
      {showCodeSearch && (
        <VenueCodeSearch
          onClose={() => setShowCodeSearch(false)}
          onVenueFound={() => setShowCodeSearch(false)}
        />
      )}
    </div>
  );
};

export default Legal;
