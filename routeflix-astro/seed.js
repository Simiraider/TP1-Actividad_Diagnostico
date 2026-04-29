import { createClient } from '@supabase/supabase-js';
import { destinations } from './src/data/destinations.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Configurar dotenv para leer el .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Faltan las variables de entorno en el archivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
  console.log('Iniciando carga de destinos a Supabase...');
  
  // Limpiamos los IDs porque Supabase los genera automáticamente con bigserial
  const dataToInsert = destinations.map(dest => ({
    title: dest.title,
    category: dest.category,
    image: dest.image,
    link: dest.link,
    rating: dest.rating,
    reviews: dest.reviews,
    price: dest.price
  }));

  const { data, error } = await supabase
    .from('destinations')
    .insert(dataToInsert);

  if (error) {
    console.error('Error al insertar los datos:', error.message);
  } else {
    console.log(`¡Éxito! Se insertaron ${destinations.length} destinos en la base de datos.`);
  }
}

seed();
