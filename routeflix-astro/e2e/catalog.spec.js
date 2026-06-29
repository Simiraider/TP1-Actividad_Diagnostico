import { test, expect } from '@playwright/test';

test.describe('Catálogo RouteFlix - Flujo Principal', () => {
  test('debe cargar el catálogo con las 3 categorías y tener búsqueda funcional', async ({ page }) => {
    await page.goto('/catalog', { waitUntil: 'networkidle' });

    // Esperar a que aparezca al menos un título de categoría
    await expect(page.locator('.category-title')).toHaveCount(3, { timeout: 15000 });

    // Verificar que las 3 categorías existen con sus textos específicos
    const categoryTitles = page.locator('.category-title');
    await expect(categoryTitles.nth(0)).toHaveText('Destinos Populares');
    await expect(categoryTitles.nth(1)).toHaveText('Aventuras');
    await expect(categoryTitles.nth(2)).toHaveText('Escapadas');

    // Verificar que hay cards en cada categoría
    const rows = page.locator('.category-row');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(3);

    // Verificar que hay al menos un destino visible en "Escapadas"
    const escapadasRow = page.locator('#escapadas');
    await expect(escapadasRow).toBeVisible();
    const cards = escapadasRow.locator('.card');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);

    // Verificar que el título del destino (con país) es visible sin hover
    const firstCardTitle = escapadasRow.locator('.card-title').first();
    // El título debe contener el nombre de un país (ej: "París, Francia")
    const titleText = await firstCardTitle.textContent();
    expect(titleText).toBeTruthy();
    // El título country-card debe tener información visible (país mencionado)
    expect(titleText).toMatch(/,/); // Debe tener coma separando ciudad y país

    // Verificar que la barra de búsqueda existe y permite escribir
    const searchInput = page.locator('#search-location');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('París');
    await page.locator('#search-btn').click();

    // Debe mostrar resultados de búsqueda
    await expect(page.locator('.category-title')).toContainText(['Resultados de la búsqueda'], { timeout: 5000 });

    // Verificar que el botón de favoritos existe en las cards
    const favIcons = page.locator('.fav-icon');
    const favCount = await favIcons.count();
    expect(favCount).toBeGreaterThan(0);
  });

  test('debe mostrar el catálogo incluso si la API falla (usando fallback)', async ({ page }) => {
    // Bloquear la API para simular fallo
    await page.route('**/api/destinations', route => route.abort());
    await page.goto('/catalog', { waitUntil: 'networkidle' });

    // Debe cargar igual con el fallback
    await expect(page.locator('.category-title')).toHaveCount(3, { timeout: 15000 });
    await expect(page.locator('.card')).not.toHaveCount(0);
  });
});
