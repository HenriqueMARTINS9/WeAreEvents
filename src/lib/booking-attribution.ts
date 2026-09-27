export type BookingAttribution = {
  landingPage: string;
  referrer: string;
  trafficSource: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  interactionSource: string;
};

const storageKey = "wearevents-booking-attribution";

const inferTrafficSource = (utmSource: string, referrer: string) => {
  if (utmSource) return utmSource;
  if (!referrer) return "direct";

  try {
    const hostname = new URL(referrer).hostname.toLowerCase();
    if (hostname.includes("google.")) return "google";
    if (hostname.includes("tiktok.")) return "tiktok";
    if (hostname.includes("instagram.")) return "instagram";
    if (hostname.includes("facebook.") || hostname.includes("fb.")) return "facebook";
    if (hostname.includes("linkedin.")) return "linkedin";
    return hostname;
  } catch {
    return "referral";
  }
};

export const getBookingAttribution = (interactionSource = ""): BookingAttribution => {
  if (typeof window === "undefined") {
    return {
      landingPage: "",
      referrer: "",
      trafficSource: "direct",
      utmSource: "",
      utmMedium: "",
      utmCampaign: "",
      interactionSource,
    };
  }

  const params = new URLSearchParams(window.location.search);
  let stored: Partial<BookingAttribution> = {};

  try {
    stored = JSON.parse(window.sessionStorage.getItem(storageKey) || "{}") as Partial<BookingAttribution>;
  } catch {
    stored = {};
  }

  const utmSource = stored.utmSource || params.get("utm_source") || "";
  const referrer = stored.referrer || document.referrer || "";
  const attribution: BookingAttribution = {
    landingPage: stored.landingPage || `${window.location.pathname}${window.location.search}`,
    referrer,
    trafficSource: stored.trafficSource || inferTrafficSource(utmSource, referrer),
    utmSource,
    utmMedium: stored.utmMedium || params.get("utm_medium") || "",
    utmCampaign: stored.utmCampaign || params.get("utm_campaign") || "",
    interactionSource,
  };

  window.sessionStorage.setItem(storageKey, JSON.stringify(attribution));
  return attribution;
};

export const getBookingPrefillFromUrl = () => {
  if (typeof window === "undefined") return { desiredDate: "", guestCount: "", eventType: "" };
  const params = new URLSearchParams(window.location.search);

  return {
    desiredDate: params.get("date") || "",
    guestCount: params.get("guests") || "",
    eventType: params.get("type") || params.get("event") || "",
  };
};
