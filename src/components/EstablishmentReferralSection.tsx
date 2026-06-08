import { ArrowRight, BadgeCheck, Building2, Gem, Sparkles } from "lucide-react";
import { useEstablishmentReferralModal } from "@/lib/establishment-referral-modal";

interface EstablishmentReferralSectionProps {
  variant?: "light" | "dark";
}

const EstablishmentReferralSection = ({ variant = "dark" }: EstablishmentReferralSectionProps) => {
  const { openModal } = useEstablishmentReferralModal();
  const isDark = variant === "dark";

  return (
    <section
      data-header-theme={isDark ? "light" : "dark"}
      className={`px-6 py-20 ${isDark ? "bg-foreground text-primary-foreground" : "bg-background text-foreground"}`}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start xl:px-2">
        <div className="max-w-xl">
          <p className="font-body text-sm font-semibold text-primary mb-3">Vous gérez un lieu événementiel ?</p>
          <h2 className="font-heading text-3xl md:text-5xl font-semibold leading-tight mb-5">
            Rejoignez Wearevents et recevez des demandes qualifiées.
          </h2>
          <p className={`mb-5 font-body leading-relaxed ${isDark ? "text-primary-foreground/72" : "text-muted-foreground"}`}>
            Gagnez en visibilité auprès d'organisateurs réellement en recherche d'un lieu sérieux, disponible et simple à privatiser.
          </p>
          <p className={`mb-5 font-body leading-relaxed ${isDark ? "text-primary-foreground/72" : "text-muted-foreground"}`}>
            Aucun coût fixe. Une commission uniquement en cas de réservation confirmée.
          </p>
          <p className={`mb-5 font-body leading-relaxed ${isDark ? "text-primary-foreground/72" : "text-muted-foreground"}`}>
            Un modèle simple, transparent et aligné sur vos résultats.
          </p>
          <div className={`space-y-3 text-sm font-body ${isDark ? "text-primary-foreground/82" : "text-foreground/75"}`}>
            <p>Visibilité premium auprès de porteurs de projets qualifiés.</p>
            <p>Demandes centralisées et accompagnées par notre équipe.</p>
            <p>Vous payez uniquement sur les réservations réalisées.</p>
          </div>
        </div>

        <div className={`rounded-lg p-6 luxury-shadow ${
          isDark
            ? "border border-primary-foreground/18 bg-primary-foreground text-foreground"
            : "border border-foreground/10 bg-foreground text-primary-foreground"
        }`}>
          <div className="flex items-center gap-2 text-xs font-body font-semibold text-primary">
            <Building2 className="h-4 w-4" />
            Demandes qualifiées
          </div>
          <h3 className="mt-4 font-heading text-3xl font-semibold leading-tight">
            Un référencement simple, transparent et sans coût fixe.
          </h3>
          <p className={`mt-3 text-sm font-body leading-relaxed ${isDark ? "text-muted-foreground" : "text-primary-foreground/65"}`}>
            Présentez votre lieu à des organisateurs réellement en recherche d'un établissement fiable et simple à privatiser.
          </p>

          <div className="mt-6 space-y-3">
            {[
              { icon: <BadgeCheck className="h-4 w-4" />, label: "Visibilité premium auprès de porteurs de projets qualifiés" },
              { icon: <Gem className="h-4 w-4" />, label: "Demandes centralisées et accompagnées par notre équipe" },
              { icon: <Sparkles className="h-4 w-4" />, label: "Commission uniquement en cas de réservation confirmée" },
            ].map((item) => (
              <div key={item.label} className={`flex items-start gap-3 rounded-lg px-4 py-3 ${
                isDark
                  ? "border border-border bg-card"
                  : "border border-primary-foreground/10 bg-primary-foreground/[0.06]"
              }`}>
                <span className="mt-0.5 text-primary">{item.icon}</span>
                <p className={`text-sm font-body ${isDark ? "text-foreground/80" : "text-primary-foreground/78"}`}>{item.label}</p>
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
