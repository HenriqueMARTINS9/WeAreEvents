import { useState } from "react";
import { Building2, CheckCircle2, Mail, Phone, MapPin, UserRound } from "lucide-react";

const EstablishmentReferralSection = () => {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    venueName: "",
    contactName: "",
    email: "",
    phone: "",
    city: "",
    message: "",
  });

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="referencer-etablissement" className="px-6 py-20 bg-foreground text-primary-foreground scroll-mt-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start xl:px-2">
        <div className="max-w-xl">
          <p className="font-body text-sm font-semibold text-luxe-gold mb-3">Professionnels du secteur</p>
          <h2 className="font-heading text-3xl md:text-5xl font-semibold leading-tight mb-5">
            Vous souhaitez référencer votre établissement ?
          </h2>
          <p className="font-body text-primary-foreground/72 leading-relaxed mb-5">
            Gagnez de nombreux clients parmi les visiteurs qui cherchent chaque mois un lieu fiable, lisible et rapide à réserver.
          </p>
          <p className="font-body text-primary-foreground/72 leading-relaxed mb-5">
            Pas de commissions et sans engagement, vous payez un montant fixe sans risque de voir déraper la facture.
          </p>
          <div className="space-y-3 text-sm font-body text-primary-foreground/80">
            <p>Visibilité premium auprès d'organisateurs qualifiés.</p>
            <p>Demandes centralisées, triées et accompagnées par notre équipe.</p>
            <p>Modèle simple, 100 % lisible et sans surprise.</p>
          </div>
        </div>

        <div className="rounded-lg border border-primary-foreground/15 bg-background p-6 text-foreground luxury-shadow">
          {submitted ? (
            <div className="text-center py-6">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <p className="font-body text-xs font-semibold text-primary mb-2">Référencement établissement</p>
              <h3 className="font-heading text-3xl font-semibold mb-3">Votre demande est bien reçue.</h3>
              <p className="font-body text-muted-foreground leading-relaxed">
                Notre équipe vous recontacte rapidement pour étudier le référencement de votre établissement.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="font-body text-xs font-semibold text-primary mb-1">Formulaire professionnel</p>
                <h3 className="font-heading text-2xl font-semibold">Référencer mon établissement</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs font-body font-medium text-muted-foreground">Nom de l'établissement</span>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input required value={form.venueName} onChange={(e) => updateField("venueName", e.target.value)} className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/25" />
                  </div>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-body font-medium text-muted-foreground">Ville</span>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input required value={form.city} onChange={(e) => updateField("city", e.target.value)} className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/25" />
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs font-body font-medium text-muted-foreground">Nom du contact</span>
                  <div className="relative">
                    <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input required value={form.contactName} onChange={(e) => updateField("contactName", e.target.value)} className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/25" />
                  </div>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-body font-medium text-muted-foreground">Téléphone</span>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input required value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/25" />
                  </div>
                </label>
              </div>

              <label className="space-y-1 block">
                <span className="text-xs font-body font-medium text-muted-foreground">Email professionnel</span>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="email" required value={form.email} onChange={(e) => updateField("email", e.target.value)} className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/25" />
                </div>
              </label>

              <label className="space-y-1 block">
                <span className="text-xs font-body font-medium text-muted-foreground">Message</span>
                <textarea value={form.message} onChange={(e) => updateField("message", e.target.value)} rows={4} className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/25 resize-none" placeholder="Nombre d'espaces, capacité, clientèle visée, type d'événements..." />
              </label>

              <button type="submit" className="w-full rounded-lg bg-primary py-3 text-sm font-body font-semibold text-primary-foreground hover:bg-foreground transition-colors">
                Référencer mon établissement
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default EstablishmentReferralSection;
