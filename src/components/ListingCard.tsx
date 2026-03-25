import type { Listing } from '../types/listing';
import { formatPrice } from '../utils/formatPrice';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface ListingCardProps {
  listing: Listing;
}

const gradients = [
  'from-primary-400 to-primary-600',
  'from-teal-400 to-emerald-600',
  'from-cyan-400 to-blue-600',
  'from-indigo-400 to-purple-600',
  'from-amber-400 to-orange-600',
];

export function ListingCard({ listing }: ListingCardProps) {
  const gradientIndex = listing.id.charCodeAt(listing.id.length - 1) % gradients.length;
  const timeAgo = formatDistanceToNow(parseISO(listing.createdDate), { addSuffix: true, locale: es });

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden group">
      {/* Image or gradient header */}
      <div className={`h-40 relative ${!listing.image ? `bg-gradient-to-br ${gradients[gradientIndex]}` : 'bg-gray-200'}`}>
        {listing.image ? (
          <img
            src={listing.image}
            alt={listing.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.classList.add(`bg-gradient-to-br`, ...gradients[gradientIndex].split(' '));
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 text-white/30" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold text-white ${
            listing.operationType === 'rent' ? 'bg-blue-500' : 'bg-green-600'
          }`}>
            {listing.operationType === 'rent' ? 'Arriendo' : 'Venta'}
          </span>
        </div>
        <div className="absolute bottom-3 right-3 bg-black/50 text-white px-2 py-0.5 rounded text-xs">
          {listing.source}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-800 text-sm leading-tight mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {listing.title}
        </h3>

        <p className="text-xl font-extrabold text-primary-600 mb-2">
          {formatPrice(listing.price)}
          {listing.operationType === 'rent' && <span className="text-sm font-normal text-gray-500">/mes</span>}
        </p>

        <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
            {listing.areaM2} m²
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            {listing.bedrooms} hab
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            {listing.bathrooms} ba
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
          <span>{listing.neighborhood}, {listing.city}</span>
          <span>{timeAgo}</span>
        </div>

        <a
          href={listing.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
        >
          Ver oferta en {listing.source} &rarr;
        </a>
      </div>
    </div>
  );
}
