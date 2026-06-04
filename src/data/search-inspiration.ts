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
    description: "Espaces adaptés aux afterworks, cocktails et événements corporate.",
    href: buildSearchUrl({
      location: "Paris",
      type: "Corporate",
      privatization: ["Forfait consommation (budget par personne)"],
    }),
  },
  {
    title: "Rooftop à privatiser",
    description: "Adresses avec vue, terrasse ou ambiance premium.",
    href: buildSearchUrl({
      location: "Paris",
      venueTypes: ["Rooftop"],
      space: ["Espace ouvert"],
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
    title: "Péniche événementielle",
    description: "Une sélection de lieux atypiques au bord de l'eau.",
    href: buildSearchUrl({
      location: "Paris",
      venueTypes: ["Péniche"],
      ambiance: ["Atypique"],
    }),
  },
];
