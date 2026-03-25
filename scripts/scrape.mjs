/**
 * Scraper de FincaRaiz - Extrae datos reales de __NEXT_DATA__
 * Se ejecuta en GitHub Actions (cron diario) o manualmente.
 */

import { writeFileSync, mkdirSync } from 'fs';

const ZONES = [
  'chapinero', 'usaquen', 'suba', 'kennedy', 'fontibon',
  'teusaquillo', 'engativa', 'bosa', 'barrios-unidos',
  'santa-fe', 'antonio-narino', 'puente-aranda', 'rafael-uribe-uribe',
  'san-cristobal', 'ciudad-bolivar', 'tunjuelito', 'los-martires',
];

const NEARBY_CITIES = [
  'chia', 'soacha', 'mosquera', 'madrid-cundinamarca', 'zipaquira',
];

const OPERATIONS = ['arriendo', 'venta'];

async function fetchListings(location, operation, isCity = false) {
  const basePath = isCity
    ? `https://www.fincaraiz.com.co/${operation}/apartamentos/${location}`
    : `https://www.fincaraiz.com.co/${operation}/apartamentos/bogota/${location}`;

  const listings = [];

  try {
    const res = await fetch(basePath, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-CO,es;q=0.9',
      },
    });

    if (!res.ok) {
      console.warn(`  [${res.status}] ${basePath}`);
      return [];
    }

    const html = await res.text();

    // Extract __NEXT_DATA__ JSON
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) {
      console.warn(`  No __NEXT_DATA__ found: ${basePath}`);
      return [];
    }

    const nextData = JSON.parse(match[1]);

    // Navigate FincaRaiz structure: props.pageProps.fetchResult.searchFast.data
    const results = nextData?.props?.pageProps?.fetchResult?.searchFast?.data
      || nextData?.props?.pageProps?.searchFast?.data
      || [];

    if (!Array.isArray(results)) {
      console.warn(`  Data not an array at: ${basePath}`);
      return [];
    }

    for (const item of results) {
      try {
        const price = item.price?.amount || 0;
        const adminPrice = item.price?.admin_included || price;
        const area = item.m2 || item.area || 0;
        const title = item.title || item.address || '';
        const itemId = item.id || item.code;

        if (!price || !title || !itemId) continue;

        // Extract location from the item's locations array or nested data
        const locData = item.locations;
        let neighborhood = location;
        let city = isCity ? location : 'Bogota';
        let lat = 0;
        let lon = 0;

        if (locData) {
          if (Array.isArray(locData)) {
            for (const loc of locData) {
              if (loc.type === 'NEIGHBOURHOOD' || loc.type === 'neighbourhood') {
                neighborhood = loc.name || neighborhood;
              }
              if (loc.type === 'CITY' || loc.type === 'city') {
                city = loc.name || city;
              }
            }
          } else if (typeof locData === 'object') {
            neighborhood = locData.neighbourhood?.name || locData.locality?.name || locData.zone?.name || neighborhood;
            city = locData.city?.name || city;
          }
        }

        lat = item.latitude || item.geo_point?.lat || item.coordinates?.lat || 0;
        lon = item.longitude || item.geo_point?.lon || item.coordinates?.lon || 0;

        // Only keep listings with valid 9+ digit IDs
        if (String(itemId).length < 9) continue;

        // Build real URL using the link field from FincaRaiz data
        const url = item.link
          ? `https://www.fincaraiz.com.co${item.link}`
          : `https://www.fincaraiz.com.co/${operation}/apartamentos/bogota`;

        // Extract bedrooms/bathrooms
        let bedrooms = item.rooms || item.bedrooms || 0;
        let bathrooms = item.bathrooms || 0;
        if (item.technicalSheet) {
          const ts = item.technicalSheet;
          if (Array.isArray(ts)) {
            for (const t of ts) {
              if (t.key === 'bedrooms' || t.key === 'rooms') bedrooms = bedrooms || t.value;
              if (t.key === 'bathrooms') bathrooms = bathrooms || t.value;
            }
          } else {
            bedrooms = bedrooms || ts.bedrooms || ts.rooms || 0;
            bathrooms = bathrooms || ts.bathrooms || 0;
          }
        }

        // Use description to try to extract bedrooms/bathrooms if still 0
        if ((!bedrooms || !bathrooms) && item.description) {
          const desc = item.description;
          if (!bedrooms) {
            const bedMatch = desc.match(/(\d+)\s*(?:dormitorio|habitaci|alcoba)/i);
            if (bedMatch) bedrooms = parseInt(bedMatch[1]);
          }
          if (!bathrooms) {
            const bathMatch = desc.match(/(\d+)\s*baño/i);
            if (bathMatch) bathrooms = parseInt(bathMatch[1]);
          }
        }

        listings.push({
          id: `fr-${itemId}`,
          title,
          price,
          adminPrice,
          currency: 'COP',
          areaM2: typeof area === 'number' ? area : parseFloat(area) || 0,
          bedrooms,
          bathrooms,
          neighborhood: capitalize(neighborhood),
          city: capitalize(city),
          lat,
          lon,
          operationType: operation === 'arriendo' ? 'rent' : 'sale',
          createdDate: new Date().toISOString().split('T')[0],
          source: 'FincaRaiz',
          url,
          image: item.img || '',
        });
      } catch {
        // Skip malformed items
      }
    }
  } catch (err) {
    console.warn(`  Error fetching ${basePath}: ${err.message}`);
  }

  return listings;
}

function capitalize(str) {
  return String(str).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('Starting FincaRaiz scraper...');
  const allListings = [];
  const seen = new Set();

  for (const op of OPERATIONS) {
    // Bogota zones
    for (const zone of ZONES) {
      console.log(`Fetching: ${op}/apartamentos/bogota/${zone}`);
      const results = await fetchListings(zone, op, false);
      for (const item of results) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          allListings.push(item);
        }
      }
      console.log(`  Got ${results.length} (total unique: ${allListings.length})`);
      await delay(2000);
    }

    // Nearby cities
    for (const city of NEARBY_CITIES) {
      console.log(`Fetching: ${op}/apartamentos/${city}`);
      const results = await fetchListings(city, op, true);
      for (const item of results) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          allListings.push(item);
        }
      }
      console.log(`  Got ${results.length} (total unique: ${allListings.length})`);
      await delay(2000);
    }
  }

  console.log(`\nTotal unique listings: ${allListings.length}`);

  mkdirSync('public/data', { recursive: true });
  writeFileSync('public/data/listings.json', JSON.stringify(allListings, null, 2));
  console.log('Written to public/data/listings.json');
}

main().catch(console.error);
