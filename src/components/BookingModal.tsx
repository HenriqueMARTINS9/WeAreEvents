import { useState } from "react";
import { X, CheckCircle, MapPin, AlertCircle, MailCheck, CalendarDays, Users } from "lucide-react";
import type { BookingEmailTemplates, BookingRequest, Venue } from "@/types/venue";
import { EVENT_TYPES } from "@/types/venue";
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
  guestCount: "",
  eventType: "",
  message: "",
};

const BookingModal = ({ venue, onClose }: BookingModalProps) => {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [fieldErrors, setFieldErrors] = useState<BookingFieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState<{ request: BookingRequest; emails: BookingEmailTemplates } | null>(null);
  const [form, setForm] = useState<BookingFormValues>(initialForm);

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

  const fieldClass = (field: keyof BookingFormValues) =>
    `w-full px-3 py-2.5 rounded-lg border bg-card text-sm font-body focus:outline-none focus:ring-2 ${
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
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-foreground/75 backdrop-blur-md" onClick={onClose} />
        <div className="relative w-full sm:max-w-lg bg-background rounded-t-lg sm:rounded-lg p-7 animate-scale-in luxury-shadow">
          <div className="rounded-lg bg-foreground p-6 text-primary-foreground text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-primary">
              <CheckCircle className="w-7 h-7" />
            </div>
            <p className="font-body text-xs font-semibold text-luxe-gold mb-2">Demande confiée à notre conciergerie</p>
            <h3 className="font-heading text-3xl font-semibold mb-3">Nous avons tout ce qu'il faut.</h3>
            <p className="text-sm font-body text-primary-foreground/72 leading-relaxed">
              Votre demande pour <strong>{request.venueTitle}</strong> est enregistrée. Un retour qualifié vous sera adressé sous 24h ouvrées.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-body text-muted-foreground mb-1">Référence</p>
              <p className="font-heading text-xl font-semibold text-primary">{request.id}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-body text-muted-foreground mb-1">Code TikTok</p>
              <p className="font-heading text-xl font-semibold text-primary">{request.venueCode}</p>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-body font-semibold text-primary mb-3">Emails préparés</p>
            <div className="space-y-2 text-sm font-body text-foreground/80">
              <p className="flex items-center gap-2">
                <MailCheck className="w-4 h-4 text-primary" />
                Confirmation client : {emails.customerConfirmation.to}
              </p>
              <p className="flex items-center gap-2">
                <MailCheck className="w-4 h-4 text-primary" />
                Notification équipe : {emails.adminNotification.to}
              </p>
              <p className="flex items-center gap-2">
                <MailCheck className="w-4 h-4 text-primary" />
                Notification lieu : {emails.venueContactNotification.to}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-5 w-full py-3 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-sm"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-foreground/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full sm:max-w-md max-h-[90vh] bg-background rounded-t-lg sm:rounded-lg overflow-y-auto animate-slide-up luxury-shadow">
        <div className="sticky top-0 bg-background/95 backdrop-blur-md p-5 pb-3 border-b border-border z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body text-xs font-semibold text-primary mb-1">Demande de disponibilité</p>
              <h3 className="font-heading text-2xl font-semibold">Brief événement</h3>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Fermer">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="min-w-0 flex items-center gap-1.5 text-sm font-body">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold truncate">{venue.title}</span>
              <span className="text-muted-foreground shrink-0">· {venue.city}</span>
            </div>
          </div>
          <span className="inline-block mt-2 px-2 py-1 rounded-lg bg-secondary text-primary text-xs font-body font-semibold">
            Code TikTok · {venue.venueCode}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4" noValidate>
          <div>
            <label className="text-xs font-body font-medium text-muted-foreground mb-1 block">
              Lieu sélectionné
            </label>
            <div className="rounded-lg border border-border bg-foreground p-3 text-primary-foreground">
              <p className="font-body text-sm font-semibold">{venue.title}</p>
              <p className="mt-1 text-xs font-body text-primary-foreground/65">
                {venue.city} · {venue.minCapacity}-{venue.maxCapacity} invités · {venue.venueCode}
              </p>
            </div>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground mb-1 block">
                Date souhaitée *
              </label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={form.desiredDate}
                  onChange={(e) => updateField("desiredDate", e.target.value)}
                  className={`${fieldClass("desiredDate")} pl-9`}
                  aria-invalid={Boolean(fieldErrors.desiredDate)}
                />
              </div>
              {renderError("desiredDate")}
            </div>
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

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground mb-1 block">
              Message
            </label>
            <textarea
              rows={4}
              value={form.message}
              onChange={(e) => updateField("message", e.target.value)}
              placeholder="Précisez l'ambiance, les horaires ou les besoins de production."
              className={`${fieldClass("message")} resize-none`}
              aria-invalid={Boolean(fieldErrors.message)}
            />
            {renderError("message")}
          </div>

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-sm shadow-lg disabled:opacity-60 active:scale-[0.98] transition-transform"
          >
            {status === "submitting" ? "Préparation de la demande..." : "Envoyer ma demande de disponibilité"}
          </button>
          <p className="text-center text-[11px] font-body text-muted-foreground">
            Confirmation client, notification équipe et notification lieu préparées à l'envoi.
          </p>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
