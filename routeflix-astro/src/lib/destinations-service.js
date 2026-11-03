// Servicio de destinos: fuentes combinadas con cadena de fallback.
//
//   Curado (3 categorías):  Supabase `destinations`  → fallback local
//   Grid "todos los destinos": GeoDB → Supabase → fallback local
//   Detail por slug:        Supabase RPC → GeoDB (slug geo-*) → fallback local
//
// Todas las queries a Supabase son dirigidas (limit / in / range):
// NUNCA se descarga la tabla completa (~1.663 filas) en un request normal.
// Todos los resultados pasan por enrichment (imágenes) antes de salir.

import {
  getDestinations,
  getDestinationsByCategory,
  getDestinationsByTitles,
  searchDestinations,
} from './destinations-db.js';
import { fallbackDestinations } from '../data/destinations-fallback.js';
import { enrichDestinations } from './enrichment.js';
import { searchCities } from './geodb.js';
import { supabase } from './supabase.js';
import { mergeWithCurated, parseGeoSlug, slugify } from './destination-utils.js';

export const CATEGORIES = ['Destinos Populares', 'Aventuras', 'Escapadas'];
const FALLBACK_PAGE_SIZE = 10;

/**
 * @typedef {object} Destination
 * @property {number|string} id
 * @property {string} title
 * @property {string} category
 * @property {string} image
 * @property {string} [link]
 * @property {number} rating
 * @property {number} [reviews]
 * @property {string} price
 * @property {string} [slug]
 * @property {string} [source]
 */

/** Cache corta en memoria para la vista curada (la DB cambia poco). */
let curatedCache = { items: null, at: 0 };
const CURATED_TTL_MS = 60 * 1000;

function toCuratedShape(d) {
  return { ...d, slug: slugify(d.title), source: 'curated' };
}

function toFallbackShape(list) {
  return list.map((d) => ({ ...d, slug: d.slug || slugify(d.title), source: 'curated' }));
}

/**
 * Top de destinos por categoría (las 3 filas del catálogo).
 * 3 queries pequeñas en paralelo (limit = perCategory) en lugar de
 * descargar las ~1.663 filas.
 * @param {number} perCategory cuántos por categoría (default 14, como siempre).
 */
export async function getCurated(perCategory = 14) {
  const now = Date.now();
  if (curatedCache.items && now - curatedCache.at < CURATED_TTL_MS) {
    return curatedCache.items;
  }

  let items = null;
  try {
    const rows = await Promise.all(
      CATEGORIES.map((cat) => getDestinationsByCategory(cat, perCategory)),
    );
    if (rows.every((r) => Array.isArray(r) && r.length > 0)) {
      items = rows.flat().map(toCuratedShape);
    }
  } catch (err) {
    console.warn('[destinations] curado desde fallback:', err.message);
  }

  if (!items || items.length === 0) {
    items = groupFallback(perCategory);
  }

  curatedCache = { items, at: now };
  return items;
}

function groupFallback(perCategory) {
  const grouped = CATEGORIES.flatMap((cat) =>
    fallbackDestinations
      .filter((d) => d.category === cat)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, perCategory),
  );
  return toFallbackShape(grouped);
}

/**
 * Grid paginado de "todos los destinos".
 * Cadena: GeoDB (si hay key) → Supabase → fallback local.
 *
 * @param {object} opts { q?, page?, limit? }
 * @returns {Promise<{items: Array, page: number, hasMore: boolean, source: string}>}
 */
export async function getGrid({ q, page = 0, limit = FALLBACK_PAGE_SIZE } = {}) {
  const pageNum = Math.max(0, Number(page) || 0);
  const pageSize = Math.min(Math.max(1, Number(limit) || FALLBACK_PAGE_SIZE), 50);
  const query = q && String(q).trim() ? String(q).trim() : null;

  // --- Fuente 1: GeoDB ---
  try {
    const geo = await searchCities({ q: query || undefined, page: pageNum, limit: pageSize });
    // Merge dirigido: solo los títulos de ESTA página, no la tabla entera.
    const curatedRows = await getDestinationsByTitles(geo.items.map((i) => i.title)).catch(() => []);
    let items = mergeWithCurated(geo.items, curatedRows || []);
    items = await enrichDestinations(items);
    return {
      items,
      page: pageNum,
      hasMore: geo.hasMore,
      source: 'geodb',
    };
  } catch (err) {
    if (err.message !== 'GEODB_API_KEY no configurada') {
      console.warn('[destinations] GeoDB falló, pruebo Supabase:', err.message);
    }
  }

  // --- Fuente 2: Supabase con paginación (búsqueda por título o categoría) ---
  try {
    const from = pageNum * pageSize;
    const { items: rows, hasMore } = await searchDestinations(query, {
      from,
      limit: pageSize,
    });
    if (rows.length > 0) {
      const items = rows.map(toCuratedShape);
      return {
        items: await enrichDestinations(items),
        page: pageNum,
        hasMore,
        source: 'supabase',
      };
    }
  } catch (err) {
    console.warn('[destinations] error Supabase grid:', err.message);
  }

  // --- Fuente 3: fallback local (siempre responde algo) ---
  return fallbackGrid(query, pageNum, pageSize);
}

