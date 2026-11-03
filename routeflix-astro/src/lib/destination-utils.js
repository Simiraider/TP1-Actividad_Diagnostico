// Utilidades puras de destinos — sin I/O, aptas para tests unitarios.

/**
 * Slug del front (comportamiento histórico, NO cambiar sin migrar URLs):
 *   "París, Francia" -> "paris-francia"  (toLowerCase + no [a-z0-9])
 * Nota: "París" queda como "par-s"? No: í no es [a-z0-9] pero el replace
 * agrupa run de no-alfanum en UN solo guion: "parís" -> "par" + "-" + "s"?
 * No: /[^a-z0-9]+/ reemplaza el run completo "í" por "-", quedando "par-s".
 * Se replica exactamente igual en la RPC destinations_by_slug (SQL).
 */
export function slugify(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Clave normalizada para matchear títulos entre fuentes
 * (Supabase vs GeoDB vs Wikipedia): sin acentos, minúsculas, espacios simples.
 * "París, Francia" === "paris, francia"
 */
export function normKey(str) {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Hash determinístico (FNV-1a) para derivar datos plausibles sin population. */
export function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Rating derivado: 3.8 - 5.0, determinístico por ciudad. */
export function deriveRating(seed) {
  const h = hashString(String(seed));
  return Math.round((3.8 + (h % 13) / 10) * 10) / 10;
}

/** Precio por noche derivado de la población (o del hash si no hay población). */
export function derivePrice(seed, population) {
  const pop = Number(population) || 0;
  let tier;
  if (pop >= 1_000_000) tier = 4;
  else if (pop >= 500_000) tier = 3;
  else if (pop >= 200_000) tier = 2;
  else if (pop >= 50_000) tier = 1;
  else tier = pop > 0 ? 0 : hashString(String(seed)) % 5;
  const prices = ['$40/noche', '$55/noche', '$75/noche', '$100/noche', '$140/noche'];
  return prices[tier];
}

/** Categoría derivada para ciudades no curadas. */
export function deriveCategory(seed, population) {
  const pop = Number(population) || 0;
  if (pop >= 1_000_000) return 'Destinos Populares';
  if (pop >= 200_000) return 'Escapadas';
  if (pop > 0) return 'Aventuras';
  return hashString(String(seed)) % 2 === 0 ? 'Aventuras' : 'Escapadas';
}

/**
 * Slug de ciudades de GeoDB: "geo-{id}-{slug-del-nombre}".
 * El id (wikiDataId "Q90" o numérico) va primero y sin guiones propios,
 * así el detail endpoint puede parsearlo con /^geo-([^-]+)/.
 */
export function buildGeoSlug(id, name) {
  const nameSlug = slugify(name || '');
  return nameSlug ? `geo-${id}-${nameSlug}` : `geo-${id}`;
}

/** Parsea un slug devuelto por buildGeoSlug. Devuelve el id de GeoDB o null. */
export function parseGeoSlug(slug) {
  const m = /^geo-([^-]+)(?:-|$)/.exec(String(slug || ''));
  return m ? m[1] : null;
}

/** Sanitiza una query para usarla en ilike de PostgREST (or-syntax). */
export function sanitizeIlike(q) {
  return String(q || '')
    .replace(/[(),]/g, ' ')
    .replace(/[%_\\]/g, (c) => `\\${c}`)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Merge de ciudades de GeoDB con filas curadas de Supabase.
 * - Coincidencia por título normalizado.
 * - La fila curada "gana": aporta id, image, rating, price, category, link.
 * - Las ciudades sin curar conservan id "geo-..." y los datos derivados.
 * - Deduplica por título normalizado (conserva el primero).
 */
export function mergeWithCurated(geodbItems, curatedRows) {
  const curatedByKey = new Map();
  for (const row of curatedRows || []) {
    curatedByKey.set(normKey(row.title), row);
  }

  const out = [];
  const seen = new Set();
  for (const item of geodbItems || []) {
    const key = normKey(item.title);
    if (seen.has(key)) continue;
    seen.add(key);

    const curated = curatedByKey.get(key);
    if (curated) {
      out.push({
        ...item,
        id: curated.id,
        slug: slugify(curated.title),
        title: curated.title,
        category: curated.category,
        image: curated.image,
        link: curated.link,
        rating: curated.rating,
        reviews: curated.reviews,
        price: curated.price,
        source: 'curated',
      });
    } else {
      out.push({ ...item, source: 'geodb' });
    }
  }
  return out;
}

/** Deduplica por título normalizado conservando el primero. */
export function dedupeByTitle(items) {
  const seen = new Set();
  const out = [];
  for (const item of items || []) {
    const key = normKey(item.title);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/**
 * Placeholder sin red: SVG data-URI con inicial y gradiente determinístico.
 */
export function placeholderImage(title) {
  const t = String(title || '?').trim();
  const initial = (t[0] || '?').toUpperCase();
  const hue = hashString(t) % 360;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="320">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${hue},55%,32%)"/>` +
    `<stop offset="1" stop-color="hsl(${(hue + 60) % 360},55%,18%)"/>` +
    `</linearGradient></defs>` +
    `<rect width="500" height="320" fill="url(#g)"/>` +
    `<text x="50%" y="54%" font-family="Inter,Arial,sans-serif" font-size="140" ` +
    `font-weight="700" fill="rgba(255,255,255,0.85)" text-anchor="middle" ` +
    `dominant-baseline="middle">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
