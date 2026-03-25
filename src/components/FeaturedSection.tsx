import type { Listing } from '../types/listing';
import { ListingCard } from './ListingCard';

interface FeaturedSectionProps {
  listings: Listing[];
  onViewAll: () => void;
}

export function FeaturedSection({ listings, onViewAll }: FeaturedSectionProps) {
  if (listings.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🏡</span>
              <h2 className="text-xl font-bold text-gray-800">Hacienda Casablanca, Madrid</h2>
            </div>
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-amber-700">{listings.length}</span> apartamentos encontrados en esta zona
              &middot; Actualizado diariamente
            </p>
          </div>
          <button
            onClick={onViewAll}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            Ver todos →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {listings.slice(0, 6).map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      {listings.length > 6 && (
        <div className="text-center mt-4">
          <button
            onClick={onViewAll}
            className="text-amber-700 hover:text-amber-800 font-medium text-sm underline"
          >
            Ver los {listings.length} apartamentos en Hacienda Casablanca →
          </button>
        </div>
      )}
    </div>
  );
}
