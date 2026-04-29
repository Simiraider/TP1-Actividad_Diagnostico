import { getDestinations } from '../../lib/destinations-db.js';

export const prerender = false;

export async function GET() {
  try {
    const destinations = await getDestinations();
    return new Response(JSON.stringify(destinations), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[API /destinations] Error:', err.message);
    return new Response(JSON.stringify({ error: err.message, destinations: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
