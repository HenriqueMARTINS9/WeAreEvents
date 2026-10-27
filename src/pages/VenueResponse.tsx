import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Send, XCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Seo from "@/components/Seo";
import { supabase } from "@/lib/supabase";

type VenueResponseChoice = "available" | "unavailable" | "conditions";

const responseContent: Record<VenueResponseChoice, { label: string; description: string }> = {
  available: {
    label: "Disponible",
    description: "Confirmez que votre établissement peut accueillir cette demande.",
  },
  unavailable: {
    label: "Pas disponible",
    description: "Indiquez éventuellement la raison pour nous aider à proposer une alternative au client.",
  },
  conditions: {
    label: "Répondre avec mes conditions",
    description: "Précisez vos modalités de privatisation, tarifs et conditions utiles.",
  },
};

const unavailableReasons = ["Complet", "Groupe trop petit", "Budget trop bas", "Autre"];

const VenueResponse = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() || "";
  const response = searchParams.get("response") as VenueResponseChoice | null;
  const choice = response && response in responseContent ? response : null;
  const [reason, setReason] = useState("");
  const [conditions, setConditions] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const content = useMemo(() => choice ? responseContent[choice] : null, [choice]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !token || !choice) return;
    if (choice === "conditions" && !conditions.trim()) {
      setStatus("error");
      setErrorMessage("Ajoutez vos modalités et conditions avant d'envoyer la réponse.");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");
    const { error } = await supabase.functions.invoke("venue-response", {
      body: {
        token,
        response: choice,
        reason: choice === "unavailable" ? reason : "",
        conditions: choice === "conditions" || choice === "available" ? conditions.trim() : "",
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage("La réponse n'a pas pu être enregistrée. Vérifiez le lien ou réessayez dans quelques instants.");
      return;
    }

    setStatus("success");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-5 py-12">
      <Seo
        title="Réponse partenaire - Wearevents"
        description="Répondre à une demande de disponibilité Wearevents."
        path="/reponse-lieu"
        noindex
      />
      <section className="w-full max-w-xl overflow-hidden rounded-lg border border-border bg-background luxury-shadow">
        <header className="bg-foreground px-6 py-8 text-primary-foreground sm:px-9">
          <p className="font-body text-xs font-semibold uppercase text-primary">Espace partenaire</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold">Votre réponse au client</h1>
          <p className="mt-3 max-w-md font-body text-sm leading-relaxed text-primary-foreground/70">
            Votre réponse est transmise à l'équipe Wearevents et ajoutée automatiquement à la demande.
          </p>
        </header>

        <div className="p-6 sm:p-9">
          {!token || !content ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-5">
              <h2 className="font-heading text-2xl font-semibold">Lien incomplet</h2>
              <p className="mt-2 font-body text-sm leading-relaxed text-muted-foreground">
                Utilisez l'un des boutons présents dans l'e-mail de demande reçu par votre établissement.
              </p>
            </div>
          ) : status === "success" ? (
            <div className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-7 w-7" />
              </span>
              <h2 className="mt-5 font-heading text-3xl font-semibold">Réponse enregistrée</h2>
              <p className="mx-auto mt-3 max-w-md font-body text-sm leading-relaxed text-muted-foreground">
                Merci. L'équipe Wearevents a été notifiée et s'occupe désormais du client.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-4">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${choice === "unavailable" ? "bg-destructive/10 text-destructive" : "bg-emerald-100 text-emerald-700"}`}>
                  {choice === "unavailable" ? <XCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                </span>
                <div>
                  <h2 className="font-heading text-2xl font-semibold">{content.label}</h2>
                  <p className="mt-1 font-body text-sm leading-relaxed text-muted-foreground">{content.description}</p>
                </div>
              </div>

              {choice === "unavailable" && (
                <div>
                  <label htmlFor="venue-response-reason" className="mb-2 block font-body text-sm font-semibold">Motif <span className="font-normal text-muted-foreground">(facultatif)</span></label>
                  <select
                    id="venue-response-reason"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 font-body text-sm outline-none focus:border-primary"
                  >
                    <option value="">Aucun motif précisé</option>
                    {unavailableReasons.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
              )}

              {(choice === "conditions" || choice === "available") && (
                <div>
                  <label htmlFor="venue-response-conditions" className="mb-2 block font-body text-sm font-semibold">
                    Modalités et conditions {choice === "available" && <span className="font-normal text-muted-foreground">(facultatif)</span>}
                  </label>
                  <textarea
                    id="venue-response-conditions"
                    value={conditions}
                    onChange={(event) => setConditions(event.target.value)}
                    required={choice === "conditions"}
                    maxLength={3000}
                    rows={7}
                    placeholder="Minimum de consommation, horaires, acompte, prestations incluses..."
                    className="w-full resize-y rounded-lg border border-border bg-background px-3 py-3 font-body text-sm leading-relaxed outline-none focus:border-primary"
                  />
                </div>
              )}

              {status === "error" && <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 font-body text-sm text-destructive">{errorMessage}</p>}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 font-body text-sm font-semibold text-primary-foreground disabled:cursor-wait disabled:opacity-60"
              >
                {status === "submitting" ? <Clock3 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {status === "submitting" ? "Enregistrement..." : "Confirmer ma réponse"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default VenueResponse;
