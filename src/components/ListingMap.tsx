import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Listing } from '../types/listing';
import { formatPrice } from '../utils/formatPrice';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface ListingMapProps {
  listings: Listing[];
}

export function ListingMap({ listings }: ListingMapProps) {
  const bogotaCenter: [number, number] = [4.6510, -74.0817];

  return (
    <div className="h-[500px] lg:h-[600px] rounded-xl overflow-hidden shadow-md">
      <MapContainer center={bogotaCenter} zoom={11} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {listings.slice(0, 100).map((listing) => (
          <Marker key={listing.id} position={[listing.lat, listing.lon]} icon={defaultIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-bold text-primary-700 mb-1">{formatPrice(listing.price)}</p>
                <p className="text-gray-700">{listing.title}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {listing.areaM2} m² | {listing.bedrooms} hab | {listing.bathrooms} ba
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
