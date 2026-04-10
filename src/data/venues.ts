import type { Venue, Review, TikTokVenueCodeMapping } from "@/types/venue";

export const mockVenues: Venue[] = [
  {
    id: "1",
    title: "Le Rooftop Étoilé",
    slug: "le-rooftop-etoile",
    tagline: "Paris sous les étoiles, à couper le souffle",
    description: "Perché au sommet d'un immeuble haussmannien, Le Rooftop Étoilé offre une vue panoramique sur tout Paris. Avec la Tour Eiffel en toile de fond, cet espace de 400m² est l'écrin parfait pour vos événements les plus prestigieux. Ambiance lounge, décoration raffinée et service irréprochable.",
    city: "Paris",
    address: "42 Avenue des Champs-Élysées, 75008 Paris",
    venueCode: "WE-ROOF01",
    minCapacity: 50,
    maxCapacity: 300,
    eventCategories: ["Mariage", "Corporate", "Gala", "Cocktail"],
    services: ["Traiteur", "DJ / Musique", "Décoration", "Parking privé", "Terrasse", "Wi-Fi", "Climatisation", "Vestiaire"],
    pricingText: "À partir de 5 000 €",
    coverImage: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80",
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80",
      "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800&q=80",
    ],
    videoUrl: "https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4",
    tiktokUrl: "https://tiktok.com/@wearevents",
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
    venueCode: "WE-VILLA02",
    minCapacity: 20,
    maxCapacity: 200,
    eventCategories: ["Mariage", "Anniversaire", "Soirée privée", "Séminaire"],
    services: ["Traiteur", "Décoration", "Photographe", "Parking privé", "Terrasse", "Piscine", "Cuisine équipée", "Wi-Fi"],
    pricingText: "À partir de 8 000 €",
    coverImage: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
      "https://images.unsplash.com/photo-1510076857177-7470076d4098?w=800&q=80",
    ],
    videoUrl: "https://videos.pexels.com/video-files/4062417/4062417-uhd_2560_1440_25fps.mp4",
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
    venueCode: "WE-LOFT03",
    minCapacity: 80,
    maxCapacity: 500,
    eventCategories: ["Corporate", "Lancement", "Cocktail", "Gala"],
    services: ["Traiteur", "DJ / Musique", "Projecteur", "Wi-Fi", "Climatisation", "Vestiaire", "Parking privé"],
    pricingText: "À partir de 3 500 €",
    coverImage: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
      "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800&q=80",
    ],
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
    venueCode: "WE-CHAT04",
    minCapacity: 40,
    maxCapacity: 400,
    eventCategories: ["Mariage", "Gala", "Séminaire", "Anniversaire"],
    services: ["Traiteur", "Décoration", "Photographe", "Parking privé", "Terrasse", "Cuisine équipée", "Vestiaire"],
    pricingText: "Sur devis",
    coverImage: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80",
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",
    ],
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
    venueCode: "WE-JARD05",
    minCapacity: 30,
    maxCapacity: 150,
    eventCategories: ["Mariage", "Anniversaire", "Cocktail", "Soirée privée"],
    services: ["Traiteur", "Décoration", "Terrasse", "Wi-Fi", "Climatisation"],
    pricingText: "À partir de 4 000 €",
    coverImage: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80",
      "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800&q=80",
    ],
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
    venueCode: "WE-NICE06",
    minCapacity: 20,
    maxCapacity: 120,
    eventCategories: ["Corporate", "Cocktail", "Anniversaire", "Lancement"],
    services: ["Traiteur", "DJ / Musique", "Terrasse", "Parking privé", "Wi-Fi", "Climatisation"],
    pricingText: "À partir de 6 000 €",
    coverImage: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800&q=80",
    ],
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
  { code: "WE-ROOF01", venueId: "1", campaignName: "Rooftop Paris sous les étoiles", active: true },
  { code: "TT-PARIS-ROOF", venueId: "1", campaignName: "Rooftop Étoilé TikTok reveal", active: true },
  { code: "WE-VILLA02", venueId: "2", campaignName: "Villa Méditerranée mariage privé", active: true },
  { code: "TT-MARSEILLE-VILLA", venueId: "2", campaignName: "Villa Méditerranée TikTok reveal", active: true },
  { code: "WE-LOFT03", venueId: "3", campaignName: "Loft industriel Lyon corporate", active: true },
  { code: "TT-LYON-LOFT", venueId: "3", campaignName: "Atelier Industriel TikTok reveal", active: true },
  { code: "WE-CHAT04", venueId: "4", campaignName: "Château des Lumières mariage", active: true },
  { code: "TT-LOIRE-CHATEAU", venueId: "4", campaignName: "Château des Lumières TikTok reveal", active: true },
  { code: "WE-JARD05", venueId: "5", campaignName: "Jardin Suspendu Bordeaux", active: true },
  { code: "TT-BDX-JARDIN", venueId: "5", campaignName: "Jardin Suspendu TikTok reveal", active: true },
  { code: "WE-NICE06", venueId: "6", campaignName: "Loft Riviera Nice", active: true },
  { code: "TT-NICE-RIVIERA", venueId: "6", campaignName: "Loft Riviera TikTok reveal", active: true },
];

const normalizeVenueCode = (code: string) => code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

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

export function searchVenues(filters: {
  query?: string;
  city?: string;
  eventType?: string;
  minGuests?: number;
}): Venue[] {
  return mockVenues.filter((v) => {
    if (!v.active) return false;
    if (filters.query) {
      const q = filters.query.toLowerCase();
      const codes = getTikTokCodesByVenueId(v.id).map((mapping) => mapping.code.toLowerCase());
      if (!v.title.toLowerCase().includes(q) && !v.city.toLowerCase().includes(q) && !v.venueCode.toLowerCase().includes(q) && !codes.some((code) => code.includes(q))) return false;
    }
    if (filters.city && v.city.toLowerCase() !== filters.city.toLowerCase()) return false;
    if (filters.eventType && !v.eventCategories.includes(filters.eventType)) return false;
    if (filters.minGuests && v.maxCapacity < filters.minGuests) return false;
    return true;
  });
}
