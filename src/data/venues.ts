import type { Venue, Review, TikTokVenueCodeMapping } from "@/types/venue";
import { venueCanHostGuestCount } from "@/lib/venue-capacity";

export const mockVenues: Venue[] = [
  {
    id: "1",
    title: "Le Rooftop Étoilé",
    slug: "le-rooftop-etoile",
    tagline: "Paris sous les étoiles, à couper le souffle",
    description: "Perché au sommet d'un immeuble haussmannien, Le Rooftop Étoilé offre une vue panoramique sur tout Paris. Avec la Tour Eiffel en toile de fond, cet espace de 400m² est l'écrin parfait pour vos événements les plus prestigieux. Ambiance lounge, décoration raffinée et service irréprochable.",
    city: "Paris",
    address: "42 Avenue des Champs-Élysées, 75008 Paris",
    location: { lat: 48.8696, lng: 2.3078 },
    venueCode: "1001",
    minCapacity: 50,
    maxCapacity: 300,
    eventCategories: ["Mariage", "Corporate", "Gala", "Cocktail"],
    venueTypes: ["Rooftop", "Salle de réception"],
    services: ["Wi-Fi", "Climatisation", "Terrasse", "Système son", "Mobilier", "Parking"],
    spaces: [
      { id: "roof-main", name: "Terrasse principale", capacity: 180, description: "Vue panoramique sur Paris, idéale pour cocktail et dîner assis.", imageUrl: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=900&q=80" },
      { id: "roof-lounge", name: "Salon verrière", capacity: 70, description: "Espace couvert pour accueil, cocktail ou repli météo.", imageUrl: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=900&q=80" },
      { id: "roof-vip", name: "Suite privée", capacity: 30, description: "Petit espace confidentiel pour VIP, préparation ou rendez-vous presse.", imageUrl: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=900&q=80" },
    ],
    accessDetails: [
      "Métro George V à 4 minutes à pied.",
      "Ascenseur privatisable depuis le hall principal.",
      "Dépose minute possible avenue des Champs-Élysées, parking privé sur demande.",
    ],
    usefulInformation: [
      "Installation technique possible à partir de 14h.",
      "Fin de diffusion musicale extérieure à 23h30.",
      "Vestiaire, Wi-Fi haut débit et loge organisateur sur place.",
    ],
    pricingText: "À partir de 5 000 €",
    coverImage: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80",
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80",
      "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800&q=80",
    ],
    videoUrl: "https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4",
    videoStartSeconds: 2,
    videoEndSeconds: 18,
    tiktokUrl: "https://tiktok.com/@wearevents",
    googleReviewUrl: "https://g.page/r/CfRooftopEtoile/review",
    priceTier: "€€€",
    closingTime: "02:00",
    ambianceTypes: ["Élégant", "Animé", "Festif"],
    externalOptions: ["Possibilité de ramener son gâteau"],
    privatizationTypes: ["Forfait consommation (budget par personne)", "Location sèche (budget location)"],
    guestDispositions: ["Debout", "Assis"],
    spaceTypes: ["Espace clos", "Espace ouvert"],
    optionFeatures: ["Possibilité de mettre sa musique", "Possibilité de danser"],
    metroAccess: "George V, ligne 1",
    featured: true,
    active: true,
    contactEmail: "rooftop@wearevents.fr",
    rating: 4.8,
    reviewCount: 124,
  },
  {
    id: "2",
    title: "La Villa Méditerranée",
    slug: "la-villa-mediterranee",
    tagline: "L'élégance provençale au bord de l'eau",
    description: "Nichée entre les calanques et la mer, La Villa Méditerranée est un domaine d'exception de 2 hectares. Piscine à débordement, jardins luxuriants et salons intérieurs somptueux composent ce lieu unique pour des événements de 20 à 200 personnes.",
    city: "Marseille",
    address: "Corniche Kennedy, 13007 Marseille",
    location: { lat: 43.2814, lng: 5.3642 },
    venueCode: "1002",
    minCapacity: 20,
    maxCapacity: 200,
    eventCategories: ["Mariage", "Anniversaire", "Soirée privée", "Séminaire"],
    venueTypes: ["Villa", "Espace extérieur"],
    services: ["Wi-Fi", "Terrasse", "Mobilier", "Parking", "Climatisation"],
    spaces: [
      { id: "villa-garden", name: "Jardins et piscine", capacity: 120, description: "Espace extérieur pour cérémonie, cocktail et brunch.", imageUrl: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=900&q=80" },
      { id: "villa-salon", name: "Grand salon", capacity: 60, description: "Salon intérieur avec vue mer pour dîner ou réunion.", imageUrl: "https://images.unsplash.com/photo-1510076857177-7470076d4098?w=900&q=80" },
      { id: "villa-deck", name: "Deck sunset", capacity: 40, description: "Terrasse intime pour apéritif privé ou prise de parole.", imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&q=80" },
    ],
    accessDetails: [
      "Accès en voiture en 15 minutes depuis la gare Saint-Charles.",
      "Parking privé au sein de la propriété pour les prestataires et invités.",
      "Navettes privées possibles depuis le Vieux-Port.",
    ],
    usefulInformation: [
      "Site privatisable jusqu'à 2h du matin.",
      "Cuisine traiteur indépendante avec accès livraison.",
      "Mise à disposition d'un coordinateur sur demande.",
    ],
    pricingText: "À partir de 8 000 €",
    coverImage: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
      "https://images.unsplash.com/photo-1510076857177-7470076d4098?w=800&q=80",
    ],
    videoUrl: "https://videos.pexels.com/video-files/4062417/4062417-uhd_2560_1440_25fps.mp4",
    videoStartSeconds: 1,
    videoEndSeconds: 16,
    googleReviewUrl: "https://g.page/r/CfVillaMediterranee/review",
    priceTier: "€€€",
    closingTime: "02:00",
    ambianceTypes: ["Élégant", "Intimiste", "Festif"],
    externalOptions: ["Possibilité de ramener sa nourriture", "Possibilité de ramener son gâteau"],
    privatizationTypes: ["Location sèche (budget location)"],
    guestDispositions: ["Debout", "Assis"],
    spaceTypes: ["Espace clos", "Espace ouvert"],
    optionFeatures: ["Possibilité de mettre sa musique", "Décoration personnalisable"],
    metroAccess: "Navettes privées depuis le Vieux-Port",
    featured: true,
    active: true,
    contactEmail: "villa@wearevents.fr",
    rating: 4.9,
    reviewCount: 87,
  },
  {
    id: "3",
    title: "L'Atelier Industriel",
    slug: "latelier-industriel",
    tagline: "Le charme brut du loft new-yorkais à Lyon",
    description: "Ancien entrepôt transformé en loft événementiel de caractère, L'Atelier Industriel mêle briques apparentes, poutres métalliques et verrières XXL. Un espace modulable de 600m² au cœur du quartier de la Confluence, idéal pour les événements corporate et les soirées branchées.",
    city: "Lyon",
    address: "18 Quai Antoine Riboud, 69002 Lyon",
    location: { lat: 45.7433, lng: 4.8158 },
    venueCode: "1003",
    minCapacity: 80,
    maxCapacity: 500,
    eventCategories: ["Corporate", "Lancement", "Cocktail", "Gala"],
    venueTypes: ["Loft", "Salle de réception"],
    services: ["Projecteur", "Wi-Fi", "Climatisation", "Système son", "Micro", "Parking"],
    spaces: [
      { id: "atelier-hall", name: "Grande nef", capacity: 320, description: "Volume principal pour lancement, gala ou conférence.", imageUrl: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=900&q=80" },
      { id: "atelier-mezzanine", name: "Mezzanine networking", capacity: 90, description: "Vue plongeante pour accueil VIP et networking.", imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80" },
      { id: "atelier-studio", name: "Studio contenus", capacity: 45, description: "Pièce isolée pour interviews, showroom ou coulisses.", imageUrl: "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=900&q=80" },
    ],
    accessDetails: [
      "Tramway Hôtel de Région à 6 minutes à pied.",
      "Accès direct en utilitaire via quai technique latéral.",
      "Parking public Confluence à proximité immédiate.",
    ],
    usefulInformation: [
      "Hauteur sous plafond de 8 mètres dans la nef.",
      "Accroche technique et alimentation triphasée disponibles.",
      "Sécurité incendie et agent SSIAP possibles sur devis.",
    ],
    pricingText: "À partir de 3 500 €",
    coverImage: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
      "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800&q=80",
    ],
    googleReviewUrl: "https://g.page/r/CfAtelierIndustriel/review",
    priceTier: "€€",
    closingTime: "03:00",
    ambianceTypes: ["Corporate", "Animé", "Festif"],
    externalOptions: ["Possibilité de ramener sa nourriture", "Possibilité de ramener ses boissons"],
    privatizationTypes: ["Forfait consommation (budget par personne)", "Location sèche (budget location)"],
    guestDispositions: ["Debout", "Assis"],
    spaceTypes: ["Espace clos"],
    optionFeatures: ["Possibilité de mettre sa musique", "Possibilité de danser"],
    metroAccess: "Tram Hôtel de Région Montrochet",
    featured: true,
    active: true,
    contactEmail: "atelier@wearevents.fr",
    rating: 4.6,
    reviewCount: 65,
  },
  {
    id: "4",
    title: "Le Château des Lumières",
    slug: "le-chateau-des-lumieres",
    tagline: "Un conte de fées grandeur nature",
    description: "Château du XVIIIe siècle entièrement restauré, au milieu d'un parc de 5 hectares dans la vallée de la Loire. Salons d'apparat, orangerie, jardins à la française — un cadre royal pour des mariages et événements d'exception jusqu'à 400 personnes.",
    city: "Tours",
    address: "Route des Châteaux, 37000 Tours",
    location: { lat: 47.3898, lng: 0.6903 },
    venueCode: "1004",
    minCapacity: 40,
    maxCapacity: 400,
    eventCategories: ["Mariage", "Gala", "Séminaire", "Anniversaire"],
    venueTypes: ["Salle de réception", "Espace extérieur"],
    services: ["Terrasse", "Mobilier", "Parking", "Système son"],
    spaces: [
      { id: "chateau-orangerie", name: "Orangerie", capacity: 220, description: "Réception principale pour dîner, bal ou conférence.", imageUrl: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=900&q=80" },
      { id: "chateau-salons", name: "Salons d'apparat", capacity: 90, description: "Enfilade de salons pour cocktail, cérémonie ou conférences de presse.", imageUrl: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=900&q=80" },
      { id: "chateau-parc", name: "Parc et parvis", capacity: 400, description: "Grand extérieur pour cérémonie, garden party ou feu d'artifice.", imageUrl: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=900&q=80" },
    ],
    accessDetails: [
      "Accès en 20 minutes depuis la gare de Tours.",
      "Parking invités au sein du domaine avec signalétique dédiée.",
      "Possibilité de navettes depuis hôtels partenaires du centre-ville.",
    ],
    usefulInformation: [
      "Hébergement de préparation disponible sur le domaine.",
      "Fin de musique dans l'orangerie à 3h du matin.",
      "Le parc nécessite une validation météo la veille pour les installations lourdes.",
    ],
    pricingText: "Sur devis",
    coverImage: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80",
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",
    ],
    googleReviewUrl: "https://g.page/r/CfChateauLumieres/review",
    priceTier: "€€€",
    closingTime: "03:00",
    ambianceTypes: ["Élégant", "Calme", "Intimiste"],
    externalOptions: ["Possibilité de ramener son gâteau"],
    privatizationTypes: ["Location sèche (budget location)"],
    guestDispositions: ["Debout", "Assis"],
    spaceTypes: ["Espace clos", "Espace ouvert"],
    optionFeatures: ["Décoration personnalisable", "Heures supplémentaires possibles"],
    metroAccess: "Navettes depuis la gare de Tours",
    featured: false,
    active: true,
    contactEmail: "chateau@wearevents.fr",
    rating: 4.7,
    reviewCount: 43,
  },
  {
    id: "5",
    title: "Le Jardin Suspendu",
    slug: "le-jardin-suspendu",
    tagline: "Un oasis secret au cœur de Bordeaux",
    description: "Caché derrière une façade bordelaise classique, Le Jardin Suspendu révèle un espace végétalisé suspendu au-dessus de la ville. Terrasses en cascades, mur végétal, fontaines — un lieu magique et intime pour des événements de 30 à 150 personnes.",
    city: "Bordeaux",
    address: "21 Cours du Chapeau-Rouge, 33000 Bordeaux",
    location: { lat: 44.8424, lng: -0.5726 },
    venueCode: "1005",
    minCapacity: 30,
    maxCapacity: 150,
    eventCategories: ["Mariage", "Anniversaire", "Cocktail", "Soirée privée"],
    venueTypes: ["Espace extérieur", "Restaurant"],
    services: ["Terrasse", "Wi-Fi", "Climatisation", "Mobilier"],
    spaces: [
      { id: "jardin-terrasses", name: "Terrasses cascades", capacity: 80, description: "Extérieurs végétalisés pour cocktail et cérémonie intime.", imageUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=900&q=80" },
      { id: "jardin-salon", name: "Salon verrière", capacity: 45, description: "Espace intérieur lumineux pour dîner ou discours.", imageUrl: "https://images.unsplash.com/photo-1510076857177-7470076d4098?w=900&q=80" },
      { id: "jardin-bar", name: "Bar secret", capacity: 25, description: "Petit espace signature pour dégustation ou after privé.", imageUrl: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=900&q=80" },
    ],
    accessDetails: [
      "Tram B Grand Théâtre à 5 minutes à pied.",
      "Accès PMR par ascenseur depuis le hall principal.",
      "Zone de livraison matinale possible avant 11h.",
    ],
    usefulInformation: [
      "Le lieu convient particulièrement aux formats jusqu'à 110 personnes en dîner.",
      "Une solution de repli intérieur est prévue en cas de pluie.",
      "Décoration florale suspendue possible avec validation préalable.",
    ],
    pricingText: "À partir de 4 000 €",
    coverImage: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80",
      "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800&q=80",
    ],
    googleReviewUrl: "https://g.page/r/CfJardinSuspendu/review",
    priceTier: "€€",
    closingTime: "01:00",
    ambianceTypes: ["Calme", "Intimiste", "Élégant"],
    externalOptions: ["Possibilité de ramener sa nourriture", "Possibilité de ramener son gâteau"],
    privatizationTypes: ["Forfait consommation (budget par personne)"],
    guestDispositions: ["Debout", "Assis"],
    spaceTypes: ["Espace clos", "Espace ouvert"],
    optionFeatures: ["Décoration personnalisable"],
    metroAccess: "Tram B Grand Théâtre",
    featured: true,
    active: true,
    contactEmail: "jardin@wearevents.fr",
    rating: 4.9,
    reviewCount: 56,
  },
  {
    id: "6",
    title: "Le Loft Riviera",
    slug: "le-loft-riviera",
    tagline: "Glamour et vue mer sur la Côte d'Azur",
    description: "Un penthouse de 350m² avec terrasse panoramique surplombant la Baie des Anges. Design contemporain, matériaux nobles et une lumière exceptionnelle font de ce lieu un incontournable pour les événements haut de gamme à Nice.",
    city: "Nice",
    address: "14 Quai des États-Unis, 06000 Nice",
    location: { lat: 43.6958, lng: 7.2745 },
    venueCode: "1006",
    minCapacity: 20,
    maxCapacity: 120,
    eventCategories: ["Corporate", "Cocktail", "Anniversaire", "Lancement"],
    venueTypes: ["Loft", "Rooftop", "Appartement"],
    services: ["Terrasse", "Parking", "Wi-Fi", "Climatisation", "Système son", "Mobilier"],
    spaces: [
      { id: "riviera-terrace", name: "Terrasse panoramique", capacity: 70, description: "Vue mer pour cocktail, sunset session ou prise de parole.", imageUrl: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=900&q=80" },
      { id: "riviera-loft", name: "Loft principal", capacity: 45, description: "Pièce de réception intérieure pour dîner ou lancement presse.", imageUrl: "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=900&q=80" },
      { id: "riviera-suite", name: "Suite signature", capacity: 18, description: "Espace confidentiel pour comité, talents ou VIP.", imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80" },
    ],
    accessDetails: [
      "Accès en 15 minutes depuis l'aéroport Nice Côte d'Azur.",
      "Voiturier et parking partenaire disponibles sur réservation.",
      "Entrée privative avec contrôle d'accès à partir de 19h.",
    ],
    usefulInformation: [
      "Volume sonore encadré après minuit sur la terrasse.",
      "Le lieu dispose d'une cuisine d'office pour traiteur.",
      "Mobilier lounge inclus pour les formats cocktail.",
    ],
    pricingText: "À partir de 6 000 €",
    coverImage: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800&q=80",
    ],
    googleReviewUrl: "https://g.page/r/CfLoftRiviera/review",
    priceTier: "€€€",
    closingTime: "02:00",
    ambianceTypes: ["Animé", "Festif", "Élégant"],
    externalOptions: ["Possibilité de ramener ses boissons", "Possibilité de ramener son gâteau"],
    privatizationTypes: ["Forfait consommation (budget par personne)"],
    guestDispositions: ["Debout", "Assis"],
    spaceTypes: ["Espace clos", "Espace ouvert"],
    optionFeatures: ["Possibilité de mettre sa musique", "Possibilité de danser"],
    metroAccess: "Tram Opéra Vieille Ville",
    featured: false,
    active: true,
    contactEmail: "nice@wearevents.fr",
    rating: 4.5,
    reviewCount: 32,
  },
];

export const mockReviews: Review[] = [
  { id: "r1", venueId: "1", authorName: "Sophie M.", rating: 5, comment: "Un lieu absolument magique ! La vue sur Paris est à couper le souffle. Notre mariage était parfait.", createdAt: "2024-11-15" },
  { id: "r2", venueId: "1", authorName: "Thomas D.", rating: 5, comment: "Service impeccable, équipe très professionnelle. Je recommande les yeux fermés.", createdAt: "2024-10-22" },
  { id: "r3", venueId: "1", authorName: "Marie L.", rating: 4, comment: "Superbe cadre pour notre événement corporate. Seul bémol : le parking un peu éloigné.", createdAt: "2024-09-08" },
  { id: "r4", venueId: "2", authorName: "Julie R.", rating: 5, comment: "La villa est encore plus belle en vrai qu'en photo. Un rêve éveillé !", createdAt: "2024-12-01" },
  { id: "r5", venueId: "2", authorName: "Pierre K.", rating: 5, comment: "Cadre exceptionnel, piscine magnifique. Nos invités en parlent encore.", createdAt: "2024-11-10" },
  { id: "r6", venueId: "3", authorName: "Alex B.", rating: 4, comment: "L'espace est incroyable, très modulable. Parfait pour notre lancement de produit.", createdAt: "2024-10-05" },
  { id: "r7", venueId: "4", authorName: "Camille S.", rating: 5, comment: "Un château de conte de fées. Notre mariage était tout simplement royal.", createdAt: "2024-08-20" },
  { id: "r8", venueId: "5", authorName: "Léa F.", rating: 5, comment: "Un jardin secret incroyable ! L'ambiance est unique, on se sent hors du temps.", createdAt: "2024-09-30" },
];

export const mockTikTokCodeMappings: TikTokVenueCodeMapping[] = [
  { code: "1001", venueId: "1", campaignName: "Rooftop Paris sous les étoiles", active: true },
  { code: "TT-PARIS-ROOF", venueId: "1", campaignName: "Rooftop Étoilé TikTok reveal", active: true },
  { code: "1002", venueId: "2", campaignName: "Villa Méditerranée mariage privé", active: true },
  { code: "TT-MARSEILLE-VILLA", venueId: "2", campaignName: "Villa Méditerranée TikTok reveal", active: true },
  { code: "1003", venueId: "3", campaignName: "Loft industriel Lyon corporate", active: true },
  { code: "TT-LYON-LOFT", venueId: "3", campaignName: "Atelier Industriel TikTok reveal", active: true },
  { code: "1004", venueId: "4", campaignName: "Château des Lumières mariage", active: true },
  { code: "TT-LOIRE-CHATEAU", venueId: "4", campaignName: "Château des Lumières TikTok reveal", active: true },
  { code: "1005", venueId: "5", campaignName: "Jardin Suspendu Bordeaux", active: true },
  { code: "TT-BDX-JARDIN", venueId: "5", campaignName: "Jardin Suspendu TikTok reveal", active: true },
  { code: "1006", venueId: "6", campaignName: "Loft Riviera Nice", active: true },
  { code: "TT-NICE-RIVIERA", venueId: "6", campaignName: "Loft Riviera TikTok reveal", active: true },
];

const normalizeVenueCode = (code: string) => code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
const normalizeSearchValue = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
const getPostalCodeFromAddress = (address: string) => address.match(/\b\d{5}\b/)?.[0] ?? "";

export function getVenueBySlug(slug: string): Venue | undefined {
  return mockVenues.find((v) => v.slug === slug);
}

export function getTikTokCodeMapping(code: string): TikTokVenueCodeMapping | undefined {
  const normalizedCode = normalizeVenueCode(code);
  return mockTikTokCodeMappings.find((mapping) => normalizeVenueCode(mapping.code) === normalizedCode && mapping.active);
}

export function getTikTokCodesByVenueId(venueId: string): TikTokVenueCodeMapping[] {
  return mockTikTokCodeMappings.filter((mapping) => mapping.venueId === venueId && mapping.active);
}

export function getVenueByCode(code: string): Venue | undefined {
  const mapping = getTikTokCodeMapping(code);
  if (mapping) {
    return mockVenues.find((v) => v.id === mapping.venueId && v.active);
  }

  const normalizedCode = normalizeVenueCode(code);
  return mockVenues.find((v) => normalizeVenueCode(v.venueCode) === normalizedCode && v.active);
}

export function getReviewsByVenueId(venueId: string): Review[] {
  return mockReviews.filter((r) => r.venueId === venueId);
}

export function getVenueLocationSuggestions() {
  const locations = new Map<string, Set<string>>();

  mockVenues.forEach((venue) => {
    if (!venue.active) return;

    const cityKey = venue.city;
    const postalCode = getPostalCodeFromAddress(venue.address);
    const cityPostcodes = locations.get(cityKey) ?? new Set<string>();

    if (postalCode) {
      cityPostcodes.add(postalCode);
    }

    locations.set(cityKey, cityPostcodes);
  });

  return Array.from(locations.entries())
    .map(([city, postalCodes]) => ({
      city,
      postalCodes: Array.from(postalCodes).sort(),
    }))
    .sort((a, b) => a.city.localeCompare(b.city, "fr"));
}

export function searchVenues(filters: {
  locationQuery?: string;
  eventType?: string;
  minGuests?: number;
}): Venue[] {
  return mockVenues.filter((v) => {
    if (!v.active) return false;
    if (filters.locationQuery) {
      const locationQuery = normalizeSearchValue(filters.locationQuery);
      const city = normalizeSearchValue(v.city);
      const address = normalizeSearchValue(v.address);
      const postalCode = getPostalCodeFromAddress(v.address);

      if (!city.includes(locationQuery) && !address.includes(locationQuery) && !postalCode.startsWith(locationQuery)) {
        return false;
      }
    }
    if (filters.eventType && !v.eventCategories.includes(filters.eventType)) return false;
    if (!venueCanHostGuestCount(v, filters.minGuests)) return false;
    return true;
  });
}
