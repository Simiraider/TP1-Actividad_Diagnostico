import { createClient } from '@supabase/supabase-js';

// Init LAZY: no lanza en import (el build/prerender no rompe si faltan env vars).
// El error recién aparece cuando alguien realmente usa el cliente.
let client = null;

function getClient() {
  if (client) return client;

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Faltan variables de entorno de Supabase. ' +
        'Copiá .env.example a .env y completá PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  client = createClient(supabaseUrl, supabaseAnonKey);
  return client;
}

/**
 * Cliente lazy. Usar: getSupabase().from(...)
 * Se mantiene un Proxy con el nombre `supabase` para no romper los
 * call sites existentes (auth.js, destinations-db.js, etc.).
 */
export function getSupabase() {
  return getClient();
}

export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      const c = getClient();
      const value = c[prop];
      return typeof value === 'function' ? value.bind(c) : value;
    },
  }
);
