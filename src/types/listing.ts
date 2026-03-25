export interface Listing {
  id: string;
  title: string;
  price: number;
  currency: 'COP';
  areaM2: number;
  bedrooms: number;
  bathrooms: number;
  neighborhood: string;
  city: string;
  lat: number;
  lon: number;
  operationType: 'sale' | 'rent';
  createdDate: string;
  source: string;
  url: string;
  image?: string;
  adminPrice?: number;
}

export interface FilterState {
  priceMin: number;
  priceMax: number;
  areaMin: number;
  areaMax: number;
  operationType: 'sale' | 'rent' | 'all';
  neighborhood: string;
}
