import { useState } from 'react';
import type { Listing } from '../types/listing';
import { ListingCard } from './ListingCard';

interface ListingGridProps {
  listings: Listing[];
}

const PAGE_SIZE = 12;

export function ListingGrid({ listings }: ListingGridProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visible = listings.slice(0, visibleCount);
  const hasMore = visibleCount < listings.length;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {visible.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-6">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors shadow-sm"
          >
            Cargar mas ({listings.length - visibleCount} restantes)
          </button>
        </div>
      )}
    </div>
  );
}
