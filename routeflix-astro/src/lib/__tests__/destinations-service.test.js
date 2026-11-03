import { describe, it, expect, vi, beforeEach } from 'vitest';

// La cadena de fallback del servicio debe funcionar SIN GeoDB ni Supabase:
// es exactamente lo que ocurre en e2e (env dummy) y en local sin .env.
vi.mock('../geodb.js', () => ({
  searchCities: vi.fn(async () => {
    throw new Error('GEODB_API_KEY no configurada');
  }),
  clearGeoDbCache: vi.fn(),
}));

vi.mock('../enrichment.js', () => ({
  // En estos tests todos los items ya traen imagen: pasan sin tocar red.
  enrichDestinations: vi.fn(async (items) => items),
  clearEnrichmentMemoryCache: vi.fn(),
}));

vi.mock('../destinations-db.js', () => ({
  getDestinations: vi.fn(async () => []),
  getDestinationsByCategory: vi.fn(async () => []),
  getDestinationsByTitles: vi.fn(async () => []),
  searchDestinations: vi.fn(async () => ({ items: [], hasMore: false, total: 0 })),
}));

const { getCurated, getGrid, getDestinationBySlug, clearServiceCaches, CATEGORIES } = await import(
  '../destinations-service.js'
);
const { fallbackDestinations } = await import('../../data/destinations-fallback.js');
const { slugify } = await import('../destination-utils.js');

beforeEach(() => {
  clearServiceCaches();
  vi.clearAllMocks();
});

describe('getCurated — 3 categorías desde el fallback local', () => {
  it('devuelve las 3 categorías del catálogo', async () => {
    const items = await getCurated();
    const cats = new Set(items.map((i) => i.category));
    expect(cats.size).toBe(3);
    for (const c of CATEGORIES) expect(cats).toContain(c);
  });

  it('respeta el límite por categoría (14, como siempre)', async () => {
    const items = await getCurated(14);
    for (const c of CATEGORIES) {
      expect(items.filter((i) => i.category === c).length).toBeLessThanOrEqual(14);
    }
  });

  it('ordena cada categoría por rating descendente', async () => {
    const items = await getCurated();
    for (const c of CATEGORIES) {
      const ratings = items.filter((i) => i.category === c).map((i) => i.rating);
      const sorted = [...ratings].sort((a, b) => b - a);
      expect(ratings).toEqual(sorted);
    }
  });

  it('cada item tiene slug, source e imagen (nunca imagen nula)', async () => {
    const items = await getCurated();
    expect(items.length).toBe(fallbackDestinations.length);
    for (const it of items) {
      expect(it.slug).toBe(slugify(it.title));
      expect(it.source).toBe('curated');
      expect(it.image).toBeTruthy();
    }
  });

  it('cachea el resultado (una sola query por TTL)', async () => {
    const a = await getCurated();
    const b = await getCurated();
    expect(a).toBe(b); // misma referencia → cache hit
  });
});

describe('getGrid — paginación sobre el fallback', () => {
  it('pagina sin solaparse ni repetir items', async () => {
    const p0 = await getGrid({ page: 0, limit: 5 });
    const p1 = await getGrid({ page: 1, limit: 5 });
    const p2 = await getGrid({ page: 2, limit: 5 });

    expect(p0.items).toHaveLength(5);
    expect(p1.items).toHaveLength(5);
    expect(p2.items).toHaveLength(5);
    expect(p0.hasMore).toBe(true);
    expect(p1.hasMore).toBe(true);
    expect(p2.hasMore).toBe(false); // 15 destinos en total

    const all = [...p0.items, ...p1.items, ...p2.items].map((i) => i.slug);
    expect(new Set(all).size).toBe(all.length); // sin duplicados
    expect(all).toHaveLength(fallbackDestinations.length);
  });

  it('devuelve hasMore=false cuando no hay más páginas', async () => {
    const p3 = await getGrid({ page: 3, limit: 5 });
    expect(p3.items).toHaveLength(0);
    expect(p3.hasMore).toBe(false);
    expect(p3.source).toBe('fallback');
  });

  it('marca source=y page correctamente', async () => {
    const p0 = await getGrid({ page: 0, limit: 10 });
    expect(p0.source).toBe('fallback');
    expect(p0.page).toBe(0);
  });

  it('filtra por búsqueda', async () => {
    const res = await getGrid({ q: 'parís', limit: 50 });
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items.every((i) => i.title.toLowerCase().includes('parís'))).toBe(true);
  });

  it('búsqueda sin resultados devuelve lista vacía (sin error)', async () => {
    const res = await getGrid({ q: 'zzzzz-no-existe', limit: 50 });
    expect(res.items).toHaveLength(0);
    expect(res.hasMore).toBe(false);
    expect(res.source).toBe('fallback');
  });

  it('normaliza los límites (limit inválido no explota)', async () => {
    const res = await getGrid({ page: 0, limit: 0 });
    expect(res.items.length).toBeGreaterThan(0);
    const huge = await getGrid({ page: 0, limit: 9999 });
    expect(huge.items.length).toBeLessThanOrEqual(50);
  });
});

describe('getDestinationBySlug', () => {
  it('resuelve un slug curado con el mismo slugify del front', async () => {
    const dest = await getDestinationBySlug('par-s-francia');
    expect(dest).not.toBeNull();
    expect(dest.title).toBe('París, Francia');
    expect(dest.slug).toBe('par-s-francia');
  });

  it('resuelve un slug simple', async () => {
    const dest = await getDestinationBySlug('roma-italia');
    expect(dest).not.toBeNull();
    expect(dest.title).toBe('Roma, Italia');
  });

  it('devuelve null para un slug inexistente (la página puede mostrar 404)', async () => {
    expect(await getDestinationBySlug('este-destino-no-existe')).toBeNull();
    expect(await getDestinationBySlug('')).toBeNull();
    expect(await getDestinationBySlug(undefined)).toBeNull();
  });

  it('un slug geo sin API key termina en null (no revienta)', async () => {
    expect(await getDestinationBySlug('geo-Q90-paris')).toBeNull();
  });
});
