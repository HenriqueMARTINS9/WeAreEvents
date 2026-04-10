import { Star, MapPin, Users, ArrowUpRight } from "lucide-react";
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
      className="group cursor-pointer overflow-hidden rounded-lg border border-border bg-card luxury-shadow transition-all duration-300 hover:-translate-y-1 hover:border-primary/40"
    >
      <div className="relative h-64 overflow-hidden bg-foreground">
        <img
          src={venue.coverImage}
          alt={venue.title}
          className="w-full h-full object-cover image-grade-luxe transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-foreground/20" />
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground text-xs font-body font-semibold backdrop-blur-md">
            Code TikTok · {venue.venueCode}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg glass-dark text-primary-foreground text-xs font-body">
            <Star className="w-3 h-3 fill-accent text-accent" />
            {venue.rating}
          </div>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-xs font-body text-luxe-gold mb-1">Sélection WeAreEvents</p>
          <h3 className="font-heading text-2xl font-semibold leading-tight text-primary-foreground">
            {venue.title}
          </h3>
        </div>
      </div>

      <div className="p-5">
        <p className="text-muted-foreground text-sm font-body leading-relaxed mb-4 line-clamp-2">
          {venue.tagline}
        </p>
        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground font-body">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {venue.city}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {venue.minCapacity}–{venue.maxCapacity}
          </span>
          <span className="col-span-2 text-primary font-semibold">{venue.pricingText}</span>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <span className="text-xs font-body text-muted-foreground">Disponibilité sur demande</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-primary-foreground transition-colors group-hover:bg-primary">
            <ArrowUpRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </div>
  );
};

export default VenueGridCard;
