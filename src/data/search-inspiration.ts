import { buildSearchUrl } from "@/lib/search-links";

export const searchInspirationLinks = [
  {
    title: "Anniversaire festif",
    description: "Bars, clubs et lieux où danser entre amis.",
    href: buildSearchUrl({
      location: "Paris",
      type: "Anniversaire",
      ambiance: ["Festif"],
      options: ["Possibilité de danser"],
    }),
  },
  {
    title: "Soirée d'entreprise",
    description: "Espaces adaptés aux repas d'équipe, cocktails et événements professionnels.",
    href: buildSearchUrl({
      location: "Paris",
      type: "Repas d'entreprise",
      privatization: ["Forfait consommation (budget par personne)"],
    }),
  },
  {
    title: "Restaurant privatisable",
    description: "Des adresses adaptées aux repas de groupe et soirées privées.",
    href: buildSearchUrl({
      location: "Paris",
      venueTypes: ["Restaurant"],
    }),
  },
  {
    title: "Mariage intimiste",
    description: "Salles élégantes pour réunir vos proches dans un cadre soigné.",
    href: buildSearchUrl({
      location: "Paris",
      type: "Mariage",
      venueTypes: ["Salle de réception"],
    }),
  },
  {
    title: "Bar privatisable",
    description: "Lieux simples à réserver avec minimum de consommation.",
    href: buildSearchUrl({
      location: "Paris",
      venueTypes: ["Bar"],
      privatization: ["Forfait consommation (budget par personne)"],
    }),
  },
  {
    title: "Discothèque à privatiser",
    description: "Des lieux festifs avec piste de danse et horaires adaptés.",
    href: buildSearchUrl({
      location: "Paris",
      venueTypes: ["Discothèque"],
    }),
  },
];
