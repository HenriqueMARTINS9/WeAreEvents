export type BlogPost = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  readTime: string;
  image: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "choisir-salle-evenement",
    category: "Guide",
    title: "Comment choisir une salle qui sert vraiment votre événement",
    excerpt:
      "Capacité, accès, ambiance, contraintes techniques : les critères à vérifier avant de bloquer une date.",
    readTime: "5 min",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&q=80",
  },
  {
    slug: "questions-a-poser-avant-visite",
    category: "Checklist",
    title: "Les questions à poser avant de visiter un lieu",
    excerpt:
      "Un mémo clair pour comparer plusieurs établissements et éviter les mauvaises surprises le jour J.",
    readTime: "4 min",
    image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200&q=80",
  },
  {
    slug: "referencer-etablissement",
    category: "Propriétaires",
    title: "Pourquoi référencer son établissement sur wearevents",
    excerpt:
      "Visibilité qualifiée, demandes mieux cadrées et mise en avant premium pour vos espaces événementiels.",
    readTime: "3 min",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80",
  },
];
