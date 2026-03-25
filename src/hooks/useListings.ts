import { useState, useEffect } from 'react';
import type { Listing } from '../types/listing';
import { generateSeedData } from '../utils/seedData';

interface UseListingsResult {
  listings: Listing[];
  loading: boolean;
  error: string | null;
  lastUpdated: string;
}

export function useListings(): UseListingsResult {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        // Try fetching from static JSON first
        const base = import.meta.env.BASE_URL;
        const res = await fetch(`${base}data/listings.json`);
        if (res.ok) {
          const data = await res.json();
          setListings(data);
        } else {
          // Fallback to generated seed data
          setListings(generateSeedData());
        }
      } catch {
        // Fallback to generated seed data
        setListings(generateSeedData());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { listings, loading, error, lastUpdated: new Date().toISOString().split('T')[0] };
}
