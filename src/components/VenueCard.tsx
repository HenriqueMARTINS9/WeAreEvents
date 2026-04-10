import { useState, useEffect, useRef } from "react";
import { Heart, Share2, MessageCircle, Star, MapPin, Users, Tag } from "lucide-react";
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
    <div className="snap-item h-screen w-full relative overflow-hidden">
      {/* Cover image */}
      <img
        src={venue.coverImage}
        alt={venue.title}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
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
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            showVideo ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* Progress bar for video transition */}
      {isActive && venue.videoUrl && !showVideo && (
        <div className="absolute top-0 left-0 right-0 z-20 h-0.5 bg-primary-foreground/20">
          <div
            className="h-full bg-primary"
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

      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-16 z-20 p-5 pb-8">
        <button onClick={onOpenDetail} className="text-left">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-body font-semibold tracking-wide">
              {venue.venueCode}
            </span>
            <span className="flex items-center gap-1 text-primary-foreground/80 text-xs font-body">
              <MapPin className="w-3 h-3" />
              {venue.city}
            </span>
          </div>

          <h2 className="font-heading text-2xl text-primary-foreground font-bold leading-tight mb-1">
            {venue.title}
          </h2>
          <p className="text-primary-foreground/80 text-sm font-body mb-3 line-clamp-2">
            {venue.tagline}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {venue.eventCategories.slice(0, 3).map((cat) => (
              <span
                key={cat}
                className="px-2 py-0.5 rounded-full glass text-primary-foreground text-xs font-body"
              >
                {cat}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4 text-primary-foreground/70 text-xs font-body">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {venue.minCapacity}–{venue.maxCapacity} pers.
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-primary text-primary" />
              {venue.rating} ({venue.reviewCount})
            </span>
          </div>
        </button>
      </div>

      {/* Right action column (TikTok style) */}
      <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-5">
        <button
          onClick={onBooking}
          className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg animate-pulse-soft"
        >
          <Tag className="w-5 h-5 text-primary-foreground" />
        </button>

        <button
          onClick={() => setLiked(!liked)}
          className="flex flex-col items-center gap-0.5"
        >
          <Heart
            className={`w-7 h-7 ${
              liked ? "fill-primary text-primary" : "text-primary-foreground"
            } transition-colors`}
          />
          <span className="text-primary-foreground text-[10px] font-body">
            {liked ? "Sauvé" : "Sauver"}
          </span>
        </button>

        <button className="flex flex-col items-center gap-0.5">
          <MessageCircle className="w-7 h-7 text-primary-foreground" />
          <span className="text-primary-foreground text-[10px] font-body">{venue.reviewCount}</span>
        </button>

        <button className="flex flex-col items-center gap-0.5">
          <Share2 className="w-7 h-7 text-primary-foreground" />
          <span className="text-primary-foreground text-[10px] font-body">Partager</span>
        </button>
      </div>

      {/* Bottom CTA */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pb-5">
        <button
          onClick={onBooking}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-body font-semibold text-sm tracking-wide shadow-lg active:scale-[0.98] transition-transform"
        >
          Réserver cette salle
        </button>
      </div>
    </div>
  );
};

export default VenueCard;
