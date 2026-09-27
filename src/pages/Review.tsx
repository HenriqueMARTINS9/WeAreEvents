import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, Star } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import Seo from "@/components/Seo";
import SiteFooter from "@/components/SiteFooter";
import VenueCodeSearch from "@/components/VenueCodeSearch";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/lib/supabase";

const reviewTokenPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const Review = () => {
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const isValidLink = useMemo(() => reviewTokenPattern.test(token), [token]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [showCodeSearch, setShowCodeSearch] = useState(false);

  const submitReview = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !isValidLink || rating === 0 || comment.trim().length < 10) return;

    setSubmitting(true);
    setMessage("");

    const { error } = await supabase.from("venue_reviews").insert({
      review_token: token,
      rating,
      comment: comment.trim(),
    });

    setSubmitting(false);

    if (error) {
      setMessage(
        /duplicate|unique/i.test(error.message)
          ? "Un avis a déjà été envoyé avec ce lien."
          : "Ce lien n'est pas valide, la réservation n'est pas confirmée ou l'avis n'a pas pu être enregistré.",
      );
      return;
    }

    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title="Donner votre avis | Wearevents"
        description="Partagez votre expérience après un événement réservé avec Wearevents."
        path="/avis"
        noindex
      />
      {isMobile ? <MobileHeader onCodeSearch={() => setShowCodeSearch(true)} withBackground /> : <DesktopNav />}

      <main className="flex min-h-[78vh] items-center justify-center px-5 pb-16 pt-28 md:px-8 md:pt-32">
        <section className="w-full max-w-xl rounded-lg border border-border bg-card p-6 luxury-shadow md:p-10">
          {submitted ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
              <h1 className="mt-5 font-heading text-4xl font-semibold">Merci pour votre avis</h1>
              <p className="mt-4 font-body leading-relaxed text-muted-foreground">
                Votre retour est maintenant associé au lieu et aidera les prochains organisateurs à faire leur choix.
              </p>
            </div>
          ) : (
            <>
              <p className="font-body text-sm font-semibold text-primary">Votre expérience</p>
              <h1 className="mt-2 font-heading text-4xl font-semibold md:text-5xl">Comment s'est passé votre événement ?</h1>
              <p className="mt-4 font-body leading-relaxed text-muted-foreground">
                Cet avis concerne le lieu réservé via Wearevents. Votre nom de famille ne sera jamais affiché en entier.
              </p>

              {!isValidLink ? (
                <p className="mt-8 rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 font-body text-sm text-destructive">
                  Ce lien d'avis est incomplet ou invalide. Utilisez le bouton reçu dans votre email après l'événement.
                </p>
              ) : (
                <form onSubmit={submitReview} className="mt-8 space-y-6">
                  <fieldset>
                    <legend className="font-body text-sm font-semibold">Votre note</legend>
                    <div className="mt-3 flex gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRating(value)}
                          className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          aria-label={`${value} étoile${value > 1 ? "s" : ""}`}
                          aria-pressed={rating === value}
                        >
                          <Star className={`h-6 w-6 ${value <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <label className="block">
                    <span className="font-body text-sm font-semibold">Votre commentaire</span>
                    <textarea
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      minLength={10}
                      maxLength={1200}
                      rows={6}
                      required
                      className="mt-3 w-full rounded-lg border border-border bg-background px-4 py-3 font-body text-sm leading-relaxed outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="Accueil, qualité du lieu, ambiance, organisation..."
                    />
                    <span className="mt-2 block text-right font-body text-xs text-muted-foreground">{comment.length}/1200</span>
                  </label>

                  {message && <p className="font-body text-sm text-destructive" role="alert">{message}</p>}

                  <button
                    type="submit"
                    disabled={submitting || rating === 0 || comment.trim().length < 10}
                    className="h-12 w-full rounded-lg bg-foreground px-5 font-body text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {submitting ? "Envoi en cours..." : "Publier mon avis"}
                  </button>
                </form>
              )}
            </>
          )}
        </section>
      </main>

      <SiteFooter variant="dark" />
      {showCodeSearch && (
        <VenueCodeSearch
          onClose={() => setShowCodeSearch(false)}
          onVenueFound={() => setShowCodeSearch(false)}
        />
      )}
    </div>
  );
};

export default Review;
