import { useState, useEffect, useRef } from "react";
import { Heart, Share2, MessageCircle, Star, MapPin, Users, Tag, ShieldCheck } from "lucide-react";
import type { Venue } from "@/types/venue";

interface VenueCardProps {
  venue: Venue;
  isActive: boolean;
  onOpenDetail: () => void;
  onBooking: () => void;
}

const VenueCard = ({ venue, isActive, onOpenDetail, onBooking }: VenueCardProps) => {
  const [showVideo, setShowVideo] = useState(false);
  const [liked, setLiked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (isActive && venue.videoUrl) {
      timerRef.current = setTimeout(() => setShowVideo(true), 3000);
    } else {
      setShowVideo(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
    return () => clearTimeout(timerRef.current);
  }, [isActive, venue.videoUrl]);

  useEffect(() => {
    if (showVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [showVideo]);

  return (
    <div className="snap-item h-screen w-full relative overflow-hidden bg-foreground">
      {/* Cover image */}
      <img
        src={venue.coverImage}
        alt={venue.title}
        className={`absolute inset-0 w-full h-full object-cover image-grade-luxe transition-opacity duration-700 ${
          showVideo ? "opacity-0" : "opacity-100"
        }`}
        loading="lazy"
      />

      {/* Video */}
      {venue.videoUrl && (
        <video
          ref={videoRef}
          src={venue.videoUrl}
          muted
          loop
          playsInline
          className={`absolute inset-0 w-full h-full object-cover image-grade-luxe transition-opacity duration-700 ${
            showVideo ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* Progress bar for video transition */}
      {isActive && venue.videoUrl && !showVideo && (
        <div className="absolute top-0 left-0 right-0 z-20 h-0.5 bg-primary-foreground/20">
          <div
            className="h-full bg-accent"
            style={{ animation: "progress 3s linear forwards" }}
          />
          <style>{`
            @keyframes progress { from { width: 0%; } to { width: 100%; } }
          `}</style>
        </div>
      )}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-dark z-10" />
      <div className="absolute inset-0 bg-gradient-dark-top z-10" />
      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_22%_78%,rgba(190,154,83,0.18),transparent_32%)]" />

      {/* Content overlay */}
      <div className="absolute bottom-[6.5rem] left-0 right-16 z-20 px-5">
        <button onClick={onOpenDetail} className="text-left w-full">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-2 py-1 rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground text-[11px] font-body font-semibold">
              Code TikTok · {venue.venueCode}
            </span>
            <span className="flex items-center gap-1 text-primary-foreground/80 text-xs font-body">
              <MapPin className="w-3 h-3" />
              {venue.city}
            </span>
            <span className="flex items-center gap-1 text-primary-foreground/80 text-xs font-body">
              <ShieldCheck className="w-3 h-3 text-luxe-gold" />
              Sélection validée
            </span>
          </div>

          <p className="font-body text-xs text-luxe-gold mb-2">
            Lieu événementiel privé
          </p>

          <h2 className="font-heading text-[2rem] text-primary-foreground font-semibold leading-none mb-2">
            {venue.title}
          </h2>
          <p className="text-primary-foreground/80 text-sm font-body leading-relaxed mb-4 line-clamp-2">
            {venue.tagline}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {venue.eventCategories.slice(0, 3).map((cat) => (
              <span
                key={cat}
                className="px-2 py-1 rounded-lg glass text-primary-foreground text-xs font-body"
              >
                {cat}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-primary-foreground/75 text-xs font-body">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {venue.minCapacity}–{venue.maxCapacity} pers.
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-accent text-accent" />
              {venue.rating} ({venue.reviewCount})
            </span>
          </div>
        </button>
      </div>

      {/* Right action column (TikTok style) */}
      <div className="absolute right-3 bottom-28 z-20 flex flex-col items-center gap-4">
        <button
          onClick={onBooking}
          className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center luxury-shadow active:scale-[0.96] transition-transform"
        >
          <Tag className="w-5 h-5 text-primary-foreground" />
        </button>

        <button
          onClick={() => setLiked(!liked)}
          className="flex flex-col items-center gap-1 text-primary-foreground"
        >
          <span className="p-2 rounded-lg glass-dark">
            <Heart
              className={`w-6 h-6 ${
                liked ? "fill-accent text-accent" : "text-primary-foreground"
              } transition-colors`}
            />
          </span>
          <span className="text-[10px] font-body">
            {liked ? "Sauvé" : "Sauver"}
          </span>
        </button>

        <button className="flex flex-col items-center gap-1 text-primary-foreground">
          <span className="p-2 rounded-lg glass-dark">
            <MessageCircle className="w-6 h-6" />
          </span>
          <span className="text-[10px] font-body">{venue.reviewCount}</span>
        </button>

        <button className="flex flex-col items-center gap-1 text-primary-foreground">
          <span className="p-2 rounded-lg glass-dark">
            <Share2 className="w-6 h-6" />
          </span>
          <span className="text-[10px] font-body">Partager</span>
        </button>
      </div>

      {/* Bottom CTA */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] bg-gradient-to-t from-foreground via-foreground/75 to-transparent">
        <div className="flex gap-2">
          <button
            onClick={onBooking}
            className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-sm shadow-lg active:scale-[0.98] transition-transform"
          >
            Demander une visite
          </button>
          <button
            onClick={onOpenDetail}
            className="px-4 py-3 rounded-lg glass-dark text-primary-foreground font-body font-semibold text-sm active:scale-[0.98] transition-transform"
          >
            Détails
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] font-body text-primary-foreground/70">
          Conciergerie, devis et disponibilité sous 24h
        </p>
      </div>
    </div>
  );
};

export default VenueCard;
