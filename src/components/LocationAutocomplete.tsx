import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, MapPin } from "lucide-react";

interface LocationSuggestion {
  city: string;
  postalCodes: string[];
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  options: LocationSuggestion[];
  placeholder?: string;
  className?: string;
  icon?: ReactNode;
}

const normalizeLocationValue = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const LocationAutocomplete = ({
  value,
  onChange,
  options,
  placeholder = "Ville ou code postal",
  className = "",
  icon = <MapPin className="h-4 w-4" />,
}: LocationAutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const normalizedValue = normalizeLocationValue(value);

  const filteredOptions = useMemo(() => {
    if (!normalizedValue) {
      return options.slice(0, 8);
    }

    return options
      .filter((option) => {
        const matchesCity = normalizeLocationValue(option.city).includes(normalizedValue);
        const matchesPostalCode = option.postalCodes.some((postalCode) => postalCode.startsWith(normalizedValue));

        return matchesCity || matchesPostalCode;
      })
      .slice(0, 8);
  }, [normalizedValue, options]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative min-w-0 ${open ? "z-[2400]" : "z-0"}`}>
      <div
        className={`flex h-11 w-full min-w-0 items-center gap-2 rounded-lg border border-border bg-background px-3 transition-colors hover:border-primary/40 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 ${className}`}
      >
        <span className="shrink-0 text-primary">{icon}</span>
        <input
          type="text"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm font-body font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[2400] overflow-hidden rounded-lg border border-primary-foreground/15 bg-foreground p-1 text-primary-foreground shadow-2xl luxury-shadow">
          {filteredOptions.length > 0 ? (
            <div className="max-h-64 overflow-y-auto hide-scrollbar">
              {filteredOptions.map((option) => {
                const isSelected = normalizeLocationValue(option.city) === normalizedValue;
                const postalCodesLabel = option.postalCodes.length > 0 ? option.postalCodes.join(", ") : "Ville";

                return (
                  <button
                    key={`${option.city}-${postalCodesLabel}`}
                    type="button"
                    onClick={() => {
                      onChange(option.city);
                      setOpen(false);
                    }}
                    className={`flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "text-primary-foreground/78 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                    }`}
                  >
                    <span className="mt-0.5 shrink-0 text-primary-foreground/85">{icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-body font-semibold">{option.city}</span>
                      <span className="mt-0.5 block truncate text-xs font-body text-current/70">
                        {postalCodesLabel}
                      </span>
                    </span>
                    {isSelected && <Check className="mt-0.5 h-4 w-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-3 py-3 text-sm font-body text-primary-foreground/70">
              Aucune ville ou code postal correspondant.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
