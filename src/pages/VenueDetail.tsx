import { useParams, useNavigate } from "react-router-dom";
import { getVenueBySlug, getReviewsByVenueId } from "@/data/venues";
import { Star, MapPin, Users, Tag, ArrowLeft, Heart, Share2, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import DesktopNav from "@/components/DesktopNav";
import BookingModal from "@/components/BookingModal";
import VenueDetailSheet from "@/components/VenueDetailSheet";

const serviceIcons: Record<string, string> = {};

const VenueDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const venue = getVenueBySlug(slug || "");
  const [bookingOpen, setBookingOpen] = useState(false);

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold mb-2">Salle introuvable</h1>
          <p className="text-muted-foreground font-body mb-4">Cette salle n'existe pas ou n'est plus disponible.</p>
          <button onClick={() => navigate("/")} className="px-6 py-2 rounded-xl bg-primary text-primary-foreground font-body font-semibold text-sm">
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <>
        <VenueDetailSheet venue={venue} onClose={() => navigate(-1)} onBooking={() => setBookingOpen(true)} />
        {bookingOpen && <BookingModal venue={venue} onClose={() => setBookingOpen(false)} />}
      </>
    );
  }

  const reviews = getReviewsByVenueId(venue.id);

  return (
    <div className="min-h-screen bg-background">
      <DesktopNav />

      {/* Hero */}
      <div className="pt-16">
        <div className="relative h-[50vh] min-h-[400px]">
          <img src={venue.coverImage} alt={venue.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-dark" />
          <div className="absolute bottom-8 left-0 right-0 z-10">
            <div className="max-w-6xl mx-auto px-6">
              <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-body font-semibold mb-3 inline-block">
                {venue.venueCode}
              </span>
              <h1 className="font-heading text-4xl md:text-5xl text-primary-foreground font-bold mb-2">{venue.title}</h1>
              <div className="flex items-center gap-4 text-primary-foreground/80 font-body text-sm">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{venue.city}</span>
                <span className="flex items-center gap-1"><Users className="w-4 h-4" />{venue.minCapacity}–{venue.maxCapacity} pers.</span>
                <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-primary text-primary" />{venue.rating} ({venue.reviewCount} avis)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <p className="font-heading text-xl italic text-primary mb-4">"{venue.tagline}"</p>
            <p className="font-body text-foreground/80 leading-relaxed">{venue.description}</p>
          </div>

          {/* Gallery */}
          <div className="flex gap-3 overflow-x-auto hide-scrollbar">
            {venue.gallery.map((img, i) => (
              <img key={i} src={img} alt="" className="h-44 w-64 rounded-xl object-cover shrink-0" loading="lazy" />
            ))}
          </div>

          {/* Event types */}
          <div>
            <h3 className="font-heading text-xl font-semibold mb-3">Types d'événements</h3>
            <div className="flex flex-wrap gap-2">
              {venue.eventCategories.map((cat) => (
                <span key={cat} className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-body">{cat}</span>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-heading text-xl font-semibold mb-3">Services & équipements</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {venue.services.map((svc) => (
                <div key={svc} className="flex items-center gap-2 p-3 rounded-xl bg-muted text-sm font-body">
                  <Tag className="w-4 h-4 text-primary" />
                  {svc}
                </div>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div>
            <h3 className="font-heading text-xl font-semibold mb-4">Avis ({reviews.length})</h3>
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-body font-semibold text-sm">{r.authorName}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "fill-primary text-primary" : "text-border"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm font-body text-foreground/70">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="sticky top-24 space-y-4">
            <div className="p-6 rounded-2xl border border-border bg-card">
              <p className="text-xs text-muted-foreground font-body mb-1">Tarif indicatif</p>
              <p className="font-heading text-2xl font-bold text-primary mb-6">{venue.pricingText}</p>
              <button
                onClick={() => setBookingOpen(true)}
                className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-body font-semibold text-sm shadow-lg hover:bg-primary/90 transition-colors"
              >
                Réserver cette salle
              </button>
            </div>
            <div className="p-4 rounded-2xl bg-rose-bg border border-primary/10 text-center">
              <p className="text-xs text-muted-foreground font-body mb-1">Code salle</p>
              <p className="font-heading text-lg font-bold text-primary">{venue.venueCode}</p>
            </div>
          </div>
        </div>
      </div>

      {bookingOpen && <BookingModal venue={venue} onClose={() => setBookingOpen(false)} />}
    </div>
  );
};

export default VenueDetail;
