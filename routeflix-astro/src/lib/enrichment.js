// Enriquecimiento de destinos: imágenes desde Wikipedia (MediaWiki API).
//
// Orden de resolución de imagen para una ciudad:
//   1. Fila curada de Supabase (ya tiene image)      → no entra acá.
//   2. Cache persistente destination_enrichment      → 0 llamadas externas.
//   3. Wikipedia action=query&prop=pageimages EN LOTE → 1 llamada por página.
//   4. Placeholder SVG data-URI                      → 0 llamadas, nunca falla.
//
// Se usa la API MediaWiki (no la REST summary) porque acepta HASTA 50
// títulos por request → 24 ciudades de una página = 1 sola llamada.
// La cache en Supabase es clave porque los lambdas de Vercel son efímeros.

import { normKey, placeholderImage } from './destination-utils.js';
import { supabase } from './supabase.js';

const WIKI_API = 'https://es.wikipedia.org/w/api.php';
const FETCH_TIMEOUT_MS = 5000;
const BATCH_SIZE = 50;
const CONCURRENCY = 3;

/** Cache en memoria por proceso (capa rápida). key → url */
const memCache = new Map();
const MEM_MAX = 1000;

/**
 * Pide miniaturas de Wikipedia para un lote de títulos en UN solo request.
 * @param {string[]} titles títulos de página de Wikipedia
 * @returns {Promise<Map<string, string>>} título original → url de miniatura
 */
async function fetchWikiThumbnails(titles) {
  const found = new Map();
  if (titles.length === 0) return found;

  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: '500',
    redirects: '1',
    titles: titles.join('|'),
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${WIKI_API}?${params}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return found;

    const data = await res.json();
    const pages = data?.query?.pages || {};
    // normalizado/redirects mapean "paris" → "París" (la key real de pages).
    const aliases = new Map();
    for (const n of [...(data?.query?.normalized || []), ...(data?.query?.redirects || [])]) {
      aliases.set(normKey(n.from), n.to);
    }

    for (const page of Object.values(pages)) {
      const thumb = page.thumbnail?.source || page.originalimage?.source;
      if (!thumb || page.missing !== undefined) continue;
      // Mapeamos de vuelta al título original que pedimos.
      const original =
        [...aliases.entries()].find(([, to]) => to === page.title)?.[0] || normKey(page.title);
      found.set(original, thumb);
      found.set(normKey(page.title), thumb);
    }
  } catch {
    // Timeout / red caída → seguimos sin imágenes (va al placeholder).
  } finally {
    clearTimeout(timer);
  }
  return found;
}

/** Lee de la tabla destination_enrichment un lote de keys. Devuelve Map key→image. */
async function readEnrichmentCache(keys) {
  const found = new Map();
  if (keys.length === 0) return found;

  for (let i = 0; i < keys.length; i += 100) {
    const chunk = keys.slice(i, i + 100);
    try {
      const { data, error } = await supabase
        .from('destination_enrichment')
        .select('key, image')
        .in('key', chunk);
      if (error) {
        // Tabla aún no creada (migración no corrida) → seguir sin cache persistente.
        console.warn('[enrichment] cache no disponible:', error.message);
        break;
      }
      for (const row of data || []) found.set(row.key, row.image);
    } catch (err) {
      console.warn('[enrichment] error leyendo cache:', err.message);
      break;
    }
  }
  return found;
}

/** Guarda (upsert) un lote de resultados en destination_enrichment. Best-effort. */
async function writeEnrichmentCache(entries) {
  if (entries.length === 0) return;
  try {
    const { error } = await supabase
      .from('destination_enrichment')
      .upsert(entries, { onConflict: 'key', ignoreDuplicates: true });
    if (error) console.warn('[enrichment] no se pudo escribir cache:', error.message);
  } catch (err) {
    console.warn('[enrichment] error escribiendo cache:', err.message);
  }
}

/**
 * Completa `image` de los destinos que no la tengan.
 * Modifica los items in-place y los devuelve (mismo array).
 *
 * @param {Array<{title: string, image?: string|null}>} items
 * @returns {Promise<Array>} el mismo array con image siempre presente.
 */
export async function enrichDestinations(items) {
  const missing = items.filter((it) => !it?.image);
  if (missing.length === 0) return items;

  // 1) Memoria del proceso.
  const pending = [];
  for (const item of missing) {
    const key = normKey(item.title);
    const hit = memCache.get(key);
    if (hit) item.image = hit;
    else pending.push({ item, key });
  }
  if (pending.length === 0) return items;

  // 2) Cache persistente (Supabase).
  const persisted = await readEnrichmentCache(pending.map((p) => p.key));
  const stillPending = [];
  for (const entry of pending) {
    const hit = persisted.get(entry.key);
    if (hit) {
      entry.item.image = hit;
      memCache.set(entry.key, hit);
    } else {
      stillPending.push(entry);
    }
  }
  if (stillPending.length === 0) return items;

  // 3) Wikipedia EN LOTE: 1 request por cada 50 títulos, poca concurrencia.
  //    Título candidato: "Ciudad, País" y como respaldo "Ciudad".
  const writes = [];
  for (let i = 0; i < stillPending.length; i += BATCH_SIZE) {
    const batch = stillPending.slice(i, i + BATCH_SIZE);

    const candidates = [];
    const candidateOf = new Map(); // key → título candidato a probar
    for (const entry of batch) {
      const bare = entry.item.title.split(',')[0].trim();
      candidateOf.set(entry.key, bare);
      candidates.push(entry.item.title, bare);
    }

    const unique = Array.from(new Set(candidates));
    const thumbs = new Map();
    // Pocos batches en paralelo (CONCURRENCY) para no saturar Wikipedia.
    for (let j = 0; j < unique.length; j += CONCURRENCY * 25) {
      const part = unique.slice(j, j + CONCURRENCY * 25);
      const res = await fetchWikiThumbnails(part);
      for (const [k, v] of res) thumbs.set(k, v);
    }

    for (const entry of batch) {
      const url =
        thumbs.get(entry.key) ||
        thumbs.get(normKey(entry.item.title)) ||
        thumbs.get(candidateOf.get(entry.key)) ||
        null;
      if (url) {
        entry.item.image = url;
        memCache.set(entry.key, url);
        writes.push({ key: entry.key, image: url });
      }
    }
  }

  // 4) Persistir lo nuevo (best-effort) + placeholder para lo que quedó sin imagen.
  if (writes.length > 0) await writeEnrichmentCache(writes);
  for (const item of missing) {
    if (!item.image) item.image = placeholderImage(item.title);
  }

  // Evicción simple de la memoria.
  if (memCache.size > MEM_MAX) {
    for (const k of memCache.keys()) {
      if (memCache.size <= MEM_MAX - Math.floor(MEM_MAX / 2)) break;
      memCache.delete(k);
    }
  }

  return items;
}

/** Limpia la cache en memoria (tests). */
export function clearEnrichmentMemoryCache() {
  memCache.clear();
}
