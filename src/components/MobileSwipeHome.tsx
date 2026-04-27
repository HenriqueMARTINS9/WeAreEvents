import { useState, useRef, useCallback, useEffect } from "react";
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

const MobileSwipeHome = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCodeSearch, setShowCodeSearch] = useState(false);
  const [showEntryPrompt, setShowEntryPrompt] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [bookingVenue, setBookingVenue] = useState<Venue | null>(null);
  const [commentsVenue, setCommentsVenue] = useState<Venue | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: allVenues = [] } = useQuery({ queryKey: ["venues"], queryFn: fetchVenues });
  const venues = allVenues.filter((v) => v.active);
  const entryPromptStorageKey = "wearevents-mobile-code-entry-seen";

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const idx = Math.round(container.scrollTop / container.clientHeight);
    setCurrentIndex(Math.min(idx, venues.length - 1));
  }, [venues.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(entryPromptStorageKey)) return;

    const timeout = window.setTimeout(() => {
      setShowEntryPrompt(true);
    }, 320);

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
    <div className="fixed inset-0 overflow-x-hidden bg-foreground">
      <MobileHeader
        onCodeSearch={() => setShowCodeSearch(true)}
      />

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="snap-container h-full w-full hide-scrollbar"
      >
        {venues.map((venue, index) => (
          <VenueCard
            key={venue.id}
            venue={venue}
            isActive={index === currentIndex}
            onOpenDetail={() => setSelectedVenue(venue)}
            onBooking={() => setBookingVenue(venue)}
            onComments={() => setCommentsVenue(venue)}
            commentsCount={commentCounts[venue.id] ?? 0}
          />
        ))}
      </div>

      {/* Dot indicator */}
      <div className="fixed right-2 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1.5">
        {venues.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 rounded-full transition-all duration-300 ${
              i === currentIndex ? "h-7 bg-accent" : "h-1.5 bg-primary-foreground/40"
            }`}
          />
        ))}
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
    </div>
  );
};

export default MobileSwipeHome;
