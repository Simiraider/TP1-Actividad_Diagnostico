# CALIDAD.md — Estrategia de Calidad

## 1. Estrategia General

El objetivo de este documento es describir las decisiones tomadas para garantizar la calidad del producto **RouteFlix**, una aplicación de descubrimiento y planificación de viajes construida con **Astro + Supabase + Vercel**.

La estrategia de calidad se basa en tres pilares:

- **Automatización:** Pipeline CI/CD que ejecuta linting, pruebas unitarias, build y deploy automáticamente.
- **Cobertura funcional:** Pruebas sobre la lógica de negocio crítica (filtrado de destinos, categorización).
- **Prevención de regresiones:** Cada PR debe pasar por el pipeline antes de ser mergeado a `main`.

## 2. Herramientas Seleccionadas

| Herramienta | Propósito | Justificación |
|-------------|-----------|---------------|
| **Vitest** | Testing unitario | Rápido, compatible con Vite/Astro, configuración mínima. |
| **Playwright** | Testing E2E | Estándar de la industria, soporte multi-browser, ideal para flujos de usuario. |
| **GitHub Actions** | CI/CD | Integración nativa con GitHub, gratuita para repos públicos/privados. |
| **Astro Check** | Linting/type-check | Valida TypeScript y estructura de componentes Astro. |
| **Vercel** | Deploy | Deploy preview automático en cada PR, producción desde `main`. |

## 3. Tests Implementados

### 3.1 Unit Tests (Vitest)

| Test | Archivo | ¿Qué cubre? |
|------|---------|-------------|
| `filterByCategory` | `src/lib/__tests__/destinations.test.js` | Verifica que los destinos se filtren correctamente por categoría ("Destinos Populares", "Aventuras", "Escapadas") y que categorías inexistentes devuelvan array vacío. |
| `deduplicateDestinations` | `src/lib/__tests__/destinations.test.js` | Verifica que destinos duplicados (mismo título) sean eliminados, priorizando el que tiene más reviews. |

### 3.2 E2E Test (Playwright)

| Test | Archivo | ¿Qué cubre? |
|------|---------|-------------|
| `Flujo principal de catálogo` | `e2e/catalog.spec.js` | Navega a la página de catálogo, espera que se carguen las categorías, verifica que "Escapadas" esté visible con destinos, y que la búsqueda funcione. |

## 4. Casos de Uso Críticos

Se priorizaron los siguientes flujos para testing porque representan la funcionalidad principal del producto:

1. **Carga del catálogo:** El usuario debe ver los destinos agrupados por categoría. Si falla, la app no sirve.
2. **Filtrado por categoría:** Los destinos deben aparecer en la categoría correcta. Un destino en "Escapadas" no debe aparecer en "Aventuras".
3. **Fallback ante fallo de API:** Si Supabase no responde, la app debe mostrar datos de respaldo sin errores visibles.
4. **Búsqueda:** El usuario puede buscar destinos por nombre o categoría.
5. **Favoritos:** El usuario puede agregar/remover destinos de su lista personal.

## 5. Pipeline CI/CD

El pipeline se ejecuta en **GitHub Actions** ante cada `push` o `pull_request` a `main`.

```
[Push/PR a main]
      │
      ▼
┌─────────────┐
│    Lint     │  → Astro Check (type-check + lint)
└──────┬──────┘
       │ (fallo → ❌ cancelar)
       ▼
┌─────────────┐
│    Tests    │  → Vitest (unit tests)
└──────┬──────┘
       │ (fallo → ❌ cancelar)
       ▼
┌─────────────┐
│    Build    │  → astro build
└──────┬──────┘
       │ (fallo → ❌ cancelar)
       ▼
┌─────────────┐
│   Deploy    │  → Vercel (solo en push a main)
└─────────────┘
       │ (éxito → ✅)
       ▼
    Producción
```

**Reglas:**
- Si **lint** falla → se cancela todo el pipeline.
- Si **tests** fallan → se cancela el build y el deploy.
- Si **build** falla → no se despliega.
- El **deploy a producción** solo ocurre si todos los pasos anteriores son exitosos Y el evento es un `push` a `main`.
- Los PRs incluyen un **deploy preview** automático de Vercel.

## 6. Limitaciones y Deuda Técnica

| Ítem | Descripción | Impacto | Plan de mejora |
|------|-------------|---------|----------------|
| **Cobertura de tests** | Solo cubrimos la lógica de destinos y el flujo principal E2E. | Medio | Agregar tests para autenticación (login, OTP), generación de itinerarios y multi-trip. |
| **Sin tests de componentes** | Los componentes Astro (Card, Row, Hero) no tienen tests unitarios. | Bajo | Implementar testing de componentes con Astro Testing Library. |
| **Sin tests de accesibilidad** | No se audita a11y automáticamente. | Bajo | Agregar axe-core al pipeline E2E. |
| **Manejo de errores** | Algunas llamadas a Supabase no tienen retry/backoff. | Medio | Implementar reintentos con backoff exponencial en las queries a Supabase. |
| **Dataset grande** | `destinations.js` tiene ~610KB con 200+ destinos. | Alto | Migrar a paginación desde Supabase y lazy loading en el frontend. |
| **Sin caché** | Las serverless functions de Vercel no tienen caché configurada. | Medio | Agregar headers `Cache-Control` en el endpoint `/api/destinations`. |
| **Sin tests de rendimiento** | No hay métricas de Lighthouse ni audits de performance. | Bajo | Agregar auditoría Lighthouse en el pipeline. |

---

*Documento generado para el TP3 - DevOps*
