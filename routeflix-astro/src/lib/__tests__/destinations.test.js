import { describe, it, expect } from 'vitest';

// --- Helper functions extracted from catalog.astro logic ---

/**
 * Filters destinations by category name.
 */
function filterByCategory(destinations, category) {
  if (!Array.isArray(destinations)) return [];
  if (!category || typeof category !== 'string') return [];
  return destinations.filter(d => d.category === category);
}

/**
 * Removes duplicate destinations by title.
 * When duplicates are found, keeps the one with more reviews.
 */
function deduplicateDestinations(destinations) {
  if (!Array.isArray(destinations)) return [];

  const map = new Map();
  for (const dest of destinations) {
    const key = dest.title.toLowerCase().trim();
    if (!map.has(key) || (map.get(key).reviews || 0) < (dest.reviews || 0)) {
      map.set(key, dest);
    }
  }
  return Array.from(map.values());
}

// --- Sample data for tests ---

const sampleDestinations = [
  { id: 1, title: 'Santorini, Grecia', category: 'Destinos Populares', rating: 4.9, reviews: 1240 },
  { id: 2, title: 'Bali, Indonesia', category: 'Destinos Populares', rating: 4.8, reviews: 3105 },
  { id: 3, title: 'París, Francia', category: 'Escapadas', rating: 4.6, reviews: 15400 },
  { id: 4, title: 'Nueva York, EEUU', category: 'Escapadas', rating: 4.7, reviews: 22000 },
  { id: 5, title: 'Machu Picchu', category: 'Aventuras', rating: 5.0, reviews: 5320 },
  { id: 6, title: 'Patagonia, Argentina', category: 'Aventuras', rating: 4.9, reviews: 2100 },
  { id: 7, title: 'Roma, Italia', category: 'Destinos Populares', rating: 4.7, reviews: 8430 },
  { id: 8, title: 'Ámsterdam, Países Bajos', category: 'Escapadas', rating: 4.8, reviews: 6700 },
  { id: 9, title: 'Alpes Suizos', category: 'Aventuras', rating: 4.8, reviews: 980 },
  { id: 10, title: 'Tokio, Japón', category: 'Destinos Populares', rating: 4.8, reviews: 14200 },
];

const duplicatesData = [
  { id: 1, title: 'París, Francia', category: 'Escapadas', rating: 4.6, reviews: 15400 },
  { id: 2, title: 'París, Francia', category: 'Escapadas', rating: 4.5, reviews: 12000 },
  { id: 3, title: 'Roma, Italia', category: 'Destinos Populares', rating: 4.7, reviews: 8430 },
  { id: 4, title: 'roma, italia', category: 'Destinos Populares', rating: 4.6, reviews: 7000 },
];

// --- Tests ---

describe('filterByCategory', () => {
  it('should return only destinations matching the "Escapadas" category', () => {
    const result = filterByCategory(sampleDestinations, 'Escapadas');
    expect(result).toHaveLength(3);
    result.forEach(d => {
      expect(d.category).toBe('Escapadas');
    });
    expect(result.map(d => d.title)).toContain('París, Francia');
    expect(result.map(d => d.title)).toContain('Nueva York, EEUU');
    expect(result.map(d => d.title)).toContain('Ámsterdam, Países Bajos');
  });

  it('should return only destinations matching the "Aventuras" category', () => {
    const result = filterByCategory(sampleDestinations, 'Aventuras');
    expect(result).toHaveLength(3);
    result.forEach(d => {
      expect(d.category).toBe('Aventuras');
    });
  });

  it('should return an empty array for a non-existent category', () => {
    const result = filterByCategory(sampleDestinations, 'CategoriaInexistente');
    expect(result).toHaveLength(0);
  });

  it('should return an empty array when destinations is null or undefined', () => {
    expect(filterByCategory(null, 'Escapadas')).toHaveLength(0);
    expect(filterByCategory(undefined, 'Escapadas')).toHaveLength(0);
  });

  it('should return an empty array when category is empty string', () => {
    const result = filterByCategory(sampleDestinations, '');
    expect(result).toHaveLength(0);
  });
});

describe('deduplicateDestinations', () => {
  it('should remove exact duplicate titles and keep the one with more reviews', () => {
    const result = deduplicateDestinations(duplicatesData);
    // París should appear once, with 15400 reviews (not 12000)
    // Roma should appear once, with 8430 reviews (not 7000)
    expect(result).toHaveLength(2);
    const paris = result.find(d => d.title === 'París, Francia');
    expect(paris).toBeDefined();
    expect(paris.reviews).toBe(15400);
    const roma = result.find(d => d.title.toLowerCase() === 'roma, italia');
    expect(roma).toBeDefined();
    expect(roma.reviews).toBe(8430);
  });

  it('should handle case-insensitive duplicates (same city, different casing)', () => {
    const caseData = [
      { id: 1, title: 'Barcelona, España', category: 'Escapadas', rating: 4.7, reviews: 9500 },
      { id: 2, title: 'barcelona, españa', category: 'Escapadas', rating: 4.6, reviews: 8000 },
    ];
    const result = deduplicateDestinations(caseData);
    expect(result).toHaveLength(1);
    // Debe conservar el que tiene más reviews
    expect(result[0].reviews).toBe(9500);
    expect(result[0].title).toBe('Barcelona, España');
  });

  it('should return an empty array when input is null', () => {
    expect(deduplicateDestinations(null)).toHaveLength(0);
  });

  it('should return the same array when there are no duplicates', () => {
    const result = deduplicateDestinations(sampleDestinations);
    expect(result).toHaveLength(sampleDestinations.length);
  });
});
