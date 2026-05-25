import { useMemo, useState, type MouseEvent } from "react";
import { Star, MapPin, Users, ArrowUpRight, ChevronLeft, ChevronRight, Images } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Venue } from "@/types/venue";

interface VenueGridCardProps {
  venue: Venue;
  size?: "default" | "large";
  variant?: "default" | "mobile" | "search";
}

const VenueGridCard = ({ venue, size = "default", variant = "default" }: VenueGridCardProps) => {
  const navigate = useNavigate();
  const isLarge = size === "large";
  const isSearch = variant === "search";
  const images = useMemo(
    () => [venue.coverImage, ...venue.gallery].filter((image, index, list) => image && list.indexOf(image) === index),
    [venue.coverImage, venue.gallery],
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const activeImage = images[activeImageIndex] ?? venue.coverImage;
  const hasMultipleImages = images.length > 1;
  const showPreviousImage = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setActiveImageIndex((current) => (current - 1 + images.length) % images.length);
  };
  const showNextImage = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setActiveImageIndex((current) => (current + 1) % images.length);
  };
  const openVenueDetailInNewTab = () => {
    window.open(`/salle/${venue.slug}`, "_blank", "noopener,noreferrer");
  };

  if (variant === "mobile") {
    return (
      <article
        onClick={() => navigate(`/salle/${venue.slug}`)}
        className="group cursor-pointer"
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
          <img
            src={activeImage}
            alt={venue.title}
            className="h-full w-full object-cover image-grade-luxe transition-transform duration-700 group-active:scale-[1.02]"
            loading="lazy"
          />
          {hasMultipleImages && (
            <>
              <button
                type="button"
                onClick={showPreviousImage}
                className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/86 text-foreground shadow-lg backdrop-blur-md active:scale-[0.96]"
                aria-label={`Photo précédente de ${venue.title}`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={showNextImage}
                className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/86 text-foreground shadow-lg backdrop-blur-md active:scale-[0.96]"
                aria-label={`Photo suivante de ${venue.title}`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-foreground/62 px-2.5 py-1 text-xs font-body font-semibold text-primary-foreground backdrop-blur-md">
                <Images className="h-3.5 w-3.5" />
                {activeImageIndex + 1}/{images.length}
              </div>
            </>
          )}
        </div>

        <div className="pt-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-heading text-2xl font-semibold leading-tight text-foreground">
                {venue.title}
              </h3>
              <p className="mt-1 text-sm font-body text-muted-foreground">
                {venue.city}
              </p>
            </div>
            <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-sm font-body font-semibold text-foreground">
              <Star className="h-4 w-4 fill-foreground text-foreground" />
              {venue.rating}
            </span>
          </div>
          <p className="mt-2 line-clamp-1 text-sm font-body leading-relaxed text-muted-foreground">
            {venue.tagline}
          </p>
          <p className="mt-1 text-sm font-body font-semibold text-foreground">
            {venue.minCapacity}–{venue.maxCapacity} invités · {venue.pricingText}
          </p>
        </div>
      </article>
    );
  }

  return (
    <div
      onClick={openVenueDetailInNewTab}
      className={`group flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 ${
        isSearch ? "shadow-sm hover:shadow-xl" : "luxury-shadow"
      }`}
    >
      <div className={`relative overflow-hidden bg-foreground ${isLarge ? "h-72" : "h-64"}`}>
        <img
          src={activeImage}
          alt={venue.title}
          className="w-full h-full object-cover image-grade-luxe transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-foreground/20" />
        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={showPreviousImage}
              className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-foreground/55 text-primary-foreground opacity-100 shadow-lg backdrop-blur-md transition-all hover:bg-primary md:opacity-0 md:group-hover:opacity-100"
              aria-label={`Photo précédente de ${venue.title}`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={showNextImage}
              className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-foreground/55 text-primary-foreground opacity-100 shadow-lg backdrop-blur-md transition-all hover:bg-primary md:opacity-0 md:group-hover:opacity-100"
              aria-label={`Photo suivante de ${venue.title}`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-lg bg-foreground/55 px-2 py-1 text-xs font-body font-semibold text-primary-foreground backdrop-blur-md">
              <Images className="h-3.5 w-3.5" />
              {activeImageIndex + 1}/{images.length}
            </div>
          </>
        )}
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg glass-dark text-primary-foreground text-xs font-body">
            <Star className="w-3 h-3 fill-accent text-accent" />
            {venue.rating}
          </div>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <p className="mb-1 text-xs font-body text-primary-foreground/75">{venue.city}</p>
          <h3 className={`font-heading font-semibold leading-tight text-primary-foreground ${isLarge ? "text-3xl" : "text-2xl"}`}>
            {venue.title}
          </h3>
        </div>
      </div>

      <div className={`flex flex-1 flex-col ${isLarge ? "p-6" : "p-5"}`}>
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
        <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
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
