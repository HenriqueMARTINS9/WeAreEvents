import { Share2, MessageCircle, Star, MapPin, Users, Tag, ShieldCheck } from "lucide-react";
import type { Venue } from "@/types/venue";
import { toast } from "sonner";
import { buildVenueWhatsAppUrl } from "@/lib/whatsapp";
import { countMobileComments } from "@/lib/mobile-comments";

interface VenueCardProps {
  venue: Venue;
  isActive: boolean;
  priority?: boolean;
  onOpenDetail: () => void;
  onBooking: () => void;
  onComments: () => void;
  commentsCount?: number;
}

const VenueCard = ({ venue, priority = false, onOpenDetail, onBooking, onComments, commentsCount }: VenueCardProps) => {
  const visibleCommentsCount = commentsCount ?? countMobileComments(venue.id);

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined"
      ? `${window.location.origin}/salle/${venue.slug}`
      : `/salle/${venue.slug}`;

    const shareData = {
      title: venue.title,
      text: `${venue.title} · ${venue.city}`,
      url: shareUrl,
    };

    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await navigator.share(shareData);
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Lien du lieu copié.");
        return;
      }

      toast.error("Le partage n'est pas disponible sur cet appareil.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      toast.error("Impossible de partager le lieu pour le moment.");
    }
  };

  return (
    <div className="snap-item h-screen w-full relative overflow-hidden bg-foreground">
      {/* Cover image */}
      <img
        src={venue.coverImage}
        alt={venue.title}
        width={1080}
        height={1920}
        className="absolute inset-0 h-full w-full object-cover image-grade-luxe"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding={priority ? "sync" : "async"}
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-dark z-10" />
      <div className="absolute inset-0 bg-gradient-dark-top z-10" />
      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_22%_78%,rgba(190,154,83,0.18),transparent_32%)]" />

      <button
        type="button"
        onClick={onOpenDetail}
        aria-label={`Ouvrir les détails de ${venue.title}`}
        className="absolute inset-0 z-[15]"
      />

      {/* Content overlay */}
      <div className="absolute bottom-12 left-0 right-16 z-20 px-5">
        <button type="button" onClick={onOpenDetail} className="text-left w-full">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-2 py-1 rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground text-[11px] font-body font-semibold">
              Code TikTok · {venue.venueCode}
            </span>
            <span className="flex items-center gap-1 text-primary-foreground/90 text-xs font-body">
              <MapPin className="w-3 h-3" />
              {venue.city}
            </span>
            <span className="flex items-center gap-1 text-primary-foreground/90 text-xs font-body">
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
          <p className="text-primary-foreground/90 text-sm font-body leading-relaxed mb-4 line-clamp-2">
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

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-primary-foreground/90 text-xs font-body">
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
      <div className="absolute right-3 bottom-12 z-20 flex flex-col items-center gap-4">
        <button
          onClick={onBooking}
          className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center luxury-shadow active:scale-[0.96] transition-transform"
          aria-label={`Demander une disponibilité pour ${venue.title}`}
        >
          <Tag className="w-5 h-5 text-primary-foreground" />
        </button>

        <a
          href={buildVenueWhatsAppUrl(venue)}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center gap-1 text-primary-foreground"
          aria-label={`Contacter sur WhatsApp pour ${venue.title}`}
        >
          <span className="h-12 w-12 rounded-full shadow-lg">
            <img src="/whatsapp-96.png" alt="" width={48} height={48} className="h-full w-full rounded-full object-contain" />
          </span>
        </a>

        <button
          type="button"
          onClick={onComments}
          className="flex flex-col items-center gap-1 text-primary-foreground"
          aria-label={`Voir les commentaires de ${venue.title}`}
        >
          <span className="p-2 rounded-lg glass-dark">
            <MessageCircle className="w-6 h-6" />
          </span>
          <span className="text-[10px] font-body">{visibleCommentsCount}</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="flex flex-col items-center gap-1 text-primary-foreground"
          aria-label={`Partager ${venue.title}`}
        >
          <span className="p-2 rounded-lg glass-dark">
            <Share2 className="w-6 h-6" />
          </span>
          <span className="text-[10px] font-body">Partager</span>
        </button>
      </div>
    </div>
  );
};

export default VenueCard;
