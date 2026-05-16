export type BlogPost = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  content: string;
  readTime: string;
  image: string;
  publishedAt?: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "choisir-salle-evenement",
    category: "Guide",
    title: "Comment choisir une salle qui sert vraiment votre événement",
    excerpt:
      "Capacité, accès, ambiance, contraintes techniques : les critères à vérifier avant de bloquer une date.",
    content: `Choisir une salle ne se résume pas à trouver un bel espace disponible. Le bon lieu doit faciliter votre organisation, rassurer vos invités et soutenir l'ambiance que vous souhaitez créer.

## Commencez par le format de votre événement

Un cocktail, un dîner assis, une conférence ou une soirée dansante ne demandent pas le même espace. Avant de comparer les lieux, clarifiez le nombre d'invités, le rythme de la soirée, les temps forts et les contraintes techniques.

- Vérifiez la capacité en configuration réelle.
- Demandez les horaires d'accès et de fermeture.
- Confirmez les règles sur la musique, le traiteur et les boissons.

## Pensez à l'expérience invité

L'adresse, les transports, l'accueil, la circulation dans l'espace et la qualité des services changent tout. Un lieu spectaculaire mais difficile d'accès peut vite compliquer l'expérience.

## Comparez avec une grille simple

Gardez les mêmes critères pour chaque visite : capacité, prix, disponibilité, accessibilité, prestations incluses, options externes et niveau d'accompagnement. Vous gagnerez du temps et éviterez les décisions uniquement basées sur le coup de coeur.`,
    readTime: "5 min",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&q=80",
  },
  {
    slug: "questions-a-poser-avant-visite",
    category: "Checklist",
    title: "Les questions à poser avant de visiter un lieu",
    excerpt:
      "Un mémo clair pour comparer plusieurs établissements et éviter les mauvaises surprises le jour J.",
    content: `Une visite de lieu est souvent courte. Pour en tirer le maximum, préparez vos questions avant d'arriver et notez les réponses dès la sortie.

## Les points à valider sur place

- Quelle est la capacité exacte selon le format choisi ?
- Quels espaces sont inclus dans la privatisation ?
- Jusqu'à quelle heure peut-on rester ?
- Le mobilier, le son, la projection ou la sécurité sont-ils inclus ?
- Peut-on faire venir un traiteur, un gâteau ou des boissons externes ?

## Les détails qui évitent les surprises

Demandez toujours ce qui est compris dans le prix. Certains lieux affichent un minimum de consommation, d'autres un forfait de privatisation ou des frais techniques.

## Après la visite

Comparez rapidement les lieux visités pendant que vos impressions sont fraîches. Le meilleur choix est souvent celui qui combine disponibilité, clarté des conditions et fluidité dans les échanges.`,
    readTime: "4 min",
    image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200&q=80",
  },
  {
    slug: "referencer-etablissement",
    category: "Propriétaires",
    title: "Pourquoi référencer son établissement sur Wearevents",
    excerpt:
      "Visibilité qualifiée, demandes mieux cadrées et mise en avant premium pour vos espaces événementiels.",
    content: `Référencer son établissement permet de recevoir des demandes plus qualifiées, mieux cadrées et plus faciles à transformer en réservation.

## Une visibilité utile

Les organisateurs comparent vite. Une fiche claire avec photos, capacité, ambiance, accès et conditions de privatisation aide votre lieu à ressortir au bon moment.

## Des demandes mieux préparées

Une demande complète permet de comprendre rapidement le type d'événement, le nombre d'invités, la date, le budget et les besoins spécifiques. Vous gagnez du temps et répondez plus précisément.

## Un modèle aligné avec vos résultats

Avec un fonctionnement à la commission confirmée, la mise en avant reste simple : pas de coût fixe, pas d'engagement inutile, et un intérêt partagé autour des réservations réalisées.`,
    readTime: "3 min",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80",
  },
];
