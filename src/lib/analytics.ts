import type { BookingRequest } from "@/types/venue";

type GoogleConsentChoice = "granted" | "denied";
type GtagParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const ga4MeasurementId = (import.meta.env.VITE_GA4_MEASUREMENT_ID || "").trim();
const googleAdsId = (import.meta.env.VITE_GOOGLE_ADS_ID || "").trim();
const bookingConversionLabel = (import.meta.env.VITE_GOOGLE_ADS_BOOKING_CONVERSION_LABEL || "").trim();
const referralConversionLabel = (import.meta.env.VITE_GOOGLE_ADS_REFERRAL_CONVERSION_LABEL || "").trim();
const whatsAppConversionLabel = (import.meta.env.VITE_GOOGLE_ADS_WHATSAPP_CONVERSION_LABEL || "").trim();
const consentStorageKey = "wearevents-google-consent";
const consentChangeEventName = "wearevents:analytics-consent-change";

let googleTagInitialized = false;
let googleTagScriptRequested = false;

export const isGoogleTagConfigured = Boolean(ga4MeasurementId || googleAdsId);

const canUseDom = () => typeof window !== "undefined" && typeof document !== "undefined";

const getGoogleTagIds = () =>
  Array.from(new Set([ga4MeasurementId, googleAdsId].filter(Boolean)));

const getConsentParams = (choice: GoogleConsentChoice) => ({
  analytics_storage: choice,
  ad_storage: choice,
  ad_user_data: choice,
  ad_personalization: choice,
  wait_for_update: 500,
});

const getStoredConsentChoice = (): GoogleConsentChoice | null => {
  if (!canUseDom()) return null;
  const value = window.localStorage.getItem(consentStorageKey);
  return value === "granted" || value === "denied" ? value : null;
};

export const getGoogleConsentChoice = () => getStoredConsentChoice();
const hasGoogleTrackingConsent = () => getStoredConsentChoice() === "granted";

const dispatchConsentChange = () => {
  if (!canUseDom()) return;
  window.dispatchEvent(new Event(consentChangeEventName));
};

export const addGoogleConsentChangeListener = (listener: () => void) => {
  if (!canUseDom()) return () => undefined;
  window.addEventListener(consentChangeEventName, listener);
  return () => window.removeEventListener(consentChangeEventName, listener);
};

const ensureGoogleTag = () => {
  if (!canUseDom() || !isGoogleTagConfigured || !hasGoogleTrackingConsent()) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer?.push(arguments);
  };

  if (!googleTagInitialized) {
    window.gtag("consent", "default", getConsentParams("granted"));
    window.gtag("js", new Date());

    getGoogleTagIds().forEach((tagId) => {
      window.gtag?.("config", tagId, { send_page_view: false });
    });

    googleTagInitialized = true;
  }

  if (!googleTagScriptRequested) {
    const firstTagId = getGoogleTagIds()[0];
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(firstTagId)}`;
    document.head.appendChild(script);
    googleTagScriptRequested = true;
  }
};

export const setGoogleConsentChoice = (choice: GoogleConsentChoice) => {
  if (!canUseDom() || !isGoogleTagConfigured) return;
  window.localStorage.setItem(consentStorageKey, choice);

  if (choice === "granted") {
    ensureGoogleTag();
    window.gtag?.("consent", "update", getConsentParams("granted"));
  } else if (window.gtag) {
    window.gtag("consent", "update", getConsentParams("denied"));
  }

  dispatchConsentChange();
};

export const resetGoogleConsentChoice = () => {
  if (!canUseDom()) return;
  window.localStorage.removeItem(consentStorageKey);
  if (window.gtag) {
    window.gtag("consent", "update", getConsentParams("denied"));
  }
  dispatchConsentChange();
};

export const trackPageView = (path: string, title = document.title) => {
  if (!isGoogleTagConfigured || !hasGoogleTrackingConsent() || path.startsWith("/admin")) return;
  ensureGoogleTag();

  const pageLocation = `${window.location.origin}${path}`;

  if (ga4MeasurementId) {
    window.gtag?.("event", "page_view", {
      send_to: ga4MeasurementId,
      page_path: path,
      page_location: pageLocation,
      page_title: title,
    });
  }

  if (googleAdsId) {
    window.gtag?.("config", googleAdsId, {
      page_path: path,
      page_location: pageLocation,
      page_title: title,
    });
  }
};

export const trackAnalyticsEvent = (eventName: string, params: GtagParams = {}) => {
  if (!isGoogleTagConfigured || !hasGoogleTrackingConsent()) return;
  ensureGoogleTag();
  window.gtag?.("event", eventName, {
    ...(ga4MeasurementId ? { send_to: ga4MeasurementId } : {}),
    ...params,
  });
};

const trackGoogleAdsConversion = (label: string, params: GtagParams = {}) => {
  if (!googleAdsId || !label || !hasGoogleTrackingConsent()) return;
  ensureGoogleTag();
  window.gtag?.("event", "conversion", {
    send_to: `${googleAdsId}/${label}`,
    ...params,
  });
};

export const trackBookingRequestConversion = (request: BookingRequest) => {
  trackAnalyticsEvent("generate_lead", {
    lead_type: "booking_request",
    venue_id: request.venueId,
    venue_code: request.venueCode,
    venue_name: request.venueTitle,
    event_type: request.eventType,
    guest_count: request.guestCount,
    value: 1,
    currency: "EUR",
  });
  trackGoogleAdsConversion(bookingConversionLabel, {
    value: 1,
    currency: "EUR",
    transaction_id: request.id,
  });
};

export const trackEstablishmentReferralConversion = (venueName?: string, city?: string) => {
  trackAnalyticsEvent("generate_lead", {
    lead_type: "establishment_referral",
    venue_name: venueName,
    city,
    value: 1,
    currency: "EUR",
  });
  trackGoogleAdsConversion(referralConversionLabel, {
    value: 1,
    currency: "EUR",
  });
};

export const trackWhatsAppClick = (context: string, venueName?: string) => {
  trackAnalyticsEvent("contact", {
    method: "whatsapp",
    contact_context: context,
    venue_name: venueName,
  });
  trackGoogleAdsConversion(whatsAppConversionLabel, {
    value: 1,
    currency: "EUR",
  });
};
