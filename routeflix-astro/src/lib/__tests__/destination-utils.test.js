import { describe, it, expect } from 'vitest';
import {
  slugify,
  normKey,
  hashString,
  deriveRating,
  derivePrice,
  deriveCategory,
  buildGeoSlug,
  parseGeoSlug,
  sanitizeIlike,
  mergeWithCurated,
  dedupeByTitle,
  placeholderImage,
} from '../destination-utils.js';

describe('slugify', () => {
  it('replica el slug histórico del front (comportamiento que NO se puede cambiar)', () => {
    // Mismo regex que usaba catalog.astro y destinations/[slug].astro.
    const legacy = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    for (const title of [
      'París, Francia',
      'Roma, Italia',
      'Nueva York, EEUU',
      'Ámsterdam, Países Bajos',
      'Praga, República Checa',
      'Machu Picchu, Perú',
    ]) {
      expect(slugify(title)).toBe(legacy(title));
    }
  });

  it('convierte títulos simples en slugs legibles', () => {
    expect(slugify('Roma, Italia')).toBe('roma-italia');
    expect(slugify('Nueva York, EEUU')).toBe('nueva-york-eeuu');
    expect(slugify('Kyoto, Japón')).toBe('kyoto-jap-n');
    expect(slugify('Lisboa, Portugal')).toBe('lisboa-portugal');
  });

  it('es idempotente (dos pasos = un paso)', () => {
    const once = slugify('París, Francia');
    expect(slugify(once)).toBe(once);
  });

  it('no revienta con entradas raras', () => {
    expect(slugify('')).toBe('');
    expect(slugify(null)).toBe('null');
    expect(slugify(undefined)).toBe('undefined');
    expect(slugify(123)).toBe('123');
  });
});

describe('normKey', () => {
  it('quita acentos, pasa a minúsculas y colapsa espacios', () => {
    expect(normKey('París, Francia')).toBe('paris, francia');
    expect(normKey('  ÁMSTERDAM,  Países Bajos ')).toBe('amsterdam, paises bajos');
  });

  it('hace iguales los títulos de Supabase y de GeoDB', () => {
    expect(normKey('París, Francia')).toBe(normKey('Paris, France'.replace('France', 'Francia')));
    expect(normKey('São Paulo')).toBe(normKey('Sao Paulo'));
  });
});

describe('hashString / derivados determinísticos', () => {
  it('hash es estable y sin signo', () => {
    expect(hashString('Buenos Aires')).toBe(hashString('Buenos Aires'));
    expect(hashString('Buenos Aires')).not.toBe(hashString('Córdoba'));
    expect(hashString('x')).toBeGreaterThanOrEqual(0);
    expect(hashString('x')).toBeLessThan(2 ** 32);
  });

  it('deriveRating devuelve 1 decimal dentro de 3.8–5.0', () => {
    for (const seed of ['Paris', 'Lyon', 'Tokio', 'Córdoba', '']) {
      const r = deriveRating(seed);
      expect(r).toBeGreaterThanOrEqual(3.8);
      expect(r).toBeLessThanOrEqual(5.0);
      expect(r).toBeCloseTo(Math.round(r * 10) / 10, 10);
      expect(deriveRating(seed)).toBe(r); // determinístico
    }
  });

  it('derivePrice usa los tramos de población', () => {
    expect(derivePrice('x', 2_000_000)).toBe('$140/noche');
    expect(derivePrice('x', 700_000)).toBe('$100/noche');
    expect(derivePrice('x', 300_000)).toBe('$75/noche');
    expect(derivePrice('x', 80_000)).toBe('$55/noche');
    expect(derivePrice('x', 10_000)).toBe('$40/noche');
  });

  it('derivePrice sin población cae en un tramo por hash (siempre válido)', () => {
    const valid = ['$40/noche', '$55/noche', '$75/noche', '$100/noche', '$140/noche'];
    expect(valid).toContain(derivePrice('Sin Población', 0));
    expect(derivePrice('Sin Población', 0)).toBe(derivePrice('Sin Población', 0));
  });

  it('deriveCategory usa los umbrales de población', () => {
    expect(deriveCategory('x', 5_000_000)).toBe('Destinos Populares');
    expect(deriveCategory('x', 400_000)).toBe('Escapadas');
    expect(deriveCategory('x', 90_000)).toBe('Aventuras');
    expect(['Aventuras', 'Escapadas']).toContain(deriveCategory('Sin Población', 0));
  });
});

