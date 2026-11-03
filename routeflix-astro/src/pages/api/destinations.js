// GET /api/destinations — Listado de destinos con paginación y búsqueda.
//
// Query params:
//   q       búsqueda por prefijo de nombre (GeoDB) o título/categoría (Supabase)
//   page    página base 0 (default 0)
//   limit   tamaño de página, máx 50 (default 24)
//   curated "1" → solo las 3 categorías curadas (filas del catálogo)
//
// Respuesta (siempre objeto, nunca array):
//   { items: [...], page, hasMore, source, total? }
//
// Fallback en cadena: GeoDB → Supabase → datos locales.
// Cache: Cache-Control público para que el CDN de Vercel cachee.

import { getCurated, getGrid } from '../../lib/destinations-service.js';

export const prerender = false;

const MAX_LIMIT = 50;

function buildResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Curado cambia poco → cache largo. Grid con q → más corto.
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}

export async function GET({ request }) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || undefined;
  const page = Math.max(0, Number(url.searchParams.get('page')) || 0);
  const limit = Math.min(
    Math.max(1, Number(url.searchParams.get('limit')) || 24),
    MAX_LIMIT,
  );
  const curatedOnly = url.searchParams.get('curated') === '1';

  try {
    if (curatedOnly) {
      const items = await getCurated(limit || 14);
      return buildResponse({ items, page: 0, hasMore: false, source: 'curated' });
    }

    const result = await getGrid({ q, page, limit });
    return buildResponse(result);
  } catch (err) {
    console.error('[API /destinations] Error:', err.message);
    // Nunca reventamos: devolvemos el fallback local para que el front pinte algo.
    const { fallbackDestinations } = await import('../../data/destinations-fallback.js');
    return buildResponse(
      {
        items: fallbackDestinations.slice(0, limit),
        page,
        hasMore: false,
        source: 'fallback',
        error: err.message,
      },
      200,
    );
  }
}
