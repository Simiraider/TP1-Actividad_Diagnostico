import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const raw = JSON.parse(fs.readFileSync(resolve(__dirname, './query.json'), 'utf-8'));
const bindings = raw.results.bindings;

const CURATED_CITIES = {
  'Chongqing': { category: 'Aventuras', rating: 4.5, reviews: 1800, price: '$40/noche' },
  'Delhi': { category: 'Destinos Populares', rating: 4.6, reviews: 8500, price: '$35/noche' },
  'Shanghái': { category: 'Destinos Populares', rating: 4.8, reviews: 9200, price: '$80/noche' },
  'Pekín': { category: 'Destinos Populares', rating: 4.9, reviews: 12000, price: '$75/noche' },
  'Daca': { category: 'Aventuras', rating: 4.3, reviews: 1200, price: '$25/noche' },
  'Bombay': { category: 'Destinos Populares', rating: 4.7, reviews: 7800, price: '$50/noche' },
  'Lagos': { category: 'Aventuras', rating: 4.4, reviews: 2100, price: '$65/noche' },
  'Kinsasa': { category: 'Aventuras', rating: 4.2, reviews: 800, price: '$55/noche' },
  'Ciudad Ho Chi Minh': { category: 'Destinos Populares', rating: 4.7, reviews: 6500, price: '$30/noche' },
  'São Paulo': { category: 'Destinos Populares', rating: 4.6, reviews: 7200, price: '$70/noche' },
  'Yakarta': { category: 'Aventuras', rating: 4.5, reviews: 3400, price: '$35/noche' },
  'Moscú': { category: 'Destinos Populares', rating: 4.7, reviews: 11000, price: '€90/noche' },
  'Kuala Lumpur': { category: 'Destinos Populares', rating: 4.8, reviews: 9500, price: '$55/noche' },
  'Área metropolitana de Nueva York': null,
  'Teherán': { category: 'Aventuras', rating: 4.5, reviews: 2800, price: '$40/noche' },
  'Kunming': { category: 'Aventuras', rating: 4.4, reviews: 1500, price: '$35/noche' },
  'Hangzhou': { category: 'Escapadas', rating: 4.7, reviews: 4200, price: '$60/noche' },
  'Nankín': { category: 'Escapadas', rating: 4.6, reviews: 3800, price: '$55/noche' },
  'Riad': { category: 'Destinos Populares', rating: 4.5, reviews: 3200, price: '$120/noche' },
  'Bagdad': { category: 'Aventuras', rating: 4.1, reviews: 900, price: '$50/noche' },
  'Adís Abeba': { category: 'Aventuras', rating: 4.4, reviews: 1600, price: '$45/noche' },
  'Bangalore': { category: 'Aventuras', rating: 4.5, reviews: 2200, price: '$30/noche' },
  'Haidrābād': { category: 'Aventuras', rating: 4.5, reviews: 1900, price: '$30/noche' },
  'Chennai': { category: 'Aventuras', rating: 4.5, reviews: 2500, price: '$30/noche' },
  'Calcuta': { category: 'Destinos Populares', rating: 4.6, reviews: 4500, price: '$28/noche' },
  'Ahmedabad': { category: 'Aventuras', rating: 4.4, reviews: 1800, price: '$25/noche' },
  'Surat': { category: 'Aventuras', rating: 4.3, reviews: 1200, price: '$25/noche' },
  'Rangún': { category: 'Aventuras', rating: 4.5, reviews: 2400, price: '$30/noche' },
  'Dubái': null,
  'Ankara': { category: 'Escapadas', rating: 4.5, reviews: 3800, price: '€55/noche' },
  'San Petersburgo': { category: 'Escapadas', rating: 4.8, reviews: 8900, price: '€80/noche' },
  'Abiyán': { category: 'Aventuras', rating: 4.3, reviews: 900, price: '$55/noche' },
  'Alejandría': { category: 'Aventuras', rating: 4.6, reviews: 3200, price: '$40/noche' },
  'Melbourne': { category: 'Escapadas', rating: 4.8, reviews: 7800, price: '$140/noche' },
  'Sídney': null,
  'Kabul': { category: 'Aventuras', rating: 4.0, reviews: 400, price: '$30/noche' },
  'Jartum': { category: 'Aventuras', rating: 4.1, reviews: 500, price: '$35/noche' },
  'Johannesburgo': { category: 'Aventuras', rating: 4.5, reviews: 3600, price: '$80/noche' },
  'Amán': { category: 'Aventuras', rating: 4.6, reviews: 3100, price: '$65/noche' },
  'Yeda': { category: 'Destinos Populares', rating: 4.5, reviews: 2800, price: '$100/noche' },
  'Dar es-Salaam': { category: 'Aventuras', rating: 4.4, reviews: 1800, price: '$55/noche' },
  'Urumqi': { category: 'Aventuras', rating: 4.3, reviews: 900, price: '$35/noche' },
  'Los Ángeles': { category: 'Escapadas', rating: 4.7, reviews: 18000, price: '$200/noche' },
  'Brisbane': { category: 'Escapadas', rating: 4.7, reviews: 4500, price: '$130/noche' },
  'Damasco': { category: 'Aventuras', rating: 4.4, reviews: 1200, price: '$35/noche' },
  'Taskent': { category: 'Aventuras', rating: 4.5, reviews: 1800, price: '$30/noche' },
  'Kiev': { category: 'Escapadas', rating: 4.6, reviews: 5200, price: '€60/noche' },
  'Toronto': { category: 'Escapadas', rating: 4.7, reviews: 9500, price: '$170/noche' },
  'Busan': { category: 'Destinos Populares', rating: 4.7, reviews: 5100, price: '₩120000/noche' },
  'Duala': { category: 'Aventuras', rating: 4.2, reviews: 700, price: '$50/noche' },
  'Yokohama': { category: 'Escapadas', rating: 4.7, reviews: 4800, price: '¥18000/noche' },
  'Incheon': { category: 'Escapadas', rating: 4.5, reviews: 2800, price: '₩100000/noche' },
  'Ciudad del Cabo': null,
  'Taichung': { category: 'Escapadas', rating: 4.6, reviews: 2500, price: '$60/noche' },
  'Surabaya': { category: 'Aventuras', rating: 4.4, reviews: 1600, price: '$30/noche' },
  'Chicago': { category: 'Escapadas', rating: 4.7, reviews: 12000, price: '$180/noche' },
  'Bandung': { category: 'Aventuras', rating: 4.5, reviews: 2000, price: '$28/noche' },
  'Haikou': { category: 'Aventuras', rating: 4.4, reviews: 1200, price: '$40/noche' },
  'Pioneyang': null,
  'Nuevo Taipéi': { category: 'Escapadas', rating: 4.6, reviews: 3200, price: '$65/noche' },
  'Kaohsiung': { category: 'Escapadas', rating: 4.6, reviews: 2800, price: '$55/noche' },
  'Kumasi': { category: 'Aventuras', rating: 4.3, reviews: 800, price: '$40/noche' },
  'Xiamen': { category: 'Escapadas', rating: 4.7, reviews: 2800, price: '$50/noche' },
  'Gran Buenos Aires': null,
  'Santa Cruz de la Sierra': { category: 'Aventuras', rating: 4.4, reviews: 1500, price: '$45/noche' },
  'Casablanca': { category: 'Destinos Populares', rating: 4.6, reviews: 5200, price: '€50/noche' },
  'Faisalabad': { category: 'Aventuras', rating: 4.2, reviews: 800, price: '$20/noche' },
  'Chittagong': { category: 'Aventuras', rating: 4.3, reviews: 900, price: '$22/noche' },
  'Omdurmán': { category: 'Aventuras', rating: 4.1, reviews: 400, price: '$30/noche' },
  'Bamako': { category: 'Aventuras', rating: 4.2, reviews: 600, price: '$40/noche' },
  'Guilin': { category: 'Aventuras', rating: 4.8, reviews: 5500, price: '$45/noche' },
  'Mbuji-Mayi': { category: 'Aventuras', rating: 4.0, reviews: 300, price: '$35/noche' },
  'Kano': { category: 'Aventuras', rating: 4.2, reviews: 700, price: '$40/noche' },
  'Bursa': { category: 'Escapadas', rating: 4.6, reviews: 3200, price: '€45/noche' },
  'Ciudad de Kuwait': { category: 'Destinos Populares', rating: 4.5, reviews: 2200, price: '$130/noche' },
  'Pune': { category: 'Aventuras', rating: 4.5, reviews: 2000, price: '$30/noche' },
  'Lucknow': { category: 'Aventuras', rating: 4.5, reviews: 1800, price: '$25/noche' },
  'Guiza': { category: 'Destinos Populares', rating: 4.8, reviews: 8500, price: '$45/noche' },
  'Hohhot': { category: 'Aventuras', rating: 4.3, reviews: 900, price: '$35/noche' },
  'Baotou': { category: 'Aventuras', rating: 4.2, reviews: 600, price: '$30/noche' },
  'Saná': { category: 'Aventuras', rating: 4.1, reviews: 500, price: '$30/noche' },
  'Ciudad Quezon': { category: 'Escapadas', rating: 4.5, reviews: 2200, price: '$40/noche' },
  'Jaipur': { category: 'Destinos Populares', rating: 4.8, reviews: 6800, price: '$35/noche' },
  'Vadodara': { category: 'Aventuras', rating: 4.4, reviews: 1200, price: '$25/noche' },
  'Kanpur': { category: 'Aventuras', rating: 4.3, reviews: 1000, price: '$22/noche' },
  'Port Harcourt': { category: 'Aventuras', rating: 4.2, reviews: 700, price: '$55/noche' },
  'Đà Nẵng': { category: 'Destinos Populares', rating: 4.7, reviews: 5800, price: '$35/noche' },
  'Cần Thơ': { category: 'Aventuras', rating: 4.5, reviews: 1500, price: '$25/noche' },
  'Đồng Nai': { category: 'Aventuras', rating: 4.3, reviews: 800, price: '$25/noche' },
};