describe('buildGeoSlug / parseGeoSlug', () => {
  it('construye y parsea el id de GeoDB (roundtrip)', () => {
    const slug = buildGeoSlug('Q90', 'Paris');
    expect(slug).toBe('geo-Q90-paris');
    expect(parseGeoSlug(slug)).toBe('Q90');
  });

  it('soporta ids numéricos y nombres con guiones', () => {
    expect(buildGeoSlug(41782, 'Ciudad de Mexico')).toBe('geo-41782-ciudad-de-mexico');
    expect(parseGeoSlug('geo-41782-ciudad-de-mexico')).toBe('41782');
  });

  it('sin nombre conserva solo el id', () => {
    expect(buildGeoSlug('Q90', '')).toBe('geo-Q90');
    expect(parseGeoSlug('geo-Q90')).toBe('Q90');
  });

  it('devuelve null para slugs curados (no-geo)', () => {
    expect(parseGeoSlug('par-s-francia')).toBeNull();
    expect(parseGeoSlug('roma-italia')).toBeNull();
    expect(parseGeoSlug('')).toBeNull();
    expect(parseGeoSlug(null)).toBeNull();
    expect(parseGeoSlug('geo-')).toBeNull();
  });
});

describe('sanitizeIlike', () => {
  it('escapa los caracteres especiales de PostgREST', () => {
    expect(sanitizeIlike('50%')).toBe('50\\%');
    expect(sanitizeIlike('a_b')).toBe('a\\_b');
    expect(sanitizeIlike('c:\\path')).toBe('c:\\\\path');
  });

  it('quita paréntesis y comas (romperían el or-syntax)', () => {
    expect(sanitizeIlike('Roma (Italia), Europa')).toBe('Roma Italia Europa');
  });

  it('colapsa espacios y recorta', () => {
    expect(sanitizeIlike('   mucho    espacio   ')).toBe('mucho espacio');
    expect(sanitizeIlike('')).toBe('');
    expect(sanitizeIlike(null)).toBe('');
  });
});

describe('mergeWithCurated', () => {
  // GeoDB puede devolver el título sin acentos/minúsculas; Supabase lo tiene curado.
  const geo = [
    { id: 'geo-Q90-paris', slug: 'geo-Q90-paris', title: 'paris, francia', rating: 4.2 },
    { id: 'geo-Q180', slug: 'geo-Q180', title: 'Lyon, France', rating: 4.0 },
    { id: 'geo-Q90-paris-dup', title: '  PARIS,  FRANCIA ', rating: 3.9 },
  ];
  const curated = [
    {
      id: 11,
      title: 'París, Francia',
      category: 'Escapadas',
      image: 'https://img/paris.jpg',
      link: 'https://link/paris',
      rating: 4.6,
      reviews: 15400,
      price: '€140/noche',
    },
  ];

  it('la fila curada gana: hereda imagen, rating, precio, categoría e id', () => {
    const out = mergeWithCurated(geo, curated);
    const paris = out.find((o) => o.title === 'París, Francia');
    expect(paris).toBeDefined();
    expect(paris.id).toBe(11);
    expect(paris.source).toBe('curated');
    expect(paris.image).toBe('https://img/paris.jpg');
    expect(paris.rating).toBe(4.6);
    expect(paris.price).toBe('€140/noche');
    expect(paris.category).toBe('Escapadas');
    expect(paris.slug).toBe(slugify('París, Francia'));
  });

  it('las ciudades sin curar conservan id geo y source geodb', () => {
    const out = mergeWithCurated(geo, curated);
    const lyon = out.find((o) => o.title === 'Lyon, France');
    expect(lyon.id).toBe('geo-Q180');
    expect(lyon.source).toBe('geodb');
  });

  it('deduplica por título normalizado', () => {
    const out = mergeWithCurated(geo, curated);
    const parisCount = out.filter((o) => normKey(o.title) === 'paris, francia').length;
    expect(parisCount).toBe(1);
    expect(out).toHaveLength(2); // París + Lyon
  });

  it('tolera entradas vacías', () => {
    expect(mergeWithCurated(null, null)).toEqual([]);
    expect(mergeWithCurated([], [])).toEqual([]);
  });
});

describe('dedupeByTitle', () => {
  it('conserva el primero de los títulos repetidos', () => {
    const items = [
      { id: 1, title: 'Roma, Italia' },
      { id: 2, title: 'roma, italia' },
      { id: 3, title: 'París, Francia' },
    ];
    const out = dedupeByTitle(items);
    expect(out).toHaveLength(2);
    expect(out[0].id).toBe(1);
    expect(out[1].id).toBe(3);
  });

  it('tolera null', () => {
    expect(dedupeByTitle(null)).toEqual([]);
  });
});

describe('placeholderImage', () => {
  it('devuelve un data-URI SVG válido', () => {
    const uri = placeholderImage('París, Francia');
    expect(uri.startsWith('data:image/svg+xml,')).toBe(true);
    expect(decodeURIComponent(uri.slice('data:image/svg+xml,'.length))).toContain('<svg');
  });

  it('es determinístico y distinto por ciudad', () => {
    expect(placeholderImage('Roma')).toBe(placeholderImage('Roma'));
    expect(placeholderImage('Roma')).not.toBe(placeholderImage('Lima'));
  });

  it('usa la inicial en mayúscula', () => {
    const svg = decodeURIComponent(placeholderImage('tokio').slice('data:image/svg+xml,'.length));
    expect(svg).toContain('>T<');
  });

  it('no revienta con entradas vacías', () => {
    expect(placeholderImage('')).toBe(placeholderImage('?'));
  });
});
