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

export const venueMaxCapacityFitsBounds = (
  venue: VenueCapacity,
  maxCapacityGreaterThan?: number,
  maxCapacityLimit?: number,
) => {
  if (maxCapacityGreaterThan !== undefined && venue.maxCapacity <= maxCapacityGreaterThan) return false;
  if (maxCapacityLimit !== undefined && venue.maxCapacity > maxCapacityLimit) return false;

  return true;
};
