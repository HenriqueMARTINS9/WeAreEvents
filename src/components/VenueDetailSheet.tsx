import { X, Star, MapPin, Users, Tag, Wifi, Car, UtensilsCrossed, Music, Camera, TreePine, Waves, ChefHat, Snowflake, Projector, ShirtIcon, ShieldCheck } from "lucide-react";
import type { Venue } from "@/types/venue";
import { getReviewsByVenueId } from "@/data/venues";

interface VenueDetailSheetProps {
  venue: Venue;
  onClose: () => void;
  onBooking: () => void;
}

const serviceIcons: Record<string, React.ReactNode> = {
  "Traiteur": <UtensilsCrossed className="w-4 h-4" />,
  "DJ / Musique": <Music className="w-4 h-4" />,
  "Décoration": <TreePine className="w-4 h-4" />,
  "Photographe": <Camera className="w-4 h-4" />,
  "Parking privé": <Car className="w-4 h-4" />,
  "Terrasse": <TreePine className="w-4 h-4" />,
  "Piscine": <Waves className="w-4 h-4" />,
  "Cuisine équipée": <ChefHat className="w-4 h-4" />,
  "Wi-Fi": <Wifi className="w-4 h-4" />,
  "Climatisation": <Snowflake className="w-4 h-4" />,
  "Projecteur": <Projector className="w-4 h-4" />,
  "Vestiaire": <ShirtIcon className="w-4 h-4" />,
};

const VenueDetailSheet = ({ venue, onClose, onBooking }: VenueDetailSheetProps) => {
  const reviews = getReviewsByVenueId(venue.id);

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto animate-slide-up">
      {/* Hero */}
      <div className="relative h-72 sm:h-96">
        <img src={venue.coverImage} alt={venue.title} className="w-full h-full object-cover image-grade-luxe" />
        <div className="absolute inset-0 bg-gradient-dark" />
        <div className="absolute inset-0 bg-gradient-dark-top" />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg glass"
        >
          <X className="w-5 h-5 text-primary-foreground" />
        </button>
        <div className="absolute bottom-5 left-5 right-5 z-10">
          <span className="px-2 py-1 rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground text-xs font-body font-semibold backdrop-blur-md">
            Code TikTok · {venue.venueCode}
          </span>
          <h1 className="mt-3 font-heading text-3xl font-semibold leading-none text-primary-foreground">
            {venue.title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 pb-32">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-body text-primary">
            <ShieldCheck className="w-4 h-4" />
            Lieu vérifié
          </div>
          <div className="flex items-center gap-1 text-sm font-body shrink-0 ml-2">
            <Star className="w-4 h-4 fill-accent text-accent" />
            <span className="font-semibold">{venue.rating}</span>
            <span className="text-muted-foreground">({venue.reviewCount})</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground text-sm font-body mb-4">
          <MapPin className="w-4 h-4" />
          {venue.city}
          <span className="mx-1">·</span>
          <Users className="w-4 h-4" />
          {venue.minCapacity}–{venue.maxCapacity} personnes
        </div>

        <p className="font-heading text-xl italic text-primary mb-4">"{venue.tagline}"</p>

        <p className="text-sm font-body text-foreground/80 leading-relaxed mb-7">
          {venue.description}
        </p>

        {/* Gallery */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-6 -mx-5 px-5">
          {venue.gallery.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`${venue.title} ${i + 1}`}
              className="h-32 w-48 rounded-lg object-cover shrink-0 image-grade-luxe"
              loading="lazy"
            />
          ))}
        </div>

        {/* Event types */}
        <h3 className="font-heading text-lg font-semibold mb-3">Types d'événements</h3>
        <div className="flex flex-wrap gap-2 mb-6">
          {venue.eventCategories.map((cat) => (
            <span key={cat} className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-body font-medium">
              {cat}
            </span>
          ))}
        </div>

        {/* Services */}
        <h3 className="font-heading text-lg font-semibold mb-3">Services & équipements</h3>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {venue.services.map((svc) => (
            <div key={svc} className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card text-sm font-body">
              {serviceIcons[svc] || <Tag className="w-4 h-4" />}
              {svc}
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="p-4 rounded-lg bg-foreground text-primary-foreground mb-6">
          <p className="text-xs text-primary-foreground/60 font-body mb-1">Tarif indicatif</p>
          <p className="font-heading text-2xl font-semibold text-luxe-gold">{venue.pricingText}</p>
          <p className="mt-2 text-xs font-body text-primary-foreground/60">Devis précis après validation de la date et du format.</p>
        </div>

        {/* Reviews */}
        <h3 className="font-heading text-lg font-semibold mb-3">
          Avis ({reviews.length})
        </h3>
        {reviews.length > 0 ? (
          <div className="space-y-3 mb-6">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-body font-semibold text-sm">{review.authorName}</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < review.rating ? "fill-accent text-accent" : "text-border"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm font-body text-foreground/70">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground font-body mb-6">Aucun avis pour le moment.</p>
        )}
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] bg-background/95 backdrop-blur-md border-t border-border z-10">
        <button
          onClick={onBooking}
          className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-sm shadow-lg active:scale-[0.98] transition-transform"
        >
          Demander une disponibilité
        </button>
        <p className="mt-2 text-center text-[11px] font-body text-muted-foreground">Réponse qualifiée sous 24h</p>
      </div>
    </div>
  );
};

export default VenueDetailSheet;
