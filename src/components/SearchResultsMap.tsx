import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { divIcon, latLngBounds, type Map as LeafletMap } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { Venue } from "@/types/venue";
import "leaflet/dist/leaflet.css";

interface SearchResultsMapProps {
  venues: Venue[];
  onVisibleVenuesChange: (venueIds: string[]) => void;
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

const SearchResultsMap = ({ venues, onVisibleVenuesChange }: SearchResultsMapProps) => {
  const navigate = useNavigate();
  const mapKey = useMemo(() => venues.map((venue) => venue.id).join("-") || "empty", [venues]);
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card luxury-shadow">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-xs font-body font-semibold text-primary">Carte des lieux</p>
          <p className="mt-1 text-sm font-body text-muted-foreground">
            Visualisez les adresses correspondant à votre sélection.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-body font-semibold text-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          {venues.length} lieu{venues.length > 1 ? "x" : ""}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-3">
        <p className="text-xs font-body text-muted-foreground">
          Déplacez la carte pour ajuster la sélection affichée.
        </p>
        <button
          type="button"
          onClick={() => {
            if (mapInstance) fitMapToVenues(mapInstance, venues);
          }}
          className="shrink-0 rounded-lg border border-border bg-background px-3 py-2 text-xs font-body font-semibold text-foreground transition-colors hover:border-primary/30 hover:text-primary"
        >
          Recentrer
        </button>
      </div>

      <div className="relative h-[360px] md:h-[420px] xl:h-[calc(100vh-15rem)] xl:min-h-[560px]">
        <MapContainer
          key={mapKey}
          center={FRANCE_CENTER}
          zoom={5.5}
          scrollWheelZoom={false}
          className="h-full w-full"
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
