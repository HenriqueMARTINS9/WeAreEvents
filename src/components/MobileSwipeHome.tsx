import { useState, useRef, useEffect, useCallback } from "react";
import { mockVenues } from "@/data/venues";
import VenueCard from "./VenueCard";
import MobileHeader from "./MobileHeader";
import VenueCodeSearch from "./VenueCodeSearch";
import VenueDetailSheet from "./VenueDetailSheet";
import BookingModal from "./BookingModal";
import type { Venue } from "@/types/venue";

const MobileSwipeHome = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCodeSearch, setShowCodeSearch] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [bookingVenue, setBookingVenue] = useState<Venue | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const venues = mockVenues.filter((v) => v.active);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const idx = Math.round(container.scrollTop / container.clientHeight);
    setCurrentIndex(Math.min(idx, venues.length - 1));
  }, [venues.length]);

  return (
    <div className="fixed inset-0 bg-foreground">
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
          />
        ))}
      </div>

      {/* Dot indicator */}
      <div className="fixed right-2 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1.5">
        {venues.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 rounded-full transition-all duration-300 ${
              i === currentIndex ? "h-6 bg-primary" : "h-1.5 bg-primary-foreground/40"
            }`}
          />
        ))}
      </div>

      {showCodeSearch && (
        <VenueCodeSearch
          onClose={() => setShowCodeSearch(false)}
          onVenueFound={(venue) => {
            setShowCodeSearch(false);
            setSelectedVenue(venue);
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
    </div>
  );
};

export default MobileSwipeHome;
