/**
 * Multi-portal scraper: FincaRaiz + Metrocuadrado
 * Se ejecuta en GitHub Actions (cron diario) o manualmente.
 */

import { writeFileSync, mkdirSync } from 'fs';

// ============================================================
// CONFIG
// ============================================================
const ZONES = [
  'chapinero', 'usaquen', 'suba', 'kennedy', 'fontibon',
  'teusaquillo', 'engativa', 'bosa', 'barrios-unidos',
  'santa-fe', 'antonio-narino', 'puente-aranda', 'rafael-uribe-uribe',
  'san-cristobal', 'ciudad-bolivar', 'tunjuelito', 'los-martires',
];

const NEARBY_CITIES = [
  'chia', 'soacha', 'mosquera', 'madrid-cundinamarca', 'zipaquira',
];

// Special focus zones - scrape more pages for these
const FOCUS_ZONES = {
  'madrid-cundinamarca': { maxPages: 10, keywords: ['casablanca', 'hacienda casa'] },
};

const OPERATIONS = ['arriendo', 'venta'];

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-CO,es;q=0.9,en;q=0.5',
};

function capitalize(str) {
  return String(str).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ============================================================
// FINCARAIZ SCRAPER
// ============================================================
async function scrapeFincaRaiz() {
  console.log('\n========== FINCARAIZ ==========');
  const allListings = [];
  const seen = new Set();

  for (const op of OPERATIONS) {
    // Bogota zones
    for (const zone of ZONES) {
      // Scrape multiple pages per zone
      for (let page = 1; page <= 3; page++) {
        const pageSuffix = page === 1 ? '' : `/pagina${page}`;
        const url = `https://www.fincaraiz.com.co/${op}/apartamentos/bogota/${zone}${pageSuffix}`;
        console.log(`  Fetching: ${url}`);
        const results = await fetchFincaRaiz(url, op, zone, false);
        let added = 0;
        for (const item of results) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            allListings.push(item);
            added++;
          }
        }
        console.log(`    Got ${results.length}, added ${added} new (total: ${allListings.length})`);
        if (results.length < 10) break; // No more pages
        await delay(1500);
      }
    }

    // Nearby cities
    for (const city of NEARBY_CITIES) {
      const focusConfig = FOCUS_ZONES[city];
      const maxPages = focusConfig ? focusConfig.maxPages : 3;
      for (let page = 1; page <= maxPages; page++) {
        const pageSuffix = page === 1 ? '' : `/pagina${page}`;
        const url = `https://www.fincaraiz.com.co/${op}/apartamentos/${city}${pageSuffix}`;
        console.log(`  Fetching: ${url}`);
        const results = await fetchFincaRaiz(url, op, city, true);
        let added = 0;
        for (const item of results) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            allListings.push(item);
            added++;
          }
        }
        console.log(`    Got ${results.length}, added ${added} new (total: ${allListings.length})`);
        if (results.length < 10) break;
        await delay(1500);
      }
    }
  }

  console.log(`FincaRaiz total: ${allListings.length}`);
  return allListings;
}

