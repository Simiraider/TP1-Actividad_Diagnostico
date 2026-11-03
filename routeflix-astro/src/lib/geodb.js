// Cliente server-side de GeoDB Cities (RapidAPI).
// - La API key NUNCA llega al browser: esto solo se importa desde /api/*.
// - Tier gratis: ~1 req/s y ~1.000 req/día → throttle + cache agresivo.
//
// Docs: https://wirefreethought.github.io/geodb-rest-api-docs
// Host: https://wft-geo-db.p.rapidapi.com/v1/geo/cities

import { buildGeoSlug, deriveCategory, derivePrice, deriveRating } from './destination-utils.js';

const GEO_BASE = 'https://wft-geo-db.p.rapidapi.com/v1/geo/cities';
const HOST = 'wft-geo-db.p.rapidapi.com';
const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 50; // el tier gratis limita el page size
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min
const MIN_INTERVAL_MS = 1100; // ~1 req/s del tier gratis

/** Cache en memoria por proceso (sobrevive entre requests de un lambda warm). */
const cache = new Map();

/** Serializa las llamadas para respetar el rate limit de 1 req/s. */
let lastCallAt = 0;
let queue = Promise.resolve();

function throttle() {
  const wait = Math.max(0, lastCallAt + MIN_INTERVAL_MS - Date.now());
  lastCallAt = Date.now() + wait;
  return new Promise((resolve) => setTimeout(resolve, wait));
}

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet(key, value) {
  // Evicción simple: si crece demasiado, limpiar lo vencido y si sigue, todo.
  if (cache.size > 500) {
    const now = Date.now();
    for (const [k, v] of cache) if (v.expires < now) cache.delete(k);
    if (cache.size > 500) cache.clear();
  }
  cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
}

/**
 * Traduce un item de GeoDB al shape de destino de RouteFlix.
 * GeoDB no trae imagen/rating/price → se derivan y luego se enriquecen.
 */
function mapCity(city) {
  const title = `${city.name}, ${city.country}`;
  const id = city.wikiDataId || String(city.id);
  return {
    id: `geo-${id}`,
    slug: buildGeoSlug(id, city.name),
    title,
    category: deriveCategory(title, city.population),
    image: null, // lo resuelve enrichment (Wikipedia) o placeholder
    link: `https://es.wikipedia.org/wiki/${encodeURIComponent(city.name)}`,
    rating: deriveRating(title),
    reviews: 0,
    price: derivePrice(title, city.population),
    population: city.population ?? null,
    countryCode: city.countryCode ?? null,
    wikiDataId: city.wikiDataId ?? null,
  };
}

/**
 * Busca ciudades en GeoDB.
 *
 * @param {object} opts
 * @param {string} [opts.q]        Prefijo de nombre (namePrefix). Sin q = browse.
 * @param {number} [opts.page]     Página base 0.
 * @param {number} [opts.limit]    Tamaño de página (máx 50).
 * @param {number} [opts.minPopulation] Filtra por población mínima.
 * @returns {Promise<{items: Array, hasMore: boolean, total: number|null}>}
 * @throws {Error} si no hay GEODB_API_KEY o si falla la API (el caller aplica fallback).
 */
export async function searchCities({ q, page = 0, limit = DEFAULT_LIMIT, minPopulation } = {}) {
  const apiKey = import.meta.env.GEODB_API_KEY;
  if (!apiKey) {
    throw new Error('GEODB_API_KEY no configurada');
  }

  const pageSize = Math.min(Math.max(1, Number(limit) || DEFAULT_LIMIT), MAX_LIMIT);
  const pageNum = Math.max(0, Number(page) || 0);

  const params = new URLSearchParams({
    limit: String(pageSize),
    offset: String(pageNum * pageSize),
    languageCode: 'es',
    hateoasMode: 'false',
    asciiMode: 'false',
    sort: q ? 'name' : '-population',
  });
  if (q && String(q).trim()) params.set('namePrefix', String(q).trim());
  if (minPopulation) params.set('minPopulation', String(minPopulation));

  const cacheKey = params.toString();
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const url = `${GEO_BASE}?${params}`;
  const result = await queue.then(async () => {
    await throttle();
    const res = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': HOST,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`GeoDB ${res.status}: ${body.slice(0, 200)}`);
    }
    return res.json();
  });

  const items = (result.data || []).map(mapCity);
  const total = result.metadata?.totalCount ?? null;
  const hasMore =
    total !== null
      ? pageNum * pageSize + items.length < total
      : items.length === pageSize;

  const payload = { items, hasMore, total };
  cacheSet(cacheKey, payload);
  return payload;
}

/** Limpia la cache (para tests). */
export function clearGeoDbCache() {
  cache.clear();
}

/** Expose para tests del mapeo. */
export { mapCity as __mapCityForTests };
