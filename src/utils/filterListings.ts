import { subMonths, isAfter, parseISO } from 'date-fns';
import type { Listing, FilterState } from '../types/listing';

export function filterListings(listings: Listing[], filters: FilterState): Listing[] {
  const threeMonthsAgo = subMonths(new Date(), 3);

  return listings.filter((listing) => {
    // Date filter: only last 3 months
    if (!isAfter(parseISO(listing.createdDate), threeMonthsAgo)) {
      return false;
    }

    // Price filter
    if (listing.price < filters.priceMin || listing.price > filters.priceMax) {
      return false;
    }

    // Area filter
    if (listing.areaM2 < filters.areaMin || listing.areaM2 > filters.areaMax) {
      return false;
    }

    // Operation type filter
    if (filters.operationType !== 'all' && listing.operationType !== filters.operationType) {
      return false;
    }

    // Neighborhood filter
    if (filters.neighborhood && listing.neighborhood !== filters.neighborhood) {
      return false;
    }

    return true;
  });
}
