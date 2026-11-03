// CRUD de destinos en Supabase.
// Nota: las queries son dirigidas (limit/in/range). El catálogo NUNCA
// descarga la tabla completa (~1.663 filas) en un request normal.

import { supabase } from './supabase.js';

const COLUMNS = 'id, title, category, image, link, rating, reviews, price';

/** Todas las filas (solo para seed/scripts; NO usar en requests normales). */
export async function getDestinations() {
  const { data, error } = await supabase
    .from('destinations')
    .select(COLUMNS)
    .order('category', { ascending: true })
    .order('rating', { ascending: false });

  if (error) {
    console.error('Error fetching destinations:', error.message);
    return [];
  }
  return data;
}

/** Top de una categoría, ordenado por rating. Query pequeña (limit). */
export async function getDestinationsByCategory(category, limit = 14) {
  const { data, error } = await supabase
    .from('destinations')
    .select(COLUMNS)
    .eq('category', category)
    .order('rating', { ascending: false })
    .limit(limit);

  if (error) {
    console.error(`Error fetching category ${category}:`, error.message);
    return [];
  }
  return data;
}

/**
 * Trae filas por sus títulos exactos (merge del grid con lo curado).
 * Usa `in` → una sola query con pocos valores, no la tabla entera.
 */
export async function getDestinationsByTitles(titles) {
  const list = Array.from(new Set((titles || []).filter(Boolean))).slice(0, 50);
  if (list.length === 0) return [];

  const { data, error } = await supabase
    .from('destinations')
    .select(COLUMNS)
    .in('title', list);

  if (error) {
    console.error('Error fetching destinations by titles:', error.message);
    return [];
  }
  return data;
}

/** Búsqueda paginada por título o categoría (usada como fallback del grid). */
export async function searchDestinations(query, { from = 0, limit = 24 } = {}) {
  const safe = String(query || '')
    .replace(/[(),]/g, ' ')
    .replace(/[%_\\]/g, (c) => `\\${c}`)
    .replace(/\s+/g, ' ')
    .trim();

  let req = supabase
    .from('destinations')
    .select(COLUMNS, { count: 'exact' });
  if (safe) req = req.or(`title.ilike.%${safe}%,category.ilike.%${safe}%`);

  const { data, error, count } = await req
    .order('rating', { ascending: false })
    .range(from, from + limit - 1);

  if (error) {
    console.error('Error searching destinations:', error.message);
    return { items: [], hasMore: false, total: 0 };
  }
  return {
    items: data || [],
    hasMore: from + (data || []).length < (count ?? 0),
    total: count ?? 0,
  };
}

export async function getDestinationById(id) {
  const { data, error } = await supabase
    .from('destinations')
    .select(COLUMNS)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching destination:', error.message);
    return null;
  }
  return data;
}

export async function createDestination(destination) {
  const { data, error } = await supabase
    .from('destinations')
    .insert([destination])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDestination(id, updates) {
  const { data, error } = await supabase
    .from('destinations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
