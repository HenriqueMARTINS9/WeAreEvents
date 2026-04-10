import { X, Star, MapPin, Users, Tag, Wifi, Car, UtensilsCrossed, Music, Camera, TreePine, Waves, ChefHat, Snowflake, Projector, ShirtIcon } from "lucide-react";
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
        <img src={venue.coverImage} alt={venue.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-dark" />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full glass"
        >
          <X className="w-5 h-5 text-primary-foreground" />
        </button>
        <div className="absolute bottom-4 left-4 z-10">
          <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-body font-semibold">
            {venue.venueCode}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 pb-32">
        <div className="flex items-start justify-between mb-1">
          <h1 className="font-heading text-2xl font-bold">{venue.title}</h1>
          <div className="flex items-center gap-1 text-sm font-body shrink-0 ml-2">
            <Star className="w-4 h-4 fill-primary text-primary" />
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

        <p className="font-heading text-lg italic text-primary mb-4">"{venue.tagline}"</p>

        <p className="text-sm font-body text-foreground/80 leading-relaxed mb-6">
          {venue.description}
        </p>

        {/* Gallery */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-6 -mx-5 px-5">
          {venue.gallery.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`${venue.title} ${i + 1}`}
              className="h-32 w-48 rounded-xl object-cover shrink-0"
              loading="lazy"
            />
          ))}
        </div>

        {/* Event types */}
        <h3 className="font-heading text-lg font-semibold mb-3">Types d'événements</h3>
        <div className="flex flex-wrap gap-2 mb-6">
          {venue.eventCategories.map((cat) => (
            <span key={cat} className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-body font-medium">
              {cat}
            </span>
          ))}
        </div>

        {/* Services */}
        <h3 className="font-heading text-lg font-semibold mb-3">Services & équipements</h3>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {venue.services.map((svc) => (
            <div key={svc} className="flex items-center gap-2 p-2.5 rounded-xl bg-muted text-sm font-body">
              {serviceIcons[svc] || <Tag className="w-4 h-4" />}
              {svc}
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="p-4 rounded-xl bg-rose-bg border border-primary/10 mb-6">
          <p className="text-xs text-muted-foreground font-body mb-1">Tarif indicatif</p>
          <p className="font-heading text-xl font-bold text-primary">{venue.pricingText}</p>
        </div>

        {/* Reviews */}
        <h3 className="font-heading text-lg font-semibold mb-3">
          Avis ({reviews.length})
        </h3>
        {reviews.length > 0 ? (
          <div className="space-y-3 mb-6">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 rounded-xl bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-body font-semibold text-sm">{review.authorName}</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < review.rating ? "fill-primary text-primary" : "text-border"
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
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-md border-t border-border z-10">
        <button
          onClick={onBooking}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-body font-semibold text-sm tracking-wide shadow-lg active:scale-[0.98] transition-transform"
        >
          Réserver cette salle
        </button>
      </div>
    </div>
  );
};

export default VenueDetailSheet;
