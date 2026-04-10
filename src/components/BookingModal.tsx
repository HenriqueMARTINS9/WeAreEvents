import { useState } from "react";
import { X, CheckCircle, MapPin } from "lucide-react";
import type { Venue } from "@/types/venue";
import { EVENT_TYPES } from "@/types/venue";
import { toast } from "sonner";

interface BookingModalProps {
  venue: Venue;
  onClose: () => void;
}

const BookingModal = ({ venue, onClose }: BookingModalProps) => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    desiredDate: "",
    guestCount: "",
    eventType: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email) {
      toast.error("Veuillez remplir les champs obligatoires.");
      return;
    }
    setLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full sm:max-w-md bg-background rounded-t-2xl sm:rounded-2xl p-8 text-center animate-scale-in">
          <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h3 className="font-heading text-2xl font-bold mb-2">Demande envoyée !</h3>
          <p className="text-muted-foreground text-sm font-body mb-2">
            Votre demande de réservation pour <strong>{venue.title}</strong> a bien été envoyée.
          </p>
          <p className="text-muted-foreground text-xs font-body mb-6">
            Code salle : <span className="font-semibold text-primary">{venue.venueCode}</span>
          </p>
          <p className="text-muted-foreground text-xs font-body mb-6">
            Vous recevrez un email de confirmation sous peu. L'équipe vous contactera dans les 24h.
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-body font-semibold text-sm"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md max-h-[90vh] bg-background rounded-t-2xl sm:rounded-2xl overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-md p-5 pb-3 border-b border-border z-10">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-xl font-bold">Réserver</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-muted">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1.5 text-sm font-body">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold">{venue.title}</span>
              <span className="text-muted-foreground">· {venue.city}</span>
            </div>
          </div>
          <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-rose-bg text-primary text-xs font-body font-semibold">
            {venue.venueCode}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground mb-1 block">
                Prénom *
              </label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground mb-1 block">
                Nom *
              </label>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground mb-1 block">
              Email *
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground mb-1 block">
              Téléphone
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground mb-1 block">
                Date souhaitée
              </label>
              <input
                type="date"
                value={form.desiredDate}
                onChange={(e) => updateField("desiredDate", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground mb-1 block">
                Nb de personnes
              </label>
              <input
                type="number"
                value={form.guestCount}
                onChange={(e) => updateField("guestCount", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground mb-1 block">
              Type d'événement
            </label>
            <select
              value={form.eventType}
              onChange={(e) => updateField("eventType", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Sélectionner...</option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-body font-medium text-muted-foreground mb-1 block">
              Message
            </label>
            <textarea
              rows={3}
              value={form.message}
              onChange={(e) => updateField("message", e.target.value)}
              placeholder="Décrivez votre événement..."
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-body font-semibold text-sm tracking-wide shadow-lg disabled:opacity-60 active:scale-[0.98] transition-transform"
          >
            {loading ? "Envoi en cours..." : "Envoyer ma demande"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
