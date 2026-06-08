type VenueCapacity = {
  minCapacity: number;
  maxCapacity: number;
};

export const venueCanHostGuestCount = (
  venue: VenueCapacity,
  guestCount?: number,
) => {
  if (!guestCount || guestCount <= 0) return true;

  return venue.minCapacity <= guestCount && venue.maxCapacity >= guestCount;
};

export const venueOverlapsGuestRange = (
  venue: VenueCapacity,
  rangeMin?: number,
  rangeMax?: number,
) => {
  if (!rangeMin && !rangeMax) return true;
  if (rangeMin && venue.maxCapacity < rangeMin) return false;
  if (rangeMax && venue.minCapacity > rangeMax) return false;

  return true;
};