function fallbackGrid(query, pageNum, pageSize) {
  let list = toFallbackShape(fallbackDestinations);
  if (query) {
    const q = query.toLowerCase();
    list = list.filter(
      (d) => d.title.toLowerCase().includes(q) || d.category.toLowerCase().includes(q),
    );
  }
  const from = pageNum * pageSize;
  const slice = list.slice(from, from + pageSize);
  return {
    items: slice,
    page: pageNum,
    hasMore: from + slice.length < list.length,
    source: 'fallback',
  };
}

/**
 * Detail por slug. Soporta:
 *  - slugs curados ("paris-francia")  → RPC destinations_by_slug → scan fallback
 *  - slugs GeoDB  ("geo-Q90-paris")  → GeoDB por id
 *
 * @param {string} slug
 * @returns {Promise<Destination|null>}
 */
export async function getDestinationBySlug(slug) {
  if (!slug) return null;
  const geoId = parseGeoSlug(slug);

  // --- GeoDB por id ---
  if (geoId) {
    const item = await fetchGeoDetail(geoId, slug);
    if (item) return item;
  }

  // --- Supabase por slug (RPC; si no existe la función, fallback local) ---
  try {
    const { data, error } = await supabase.rpc('destinations_by_slug', { p_slug: slug });
    if (!error && Array.isArray(data) && data.length > 0) {
      const row = data[0];
      return (await enrichDestinations([toCuratedShape(row)]))[0];
    }
    if (error) console.warn('[destinations] RPC slug no disponible:', error.message);
  } catch (err) {
    console.warn('[destinations] error detail Supabase:', err.message);
  }

  // --- Fallback local ---
  const local = fallbackDestinations.find((d) => slugify(d.title) === slug);
  if (local) {
    return (await enrichDestinations([toFallbackShape([local])[0]]))[0];
  }
  return null;
}

/** Trae una ciudad de GeoDB por id (wikiDataId o numérico) y la enriquece. */
async function fetchGeoDetail(geoId, slug) {
  try {
    const apiKey = import.meta.env.GEODB_API_KEY;
    if (!apiKey) return null;

    const res = await fetch(
      `https://wft-geo-db.p.rapidapi.com/v1/geo/cities/${encodeURIComponent(geoId)}?languageCode=es&hateoasMode=false`,
      {
        headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com' },
      },
    );
    if (!res.ok) return null;

    const body = await res.json();
    const city = body.data;
    if (!city) return null;

    const title = `${city.name}, ${city.country}`;
    // ¿Esta ciudad está curada en Supabase? Query dirigida por título.
    const curated = (await getDestinationsByTitles([title]).catch(() => []))[0];

    const item = curated
      ? toCuratedShape(curated)
      : {
          id: `geo-${city.wikiDataId || city.id}`,
          slug,
          title,
          category: fallbackCategory(city.population),
          image: null,
          link: `https://es.wikipedia.org/wiki/${encodeURIComponent(city.name)}`,
          rating: 4.5,
          reviews: 0,
          price: fallbackPrice(city.population),
        };
    return (await enrichDestinations([item]))[0];
  } catch (err) {
    console.warn('[destinations] detail GeoDB falló:', err.message);
    return null;
  }
}

function fallbackCategory(pop = 0) {
  if (pop >= 1_000_000) return 'Destinos Populares';
  if (pop >= 200_000) return 'Escapadas';
  return 'Aventuras';
}

function fallbackPrice(pop = 0) {
  if (pop >= 1_000_000) return '$140/noche';
  if (pop >= 500_000) return '$100/noche';
  if (pop >= 200_000) return '$75/noche';
  return '$55/noche';
}

/** Reset de caches (tests). */
export function clearServiceCaches() {
  curatedCache = { items: null, at: 0 };
}

// Re-export para tests / otros módulos.
export { getDestinations };
