import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef } from "react";

export interface VenueMediaItem {
  type: "image" | "video";
  src: string;
  label: string;
  startSeconds?: number;
  endSeconds?: number;
}

interface VenueMediaLightboxProps {
  items: VenueMediaItem[];
  activeIndex: number;
  onChange: (index: number) => void;
  onClose: () => void;
}

const VenueMediaLightbox = ({ items, activeIndex, onChange, onClose }: VenueMediaLightboxProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeItem = items[activeIndex];
  const hasPrevious = activeIndex > 0;
  const hasNext = activeIndex < items.length - 1;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && hasPrevious) onChange(activeIndex - 1);
      if (event.key === "ArrowRight" && hasNext) onChange(activeIndex + 1);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, hasNext, hasPrevious, onChange, onClose]);

  useEffect(() => {
    if (activeItem?.type !== "video" || !videoRef.current) return;

    videoRef.current.currentTime = activeItem.startSeconds ?? 0;
  }, [activeItem]);

  if (!activeItem) return null;

  const handleTimeUpdate = () => {
    if (activeItem.type !== "video" || !videoRef.current || !activeItem.endSeconds) return;

    if (videoRef.current.currentTime >= activeItem.endSeconds) {
      videoRef.current.currentTime = activeItem.startSeconds ?? 0;
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-[2600] bg-foreground text-primary-foreground">
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-4 sm:px-6">
        <div>
          <p className="text-xs font-body font-semibold text-primary-foreground/55">
            {activeIndex + 1} / {items.length}
          </p>
          <p className="mt-1 font-body text-sm font-semibold">{activeItem.label}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/10 text-primary-foreground transition-colors hover:bg-primary-foreground hover:text-foreground"
          aria-label="Fermer la galerie"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex h-full items-center justify-center px-4 py-20">
        {activeItem.type === "video" ? (
          <video
            ref={videoRef}
            src={activeItem.src}
            controls
            autoPlay
            playsInline
            onLoadedMetadata={() => {
              if (videoRef.current) videoRef.current.currentTime = activeItem.startSeconds ?? 0;
            }}
            onTimeUpdate={handleTimeUpdate}
            className="max-h-full w-full max-w-6xl rounded-2xl object-contain"
          />
        ) : (
          <img
            src={activeItem.src}
            alt={activeItem.label}
            className="max-h-full w-full max-w-6xl rounded-2xl object-contain"
          />
        )}
      </div>

      {hasPrevious && (
        <button
          type="button"
          onClick={() => onChange(activeIndex - 1)}
          className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-primary-foreground/10 text-primary-foreground backdrop-blur-md transition-colors hover:bg-primary-foreground hover:text-foreground sm:left-6"
          aria-label="Média précédent"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {hasNext && (
        <button
          type="button"
          onClick={() => onChange(activeIndex + 1)}
          className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-primary-foreground/10 text-primary-foreground backdrop-blur-md transition-colors hover:bg-primary-foreground hover:text-foreground sm:right-6"
          aria-label="Média suivant"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      <div className="absolute inset-x-0 bottom-0 flex gap-2 overflow-x-auto px-4 py-4 sm:justify-center sm:px-6">
        {items.map((item, index) => (
          <button
            key={`${item.type}-${item.src}-${index}`}
            type="button"
            onClick={() => onChange(index)}
            className={`h-16 w-24 shrink-0 overflow-hidden rounded-xl border transition-colors ${
              index === activeIndex ? "border-primary" : "border-primary-foreground/20 opacity-70"
            }`}
          >
            {item.type === "video" ? (
              <video src={item.src} muted className="h-full w-full object-cover" />
            ) : (
              <img src={item.src} alt="" className="h-full w-full object-cover" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default VenueMediaLightbox;
