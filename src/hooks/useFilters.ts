import { useState, useMemo, useCallback } from 'react';
import type { Listing, FilterState } from '../types/listing';
import { filterListings } from '../utils/filterListings';

const DEFAULT_FILTERS: FilterState = {
  priceMin: 0,
  priceMax: 1_500_000_000,
  areaMin: 0,
  areaMax: 300,
  operationType: 'all',
  neighborhood: '',
};

export function useFilters(listings: Listing[]) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const filtered = useMemo(() => filterListings(listings, filters), [listings, filters]);

  const neighborhoods = useMemo(() => {
    const set = new Set(listings.map((l) => l.neighborhood));
    return Array.from(set).sort();
  }, [listings]);

  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  return { filters, filtered, neighborhoods, updateFilter, resetFilters };
}
