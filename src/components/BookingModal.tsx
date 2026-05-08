import { useEffect, useRef, useState } from "react";
import { X, CheckCircle, MapPin, AlertCircle, MailCheck, CalendarDays, Users } from "lucide-react";
import type { BookingEmailTemplates, BookingRequest, Venue } from "@/types/venue";
import { EVENT_TYPES } from "@/types/venue";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  type BookingFieldErrors,
  type BookingFormValues,
  submitBookingRequest,
  validateBookingForm,
} from "@/lib/booking";
import { toast } from "sonner";

interface BookingModalProps {
  venue: Venue;
  onClose: () => void;
}

const initialForm: BookingFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  desiredDate: "",
  startTime: "",
  endTime: "",
  guestCount: "",
  eventType: "",
  requestedSpaces: [],
  message: "",
};

const SWIPE_CLOSE_THRESHOLD = 120;
const SWIPE_MAX_OFFSET = 240;
const SWIPE_RESISTANCE_START = 88;
const SWIPE_RESISTANCE_FACTOR = 0.42;

const BookingModal = ({ venue, onClose }: BookingModalProps) => {
  const isMobile = useIsMobile();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [fieldErrors, setFieldErrors] = useState<BookingFieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState<{ request: BookingRequest; emails: BookingEmailTemplates } | null>(null);
  const [form, setForm] = useState<BookingFormValues>(initialForm);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const dragStartYRef = useRef<number | null>(null);
  const dragDistanceRef = useRef(0);
  const dragOffsetRef = useRef(0);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const resetSheetDrag = () => {
    dragStartYRef.current = null;
    dragDistanceRef.current = 0;
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setIsDraggingSheet(false);
  };

  const getResistedOffset = (offset: number) => {
    if (offset <= 0) return 0;

    if (offset <= SWIPE_RESISTANCE_START) {
      return offset * 0.94;
    }

    return (
      SWIPE_RESISTANCE_START * 0.94 +
      (offset - SWIPE_RESISTANCE_START) * SWIPE_RESISTANCE_FACTOR
    );
  };

  const handleSheetTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    if (!isMobile) return;

    dragStartYRef.current = e.touches[0]?.clientY ?? null;
    dragDistanceRef.current = 0;
    dragOffsetRef.current = 0;
    setIsDraggingSheet(true);
  };

  const handleSheetTouchMove = (e: React.TouchEvent<HTMLElement>) => {
    if (!isMobile || dragStartYRef.current === null) return;

    const nextOffset = (e.touches[0]?.clientY ?? 0) - dragStartYRef.current;

    if (nextOffset <= 0) {
      dragDistanceRef.current = 0;
      dragOffsetRef.current = 0;
      setDragOffset(0);
      return;
    }

    if (e.cancelable) {
      e.preventDefault();
    }

    dragDistanceRef.current = nextOffset;
    const clampedOffset = Math.min(getResistedOffset(nextOffset), SWIPE_MAX_OFFSET);
    dragOffsetRef.current = clampedOffset;
    setDragOffset(clampedOffset);
  };

  const handleSheetTouchEnd = () => {
    if (!isMobile || dragStartYRef.current === null) {
      resetSheetDrag();
      return;
    }

    if (dragDistanceRef.current >= SWIPE_CLOSE_THRESHOLD) {
      resetSheetDrag();
      onClose();
      return;
    }

    resetSheetDrag();
  };

  const mobileSheetDragProps = isMobile
    ? {
        onTouchStart: handleSheetTouchStart,
        onTouchMove: handleSheetTouchMove,
        onTouchEnd: handleSheetTouchEnd,
        onTouchCancel: handleSheetTouchEnd,
      }
    : {};

  const mobileSheetStyle = isMobile
    ? {
        transform: `translate3d(0, ${dragOffset}px, 0) scale(${1 - Math.min(dragOffset / 1800, 0.018)})`,
        transformOrigin: "top center" as const,
        transition: isDraggingSheet ? "none" : "transform 340ms cubic-bezier(0.22, 1, 0.36, 1)",
        willChange: "transform" as const,
      }
    : undefined;

  const mobileBackdropStyle = isMobile
    ? {
        opacity: 1 - Math.min(dragOffset / 260, 0.5),
        transition: isDraggingSheet ? "none" : "opacity 340ms cubic-bezier(0.22, 1, 0.36, 1)",
      }
    : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateBookingForm(form, venue);
    setFieldErrors(errors);
    setSubmitError("");

    if (Object.keys(errors).length > 0) {
      setStatus("error");
      toast.error("Veuillez vérifier les champs signalés.");
      return;
    }

    setStatus("submitting");

    try {
      const submission = await submitBookingRequest(form, venue);
      setResult(submission);
      setStatus("success");
      toast.success("Votre demande a bien été préparée.");
    } catch {
      setStatus("error");
      setSubmitError("L'envoi n'a pas abouti. Veuillez réessayer dans quelques instants.");
      toast.error("Impossible d'envoyer la demande pour le moment.");
    }
  };

  const updateField = (field: keyof BookingFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setSubmitError("");
    if (status === "error") setStatus("idle");
  };

  const toggleSpace = (spaceId: string) => {
    setForm((prev) => ({
      ...prev,
      requestedSpaces: [spaceId],
    }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.requestedSpaces;
      return next;
    });
    setSubmitError("");
    if (status === "error") setStatus("idle");
  };

  const fieldClass = (field: keyof BookingFormValues) =>
    `h-11 min-w-0 max-w-full w-full rounded-lg border bg-card px-3 text-sm font-body leading-none focus:outline-none focus:ring-2 ${
      fieldErrors[field]
        ? "border-destructive focus:ring-destructive/20"
        : "border-border focus:ring-primary/30"
    }`;

  const textareaClass = (field: keyof BookingFormValues) =>
    `min-h-[7rem] min-w-0 max-w-full w-full rounded-lg border bg-card px-3 py-2.5 text-sm font-body focus:outline-none focus:ring-2 ${
      fieldErrors[field]
        ? "border-destructive focus:ring-destructive/20"
        : "border-border focus:ring-primary/30"
    }`;

  const renderError = (field: keyof BookingFormValues) =>
    fieldErrors[field] ? (
      <p className="mt-1.5 text-xs font-body text-destructive">{fieldErrors[field]}</p>
    ) : null;

  if (status === "success" && result) {
    const { request, emails } = result;

    return (
      <div className="fixed inset-0 z-[2000] flex items-end justify-center overflow-x-hidden sm:items-center">
        <div className="absolute inset-0 bg-foreground/75 backdrop-blur-md" onClick={onClose} style={mobileBackdropStyle} />
        <div
          className={`relative animate-scale-in bg-background ${
            isMobile
              ? "flex h-[100dvh] w-full flex-col overflow-hidden"
              : "w-full max-w-2xl rounded-t-lg p-7 sm:rounded-lg luxury-shadow"
          }`}
          style={mobileSheetStyle}
        >
          <div
            className={`${
              isMobile
                ? "sticky top-0 z-10 border-b border-border bg-background/95 px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-md"
                : ""
            }`}
            style={isMobile ? { touchAction: "none" } : undefined}
            {...mobileSheetDragProps}
          >
            {isMobile && <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border" />}
            <div className="flex items-center justify-between">
              <div className="min-w-0 pr-3">
                <p className="font-body text-xs font-semibold text-primary mb-1">Demande envoyée</p>
                <h3 className="font-heading text-2xl font-semibold">Votre brief est enregistré</h3>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Fermer">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className={isMobile ? "flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-5 pb-6 pt-4" : "space-y-5"}>
            <div className="rounded-lg bg-foreground p-5 text-center text-primary-foreground">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-primary">
                <CheckCircle className="w-7 h-7" />
              </div>
              <p className="mb-2 font-body text-xs font-semibold text-luxe-gold">Demande confiée à notre conciergerie</p>
              <h3 className="mb-3 font-heading text-3xl font-semibold">Nous avons tout ce qu'il faut.</h3>
              <p className="text-sm font-body leading-relaxed text-primary-foreground/72">
                Votre demande pour <strong>{request.venueTitle}</strong> est enregistrée. Un retour qualifié vous sera adressé sous 24h ouvrées.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="mb-1 text-xs font-body text-muted-foreground">Référence</p>
                <p className="break-all font-heading text-lg font-semibold text-primary">{request.id}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="mb-1 text-xs font-body text-muted-foreground">Horaires demandés</p>
                <p className="font-heading text-lg font-semibold text-primary">{request.startTime} - {request.endTime}</p>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-border bg-card p-4">
              <p className="mb-3 text-xs font-body font-semibold text-primary">Emails préparés</p>
              <div className="space-y-2 text-sm font-body text-foreground/80">
                <p className="flex items-start gap-2">
                  <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 break-words">Confirmation client : {emails.customerConfirmation.to}</span>
                </p>
                <p className="flex items-start gap-2">
                  <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 break-words">Notification équipe : {emails.adminNotification.to}</span>
                </p>
                <p className="flex items-start gap-2">
                  <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 break-words">Notification lieu : {emails.venueContactNotification.to}</span>
                </p>
                <p className="flex items-start gap-2">
                  <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 break-words">Relance avis J+1 : programmée le lendemain de l'événement</span>
                </p>
              </div>
            </div>
          </div>

          <div className={isMobile ? "border-t border-border bg-background/95 px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 backdrop-blur-md" : "mt-5"}>
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-primary py-3 text-sm font-body font-semibold text-primary-foreground"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center overflow-x-hidden sm:items-center">
      <div className="absolute inset-0 bg-foreground/70 backdrop-blur-md" onClick={onClose} style={mobileBackdropStyle} />
      <div
        className={`relative w-full animate-slide-up bg-background ${
          isMobile
            ? "flex h-[100dvh] flex-col overflow-hidden"
            : "max-h-[90vh] max-w-3xl overflow-y-auto rounded-t-lg sm:rounded-lg luxury-shadow"
        }`}
        style={mobileSheetStyle}
      >
        <div
          className={`sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-md ${
            isMobile ? "px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))]" : "p-5 pb-3"
          }`}
          style={isMobile ? { touchAction: "none" } : undefined}
          {...mobileSheetDragProps}
        >
          {isMobile && <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border" />}
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-3">
              <p className="font-body text-xs font-semibold text-primary mb-1">Demande de disponibilité</p>
              <h3 className={`font-heading font-semibold ${isMobile ? "text-[1.75rem]" : "text-2xl"}`}>Brief événement</h3>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Fermer">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="min-w-0 flex items-center gap-1.5 text-sm font-body">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold truncate">{venue.title}</span>
              <span className="truncate text-muted-foreground">· {venue.city}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={`flex flex-1 flex-col ${isMobile ? "overflow-hidden" : ""}`} noValidate>
          <div className={`space-y-4 ${isMobile ? "flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-5 py-4 pb-28" : "p-6"}`}>
          <div className="rounded-lg border border-primary/20 bg-secondary p-3">
            <p className="font-body text-sm font-semibold text-foreground">100 % gratuit, sans engagement</p>
            <p className="mt-1 text-xs font-body text-muted-foreground">
              Votre demande est transmise rapidement. Première réponse qualifiée en moins de 24h ouvrées.
            </p>
          </div>

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground mb-1 block">
              Lieu sélectionné
            </label>
            <div className="rounded-lg border border-border bg-foreground p-3 text-primary-foreground">
              <p className="font-body text-sm font-semibold">{venue.title}</p>
              <p className="mt-1 break-words text-xs font-body text-primary-foreground/65">
                {venue.city} · {venue.address}
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground mb-2 block">
              Espace à réserver *
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Espace à réserver">
              {venue.spaces.map((space) => {
                const selected = form.requestedSpaces.includes(space.id);
                return (
                  <button
                    key={space.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => toggleSpace(space.id)}
                    className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                      selected
                        ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/15"
                        : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-md"
                    }`}
                  >
                    <div className={`absolute inset-x-0 top-0 h-1 ${selected ? "bg-primary-foreground/35" : "bg-transparent"}`} />
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                              selected ? "border-primary-foreground/70 bg-primary-foreground text-primary" : "border-border bg-background text-transparent"
                            }`}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                          </span>
                          <p className="text-sm font-body font-semibold">{space.name}</p>
                        </div>
                        <p className={`mt-2 break-words text-xs font-body leading-relaxed ${selected ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                          {space.description}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-lg border px-2 py-1 text-[11px] font-body font-semibold ${
                          selected
                            ? "border-primary-foreground/25 bg-primary-foreground/15 text-primary-foreground"
                            : "border-border bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {space.capacity} pers.
                      </span>
                    </div>
                    {selected && (
                      <div className="mt-3 inline-flex rounded-lg bg-primary-foreground/12 px-2.5 py-1 text-[11px] font-body font-semibold text-primary-foreground">
                        Espace sélectionné
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {renderError("requestedSpaces")}
          </div>

          {submitError && (
            <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm font-body text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {submitError}
            </div>
          )}

          {status === "error" && Object.keys(fieldErrors).length > 0 && (
            <div className="flex gap-2 rounded-lg border border-primary/20 bg-secondary p-3 text-sm font-body text-foreground/80">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
              Quelques informations sont nécessaires pour qualifier votre demande.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground mb-1 block">
                Prénom *
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                className={fieldClass("firstName")}
                aria-invalid={Boolean(fieldErrors.firstName)}
              />
              {renderError("firstName")}
            </div>
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground mb-1 block">
                Nom *
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                className={fieldClass("lastName")}
                aria-invalid={Boolean(fieldErrors.lastName)}
              />
              {renderError("lastName")}
            </div>
          </div>

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground mb-1 block">
              Email *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className={fieldClass("email")}
              aria-invalid={Boolean(fieldErrors.email)}
            />
            {renderError("email")}
          </div>

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground mb-1 block">
              Téléphone *
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className={fieldClass("phone")}
              aria-invalid={Boolean(fieldErrors.phone)}
            />
            {renderError("phone")}
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="min-w-0">
              <label className="text-xs font-body font-medium text-muted-foreground mb-1 block">
                Date souhaitée *
              </label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={form.desiredDate}
                  onChange={(e) => updateField("desiredDate", e.target.value)}
                  className={`${fieldClass("desiredDate")} native-date-time-field pl-9`}
                  aria-invalid={Boolean(fieldErrors.desiredDate)}
                />
              </div>
              {renderError("desiredDate")}
            </div>
            <div className="min-w-0">
              <label className="text-xs font-body font-medium text-muted-foreground mb-1 block">
                Début *
              </label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => updateField("startTime", e.target.value)}
                className={`${fieldClass("startTime")} native-date-time-field`}
                aria-invalid={Boolean(fieldErrors.startTime)}
              />
              {renderError("startTime")}
            </div>
            <div className="min-w-0">
              <label className="text-xs font-body font-medium text-muted-foreground mb-1 block">
                Fin *
              </label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => updateField("endTime", e.target.value)}
                className={`${fieldClass("endTime")} native-date-time-field`}
                aria-invalid={Boolean(fieldErrors.endTime)}
              />
              {renderError("endTime")}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground mb-1 block">
                Nb d'invités *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  value={form.guestCount}
                  onChange={(e) => updateField("guestCount", e.target.value)}
                  className={`${fieldClass("guestCount")} pl-9`}
                  aria-invalid={Boolean(fieldErrors.guestCount)}
                />
              </div>
              {renderError("guestCount")}
            </div>
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground mb-1 block">
                Type d'événement *
              </label>
              <select
                value={form.eventType}
                onChange={(e) => updateField("eventType", e.target.value)}
                className={fieldClass("eventType")}
                aria-invalid={Boolean(fieldErrors.eventType)}
              >
                <option value="">Sélectionner...</option>
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {renderError("eventType")}
            </div>
          </div>

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground mb-1 block">
              Message
            </label>
            <textarea
              rows={4}
              value={form.message}
              onChange={(e) => updateField("message", e.target.value)}
              placeholder="Précisez l'ambiance, les horaires ou les besoins de production."
              className={`${textareaClass("message")} resize-none`}
              aria-invalid={Boolean(fieldErrors.message)}
            />
            {renderError("message")}
          </div>
          </div>

          <div className={isMobile ? "border-t border-border bg-background/95 px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 backdrop-blur-md" : "p-5 pt-0"}>
            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-sm shadow-lg disabled:opacity-60 active:scale-[0.98] transition-transform"
            >
              {status === "submitting" ? "Préparation de la demande..." : "Envoyer ma demande de disponibilité"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
