import { X, Star, MapPin, Users, Tag, Wifi, Car, UtensilsCrossed, Music, Camera, TreePine, Waves, ChefHat, Snowflake, Projector, ShirtIcon, ShieldCheck, ExternalLink, Play, Images } from "lucide-react";
import { useState } from "react";
import type { Venue } from "@/types/venue";
import { getReviewsByVenueId } from "@/data/venues";
import VenueMediaLightbox, { type VenueMediaItem } from "./VenueMediaLightbox";

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

const filledItems = (items: Array<string | null | undefined>) => items.filter((item): item is string => Boolean(item?.trim()));

const formatClosingLabel = (value: string) => {
  if (!value) return "Sur demande";
  if (value === "03:00") return "Après 2h";

  const [hours = "", minutes = ""] = value.split(":");
  const hourLabel = Number.isFinite(Number(hours)) ? String(Number(hours)) : hours;

  return `Jusqu'à ${hourLabel}h${minutes && minutes !== "00" ? minutes : ""}`;
};

const VenueDetailSheet = ({ venue, onClose, onBooking }: VenueDetailSheetProps) => {
  const [activeMediaIndex, setActiveMediaIndex] = useState<number | null>(null);
  const reviews = getReviewsByVenueId(venue.id);
  const heroImages = [venue.coverImage, ...venue.gallery.filter((image) => image !== venue.coverImage)];
  const mediaItems: VenueMediaItem[] = [
    ...(venue.videoUrl ? [{
      type: "video" as const,
      src: venue.videoUrl,
      label: `Vidéo de ${venue.title}`,
      startSeconds: venue.videoStartSeconds,
      endSeconds: venue.videoEndSeconds,
    }] : []),
    ...heroImages.map((image, index) => ({
      type: "image" as const,
      src: image,
      label: `${venue.title} - photo ${index + 1}`,
    })),
  ];
  const imageMediaOffset = venue.videoUrl ? 1 : 0;
  const closingLabel = formatClosingLabel(venue.closingTime);
  const usefulInformation = filledItems(venue.usefulInformation);
  const services = filledItems(venue.services);

  return (
    <div className="fixed inset-0 z-[2000] overflow-x-hidden overflow-y-auto bg-background animate-slide-up">
      {/* Hero */}
      <div className="relative p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex h-72 snap-x snap-mandatory overflow-x-auto rounded-2xl hide-scrollbar sm:h-96">
          {heroImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveMediaIndex(imageMediaOffset + index)}
              className="h-full w-full shrink-0 snap-center overflow-hidden"
              aria-label={`Ouvrir la photo ${index + 1}`}
            >
              <img
                src={image}
                alt={`${venue.title} ${index + 1}`}
                className="h-full w-full object-cover image-grade-luxe"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </button>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-3 rounded-2xl bg-gradient-dark" />
        <div className="pointer-events-none absolute inset-3 rounded-2xl bg-gradient-dark-top" />
        <button
          onClick={onClose}
          className="absolute right-5 top-[max(1.25rem,env(safe-area-inset-top))] z-10 p-2 rounded-lg glass"
        >
          <X className="w-5 h-5 text-primary-foreground" />
        </button>
        <div className="absolute bottom-6 left-6 right-6 z-10">
          <span className="px-2 py-1 rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground text-xs font-body font-semibold backdrop-blur-md">
            Code TikTok · {venue.venueCode}
          </span>
          <h1 className="mt-3 font-heading text-3xl font-semibold leading-none text-primary-foreground">
            {venue.title}
          </h1>
          <div className="mt-4 flex gap-2">
            {venue.videoUrl && (
              <button
                type="button"
                onClick={() => setActiveMediaIndex(0)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-foreground px-3 py-2 text-xs font-body font-semibold text-foreground"
              >
                <Play className="h-3.5 w-3.5" />
                Vidéo
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveMediaIndex(imageMediaOffset)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-foreground/12 px-3 py-2 text-xs font-body font-semibold text-primary-foreground backdrop-blur-md"
            >
              <Images className="h-3.5 w-3.5" />
              Photos
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-muted/35 p-5 pb-32">
        <div className="-mt-10 mb-5 grid grid-cols-3 gap-2 rounded-lg border border-border bg-background p-3 luxury-shadow">
          {[
            { label: "Espaces", value: venue.spaces.length },
            { label: "Capacité", value: `${venue.minCapacity}-${venue.maxCapacity}` },
            { label: "Prix", value: venue.priceTier },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p className="font-heading text-xl font-semibold">{item.value}</p>
              <p className="mt-1 text-[11px] font-body text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="mb-4 rounded-lg border border-border bg-background p-4">
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

        <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm font-body mb-4">
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
        </div>

        <MobileChipSection
          title="Profil du lieu"
          groups={[
            { label: "Type de lieu", items: venue.venueTypes },
            { label: "Événements", items: venue.eventCategories },
            { label: "Ambiances", items: venue.ambianceTypes },
            { label: "Type d'espace", items: venue.spaceTypes },
          ]}
        />

        <MobileChipSection
          title="Conditions & options"
          groups={[
            { label: "Horaires", items: venue.closingTime ? [closingLabel] : [] },
            { label: "Privatisation", items: venue.privatizationTypes },
            { label: "Disposition", items: venue.guestDispositions },
            { label: "Options du lieu", items: venue.optionFeatures },
            { label: "Apports possibles", items: venue.externalOptions },
          ]}
        />

        <h3 className="font-heading text-lg font-semibold mb-3">Espaces disponibles</h3>
        <div className="space-y-2 mb-6">
          {venue.spaces.map((space) => (
            <div key={space.id} className="overflow-hidden rounded-lg border border-border bg-background">
              {space.imageUrl && (
                <img src={space.imageUrl} alt={space.name} className="h-32 w-full object-cover image-grade-luxe" loading="lazy" />
              )}
              <div className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-body font-semibold">{space.name}</p>
                    <p className="mt-1 break-words text-sm font-body text-foreground/70">{space.description}</p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-foreground px-2 py-1 text-[11px] font-body font-semibold text-primary-foreground">
                    {space.capacity}
                  </span>
                </div>
                {space.squareMeters && space.squareMeters > 0 && (
                  <span className="mt-3 inline-flex rounded-lg bg-secondary px-2.5 py-1 text-[11px] font-body font-semibold text-secondary-foreground">
                    {space.squareMeters} m²
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <h3 className="font-heading text-lg font-semibold mb-3">Lieu exact</h3>
        <div className="rounded-lg border border-border bg-background p-4 mb-6">
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 mt-0.5 text-primary" />
            <div className="min-w-0">
              <p className="break-words text-sm font-body text-foreground/75">{venue.address}</p>
              {venue.metroAccess && (
                <p className="mt-2 break-words text-sm font-body text-primary">Métro / accès : {venue.metroAccess}</p>
              )}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-body font-semibold text-primary"
              >
                Voir sur la carte
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {usefulInformation.length > 0 && (
          <>
            <h3 className="font-heading text-lg font-semibold mb-3">Informations utiles</h3>
            <div className="rounded-lg border border-border bg-background p-4 mb-6 space-y-3">
              {usefulInformation.map((detail) => (
                <p key={detail} className="min-w-0 break-words text-sm font-body text-foreground/75">{detail}</p>
              ))}
            </div>
          </>
        )}

        {/* Services */}
        {services.length > 0 && (
          <>
            <h3 className="font-heading text-lg font-semibold mb-3">Services & équipements</h3>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {services.map((svc) => (
                <div key={svc} className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-background p-2.5 text-sm font-body">
                  {serviceIcons[svc] || <Tag className="w-4 h-4" />}
                  <span className="truncate">{svc}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pricing */}
        {venue.pricingText && (
          <div className="p-4 rounded-lg bg-foreground text-primary-foreground mb-6">
            <p className="text-xs text-primary-foreground/60 font-body mb-1">Tarif indicatif</p>
            <p className="font-heading text-2xl font-semibold text-luxe-gold">{venue.pricingText}</p>
            <p className="mt-2 text-xs font-body text-primary-foreground/60">Devis précis après validation de la date et du format.</p>
          </div>
        )}

        {/* Reviews */}
        <h3 className="font-heading text-lg font-semibold mb-3">
          Avis ({reviews.length})
        </h3>
        {reviews.length > 0 ? (
          <div className="space-y-3 mb-6">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 rounded-lg border border-border bg-background">
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
                <p className="break-words text-sm font-body text-foreground/70">{review.comment}</p>
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
      {activeMediaIndex !== null && (
        <VenueMediaLightbox
          items={mediaItems}
          activeIndex={activeMediaIndex}
          onChange={setActiveMediaIndex}
          onClose={() => setActiveMediaIndex(null)}
        />
      )}
    </div>
  );
};

const MobileChipSection = ({
  title,
  groups,
}: {
  title: string;
  groups: Array<{ label: string; items: string[] }>;
}) => {
  const visibleGroups = groups
    .map((group) => ({ ...group, items: filledItems(group.items) }))
    .filter((group) => group.items.length > 0);

  if (!visibleGroups.length) return null;

  return (
    <section className="mb-6 rounded-lg border border-border bg-background p-4">
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      <div className="mt-4 space-y-4">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 text-xs font-body font-semibold uppercase tracking-[0.08em] text-muted-foreground">{group.label}</p>
            <div className="flex flex-wrap gap-2">
              {group.items.map((item) => (
                <span key={item} className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-body font-semibold text-secondary-foreground">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default VenueDetailSheet;
