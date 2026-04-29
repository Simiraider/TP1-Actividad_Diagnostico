import { supabase } from './supabase.js';

export async function getDestinations() {
  const { data, error } = await supabase
    .from('destinations')
    .select('*')
    .order('category', { ascending: true })
    .order('rating', { ascending: false });

  if (error) {
    console.error('Error fetching destinations:', error.message);
    return [];
  }
  return data;
}

export async function getDestinationById(id) {
  const { data, error } = await supabase
    .from('destinations')
    .select('*')
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
