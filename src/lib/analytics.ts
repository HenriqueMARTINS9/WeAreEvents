import type { BookingRequest, Venue } from "@/types/venue";

type GoogleConsentChoice = "granted" | "denied";
type GtagParams = Record<string, string | number | boolean | null | undefined>;
type SearchTrackingFilters = {
  locationQuery?: string;
  eventType?: string;
  eventDate?: string;
  guests?: string;
  guestRangeMin?: string;
  guestRangeMax?: string;
  maxCapacityGreaterThan?: string;
  maxCapacityLimit?: string;
  priceTier?: string;
  closingFilter?: string;
  eventCategoryFilters?: string[];
  ambianceFilters?: string[];
  venueTypes?: string[];
  privatizationTypes?: string[];
  spaceTypes?: string[];
  optionFilters?: string[];
  equipmentFilters?: string[];
  guestDispositions?: string[];
};

export type EnhancedConversionData = {
  email?: string;
  phone?: string;
};

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
const e164PhonePattern = /^\+[1-9]\d{10,14}$/;

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

const compactValue = (value?: string | number | boolean | null) => {
  if (value === undefined || value === null || value === "") return undefined;
  return value;
};

const compactList = (values?: string[]) => {
  const items = values?.map((value) => value.trim()).filter(Boolean) ?? [];
  return items.length ? items.join("|") : undefined;
};

const countFilters = (filters: SearchTrackingFilters) =>
  [
    filters.locationQuery,
    filters.eventType,
    filters.eventDate,
    filters.guests,
    filters.guestRangeMin,
    filters.guestRangeMax,
    filters.maxCapacityGreaterThan,
    filters.maxCapacityLimit,
    filters.priceTier,
    filters.closingFilter,
    ...(filters.eventCategoryFilters ?? []),
    ...(filters.ambianceFilters ?? []),
    ...(filters.venueTypes ?? []),
    ...(filters.privatizationTypes ?? []),
    ...(filters.spaceTypes ?? []),
    ...(filters.optionFilters ?? []),
    ...(filters.equipmentFilters ?? []),
    ...(filters.guestDispositions ?? []),
  ].filter(Boolean).length;

const getSearchTerm = (filters: SearchTrackingFilters) =>
  filters.locationQuery?.trim() ||
  filters.eventType?.trim() ||
  filters.eventCategoryFilters?.[0] ||
  filters.venueTypes?.[0] ||
  "toutes les salles";

const normalizeEmail = (value?: string) => {
  const email = value?.trim().toLowerCase();
  if (!email || !email.includes("@")) return "";

  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "";

  if (domain === "gmail.com" || domain === "googlemail.com") {
    return `${localPart.replace(/\./g, "")}@${domain}`;
  }

  return `${localPart}@${domain}`;
};

const normalizePhoneToE164 = (value?: string) => {
  const phone = value?.trim();
  if (!phone) return "";

  const hasPlusPrefix = phone.startsWith("+");
  let digits = phone.replace(/\D/g, "");

  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);

  const normalized = hasPlusPrefix || digits.startsWith("33")
    ? `+${digits}`
    : digits.startsWith("0")
      ? `+33${digits.slice(1)}`
      : `+33${digits}`;

  return e164PhonePattern.test(normalized) ? normalized : "";
};

