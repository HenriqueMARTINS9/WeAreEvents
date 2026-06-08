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
