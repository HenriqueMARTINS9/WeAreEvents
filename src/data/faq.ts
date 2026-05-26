export type FaqItem = {
  question: string;
  answer: string[];
};

export const faqItems: FaqItem[] = [
  {
    question: "Comment fonctionne Wearevents ?",
    answer: [
      "Wearevents vous permet de trouver et réserver facilement le lieu idéal pour votre événement. Il vous suffit d'envoyer une demande sur le lieu qui vous intéresse en précisant votre date, le nombre d'invités et les grandes lignes de votre événement.",
      "Notre équipe vous accompagne ensuite directement jusqu'à la réservation.",
    ],
  },
  {
    question: "Est-ce que le service est gratuit pour les organisateurs ?",
    answer: [
      "Oui, le service est entièrement gratuit pour les organisateurs.",
      "Wearevents est rémunéré directement par les établissements partenaires une fois la réservation confirmée.",
    ],
  },
  {
    question: "Quels types de lieux peut-on réserver ?",
    answer: [
      "Nous proposons une large sélection de lieux pour tous types d'événements : bars, restaurants, clubs, rooftops, péniches, lofts, salles de réception, espaces extérieurs et lieux atypiques.",
      "Nos lieux sont adaptés aussi bien aux événements privés que professionnels.",
    ],
  },
  {
    question: "Quels sont les différents types de privatisation ?",
    answer: [
      "Selon les établissements, plusieurs formats sont possibles. La privatisation complète vous réserve entièrement le lieu, tandis que la semi-privatisation vous donne accès à un espace dédié au sein d'un établissement partagé.",
      "Notre équipe vous aide à choisir la formule la plus adaptée à votre événement, au nombre d'invités et à votre budget.",
    ],
  },
  {
    question: "Combien de temps à l'avance faut-il réserver ?",
    answer: [
      "Nous recommandons de réserver 2 à 4 semaines à l'avance pour la majorité des événements, et 1 à 3 mois à l'avance pour les gros événements ou les périodes très demandées.",
      "Certaines réservations peuvent néanmoins être organisées en last minute selon les disponibilités.",
    ],
  },
  {
    question: "Que se passe-t-il après ma demande ?",
    answer: [
      "Une fois votre demande envoyée sur un lieu, notre équipe prend directement contact avec vous afin d'échanger sur votre événement : nombre de personnes, budget, ambiance recherchée, horaires, prestations souhaitées, etc.",
      "La réservation reste ensuite soumise aux disponibilités du lieu. Si l'établissement n'est plus disponible ou ne correspond finalement pas parfaitement à votre besoin, nous vous proposons rapidement des alternatives similaires adaptées à votre événement.",
      "Nous vous accompagnons tout au long du processus jusqu'à la confirmation du booking.",
    ],
  },
  {
    question: "Les lieux sont-ils vérifiés ?",
    answer: [
      "Oui. Nous sélectionnons soigneusement nos établissements partenaires.",
      "Notre équipe visite régulièrement les lieux afin de vérifier la qualité des espaces, l'ambiance, l'accueil et la cohérence avec les événements proposés. Nous réalisons également des vidéos et contenus sur place pour offrir une vision fidèle des établissements.",
    ],
  },
  {
    question: "Qui peut privatiser une salle ?",
    answer: [
      "Tout le monde peut réserver un lieu via Wearevents : particuliers, entreprises, associations, écoles et agences événementielles.",
      "Nous accompagnons aussi bien les anniversaires et soirées privées que les événements professionnels.",
    ],
  },
  {
    question: "Quelle est la différence entre une location sèche et un forfait consommation ?",
    answer: [
      "La location sèche signifie que vous payez uniquement la privatisation du lieu. Les consommations et prestations sont généralement facturées en supplément.",
      "Le forfait consommation, ou minimum de consommation, signifie qu'il n'y a pas de coût de privatisation fixe. Vous vous engagez simplement à atteindre un montant minimum de dépenses en boissons ou restauration pendant l'événement.",
      "Le forfait consommation est souvent plus avantageux pour les groupes souhaitant organiser un événement sans payer de location pure.",
    ],
  },
];
