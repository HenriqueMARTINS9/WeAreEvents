import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  addGoogleConsentChangeListener,
  getGoogleConsentChoice,
  isGoogleTagConfigured,
  setGoogleConsentChoice,
  trackPageView,
} from "@/lib/analytics";

const GoogleTagTracker = () => {
  const location = useLocation();
  const [consentChoice, setConsentChoice] = useState(() => getGoogleConsentChoice());
  const hideOnAdmin = location.pathname.startsWith("/admin");

  useEffect(() => {
    return addGoogleConsentChangeListener(() => {
      setConsentChoice(getGoogleConsentChoice());
    });
  }, []);

  useEffect(() => {
    if (!isGoogleTagConfigured || hideOnAdmin) return;

    const path = `${location.pathname}${location.search}`;
    const timeout = window.setTimeout(() => {
      trackPageView(path, document.title);
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [hideOnAdmin, location.pathname, location.search]);

  if (!isGoogleTagConfigured || hideOnAdmin || consentChoice) return null;

  const acceptTracking = () => {
    setGoogleConsentChoice("granted");
    trackPageView(`${location.pathname}${location.search}`, document.title);
  };

  const refuseTracking = () => {
    setGoogleConsentChoice("denied");
  };

  return (
    <aside className="fixed inset-x-4 bottom-4 z-[2200] mx-auto max-w-3xl rounded-lg border border-border bg-background p-4 shadow-2xl sm:bottom-6 sm:flex sm:items-center sm:justify-between sm:gap-5">
      <div className="min-w-0">
        <p className="font-body text-sm font-semibold text-foreground">Mesure d'audience</p>
        <p className="mt-1 font-body text-xs leading-relaxed text-muted-foreground sm:text-sm">
          Nous utilisons Google Analytics 4 et Google Ads pour mesurer les visites et les demandes envoyées en France, principalement en région parisienne. Vous pouvez accepter ou refuser ce suivi.
          <Link to="/politique-confidentialite" className="ml-1 underline underline-offset-4">
            En savoir plus
          </Link>
        </p>
      </div>
      <div className="mt-4 flex shrink-0 gap-2 sm:mt-0">
        <button
          type="button"
          onClick={refuseTracking}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-border px-4 font-body text-xs font-semibold text-foreground transition-colors hover:border-primary/40 sm:flex-none"
        >
          Refuser
        </button>
        <button
          type="button"
          onClick={acceptTracking}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-primary px-4 font-body text-xs font-semibold text-primary-foreground transition-colors hover:bg-foreground sm:flex-none"
        >
          Accepter
        </button>
      </div>
    </aside>
  );
};

export default GoogleTagTracker;