const cityDataMap = new Map();
for (const b of bindings) {
  const city = b.cityLabel?.value;
  const country = b.countryLabel?.value;
  const image = b.image?.value;
  const population = b.population?.value;

  if (!city || !country || !image || !population) continue;
  
  if (!(city in CURATED_CITIES)) continue;
  if (CURATED_CITIES[city] === null) continue;

  const key = city;
  if (!cityDataMap.has(key) || parseInt(population) > parseInt(cityDataMap.get(key).population)) {
    cityDataMap.set(key, { city, country, image, population });
  }
}

const newDestinations = [];
let nextId = 87;

for (const [cityName, config] of Object.entries(CURATED_CITIES)) {
  if (config === null) continue;
  
  const data = cityDataMap.get(cityName);
  if (!data) continue;

  const title = `${data.city}, ${data.country}`;
  const link = `https://es.wikipedia.org/wiki/${encodeURIComponent(data.city)}`;

  newDestinations.push({
    id: nextId++,
    title,
    category: config.category,
    image: data.image,
    link,
    rating: config.rating,
    reviews: config.reviews,
    price: config.price,
  });
}

const destPath = resolve(__dirname, '../src/data/destinations.js');
let destContent = fs.readFileSync(destPath, 'utf-8');

const wikidataMarker = '    // === DESTINOS IMPORTADOS DESDE WIKIDATA ===';
const markerIndex = destContent.indexOf(wikidataMarker);
if (markerIndex !== -1) {
  const endIndex = destContent.lastIndexOf('];');
  destContent = destContent.slice(0, markerIndex) + '];';
}

