import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { CalendarDays, CheckCircle2, Send, X } from "lucide-react";
import { toast } from "sonner";
import { BOOKING_BUDGET_OPTIONS, EVENT_TYPES, type BookingRequest } from "@/types/venue";
import { getSeoLandingPage } from "@/data/seo-landings";
import { getBookingAttribution } from "@/lib/booking-attribution";
import { trackBookingRequestConversion } from "@/lib/analytics";
import { supabase } from "@/lib/supabase";

type FormValues = { eventType: string; desiredDate: string; flexible: boolean; guestCount: string; budgetRange: string; zone: string; name: string; email: string; phone: string; message: string };
const initialValues = (eventType = ""): FormValues => ({ eventType, desiredDate: "", flexible: false, guestCount: "", budgetRange: "", zone: "Paris et Île-de-France", name: "", email: "", phone: "", message: "" });
const inputClass = "h-12 w-full rounded-lg border border-border bg-background px-3 font-body text-sm text-foreground outline-none transition-colors focus:border-primary";
const labelClass = "mb-2 block font-body text-sm font-semibold text-foreground";

const GeneralBookingForm = ({ defaultEventType, source, onSuccess }: { defaultEventType?: string; source: string; onSuccess?: () => void }) => {
  const [form, setForm] = useState<FormValues>(() => initialValues(defaultEventType));
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  useEffect(() => { setForm((current) => ({ ...current, eventType: defaultEventType || current.eventType })); }, [defaultEventType]);
  const update = <K extends keyof FormValues>(field: K, value: FormValues[K]) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || submitting) return;
    if (!form.eventType || (!form.flexible && !form.desiredDate) || !form.guestCount || !form.zone.trim() || !form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error("Veuillez compléter les champs obligatoires.");
      return;
    }
    setSubmitting(true);
    const requestId = `WAE-${Date.now().toString(36).toUpperCase()}`;
    const attribution = getBookingAttribution(source);
    const guestCount = Number(form.guestCount);
    const request: BookingRequest = {
      id: requestId, venueId: "", venueCode: "", venueTitle: "Demande générale", venueCity: form.zone.trim(), firstName: form.name.trim(), lastName: "", email: form.email.trim().toLowerCase(), phone: form.phone.trim(), desiredDate: form.flexible ? "" : form.desiredDate, startTime: "", endTime: "", guestCount, eventType: form.eventType, budgetRange: form.budgetRange || undefined, venueResponseToken: crypto.randomUUID(), requestedSpaces: [], message: form.message.trim() || undefined, ...attribution, status: "sent", createdAt: new Date().toISOString(),
    };
    const dateLabel = form.flexible ? "Date flexible" : new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(`${form.desiredDate}T12:00:00`));
    const summary = `Référence : ${requestId}\nType d'événement : ${form.eventType}\nDate : ${dateLabel}\nInvités : ${guestCount}\nBudget : ${form.budgetRange || "Non renseigné"}\nZone : ${form.zone.trim()}\nNom : ${form.name.trim()}\nEmail : ${request.email}\nTéléphone : ${request.phone}\nPage d'origine : ${attribution.landingPage || window.location.href}\nSource : ${attribution.trafficSource || "direct"}\nMessage : ${form.message.trim() || "Aucun message"}`;
    const emails = {
      customerConfirmation: { to: request.email, subject: "Nous avons bien reçu votre demande", preview: "Notre équipe recherche les lieux adaptés à votre événement.", text: `Bonjour ${form.name.trim()},\n\nVotre demande générale a bien été transmise à notre équipe.\n\nNous recherchons maintenant des lieux adaptés à votre date, votre nombre d'invités, votre zone et votre budget. Vous recevrez un retour personnalisé sous 24h ouvrées.\n\n— L'équipe Wearevents` },
      adminNotification: { to: "reservations@wearevents.fr", subject: `Nouvelle demande générale ${requestId} · ${form.eventType}`, preview: `${form.name.trim()} recherche un lieu pour ${guestCount} personnes.`, text: `Nouvelle demande générale\n\n${summary}` },
    };
    try {
      const { error: insertError } = await supabase.from("booking_requests").insert({
        id: requestId, venue_id: null, venue_code: "", venue_title: "Demande générale", venue_city: form.zone.trim(), first_name: form.name.trim(), last_name: "", email: request.email, phone: request.phone, desired_date: form.flexible ? null : form.desiredDate, date_flexible: form.flexible, preferred_zone: form.zone.trim(), start_time: "", end_time: "", guest_count: guestCount, event_type: form.eventType, budget_range: form.budgetRange || null, requested_spaces: [], message: form.message.trim() || null, landing_page: attribution.landingPage || window.location.href, referrer: attribution.referrer || "", traffic_source: attribution.trafficSource || "", utm_source: attribution.utmSource || "", utm_medium: attribution.utmMedium || "", utm_campaign: attribution.utmCampaign || "", interaction_source: attribution.interactionSource || source, status: "new",
      });
      if (insertError) throw insertError;
      const { error: emailError } = await supabase.functions.invoke("send-booking-request", { body: { request, emails } });
      if (emailError) throw emailError;
      void trackBookingRequestConversion(request, { email: request.email, phone: request.phone });
      setSent(true); onSuccess?.(); toast.success("Votre demande a bien été envoyée.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Impossible d'envoyer la demande."); }
    finally { setSubmitting(false); }
  };

  if (sent) return <div className="flex min-h-64 flex-col items-center justify-center text-center"><CheckCircle2 className="h-10 w-10 text-primary" /><h3 className="mt-4 font-heading text-3xl font-semibold">Demande reçue</h3><p className="mt-3 max-w-md font-body text-sm leading-relaxed text-muted-foreground">Notre équipe revient vers vous avec des propositions adaptées sous 24h ouvrées.</p></div>;
  return <form onSubmit={submit} className="grid grid-cols-1 gap-5 md:grid-cols-2">
    <label><span className={labelClass}>Type d'événement *</span><select className={inputClass} value={form.eventType} onChange={(e) => update("eventType", e.target.value)} required><option value="">Sélectionner</option>{EVENT_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
    <div><label htmlFor={`${source}-date`} className={labelClass}>Date *</label><input id={`${source}-date`} type="date" className={inputClass} value={form.desiredDate} disabled={form.flexible} onChange={(e) => update("desiredDate", e.target.value)} required={!form.flexible} min={new Date().toISOString().slice(0, 10)} /><label className="mt-2 flex items-center gap-2 font-body text-sm text-muted-foreground"><input type="checkbox" checked={form.flexible} onChange={(e) => update("flexible", e.target.checked)} /> Ma date est flexible</label></div>
    <label><span className={labelClass}>Nombre d'invités *</span><input type="number" min="1" className={inputClass} value={form.guestCount} onChange={(e) => update("guestCount", e.target.value)} required /></label>
    <label><span className={labelClass}>Budget approximatif</span><select className={inputClass} value={form.budgetRange} onChange={(e) => update("budgetRange", e.target.value)}><option value="">Non renseigné</option>{BOOKING_BUDGET_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
    <label><span className={labelClass}>Zone recherchée *</span><input className={inputClass} value={form.zone} onChange={(e) => update("zone", e.target.value)} placeholder="Paris 11e, ouest parisien..." required /></label>
    <label><span className={labelClass}>Nom *</span><input className={inputClass} value={form.name} onChange={(e) => update("name", e.target.value)} autoComplete="name" required /></label>
    <label><span className={labelClass}>E-mail *</span><input type="email" className={inputClass} value={form.email} onChange={(e) => update("email", e.target.value)} autoComplete="email" required /></label>
    <label><span className={labelClass}>Téléphone *</span><input type="tel" className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} autoComplete="tel" required /></label>
    <label className="md:col-span-2"><span className={labelClass}>Message</span><textarea className="min-h-28 w-full resize-y rounded-lg border border-border bg-background p-3 font-body text-sm outline-none focus:border-primary" value={form.message} onChange={(e) => update("message", e.target.value)} maxLength={900} placeholder="Ambiance, horaires, prestations souhaitées..." /></label>
    <button type="submit" disabled={submitting} className="brand-primary-button inline-flex h-12 items-center justify-center gap-2 rounded-lg px-5 font-body text-sm font-semibold text-primary-foreground disabled:opacity-60 md:col-span-2"><Send className="h-4 w-4" />{submitting ? "Envoi en cours..." : "Recevoir des propositions"}</button>
  </form>;
};

