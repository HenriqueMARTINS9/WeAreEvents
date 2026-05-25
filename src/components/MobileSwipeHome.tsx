import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchVenues } from "@/lib/supabase-data";
import VenueCard from "./VenueCard";
import MobileHeader from "./MobileHeader";
import VenueCodeSearch from "./VenueCodeSearch";
import VenueDetailSheet from "./VenueDetailSheet";
import BookingModal from "./BookingModal";
import MobileCommentsSheet from "./MobileCommentsSheet";
import type { Venue } from "@/types/venue";
import { countMobileComments } from "@/lib/mobile-comments";

const shuffleList = <T,>(items: T[]) => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
};

const MOBILE_RENDER_RADIUS = 2;

const MobileSwipeHome = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCodeSearch, setShowCodeSearch] = useState(false);
  const [showEntryPrompt, setShowEntryPrompt] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [bookingVenue, setBookingVenue] = useState<Venue | null>(null);
  const [commentsVenue, setCommentsVenue] = useState<Venue | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [allowVideoPreview, setAllowVideoPreview] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: allVenues = [] } = useQuery({ queryKey: ["venues"], queryFn: fetchVenues });
  const venues = useMemo(() => shuffleList(allVenues.filter((v) => v.active)), [allVenues]);
  const entryPromptStorageKey = "wearevents-mobile-code-entry-seen";

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const idx = Math.round(container.scrollTop / container.clientHeight);
    if (container.scrollTop > 12) setAllowVideoPreview(true);
    setCurrentIndex(venues.length ? Math.min(idx, venues.length - 1) : 0);
  }, [venues.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(entryPromptStorageKey)) return;

    const timeout = window.setTimeout(() => {
      setShowEntryPrompt(true);
    }, 5200);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    setCommentCounts(
      Object.fromEntries(venues.map((venue) => [venue.id, countMobileComments(venue.id)])),
    );
  }, [venues]);

  const dismissEntryPrompt = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(entryPromptStorageKey, "true");
    }

    setShowEntryPrompt(false);
  };

  return (
    <main data-header-theme="light" className="fixed inset-0 overflow-x-hidden bg-foreground">
      <MobileHeader
        onCodeSearch={() => setShowCodeSearch(true)}
      />

      <div
        ref={containerRef}
        onScroll={handleScroll}
        onPointerDown={() => setAllowVideoPreview(true)}
        className="snap-container h-full w-full hide-scrollbar"
      >
        {venues.map((venue, index) => {
          const shouldRenderCard = Math.abs(index - currentIndex) <= MOBILE_RENDER_RADIUS;

          if (!shouldRenderCard) {
            return <div key={venue.id} className="snap-item h-screen w-full bg-foreground" aria-hidden="true" />;
          }

          return (
            <VenueCard
              key={venue.id}
              venue={venue}
              isActive={index === currentIndex}
              priority={index === currentIndex}
              allowVideo={allowVideoPreview && index === currentIndex}
              onOpenDetail={() => setSelectedVenue(venue)}
              onBooking={() => setBookingVenue(venue)}
              onComments={() => setCommentsVenue(venue)}
              commentsCount={commentCounts[venue.id] ?? 0}
            />
          );
        })}
      </div>

      {showEntryPrompt && (
        <VenueCodeSearch
          mode="entry"
          onClose={dismissEntryPrompt}
          onVenueFound={(venue) => {
            dismissEntryPrompt();
            navigate(`/salle/${venue.slug}`);
          }}
        />
      )}

      {showCodeSearch && (
        <VenueCodeSearch
          onClose={() => setShowCodeSearch(false)}
          onVenueFound={(venue) => {
            setShowCodeSearch(false);
            navigate(`/salle/${venue.slug}`);
          }}
        />
      )}

      {selectedVenue && (
        <VenueDetailSheet
          venue={selectedVenue}
          onClose={() => setSelectedVenue(null)}
          onBooking={() => {
            setBookingVenue(selectedVenue);
            setSelectedVenue(null);
          }}
        />
      )}

      {bookingVenue && (
        <BookingModal
          venue={bookingVenue}
          onClose={() => setBookingVenue(null)}
        />
      )}

      {commentsVenue && (
        <MobileCommentsSheet
          venue={commentsVenue}
          onClose={() => setCommentsVenue(null)}
          onCommentsChange={(count) => setCommentCounts((current) => ({ ...current, [commentsVenue.id]: count }))}
        />
      )}
    </main>
  );
};

export default MobileSwipeHome;
