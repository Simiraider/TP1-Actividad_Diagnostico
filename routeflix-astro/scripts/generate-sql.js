import { destinations } from '../src/data/destinations.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let sql = `-- INSERT DE DESTINOS\n\n`;
sql += `INSERT INTO destinations (title, category, image, link, rating, reviews, price) VALUES\n`;

const values = destinations.map((d, index) => {
  const title = d.title.replace(/'/g, "''");
  const category = d.category.replace(/'/g, "''");
  const image = d.image.replace(/'/g, "''");
  const link = d.link.replace(/'/g, "''");
  const price = d.price.replace(/'/g, "''");

  const isLast = index === destinations.length - 1;
  return `('${title}', '${category}', '${image}', '${link}', ${d.rating}, ${d.reviews}, '${price}')${isLast ? ';' : ','}`;
});

sql += values.join('\n');

fs.writeFileSync(resolve(__dirname, '../database/insert-destinations.sql'), sql);
console.log('¡Archivo insert-destinations.sql generado correctamente!');
