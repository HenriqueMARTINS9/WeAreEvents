import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getReviewsByVenueId } from "@/data/venues";
import { fetchVenues } from "@/lib/supabase-data";
import { ArrowRight, Building2, Cake, Clock3, Euro, ExternalLink, Images, MapPin, Music2, Play, Route, ShieldCheck, Sparkles, Star, Tag, UtensilsCrossed, Users } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import DesktopNav from "@/components/DesktopNav";
import BookingModal from "@/components/BookingModal";
import SiteFooter from "@/components/SiteFooter";
import VenueDetailSheet from "@/components/VenueDetailSheet";
import VenueMediaLightbox, { type VenueMediaItem } from "@/components/VenueMediaLightbox";
import Seo, { siteUrl } from "@/components/Seo";

const filledItems = (items: Array<string | null | undefined>) => items.filter((item): item is string => Boolean(item?.trim()));
const hasItems = (items: Array<string | null | undefined>) => filledItems(items).length > 0;
const getVenueSeoTitle = (title: string) => `${title} | Réservez rapidement`;
const getVenueSeoDescription = (venue: { address: string; city: string; maxCapacity: number }) => {
  const address = venue.address || venue.city;
  const capacity = venue.maxCapacity > 0 ? `Jusqu'à ${venue.maxCapacity} personnes.` : "Capacité sur demande.";

  return `${address}. ${capacity} Retrouvez le reste des informations utiles sur la page de l'établissement.`;
};

const formatClosingLabel = (value: string) => {
  if (!value) return "Sur demande";
  if (value === "03:00") return "Après 2h";

  const [hours = "", minutes = ""] = value.split(":");
  const hourLabel = Number.isFinite(Number(hours)) ? String(Number(hours)) : hours;

  return `Jusqu'à ${hourLabel}h${minutes && minutes !== "00" ? minutes : ""}`;
};

const VenueDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: venues = [], isLoading } = useQuery({ queryKey: ["venues"], queryFn: fetchVenues });
  const venue = venues.find((item) => item.slug === slug);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number | null>(null);

  if (isLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Seo title="Salle introuvable - Wearevents" description="Cette salle n'existe pas ou n'est plus disponible." noindex />
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

  const seoTitle = getVenueSeoTitle(venue.title);
  const seoDescription = getVenueSeoDescription(venue);

  if (isMobile) {
    return (
      <>
        <Seo
          title={seoTitle}
          description={seoDescription}
          path={`/salle/${venue.slug}`}
          image={venue.coverImage}
        />
        <VenueDetailSheet venue={venue} onClose={() => navigate(-1)} onBooking={() => setBookingOpen(true)} />
        {bookingOpen && <BookingModal venue={venue} onClose={() => setBookingOpen(false)} />}
      </>
    );
  }

  const reviews = getReviewsByVenueId(venue.id);
  const galleryImages = [venue.coverImage, ...venue.gallery.filter((image) => image !== venue.coverImage)];
  const mediaItems: VenueMediaItem[] = [
    ...(venue.videoUrl ? [{
      type: "video" as const,
      src: venue.videoUrl,
      label: `Vidéo de ${venue.title}`,
      startSeconds: venue.videoStartSeconds,
      endSeconds: venue.videoEndSeconds,
    }] : []),
    ...galleryImages.map((image, index) => ({
      type: "image" as const,
      src: image,
      label: `${venue.title} - photo ${index + 1}`,
    })),
  ];
  const imageMediaOffset = venue.videoUrl ? 1 : 0;
  const reservationSpaces = venue.spaces;
  const averageCapacity = `${venue.minCapacity}–${venue.maxCapacity} pers.`;
  const closingLabel = formatClosingLabel(venue.closingTime);
  const hasAmbianceSection = hasItems(venue.ambianceTypes) || hasItems(venue.externalOptions);
  const hasUsefulInformation = hasItems(venue.usefulInformation);
  const hasUsefulInfoSection = hasItems(venue.services) || hasItems(venue.eventCategories) || hasUsefulInformation;
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const headerOffset = 112;
    const top = section.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      <Seo
        title={seoTitle}
        description={seoDescription}
        path={`/salle/${venue.slug}`}
        image={venue.coverImage}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "EventVenue",
          name: venue.title,
          description: venue.description || venue.tagline,
          image: [venue.coverImage, ...venue.gallery].filter(Boolean),
          url: `${siteUrl}/salle/${venue.slug}`,
          address: {
            "@type": "PostalAddress",
            streetAddress: venue.address,
            addressLocality: venue.city,
            addressCountry: "FR",
          },
          geo: {
            "@type": "GeoCoordinates",
            latitude: venue.location.lat,
            longitude: venue.location.lng,
          },
          aggregateRating: venue.reviewCount
            ? {
                "@type": "AggregateRating",
                ratingValue: venue.rating,
                reviewCount: venue.reviewCount,
              }
            : undefined,
          maximumAttendeeCapacity: venue.maxCapacity,
          email: venue.contactEmail,
        }}
      />
      <DesktopNav />

      <main className="pt-24">
        <section className="bg-background px-6 pb-8">
          <div className="mx-auto max-w-7xl xl:px-2">
            <div className="mb-5 flex flex-wrap items-center gap-2 text-sm font-body text-muted-foreground">
              <button type="button" onClick={() => navigate("/")} className="hover:text-foreground">Accueil</button>
              <span>/</span>
              <button type="button" onClick={() => navigate("/recherche")} className="hover:text-foreground">Salles</button>
              <span>/</span>
              <span className="text-foreground">{venue.title}</span>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  {[venue.priceTier, ...venue.ambianceTypes.slice(0, 2)].filter(Boolean).map((tag) => (
                    <span key={tag} className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-body font-semibold text-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
                <h1 className="font-heading text-5xl font-semibold leading-none xl:text-6xl">{venue.title}</h1>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-body text-muted-foreground">
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" />{venue.address}</span>
                  {venue.metroAccess && <span className="flex items-center gap-1.5"><Route className="h-4 w-4 text-primary" />{venue.metroAccess}</span>}
                  <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-accent text-accent" />{venue.rating}/5 ({venue.reviewCount} avis)</span>
                </div>
              </div>
              <button
                onClick={() => setBookingOpen(true)}
                className="brand-primary-button inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-body font-semibold text-primary-foreground transition-all hover:brightness-95"
              >
                Demander une disponibilité
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div data-header-theme="light" className="relative grid h-[468px] grid-cols-[minmax(0,1fr)_468px] gap-3 rounded-2xl bg-transparent">
              <button
                type="button"
                onClick={() => setActiveMediaIndex(imageMediaOffset)}
                className="group relative h-full overflow-hidden rounded-2xl text-left"
                aria-label="Ouvrir la photo principale"
              >
                <img src={galleryImages[0]} alt={venue.title} className="h-full w-full object-cover image-grade-luxe transition-transform duration-700 group-hover:scale-105" />
              </button>
              <div className="grid h-full grid-cols-2 content-start gap-3">
                {galleryImages.slice(1, 5).map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveMediaIndex(imageMediaOffset + index + 1)}
                    className="group aspect-square w-full overflow-hidden rounded-2xl"
                    aria-label={`Ouvrir la photo ${index + 2}`}
                  >
                    <img src={image} alt="" className="h-full w-full object-cover image-grade-luxe transition-transform duration-700 group-hover:scale-105" />
                  </button>
                ))}
              </div>
              <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 rounded-lg border border-primary-foreground/20 bg-foreground/75 p-2 text-primary-foreground backdrop-blur-xl">
                {[
                  `${venue.spaces.length} espace${venue.spaces.length > 1 ? "s" : ""}`,
                  averageCapacity,
                  venue.pricingText,
                ].map((item) => (
                  <span key={item} className="rounded-md bg-primary-foreground/10 px-3 py-1.5 text-xs font-body font-semibold">
                    {item}
                  </span>
                ))}
              </div>
              <div className="absolute bottom-4 right-4 flex flex-wrap justify-end gap-2">
                {venue.videoUrl && (
                  <button
                    type="button"
                    onClick={() => setActiveMediaIndex(0)}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary-foreground px-3 py-2 text-xs font-body font-semibold text-foreground shadow-lg transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Voir la vidéo
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveMediaIndex(imageMediaOffset)}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-foreground px-3 py-2 text-xs font-body font-semibold text-foreground shadow-lg transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <Images className="h-3.5 w-3.5" />
                  Voir toutes les photos
                </button>
              </div>
            </div>

            <nav className="mt-6 flex flex-wrap gap-2 border-b border-border pb-4 text-sm font-body font-semibold text-muted-foreground">
              {[
                ["#presentation", "Présentation"],
                ["#details", "Détails"],
                ["#options", "Options"],
                hasAmbianceSection ? ["#ambiance", "Ambiance"] : null,
                hasUsefulInfoSection ? ["#infos", "Informations utiles"] : null,
                ["#acces", "Se rendre"],
                ["#avis", `Avis (${reviews.length})`],
              ].filter((item): item is [string, string] => Boolean(item)).map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  onClick={(event) => {
                    event.preventDefault();
                    scrollToSection(href.replace("#", ""));
                    window.history.replaceState(null, "", href);
                  }}
                  className="rounded-lg px-3 py-2 transition-colors hover:bg-card hover:text-foreground"
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </section>

        <section className="px-6 py-14">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start xl:px-2">
            <div className="space-y-10">
              <section id="presentation" className="scroll-mt-28">
                <div className="rounded-lg border border-border bg-background p-5 luxury-shadow">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {[
                    { icon: <Users className="h-4 w-4" />, label: "Capacité max", value: averageCapacity },
                    { icon: <Clock3 className="h-4 w-4" />, label: "Horaires", value: closingLabel },
                    { icon: <Euro className="h-4 w-4" />, label: "Gamme de prix", value: venue.priceTier },
                    { icon: <ShieldCheck className="h-4 w-4" />, label: "Statut", value: "Lieu vérifié" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-border bg-card p-4">
                      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">{item.icon}</div>
                      <p className="text-xs font-body text-muted-foreground">{item.label}</p>
                      <p className="mt-1 font-heading text-xl font-semibold">{item.value}</p>
                    </div>
                  ))}
                  </div>
                </div>

                <div className="mt-8 rounded-lg border border-border bg-background p-7">
                  <p className="font-heading text-3xl italic text-primary">"{venue.tagline}"</p>
                  <p className="mt-5 max-w-3xl font-body text-lg leading-relaxed text-foreground/80">{venue.description}</p>
                </div>
              </section>

              <section id="details" className="scroll-mt-28 rounded-lg border border-border bg-background p-6">
                <h2 className="font-heading text-3xl font-semibold">Détails du lieu</h2>
                <p className="mt-2 max-w-2xl text-sm font-body leading-relaxed text-muted-foreground">
                  Les informations clés pour vérifier rapidement si le lieu correspond au format de votre événement.
                </p>
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InfoBlock icon={<Building2 className="h-4 w-4" />} title="Type de lieu" items={venue.venueTypes} />
                  <InfoBlock icon={<ShieldCheck className="h-4 w-4" />} title="Type d'espace" items={venue.spaceTypes} />
                  <InfoBlock icon={<Euro className="h-4 w-4" />} title="Type de privatisation" items={venue.privatizationTypes} />
                  <InfoBlock icon={<Users className="h-4 w-4" />} title="Disposition des invités" items={venue.guestDispositions} />
                  <InfoBlock icon={<Clock3 className="h-4 w-4" />} title="Horaires" items={venue.closingTime ? [closingLabel] : []} />
                  <InfoBlock icon={<Sparkles className="h-4 w-4" />} title="Options du lieu" items={venue.optionFeatures} />
                </div>
              </section>

              <section id="options" className="scroll-mt-28 rounded-lg border border-border bg-background p-6">
                <h2 className="font-heading text-3xl font-semibold">Sélectionnez une option de réservation</h2>
                <p className="mt-2 text-sm font-body text-muted-foreground">Chaque espace peut être demandé selon votre format, votre date et votre volume d'invités.</p>
                <div className="mt-5 grid grid-cols-1 gap-4">
                  {reservationSpaces.map((space) => (
                    <button
                      key={space.id}
                      type="button"
                      onClick={() => setBookingOpen(true)}
                      className="group overflow-hidden rounded-lg border border-border bg-card text-left transition-colors hover:border-primary/50"
                    >
                      <div className={`grid grid-cols-1 ${space.imageUrl ? "md:grid-cols-[13rem_minmax(0,1fr)]" : ""}`}>
                        {space.imageUrl && (
                          <div className="h-44 md:h-full">
                            <img src={space.imageUrl} alt={space.name} className="h-full w-full object-cover image-grade-luxe" loading="lazy" />
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-4 p-5">
                          <div>
                            <h3 className="font-heading text-2xl font-semibold">{space.name}</h3>
                            <p className="mt-2 text-sm font-body leading-relaxed text-muted-foreground">{space.description}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <span className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-body font-semibold text-secondary-foreground">{space.capacity} pers.</span>
                              {space.squareMeters && space.squareMeters > 0 && (
                                <span className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-body font-semibold text-secondary-foreground">{space.squareMeters} m²</span>
                              )}
                              <span className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-body font-semibold text-secondary-foreground">Disponibilité sur demande</span>
                            </div>
                          </div>
                          <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {hasAmbianceSection && (
                <section id="ambiance" className="scroll-mt-28 rounded-lg border border-border bg-background p-6">
                  <h2 className="font-heading text-3xl font-semibold">Ambiance & activités</h2>
                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InfoBlock icon={<Music2 className="h-4 w-4" />} title="Ambiance" items={venue.ambianceTypes} />
                    <InfoBlock icon={<Cake className="h-4 w-4" />} title="Ce que vous pouvez apporter" items={venue.externalOptions} />
                  </div>
                </section>
              )}

              {hasUsefulInfoSection && (
                <section id="infos" className="scroll-mt-28 rounded-lg border border-border bg-background p-6">
                  <h2 className="font-heading text-3xl font-semibold">Informations utiles</h2>
                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InfoBlock icon={<Tag className="h-4 w-4" />} title="Équipements & services" items={venue.services} />
                    <InfoBlock icon={<UtensilsCrossed className="h-4 w-4" />} title="Parfait pour" items={venue.eventCategories} />
                  </div>
                  {hasUsefulInformation && (
                    <div className="mt-4 rounded-lg border border-border bg-card p-5">
                      <h3 className="font-body text-sm font-semibold text-primary">À savoir</h3>
                      <div className="mt-4 space-y-3">
                        {filledItems(venue.usefulInformation).map((detail) => (
                          <p key={detail} className="text-sm font-body leading-relaxed text-foreground/75">{detail}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              <section id="acces" className="scroll-mt-28 rounded-lg border border-border bg-background p-6">
                <h2 className="font-heading text-3xl font-semibold">Se rendre au {venue.title}</h2>
                <div className="mt-5 rounded-lg border border-border bg-card p-5">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-body font-semibold">{venue.address}</p>
                      {venue.metroAccess && <p className="mt-2 text-sm font-body text-primary">{venue.metroAccess}</p>}
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-body font-semibold text-primary"
                  >
                    Voir sur la carte
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </section>

              <section id="avis" className="scroll-mt-28 rounded-lg border border-border bg-background p-6">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="font-heading text-3xl font-semibold">Avis</h2>
                    <p className="mt-2 text-sm font-body text-muted-foreground">Tous les retours affichés proviennent des demandes enregistrées.</p>
                  </div>
                  <div className="text-right">
                    <p className="font-heading text-4xl font-semibold text-primary">{venue.rating}/5</p>
                    <p className="text-xs font-body text-muted-foreground">{venue.reviewCount} avis</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-lg border border-border bg-card p-5">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-body text-sm font-semibold">{review.authorName}</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star key={index} className={`h-3.5 w-3.5 ${index < review.rating ? "fill-accent text-accent" : "text-border"}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm font-body leading-relaxed text-foreground/70">{review.comment}</p>
                    </div>
                  ))}
                  {reviews.length === 0 && (
                    <div className="rounded-lg border border-border bg-card p-6 text-sm font-body text-muted-foreground">Aucun avis pour le moment.</div>
                  )}
                </div>
              </section>
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-lg border border-border bg-card p-5 luxury-shadow lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto">
                <p className="text-xs font-body font-semibold text-primary">Réservation</p>
                <h2 className="mt-2 font-heading text-3xl font-semibold">Demande de disponibilité</h2>
                <p className="mt-2 text-sm font-body text-muted-foreground">Recevez un retour qualifié sur la disponibilité, les options et la cohérence avec votre événement.</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-secondary p-3">
                    <p className="text-xs font-body text-muted-foreground">Capacité</p>
                    <p className="font-body text-sm font-semibold">{averageCapacity}</p>
                  </div>
                  <div className="rounded-lg bg-secondary p-3">
                    <p className="text-xs font-body text-muted-foreground">Fermeture</p>
                    <p className="font-body text-sm font-semibold">{closingLabel}</p>
                  </div>
                </div>
                <button
                  onClick={() => setBookingOpen(true)}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-sm font-body font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-foreground"
                >
                  Demander une disponibilité
                  <ArrowRight className="h-4 w-4" />
                </button>
                <div className="mt-5 space-y-3 border-t border-border pt-5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                    <p className="text-sm font-body text-muted-foreground">Demande gratuite et sans engagement.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock3 className="mt-0.5 h-4 w-4 text-primary" />
                    <p className="text-sm font-body text-muted-foreground">Réponse qualifiée sous 24h ouvrées.</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>

      {bookingOpen && <BookingModal venue={venue} onClose={() => setBookingOpen(false)} />}
      {activeMediaIndex !== null && (
        <VenueMediaLightbox
          items={mediaItems}
          activeIndex={activeMediaIndex}
          onChange={setActiveMediaIndex}
          onClose={() => setActiveMediaIndex(null)}
        />
      )}
      <SiteFooter variant="dark" />
    </div>
  );
};

const InfoBlock = ({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) => {
  const visibleItems = filledItems(items);

  if (!visibleItems.length) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">{icon}</span>
        <h3 className="font-heading text-xl font-semibold">{title}</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {visibleItems.map((item) => (
          <span key={item} className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-body font-semibold text-secondary-foreground">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

export default VenueDetail;
