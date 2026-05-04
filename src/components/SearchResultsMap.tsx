import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { divIcon, latLngBounds, type Map as LeafletMap } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { Venue } from "@/types/venue";
import { useIsMobile } from "@/hooks/use-mobile";
import "leaflet/dist/leaflet.css";

interface SearchResultsMapProps {
  venues: Venue[];
  onVisibleVenuesChange: (venueIds: string[]) => void;
  className?: string;
  fullHeight?: boolean;
  interactiveOnMobile?: boolean;
  hideBadge?: boolean;
}

const FRANCE_CENTER: [number, number] = [46.603354, 1.888334];
const markerIcon = divIcon({
  className: "venue-map-marker-wrapper",
  html: '<div class="venue-map-marker"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -10],
});

const fitMapToVenues = (map: LeafletMap, venues: Venue[]) => {
  if (venues.length === 0) {
    map.setView(FRANCE_CENTER, 5.5);
    return;
  }

  if (venues.length === 1) {
    map.setView([venues[0].location.lat, venues[0].location.lng], 13);
    return;
  }

  const bounds = latLngBounds(venues.map((venue) => [venue.location.lat, venue.location.lng]));
  map.fitBounds(bounds, { padding: [36, 36] });
};

const MapViewport = ({
  venues,
  onVisibleVenuesChange,
}: {
  venues: Venue[];
  onVisibleVenuesChange: (venueIds: string[]) => void;
}) => {
  const map = useMapEvents({
    moveend() {
      const bounds = map.getBounds();
      const visibleVenueIds = venues
        .filter((venue) => bounds.contains([venue.location.lat, venue.location.lng]))
        .map((venue) => venue.id);

      onVisibleVenuesChange(visibleVenueIds);
    },
  });

  useEffect(() => {
    fitMapToVenues(map, venues);
  }, [map, venues]);

  return null;
};

const SearchResultsMap = ({ venues, onVisibleVenuesChange, className = "", fullHeight = false, interactiveOnMobile = false, hideBadge = false }: SearchResultsMapProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const allowTouchInteractions = interactiveOnMobile || !isMobile;
  const mapKey = useMemo(() => venues.map((venue) => venue.id).join("-") || "empty", [venues]);
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);

  return (
    <div className={`isolate relative overflow-hidden rounded-2xl border border-border bg-card shadow-xl xl:h-full ${className}`}>
      {!hideBadge && (
        <div className="absolute right-4 top-4 z-[500] inline-flex items-center gap-2 rounded-full border border-border bg-background/95 px-3 py-2 text-xs font-body font-semibold text-foreground shadow-lg backdrop-blur-md">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          {venues.length} lieu{venues.length > 1 ? "x" : ""}
        </div>
      )}

      <div className={`relative z-0 ${fullHeight ? "h-full" : "h-[360px] md:h-full"}`}>
        <MapContainer
          key={mapKey}
          center={FRANCE_CENTER}
          zoom={5.5}
          scrollWheelZoom={!isMobile}
          dragging={allowTouchInteractions}
          touchZoom={interactiveOnMobile}
          doubleClickZoom={allowTouchInteractions}
          boxZoom={false}
          keyboard={false}
          className="z-0 h-full w-full"
          whenCreated={setMapInstance}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewport venues={venues} onVisibleVenuesChange={onVisibleVenuesChange} />
          {venues.map((venue) => (
            <Marker key={venue.id} position={[venue.location.lat, venue.location.lng]} icon={markerIcon}>
              <Popup closeButton={false} offset={[0, -6]}>
                <div className="min-w-[220px]">
                  <img
                    src={venue.coverImage}
                    alt={venue.title}
                    className="h-28 w-full rounded-md object-cover image-grade-luxe"
                    loading="lazy"
                  />
                  <p className="mt-3 text-xs font-body font-semibold uppercase text-primary">
                    {venue.city}
                  </p>
                  <h3 className="mt-1 font-heading text-xl font-semibold text-foreground">
                    {venue.title}
                  </h3>
                  <p className="mt-1 text-sm font-body text-muted-foreground">
                    {venue.pricingText}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/salle/${venue.slug}`)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-body font-semibold text-primary-foreground transition-colors hover:bg-primary"
                  >
                    Voir la fiche
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default SearchResultsMap;
