// GET /api/destinations/[slug] — Detalle de 1 destino por slug.
// Soporta slugs curados ("paris-francia") y slugs GeoDB ("geo-Q90-paris").

import { getDestinationBySlug } from '../../../lib/destinations-service.js';

export const prerender = false;

export async function GET({ params }) {
  const { slug } = params;
  try {
    const item = await getDestinationBySlug(slug);
    if (!item) {
      return new Response(JSON.stringify({ error: 'Destino no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }
    return new Response(JSON.stringify(item), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error(`[API /destinations/${slug}] Error:`, err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
}
