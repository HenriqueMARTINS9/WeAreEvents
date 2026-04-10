import { useParams, useNavigate } from "react-router-dom";
import { getVenueBySlug, getReviewsByVenueId } from "@/data/venues";
import { Star, MapPin, Users, Tag, ShieldCheck, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import DesktopNav from "@/components/DesktopNav";
import BookingModal from "@/components/BookingModal";
import VenueDetailSheet from "@/components/VenueDetailSheet";

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
          <button onClick={() => navigate("/")} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-sm">
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
        <div className="relative h-[58vh] min-h-[480px] bg-foreground">
          <img src={venue.coverImage} alt={venue.title} className="w-full h-full object-cover image-grade-luxe" />
          <div className="absolute inset-0 bg-gradient-dark" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/25 to-transparent" />
          <div className="absolute bottom-10 left-0 right-0 z-10">
            <div className="max-w-6xl mx-auto px-6">
              <span className="px-3 py-1.5 rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground text-sm font-body font-semibold mb-4 inline-block backdrop-blur-md">
                Code TikTok · {venue.venueCode}
              </span>

              <h1 className="font-heading text-5xl md:text-7xl text-primary-foreground font-semibold leading-none mb-5">{venue.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-primary-foreground/80 font-body text-sm">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{venue.city}</span>
                <span className="flex items-center gap-1"><Users className="w-4 h-4" />{venue.minCapacity}–{venue.maxCapacity} pers.</span>
                <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-accent text-accent" />{venue.rating} ({venue.reviewCount} avis)</span>
                <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-luxe-gold" />Lieu vérifié</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="border-b border-border pb-8">
            <p className="font-heading text-2xl md:text-3xl italic text-primary mb-5">"{venue.tagline}"</p>
            <p className="font-body text-foreground/80 leading-relaxed text-lg">{venue.description}</p>
          </div>

          {/* Gallery */}
          <div className="flex gap-3 overflow-x-auto hide-scrollbar">
            {venue.gallery.map((img, i) => (
              <img key={i} src={img} alt="" className="h-52 w-72 rounded-lg object-cover shrink-0 image-grade-luxe" loading="lazy" />
            ))}
          </div>

          {/* Event types */}
          <div>
            <h3 className="font-heading text-xl font-semibold mb-3">Types d'événements</h3>
            <div className="flex flex-wrap gap-2">
              {venue.eventCategories.map((cat) => (
                <span key={cat} className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-body">{cat}</span>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-heading text-xl font-semibold mb-3">Services & équipements</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {venue.services.map((svc) => (
                <div key={svc} className="flex items-center gap-2 p-3 rounded-lg border border-border bg-card text-sm font-body">
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
                <div key={r.id} className="p-5 rounded-lg border border-border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-body font-semibold text-sm">{r.authorName}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "fill-accent text-accent" : "text-border"}`} />
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
            <div className="p-6 rounded-lg bg-foreground text-primary-foreground luxury-shadow">
              <p className="text-xs text-primary-foreground/60 font-body mb-1">Tarif indicatif</p>
              <p className="font-heading text-3xl font-semibold text-luxe-gold mb-3">{venue.pricingText}</p>
              <p className="font-body text-sm text-primary-foreground/70 leading-relaxed mb-6">
                Recevez un retour qualifié sur la disponibilité, les options et la cohérence du lieu avec votre brief.
              </p>
              <button
                onClick={() => setBookingOpen(true)}
                className="flex w-full items-center justify-center gap-2 py-3.5 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-sm shadow-lg hover:bg-primary-foreground hover:text-foreground transition-colors"
              >
                Demander une disponibilité
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border text-center">
              <p className="text-xs text-muted-foreground font-body mb-1">Code TikTok</p>
              <p className="font-heading text-xl font-semibold text-primary">{venue.venueCode}</p>
              <p className="mt-2 text-xs font-body text-muted-foreground">Idéal pour retrouver ce lieu depuis TikTok.</p>
            </div>
          </div>
        </div>
      </div>

      {bookingOpen && <BookingModal venue={venue} onClose={() => setBookingOpen(false)} />}
    </div>
  );
};

export default VenueDetail;
