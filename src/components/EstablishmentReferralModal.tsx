import { useEffect, useState } from "react";
import { Building2, CheckCircle2, Mail, MapPin, Phone, UserRound, X } from "lucide-react";

interface EstablishmentReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialForm = {
  venueName: "",
  contactName: "",
  email: "",
  phone: "",
  city: "",
  message: "",
};

const EstablishmentReferralModal = ({ isOpen, onClose }: EstablishmentReferralModalProps) => {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (!isOpen) {
      setSubmitted(false);
      setForm(initialForm);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-foreground/75 backdrop-blur-md" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-background luxury-shadow">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-lg border border-border bg-background/90 p-2 text-foreground transition-colors hover:border-primary/30 hover:text-primary"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          <div className="grid grid-cols-1 overflow-hidden lg:grid-cols-[0.95fr_1.05fr]">
            <div className="bg-gradient-editorial px-6 py-12 text-primary-foreground sm:px-8">
              <p className="mb-3 text-sm font-body font-semibold text-luxe-gold">Référencement établissement</p>
              <h2 className="font-heading text-4xl font-semibold leading-tight">
                Votre demande est bien reçue.
              </h2>
              <p className="mt-4 max-w-lg text-sm font-body leading-relaxed text-primary-foreground/74">
                Notre équipe vous recontacte rapidement pour étudier le référencement de votre établissement et vous présenter le format le plus adapté.
              </p>
            </div>

            <div className="flex items-center justify-center px-6 py-12 sm:px-8">
              <div className="w-full max-w-md text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <p className="mb-2 text-xs font-body font-semibold text-primary">Formulaire professionnel</p>
                <h3 className="font-heading text-3xl font-semibold">Nous revenons vers vous sous 24h ouvrées.</h3>
                <p className="mt-4 text-sm font-body leading-relaxed text-muted-foreground">
                  Votre établissement sera étudié avec attention afin de garantir un positionnement cohérent, lisible et premium sur la plateforme.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-body font-semibold text-primary-foreground transition-colors hover:bg-foreground"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 overflow-hidden lg:grid-cols-[0.95fr_1.05fr]">
            <div className="bg-gradient-editorial px-6 py-10 text-primary-foreground sm:px-8 lg:py-12">
              <p className="mb-3 text-sm font-body font-semibold text-primary">Professionnels du secteur</p>
              <h2 className="font-heading text-3xl font-semibold leading-tight sm:text-4xl">
                Vous souhaitez référencer votre établissement ?
              </h2>
              <p className="mt-5 text-sm font-body leading-relaxed text-primary-foreground/76 sm:text-base">
                Gagnez de nombreux clients parmi les visiteurs qui cherchent chaque mois un lieu fiable, lisible et rapide à réserver.
              </p>
              <p className="mt-4 text-sm font-body leading-relaxed text-primary-foreground/76 sm:text-base">
                Pas de commissions et sans engagement, vous payez un montant fixe sans risque de voir déraper la facture.
              </p>
              <div className="mt-8 space-y-3 text-sm font-body text-primary-foreground/82">
                <p>Visibilité premium auprès d'organisateurs qualifiés.</p>
                <p>Demandes centralisées, triées et accompagnées par notre équipe.</p>
                <p>Modèle simple, 100 % lisible et sans surprise.</p>
              </div>
            </div>

            <div className="px-6 py-10 sm:px-8 lg:py-12">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <p className="mb-1 text-xs font-body font-semibold text-primary">Formulaire professionnel</p>
                  <h3 className="font-heading text-2xl font-semibold">Référencer mon établissement</h3>
                  <p className="mt-2 text-sm font-body text-muted-foreground">
                    Quelques informations suffisent pour lancer l'étude de votre établissement.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs font-body font-medium text-muted-foreground">Nom de l'établissement</span>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        required
                        value={form.venueName}
                        onChange={(e) => updateField("venueName", e.target.value)}
                        className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/25"
                      />
                    </div>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-body font-medium text-muted-foreground">Ville</span>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        required
                        value={form.city}
                        onChange={(e) => updateField("city", e.target.value)}
                        className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/25"
                      />
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs font-body font-medium text-muted-foreground">Nom du contact</span>
                    <div className="relative">
                      <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        required
                        value={form.contactName}
                        onChange={(e) => updateField("contactName", e.target.value)}
                        className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/25"
                      />
                    </div>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-body font-medium text-muted-foreground">Téléphone</span>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        required
                        type="tel"
                        value={form.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/25"
                      />
                    </div>
                  </label>
                </div>

                <label className="block space-y-1">
                  <span className="text-xs font-body font-medium text-muted-foreground">Email professionnel</span>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/25"
                    />
                  </div>
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-body font-medium text-muted-foreground">Message</span>
                  <textarea
                    value={form.message}
                    onChange={(e) => updateField("message", e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/25"
                    placeholder="Nombre d'espaces, capacité, clientèle visée, type d'événements..."
                  />
                </label>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-primary py-3 text-sm font-body font-semibold text-primary-foreground transition-colors hover:bg-foreground"
                >
                  Référencer mon établissement
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EstablishmentReferralModal;
