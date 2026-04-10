import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  emptyLabel?: string;
  options: readonly string[];
  icon: ReactNode;
  className?: string;
}

const FilterSelect = ({ value, onChange, placeholder, emptyLabel = placeholder, options, icon, className = "" }: FilterSelectProps) => {
  const [open, setOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const selectedLabel = value || placeholder;
  const items = [{ value: "", label: emptyLabel }, ...options.map((option) => ({ value: option, label: option }))];

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={selectRef} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex h-11 w-full min-w-0 items-center gap-2 rounded-lg border border-border bg-background px-3 text-left transition-colors hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/25 ${className}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="shrink-0 text-primary">{icon}</span>
        <span className={`min-w-0 flex-1 truncate text-sm font-body font-semibold ${value ? "text-foreground" : "text-muted-foreground"}`}>
          {selectedLabel}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-lg border border-primary-foreground/15 bg-foreground p-1 text-primary-foreground shadow-2xl luxury-shadow">
          <div className="max-h-64 overflow-y-auto hide-scrollbar" role="listbox">
            {items.map((item) => {
              const selected = item.value === value;

              return (
                <button
                  key={item.value || "empty"}
                  type="button"
                  onClick={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-body transition-colors ${
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "text-primary-foreground/75 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  }`}
                  role="option"
                  aria-selected={selected}
                >
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {selected && <Check className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterSelect;
