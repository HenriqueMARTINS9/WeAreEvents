import { seoLandingPages } from "@/data/seo-landings";

export type EditableSeoPage = {
  path: string;
  label: string;
  group: string;
  defaultTitle: string;
  defaultDescription: string;
};

const staticSeoPages: EditableSeoPage[] = [
  {
    path: "/",
    label: "Accueil",
    group: "Pages principales",
    defaultTitle: "Wearevents | Location de salle pour votre événement",
    defaultDescription:
      "Découvrez des lieux événementiels vérifiés, comparez les options et envoyez une demande de disponibilité gratuite en quelques clics.",
  },
  {
    path: "/recherche",
    label: "Recherche de salles",
    group: "Pages principales",
    defaultTitle: "Trouver une salle événementielle - Recherche Wearevents",
    defaultDescription:
      "Recherchez une salle par ville, capacité, type d'événement, ambiance et budget. Comparez les lieux et envoyez une demande gratuite.",
  },
  {
    path: "/blog",
    label: "Blog",
    group: "Pages principales",
    defaultTitle: "Blog événementiel - Conseils pour choisir le bon lieu",
    defaultDescription:
      "Guides pratiques, checklists et conseils concrets pour choisir une salle, organiser un mariage, un anniversaire, un séminaire ou privatiser un lieu.",
  },
  {
    path: "/inspirations",
    label: "Inspirations SEO",
    group: "Pages principales",
    defaultTitle: "Inspirations lieux événementiels à Paris | Wearevents",
    defaultDescription:
      "Toutes les recherches utiles pour trouver une salle à Paris : événement, capacité, ambiance, budget, équipements, horaires et options.",
  },
  {
    path: "/faq",
    label: "FAQ",
    group: "Pages principales",
    defaultTitle: "FAQ - Questions fréquentes sur la réservation de lieux",
    defaultDescription:
      "Fonctionnement de Wearevents, gratuité du service, types de lieux, délais de réservation et formats de privatisation.",
  },
  {
    path: "/reseaux-sociaux",
    label: "Réseaux sociaux",
    group: "Pages principales",
    defaultTitle: "Réseaux sociaux Wearevents",
    defaultDescription:
      "Retrouvez Wearevents sur Instagram, TikTok et LinkedIn pour découvrir nos lieux, vidéos et inspirations événementielles.",
  },
  {
    path: "/mentions-legales",
    label: "Mentions légales",
    group: "Pages légales",
    defaultTitle: "Mentions légales - Wearevents",
    defaultDescription:
      "Informations relatives à l'éditeur, à l'hébergement, à la propriété intellectuelle et aux données personnelles du site Wearevents.",
  },
  {
    path: "/cgu",
    label: "CGU",
    group: "Pages légales",
    defaultTitle: "Conditions générales d'utilisation - Wearevents",
    defaultDescription:
      "Conditions d'accès et d'utilisation du site Wearevents et de ses services de recherche de lieux événementiels.",
  },
  {
    path: "/politique-confidentialite",
    label: "Politique de confidentialité",
    group: "Pages légales",
    defaultTitle: "Politique de confidentialité - Wearevents",
    defaultDescription:
      "Informations sur la collecte, l'utilisation, la conservation et les droits liés aux données personnelles traitées sur Wearevents.",
  },
];

const getSeoLandingGroup = (page: (typeof seoLandingPages)[number]) => {
  if (page.slug.startsWith("location-salle-paris")) return "SEO - Paris";
  if (page.filters.eventType) return "SEO - Évènements";
  if (page.filters.maxCapacityLimit || page.filters.maxCapacityGreaterThan) return "SEO - Capacités";
  if (page.filters.venueTypes?.length) return "SEO - Types de lieu";
  if (page.filters.priceTier) return "SEO - Prix";
  if (page.filters.ambianceTypes?.length) return "SEO - Ambiances";
  if (page.filters.privatizationTypes?.length) return "SEO - Privatisation";
  if (page.filters.closingTimeFilter) return "SEO - Horaires";
  if (page.filters.spaceTypes?.length) return "SEO - Espaces";
  if (page.filters.guestDispositions?.length) return "SEO - Disposition";
  if (page.filters.optionFilters?.length) return "SEO - Options";
  if (page.filters.equipmentFilters?.length) return "SEO - Équipements";
  return "SEO - Autres";
};

const seoLandingEditablePages: EditableSeoPage[] = seoLandingPages.map((page) => ({
  path: `/${page.slug}`,
  label: page.h1,
  group: getSeoLandingGroup(page),
  defaultTitle: page.title,
  defaultDescription: page.description,
}));

export const editableSeoPages = [...staticSeoPages, ...seoLandingEditablePages];
