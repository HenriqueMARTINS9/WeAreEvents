export type MobileVenueComment = {
  id: string;
  author: string;
  message: string;
  createdAt: string;
};

const storageKey = (venueId: string) => `wearevents-mobile-comments-${venueId}`;

export const getMobileComments = (venueId: string): MobileVenueComment[] => {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(window.localStorage.getItem(storageKey(venueId)) || "[]");
  } catch {
    return [];
  }
};

export const saveMobileComments = (venueId: string, comments: MobileVenueComment[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(venueId), JSON.stringify(comments));
};

export const countMobileComments = (venueId: string) => getMobileComments(venueId).length;