async function fetchFincaRaiz(url, operation, location, isCity) {
  const listings = [];
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return [];

    const html = await res.text();
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return [];

    const nextData = JSON.parse(match[1]);
    const results = nextData?.props?.pageProps?.fetchResult?.searchFast?.data
      || nextData?.props?.pageProps?.searchFast?.data
      || [];

    if (!Array.isArray(results)) return [];

    for (const item of results) {
      try {
        const price = item.price?.amount || 0;
        const adminPrice = item.price?.admin_included || price;
        const area = item.m2 || item.area || 0;
        const title = item.title || item.address || '';
        const itemId = item.id || item.code;

        if (!price || !title || !itemId) continue;
        if (String(itemId).length < 9) continue;

        const locData = item.locations;
        let neighborhood = location;
        let city = isCity ? location : 'Bogota';
        let lat = 0, lon = 0;

        if (locData) {
          if (Array.isArray(locData)) {
            for (const loc of locData) {
              if (loc.type === 'NEIGHBOURHOOD' || loc.type === 'neighbourhood') neighborhood = loc.name || neighborhood;
              if (loc.type === 'CITY' || loc.type === 'city') city = loc.name || city;
            }
          } else if (typeof locData === 'object') {
            neighborhood = locData.neighbourhood?.name || locData.locality?.name || locData.zone?.name || neighborhood;
            city = locData.city?.name || city;
          }
        }

        lat = item.latitude || item.geo_point?.lat || item.coordinates?.lat || 0;
        lon = item.longitude || item.geo_point?.lon || item.coordinates?.lon || 0;

        const listingUrl = item.link
          ? `https://www.fincaraiz.com.co${item.link}`
          : `https://www.fincaraiz.com.co/${operation}/apartamentos/bogota`;

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

        if ((!bedrooms || !bathrooms) && item.description) {
          const desc = item.description;
          if (!bedrooms) { const m = desc.match(/(\d+)\s*(?:dormitorio|habitaci|alcoba)/i); if (m) bedrooms = parseInt(m[1]); }
          if (!bathrooms) { const m = desc.match(/(\d+)\s*baño/i); if (m) bathrooms = parseInt(m[1]); }
        }

        // Check if listing is in Hacienda Casablanca
        const searchText = `${title} ${neighborhood} ${item.description || ''} ${item.address || ''}`.toLowerCase();
        const isCasablanca = searchText.includes('casablanca') || searchText.includes('casa blanca');
        const tags = [];
        if (isCasablanca) tags.push('hacienda-casablanca');

        listings.push({
          id: `fr-${itemId}`,
          title,
          price,
          adminPrice,
          currency: 'COP',
          areaM2: typeof area === 'number' ? area : parseFloat(area) || 0,
          bedrooms,
          bathrooms,
          neighborhood: isCasablanca ? 'Hacienda Casablanca' : capitalize(neighborhood),
          city: capitalize(city),
          lat, lon,
          operationType: operation === 'arriendo' ? 'rent' : 'sale',
          createdDate: item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          source: 'FincaRaiz',
          url: listingUrl,
          image: item.img || '',
          tags,
        });
      } catch { /* skip */ }
    }
  } catch (err) {
    console.warn(`  Error: ${err.message}`);
  }
  return listings;
}

// ============================================================
// METROCUADRADO SCRAPER - Parses RSC chunks from self.__next_f
// ============================================================
async function scrapeMetrocuadrado() {
  console.log('\n========== METROCUADRADO ==========');
  const allListings = [];
  const seen = new Set();

  // Correct URL: /apartamentos/ (plural)
  const mcLocations = [
    { slug: 'bogota', city: 'Bogotá' },
    { slug: 'chia-cundinamarca', city: 'Chía' },
    { slug: 'soacha-cundinamarca', city: 'Soacha' },
    { slug: 'mosquera-cundinamarca', city: 'Mosquera' },
    { slug: 'zipaquira-cundinamarca', city: 'Zipaquirá' },
    { slug: 'madrid-cundinamarca', city: 'Madrid' },
  ];

  for (const op of OPERATIONS) {
    for (const loc of mcLocations) {
      // Paginate up to 10 pages (20 per page)
      for (let page = 0; page < 10; page++) {
        const from = page * 20;
        const url = `https://www.metrocuadrado.com/apartamentos/${op}/${loc.slug}/?search=form&from=${from}`;
        console.log(`  Fetching: ${url}`);

        const results = await fetchMetrocuadrado(url, op, loc.city);
        let added = 0;
        for (const item of results) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            allListings.push(item);
            added++;
          }
        }
        console.log(`    Got ${results.length}, added ${added} new (total: ${allListings.length})`);
        if (results.length < 5) break;
        await delay(2000);
      }
    }
  }

  console.log(`Metrocuadrado total: ${allListings.length}`);
  return allListings;
}

