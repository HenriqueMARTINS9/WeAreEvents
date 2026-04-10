import { Star, MapPin, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Venue } from "@/types/venue";

interface VenueGridCardProps {
  venue: Venue;
}

const VenueGridCard = ({ venue }: VenueGridCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/salle/${venue.slug}`)}
      className="group cursor-pointer rounded-2xl overflow-hidden bg-card border border-border hover:shadow-xl transition-all duration-300"
    >
      <div className="relative h-56 overflow-hidden">
        <img
          src={venue.coverImage}
          alt={venue.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-body font-semibold">
            {venue.venueCode}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full glass-dark text-primary-foreground text-xs font-body">
            <Star className="w-3 h-3 fill-primary text-primary" />
            {venue.rating}
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-heading text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
          {venue.title}
        </h3>
        <p className="text-muted-foreground text-sm font-body mb-3 line-clamp-1">
          {venue.tagline}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground font-body">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {venue.city}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {venue.minCapacity}–{venue.maxCapacity}
          </span>
          <span className="text-primary font-semibold">{venue.pricingText}</span>
        </div>
      </div>
    </div>
  );
};

export default VenueGridCard;