const sha256Hex = async (value: string) => {
  if (!canUseDom() || !window.crypto?.subtle || typeof TextEncoder === "undefined") return "";

  const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const buildEnhancedConversionUserData = async (data?: EnhancedConversionData) => {
  const email = normalizeEmail(data?.email);
  const phone = normalizePhoneToE164(data?.phone);
  const [hashedEmail, hashedPhone] = await Promise.all([
    email ? sha256Hex(email) : Promise.resolve(""),
    phone ? sha256Hex(phone) : Promise.resolve(""),
  ]);

  return {
    ...(hashedEmail ? { sha256_email_address: hashedEmail } : {}),
    ...(hashedPhone ? { sha256_phone_number: hashedPhone } : {}),
  };
};

const setEnhancedConversionUserData = async (data?: EnhancedConversionData) => {
  if (!googleAdsId || !hasGoogleTrackingConsent() || !data) return;

  const userData = await buildEnhancedConversionUserData(data);
  if (!Object.keys(userData).length) return;

  ensureGoogleTag();
  window.gtag?.("set", "user_data", userData);
};

const trackGoogleAdsConversion = (label: string, params: GtagParams = {}) => {
  if (!googleAdsId || !label || !hasGoogleTrackingConsent()) return;
  ensureGoogleTag();
  window.gtag?.("event", "conversion", {
    send_to: `${googleAdsId}/${label}`,
    ...params,
  });
};

const getVenueTrackingParams = (venue: Venue) => ({
  venue_id: venue.id,
  venue_code: venue.venueCode,
  venue_name: venue.title,
  venue_city: venue.city,
});

export const trackSearchResultsView = (
  filters: SearchTrackingFilters & { resultCount: number; source?: string },
) => {
  const filterCount = countFilters(filters);

  trackAnalyticsEvent("search", {
    search_term: getSearchTerm(filters),
    result_count: filters.resultCount,
    filter_count: filterCount,
    has_filters: filterCount > 0,
    search_source: filters.source,
    location_query: compactValue(filters.locationQuery),
    event_type: compactValue(filters.eventType),
    event_date: compactValue(filters.eventDate),
    guests: compactValue(filters.guests),
    guest_range_min: compactValue(filters.guestRangeMin),
    guest_range_max: compactValue(filters.guestRangeMax),
    max_capacity_gt: compactValue(filters.maxCapacityGreaterThan),
    max_capacity_limit: compactValue(filters.maxCapacityLimit),
    price_tier: compactValue(filters.priceTier),
    closing_filter: compactValue(filters.closingFilter),
    event_categories: compactList(filters.eventCategoryFilters),
    ambiance_types: compactList(filters.ambianceFilters),
    venue_types: compactList(filters.venueTypes),
    privatization_types: compactList(filters.privatizationTypes),
    space_types: compactList(filters.spaceTypes),
    option_filters: compactList(filters.optionFilters),
    equipment_filters: compactList(filters.equipmentFilters),
    guest_dispositions: compactList(filters.guestDispositions),
  });
};

export const trackAllFiltersOpen = (resultCount: number, activeFilterCount: number) => {
  trackAnalyticsEvent("all_filters_open", {
    result_count: resultCount,
    active_filter_count: activeFilterCount,
  });
};

export const trackVenueCardOpen = (venue: Venue, context: string) => {
  trackAnalyticsEvent("select_content", {
    content_type: "venue",
    interaction_context: context,
    ...getVenueTrackingParams(venue),
  });
};

export const trackBookingModalOpen = (venue: Venue, source: string) => {
  trackAnalyticsEvent("booking_modal_open", {
    interaction_source: source,
    ...getVenueTrackingParams(venue),
  });
};

export const trackBookingFormStart = (venue: Venue, firstField?: string) => {
  trackAnalyticsEvent("booking_form_start", {
    first_field: firstField,
    ...getVenueTrackingParams(venue),
  });
};

export const trackBookingFormError = (venue: Venue, errors: Record<string, string | undefined>) => {
  const fields = Object.keys(errors).filter((field) => Boolean(errors[field]));

  trackAnalyticsEvent("booking_form_error", {
    error_count: fields.length,
    error_fields: fields.join("|"),
    ...getVenueTrackingParams(venue),
  });
};

export const trackBookingSubmitFailure = (venue: Venue, message?: string) => {
  trackAnalyticsEvent("booking_submit_failure", {
    error_message: message?.slice(0, 120),
    ...getVenueTrackingParams(venue),
  });
};

export const trackReferralModalOpen = () => {
  trackAnalyticsEvent("referral_modal_open", {
    lead_type: "establishment_referral",
  });
};

export const trackReferralFormStart = (firstField?: string) => {
  trackAnalyticsEvent("referral_form_start", {
    lead_type: "establishment_referral",
    first_field: firstField,
  });
};

export const trackBookingRequestConversion = async (
  request: BookingRequest,
  enhancedConversionData?: EnhancedConversionData,
) => {
  await setEnhancedConversionUserData(enhancedConversionData);
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

export const trackEstablishmentReferralConversion = async (
  venueName?: string,
  city?: string,
  enhancedConversionData?: EnhancedConversionData,
) => {
  await setEnhancedConversionUserData(enhancedConversionData);
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

export const trackContactClick = (method: string, context: string) => {
  trackAnalyticsEvent("contact", {
    method,
    contact_context: context,
  });
};

export const trackSocialClick = (platform: string, url: string) => {
  trackAnalyticsEvent("select_content", {
    content_type: "social_profile",
    social_platform: platform,
    link_url: url,
  });
};