const GeneralBookingExperience = () => {
  const { pathname } = useLocation();
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const seoPage = useMemo(() => getSeoLandingPage(pathname.replace(/^\//, "")), [pathname]);
  const isBlogArticle = /^\/blog\/[^/]+$/.test(pathname);
  const isSeoPage = Boolean(seoPage);
  const shouldDisplay = pathname === "/" || pathname === "/entreprises" || isBlogArticle || isSeoPage;
  const defaultEventType = seoPage?.filters.eventType || (seoPage?.slug === "salle-soiree-entreprise-paris" ? "Fête de fin d'année" : "");
  useEffect(() => {
    if (!shouldDisplay) return;
    const host = document.createElement("div"); host.dataset.generalBooking = "true";
    const footer = document.querySelector("footer");
    if (footer?.parentElement) footer.parentElement.insertBefore(host, footer); else document.body.appendChild(host);
    setPortalTarget(host);
    return () => { host.remove(); setPortalTarget(null); };
  }, [pathname, shouldDisplay]);
  if (!shouldDisplay) return null;
  const source = isBlogArticle ? "blog_general_request" : isSeoPage ? "seo_general_request" : pathname === "/entreprises" ? "business_general_request" : "home_general_request";
  const section = portalTarget ? createPortal(<section className="border-t border-border bg-background px-6 py-20" data-header-theme="dark"><div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 xl:grid-cols-[0.72fr_1.28fr] xl:px-2"><div><p className="font-body text-sm font-semibold text-primary">Recherche personnalisée</p><h2 className="mt-3 font-heading text-4xl font-semibold leading-tight md:text-5xl">Recevez des propositions adaptées.</h2><p className="mt-5 max-w-lg font-body leading-relaxed text-muted-foreground">Décrivez votre événement. Notre équipe sélectionne des lieux cohérents avec votre date, votre zone, votre nombre d'invités et votre budget.</p><div className="mt-7 flex items-center gap-3 font-body text-sm text-muted-foreground"><CalendarDays className="h-5 w-5 text-primary" />Demande gratuite, réponse sous 24h ouvrées.</div></div><div className="rounded-lg border border-border bg-card p-5 md:p-8"><GeneralBookingForm defaultEventType={defaultEventType} source={source} /></div></div></section>, portalTarget) : null;
  return <>{section}{(isBlogArticle || isSeoPage) && <button type="button" onClick={() => setModalOpen(true)} className="fixed bottom-4 left-4 right-4 z-[70] inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-body text-sm font-semibold text-primary-foreground shadow-xl md:hidden"><Send className="h-4 w-4" />Recevoir des propositions</button>}{modalOpen && <div className="fixed inset-0 z-[100] flex items-end bg-black/60 md:items-center md:justify-center md:p-6" role="dialog" aria-modal="true" aria-label="Recevoir des propositions"><div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-xl bg-background p-5 md:max-w-3xl md:rounded-xl md:p-8"><div className="mb-6 flex items-center justify-between"><h2 className="font-heading text-3xl font-semibold">Votre événement</h2><button type="button" onClick={() => setModalOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full border border-border" aria-label="Fermer"><X className="h-5 w-5" /></button></div><GeneralBookingForm defaultEventType={defaultEventType} source={`${source}_mobile`} onSuccess={() => setTimeout(() => setModalOpen(false), 1400)} /></div></div>}</>;
};

export default GeneralBookingExperience;