let output = '    // === DESTINOS IMPORTADOS DESDE WIKIDATA ===\n';
for (const d of newDestinations) {
  output += `    {\n`;
  output += `        id: ${d.id},\n`;
  output += `        title: ${JSON.stringify(d.title)},\n`;
  output += `        category: ${JSON.stringify(d.category)},\n`;
  output += `        image: ${JSON.stringify(d.image)},\n`;
  output += `        link: ${JSON.stringify(d.link)},\n`;
  output += `        rating: ${d.rating},\n`;
  output += `        reviews: ${d.reviews},\n`;
  output += `        price: ${JSON.stringify(d.price)}\n`;
  output += `    },\n`;
}

const lastBracket = destContent.lastIndexOf('];');
const newContent = destContent.slice(0, lastBracket) + output + '];';
fs.writeFileSync(destPath, newContent, 'utf-8');

let sql = `-- INSERT DE DESTINOS (incluye Wikidata)\n\n`;
sql += `INSERT INTO destinations (title, category, image, link, rating, reviews, price) VALUES\n`;

const destModule = await import(new URL('../src/data/destinations.js', import.meta.url));
const allDests = destModule.destinations;

const sqlValues = allDests.map((d, index) => {
  const title = d.title.replace(/'/g, "''");
  const category = d.category.replace(/'/g, "''");
  const image = d.image.replace(/'/g, "''");
  const link = d.link.replace(/'/g, "''");
  const price = d.price.replace(/'/g, "''");
  const isLast = index === allDests.length - 1;
  return `('${title}', '${category}', '${image}', '${link}', ${d.rating}, ${d.reviews}, '${price}')${isLast ? ';' : ','}`;
});

sql += sqlValues.join('\n');
fs.writeFileSync(resolve(__dirname, '../database/insert-destinations.sql'), sql);