async function fetchMetrocuadrado(pageUrl, operation, cityName) {
  const listings = [];
  try {
    const res = await fetch(pageUrl, { headers: HEADERS });
    if (!res.ok) {
      console.warn(`    [${res.status}] ${pageUrl}`);
      return [];
    }

    const html = await res.text();

    // Strategy 1: Extract from RSC chunks (self.__next_f)
    // Collect all chunks and decode escaped content
    const chunkRegex = /self\.__next_f\.push\(\[\d+,"((?:[^"\\]|\\.)*)"\]\)/g;
    let fullPayload = '';
    let m;
    while ((m = chunkRegex.exec(html)) !== null) {
      // Unescape the string
      try {
        fullPayload += m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      } catch { fullPayload += m[1]; }
    }

    // Find property data blocks - look for patterns with mvalorarriendo or mvalorventa
    // These appear as serialized objects in the RSC stream
    // Extract href links to individual listings
    const linkRegex = /\/inmueble\/[^"\\]+\/(MC\d+)/g;
    const foundIds = new Set();
    let linkMatch;
    while ((linkMatch = linkRegex.exec(fullPayload)) !== null) {
      foundIds.add(linkMatch[1]);
    }
    // Also search in raw HTML
    const htmlLinkRegex = /href="(\/inmueble\/[^"]+\/(MC\d+))"/g;
    const linkMap = {};
    while ((linkMatch = htmlLinkRegex.exec(html)) !== null) {
      foundIds.add(linkMatch[2]);
      linkMap[linkMatch[2]] = linkMatch[1];
    }

    // For each property ID, try to extract its data from the RSC payload
    for (const propId of foundIds) {
      try {
        // Find the data chunk that contains this property's details
        // Look for price near this ID
        const idPos = fullPayload.indexOf(propId);
        if (idPos === -1) continue;

        // Search around the ID for property data (within ~2000 chars)
        const searchStart = Math.max(0, idPos - 1500);
        const searchEnd = Math.min(fullPayload.length, idPos + 1500);
        const context = fullPayload.substring(searchStart, searchEnd);

        // Extract fields using regex
        const price = extractNumber(context, /mvalorarriendo["\s:]+(\d+)/i)
          || extractNumber(context, /mvalorventa["\s:]+(\d+)/i)
          || extractNumber(context, /valorarriendo["\s:]+(\d+)/i)
          || extractNumber(context, /valorventa["\s:]+(\d+)/i)
          || 0;

        const area = extractNumber(context, /marea["\s:]+(\d+(?:\.\d+)?)/i)
          || extractNumber(context, /area["\s:]+(\d+(?:\.\d+)?)/i)
          || 0;

        const rooms = extractNumber(context, /mnrocuartos["\s:]+(\d+)/i)
          || extractNumber(context, /mnpieza["\s:]+(\d+)/i)
          || extractNumber(context, /habitaciones["\s:]+(\d+)/i)
          || 0;

        const baths = extractNumber(context, /mnrobanos["\s:]+(\d+)/i)
          || extractNumber(context, /mnbano["\s:]+(\d+)/i)
          || extractNumber(context, /banos["\s:]+(\d+)/i)
          || 0;

        // Extract neighborhood
        const neighMatch = context.match(/mbarrio["\s:]+["']?([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+?)["',\}]/i)
          || context.match(/mnbarrio["\s:]+["']?([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+?)["',\}]/i);
        const neighborhood = neighMatch ? neighMatch[1].trim() : cityName;

        // Extract image
        const imgMatch = context.match(/(https?:\/\/multimedia\.metrocuadrado\.com\/[^"'\s,]+)/i)
          || context.match(/(https?:\/\/[^"'\s,]*metrocuadrado[^"'\s,]*\.(?:jpg|jpeg|png|webp))/i);
        const image = imgMatch ? imgMatch[1] : '';

        // Extract coordinates
        const lat = extractFloat(context, /mlatitud["\s:]+(-?\d+\.?\d*)/i) || 0;
        const lon = extractFloat(context, /mlongitud["\s:]+(-?\d+\.?\d*)/i) || 0;

        // Build the detail URL
        const detailPath = linkMap[propId] || `/inmueble/${operation}-apartamento-${cityName.toLowerCase().replace(/[^a-z]/g, '-')}/${propId}`;
        const detailUrl = `https://www.metrocuadrado.com${detailPath}`;

        if (price > 0) {
          listings.push({
            id: `mc-${propId}`,
            title: `Apartamento en ${operation === 'arriendo' ? 'Arriendo' : 'Venta'} en ${capitalize(neighborhood)}, ${cityName}`,
            price,
            currency: 'COP',
            areaM2: area,
            bedrooms: rooms,
            bathrooms: baths,
            neighborhood: capitalize(neighborhood),
            city: capitalize(cityName),
            lat, lon,
            operationType: operation === 'arriendo' ? 'rent' : 'sale',
            createdDate: new Date().toISOString().split('T')[0],
            source: 'Metrocuadrado',
            url: detailUrl,
            image,
          });
        }
      } catch { /* skip individual property */ }
    }

    // Strategy 2: If RSC parsing got nothing, try href + enrich from detail pages
    if (listings.length === 0) {
      for (const [propId, path] of Object.entries(linkMap)) {
        const detailUrl = `https://www.metrocuadrado.com${path}`;
        listings.push({
          id: `mc-${propId}`,
          title: `Apartamento en ${cityName}`,
          price: 0,
          currency: 'COP',
          areaM2: 0,
          bedrooms: 0,
          bathrooms: 0,
          neighborhood: cityName,
          city: capitalize(cityName),
          lat: 0, lon: 0,
          operationType: operation === 'arriendo' ? 'rent' : 'sale',
          createdDate: new Date().toISOString().split('T')[0],
          source: 'Metrocuadrado',
          url: detailUrl,
          image: '',
          _needsEnrich: true,
        });
      }
    }

  } catch (err) {
    console.warn(`    Error: ${err.message}`);
  }

  return listings;
}

function extractNumber(text, regex) {
  const m = text.match(regex);
  return m ? parseInt(m[1]) : 0;
}

function extractFloat(text, regex) {
  const m = text.match(regex);
  return m ? parseFloat(m[1]) : 0;
}

// ============================================================
// ENRICHMENT: Fetch individual listing pages for incomplete data
// ============================================================
async function enrichListings(listings) {
  const needsEnrich = listings.filter(l => l._needsEnrich || (l.price === 0 && l.url));
  console.log(`\nEnriching ${needsEnrich.length} incomplete listings...`);

  let enriched = 0;
  for (const listing of needsEnrich.slice(0, 50)) { // Limit to 50 to avoid rate limiting
    try {
      const res = await fetch(listing.url, { headers: HEADERS });
      if (!res.ok) continue;

      const html = await res.text();

      // Try __NEXT_DATA__
      const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (match) {
        const data = JSON.parse(match[1]);
        const prop = data?.props?.pageProps?.realEstate || data?.props?.pageProps?.property || {};

        if (prop.salePrice || prop.rentPrice || prop.price) {
          listing.price = prop.rentPrice || prop.salePrice || prop.price || listing.price;
          listing.areaM2 = prop.area || prop.builtArea || listing.areaM2;
          listing.bedrooms = prop.rooms || prop.bedrooms || listing.bedrooms;
          listing.bathrooms = prop.bathRooms || prop.bathrooms || listing.bathrooms;
          listing.neighborhood = prop.commonNeighborhood || prop.neighborhood || listing.neighborhood;
          listing.lat = prop.coordinates?.lat || listing.lat;
          listing.lon = prop.coordinates?.lon || listing.lon;
          listing.image = prop.image?.image || prop.images?.[0] || listing.image;
          enriched++;
        }
      }

      // Try JSON-LD
      const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      if (ldMatch && listing.price === 0) {
        const ld = JSON.parse(ldMatch[1]);
        listing.price = ld.offers?.price || listing.price;
        listing.image = ld.image || listing.image;
        if (listing.price > 0) enriched++;
      }
    } catch { /* skip */ }

    delete listing._needsEnrich;
    await delay(1000);
  }

  // Remove _needsEnrich from remaining
  for (const l of listings) delete l._needsEnrich;

  console.log(`Enriched ${enriched} listings`);
  return listings;
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('🏠 PAOAPP Multi-Portal Scraper');
  console.log('================================');

  // Run scrapers
  const [fincaRaizListings, metrocuadradoListings] = await Promise.all([
    scrapeFincaRaiz(),
    scrapeMetrocuadrado(),
  ]);

  // Combine
  let allListings = [...fincaRaizListings, ...metrocuadradoListings];

  // Enrich incomplete listings
  allListings = await enrichListings(allListings);

  // Final filter: remove listings with no price
  allListings = allListings.filter(l => l.price > 0);

  // Remove duplicates by similar title+price+area
  const finalListings = [];
  const fingerprints = new Set();
  for (const l of allListings) {
    const fp = `${l.price}-${l.areaM2}-${l.neighborhood}`;
    if (!fingerprints.has(fp)) {
      fingerprints.add(fp);
      finalListings.push(l);
    }
  }

  console.log('\n================================');
  console.log(`📊 Resumen:`);
  console.log(`  FincaRaiz:     ${fincaRaizListings.length}`);
  console.log(`  Metrocuadrado: ${metrocuadradoListings.length}`);
  console.log(`  Total final:   ${finalListings.length}`);

  mkdirSync('public/data', { recursive: true });
  writeFileSync('public/data/listings.json', JSON.stringify(finalListings, null, 2));
  console.log('\n✅ Written to public/data/listings.json');
}

main().catch(console.error);
