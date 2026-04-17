import { ArrowRight, BadgeCheck, Building2, Gem, Sparkles } from "lucide-react";
import { useEstablishmentReferralModal } from "@/lib/establishment-referral-modal";

const EstablishmentReferralSection = () => {
  const { openModal } = useEstablishmentReferralModal();

  return (
    <section className="bg-background px-6 py-20 text-foreground">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start xl:px-2">
        <div className="max-w-xl">
          <p className="font-body text-sm font-semibold text-luxe-gold mb-3">Professionnels du secteur</p>
          <h2 className="font-heading text-3xl md:text-5xl font-semibold leading-tight mb-5">
            Vous souhaitez référencer votre établissement ?
          </h2>
          <p className="mb-5 font-body leading-relaxed text-muted-foreground">
            Gagnez de nombreux clients parmi les visiteurs qui cherchent chaque mois un lieu fiable, lisible et rapide à réserver.
          </p>
          <p className="mb-5 font-body leading-relaxed text-muted-foreground">
            Pas de commissions et sans engagement, vous payez un montant fixe sans risque de voir déraper la facture.
          </p>
          <div className="space-y-3 text-sm font-body text-foreground/80">
            <p>Visibilité premium auprès d'organisateurs qualifiés.</p>
            <p>Demandes centralisées, triées et accompagnées par notre équipe.</p>
            <p>Modèle simple, 100 % lisible et sans surprise.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 text-foreground luxury-shadow">
          <div className="flex items-center gap-2 text-xs font-body font-semibold text-primary">
            <Building2 className="h-4 w-4" />
            Référencement premium
          </div>
          <h3 className="mt-4 font-heading text-3xl font-semibold leading-tight">
            Ouvrez votre dossier en quelques minutes.
          </h3>
          <p className="mt-3 text-sm font-body leading-relaxed text-muted-foreground">
            Le formulaire s'ouvre dans une fenêtre dédiée pour vous permettre de transmettre rapidement les informations essentielles sur votre lieu.
          </p>

          <div className="mt-6 space-y-3">
            {[
              { icon: <BadgeCheck className="h-4 w-4" />, label: "Étude rapide du positionnement de votre établissement" },
              { icon: <Gem className="h-4 w-4" />, label: "Présentation soignée de vos espaces et capacités" },
              { icon: <Sparkles className="h-4 w-4" />, label: "Prise de contact directe avec notre équipe" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3">
                <span className="mt-0.5 text-primary">{item.icon}</span>
                <p className="text-sm font-body text-foreground/80">{item.label}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={openModal}
            className="brand-primary-button mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-body font-semibold text-primary-foreground transition-all hover:brightness-95"
          >
            Référencer mon établissement
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default EstablishmentReferralSection;
