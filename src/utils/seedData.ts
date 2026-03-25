import type { Listing } from '../types/listing';

interface NeighborhoodData {
  name: string;
  lat: number;
  lon: number;
  rentRange: [number, number];
  saleRange: [number, number];
  areaRange: [number, number];
}

const neighborhoods: NeighborhoodData[] = [
  { name: 'Chapinero', lat: 4.6440, lon: -74.0630, rentRange: [1_500_000, 5_000_000], saleRange: [300_000_000, 900_000_000], areaRange: [40, 120] },
  { name: 'Usaquen', lat: 4.6960, lon: -74.0320, rentRange: [2_000_000, 7_000_000], saleRange: [400_000_000, 1_200_000_000], areaRange: [50, 180] },
  { name: 'Chico', lat: 4.6670, lon: -74.0540, rentRange: [2_500_000, 8_000_000], saleRange: [500_000_000, 1_500_000_000], areaRange: [60, 200] },
  { name: 'Suba', lat: 4.7410, lon: -74.0840, rentRange: [800_000, 3_000_000], saleRange: [150_000_000, 500_000_000], areaRange: [35, 100] },
  { name: 'Cedritos', lat: 4.7210, lon: -74.0480, rentRange: [1_200_000, 3_500_000], saleRange: [250_000_000, 600_000_000], areaRange: [40, 110] },
  { name: 'Rosales', lat: 4.6530, lon: -74.0560, rentRange: [3_000_000, 8_000_000], saleRange: [600_000_000, 1_500_000_000], areaRange: [70, 200] },
  { name: 'Santa Barbara', lat: 4.6860, lon: -74.0440, rentRange: [2_000_000, 6_000_000], saleRange: [400_000_000, 1_000_000_000], areaRange: [55, 160] },
  { name: 'Kennedy', lat: 4.6280, lon: -74.1510, rentRange: [600_000, 1_800_000], saleRange: [120_000_000, 350_000_000], areaRange: [30, 75] },
  { name: 'Fontibon', lat: 4.6730, lon: -74.1450, rentRange: [700_000, 2_200_000], saleRange: [140_000_000, 400_000_000], areaRange: [35, 85] },
  { name: 'Teusaquillo', lat: 4.6330, lon: -74.0830, rentRange: [1_000_000, 3_000_000], saleRange: [200_000_000, 550_000_000], areaRange: [45, 110] },
  { name: 'La Candelaria', lat: 4.5960, lon: -74.0720, rentRange: [800_000, 2_500_000], saleRange: [180_000_000, 450_000_000], areaRange: [35, 90] },
  { name: 'Engativa', lat: 4.7050, lon: -74.1130, rentRange: [700_000, 2_000_000], saleRange: [130_000_000, 380_000_000], areaRange: [35, 80] },
  { name: 'Bosa', lat: 4.6090, lon: -74.1860, rentRange: [500_000, 1_500_000], saleRange: [100_000_000, 280_000_000], areaRange: [30, 65] },
  { name: 'Zipaquira', lat: 5.0220, lon: -73.9930, rentRange: [600_000, 1_800_000], saleRange: [120_000_000, 320_000_000], areaRange: [40, 90] },
  { name: 'Chia', lat: 4.8630, lon: -74.0540, rentRange: [1_000_000, 3_500_000], saleRange: [200_000_000, 600_000_000], areaRange: [45, 130] },
  { name: 'Soacha', lat: 4.5790, lon: -74.2170, rentRange: [500_000, 1_500_000], saleRange: [90_000_000, 250_000_000], areaRange: [30, 65] },
  { name: 'Mosquera', lat: 4.7060, lon: -74.2330, rentRange: [600_000, 2_000_000], saleRange: [120_000_000, 350_000_000], areaRange: [35, 85] },
  { name: 'Madrid', lat: 4.7350, lon: -74.2640, rentRange: [550_000, 1_800_000], saleRange: [100_000_000, 300_000_000], areaRange: [35, 80] },
  { name: 'Hacienda Casablanca', lat: 4.7150, lon: -74.2200, rentRange: [700_000, 2_200_000], saleRange: [130_000_000, 380_000_000], areaRange: [40, 90] },
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function randomInRange(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randomDate(rng: () => number): string {
  const now = new Date();
  const daysAgo = Math.floor(rng() * 85) + 1; // 1-85 days ago (within 3 months)
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return date.toISOString().split('T')[0];
}

const sources = ['FincaRaiz', 'Metrocuadrado', 'Properati', 'OLX', 'Ciencuadras'];

function buildSourceUrl(source: string, neighborhood: string, opType: 'sale' | 'rent'): string {
  const query = encodeURIComponent(`apartamento ${opType === 'rent' ? 'arriendo' : 'venta'} ${neighborhood} bogota`);
  switch (source) {
    case 'FincaRaiz':
      return `https://www.fincaraiz.com.co/finca-raiz?search=${query}`;
    case 'Metrocuadrado':
      return `https://www.metrocuadrado.com/s/bogota/apartamentos?search=${query}`;
    case 'Ciencuadras':
      return `https://www.ciencuadras.com/buscar?q=${query}`;
    case 'OLX':
      return `https://www.google.com/search?q=${query}+site:olx.com.co`;
    case 'Properati':
    default:
      return `https://www.google.com/search?q=${query}+site:properati.com.co`;
  }
}

export function generateSeedData(): Listing[] {
  const rng = seededRandom(42);
  const listings: Listing[] = [];
  let id = 1;

  for (const hood of neighborhoods) {
    const count = randomInRange(rng, 7, 12);
    for (let i = 0; i < count; i++) {
      const isRent = rng() > 0.45;
      const opType = isRent ? 'rent' : 'sale';
      const priceRange = isRent ? hood.rentRange : hood.saleRange;
      const price = Math.round(randomInRange(rng, priceRange[0], priceRange[1]) / 100_000) * 100_000;
      const area = randomInRange(rng, hood.areaRange[0], hood.areaRange[1]);
      const bedrooms = area < 45 ? 1 : area < 70 ? randomInRange(rng, 1, 2) : area < 110 ? randomInRange(rng, 2, 3) : randomInRange(rng, 3, 4);
      const bathrooms = bedrooms <= 1 ? 1 : randomInRange(rng, 1, bedrooms);

      const latOffset = (rng() - 0.5) * 0.015;
      const lonOffset = (rng() - 0.5) * 0.015;

      const titlePrefixes = isRent
        ? ['Arriendo Apartamento', 'Apto en Arriendo', 'Se Arrienda Apartamento', 'Arriendo Hermoso Apto']
        : ['Venta Apartamento', 'Apto en Venta', 'Se Vende Apartamento', 'Oportunidad Apto'];
      const titlePrefix = titlePrefixes[Math.floor(rng() * titlePrefixes.length)];

      listings.push({
        id: `apt-${String(id++).padStart(4, '0')}`,
        title: `${titlePrefix} en ${hood.name} - ${area}m²`,
        price,
        currency: 'COP',
        areaM2: area,
        bedrooms,
        bathrooms,
        neighborhood: hood.name,
        city: ['Zipaquira', 'Chia', 'Soacha', 'Mosquera', 'Madrid', 'Hacienda Casablanca'].includes(hood.name) ? hood.name : 'Bogota',
        lat: hood.lat + latOffset,
        lon: hood.lon + lonOffset,
        operationType: opType,
        createdDate: randomDate(rng),
        source: sources[Math.floor(rng() * sources.length)],
        url: '',
      });
      // Set URL after source is assigned
      const last = listings[listings.length - 1];
      last.url = buildSourceUrl(last.source, hood.name, opType);
    }
  }

  return listings;
}
