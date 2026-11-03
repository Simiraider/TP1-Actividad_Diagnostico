# RouteFlix 🌍✈️

Aplicación web estilo Netflix para explorar y planificar viajes. Desarrollada con **Astro**, integrada con **Supabase** para autenticación y base de datos en la nube.

> **TP2 – Aplicación Serverless** | Tecnicatura en Programación

---

## 🚀 Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | [Astro](https://astro.build) (Hybrid SSG/SSR) |
| Base de datos | [Supabase](https://supabase.com) (PostgreSQL) |
| Autenticación | Supabase Auth |
| IA (itinerarios) | Google Gemini API |
| Deploy | [Vercel](https://vercel.com) |

---

## ⚙️ Configuración inicial

### 1. Clonar e instalar
```bash
npm install
```

### 2. Variables de entorno

Copiá `.env.example` a `.env` y completá con tus credenciales de Supabase:

```bash
cp .env.example .env
```

```env
PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
GEMINI_API_KEY=TU_GEMINI_KEY
GEODB_API_KEY=TU_RAPIDAPI_KEY
```

Las de Supabase están en: **Supabase → tu proyecto → Settings → API**

> ⚠️ `GEODB_API_KEY` **no lleva el prefijo `PUBLIC_`**: la usan solo los endpoints
> del servidor (`/api/destinations`), nunca llega al bundle del browser.
> Consiguela en [RapidAPI → GeoDB Cities](https://rapidapi.com/wirefreethought/api/geodb-cities)
> (plan Basic: ~1.000 req/día). **Si no la configurás, el catálogo funciona igual**:
> cae a Supabase y después a un fallback local de 15 destinos.

### 3. Crear las tablas en Supabase

En el **SQL Editor** de Supabase, ejecutá en orden:

1. [`supabase-schema.sql`](./supabase-schema.sql) — crea:
   - `destinations` — catálogo de destinos con RLS
   - `user_trips` — viajes guardados por usuario
2. [`database/geodb-migration.sql`](./database/geodb-migration.sql) — crea:
   - `destination_enrichment` — cache de imágenes de Wikipedia (evita repetir llamadas)
   - índice `destinations_category_rating_idx` (top por categoría)
   - RPC `destinations_by_slug(slug)` — detalle por slug sin bajar la tabla entera

> Este segundo archivo es **opcional**: sin él la app funciona, pero repite llamadas a
> Wikipedia y el detalle por slug escanea el fallback local.

### 4. Levantar el proyecto
```bash
npm run dev
```

---

## 📁 Estructura del proyecto

```text
src/
├── components/
│   ├── Navbar.astro        # Navbar con estado de sesión (login/logout)
│   └── Hero.astro
├── data/
│   └── destinations-fallback.js  # Fallback local (15 destinos) si no hay API
├── lib/
│   ├── supabase.js             # Cliente de Supabase (init lazy)
│   ├── auth.js                 # Helpers de autenticación
│   ├── destinations-db.js      # Queries dirigidas a Supabase (limit/in/range)
│   ├── destinations-service.js # Orquestador: GeoDB → Supabase → fallback
│   ├── geodb.js                # Cliente GeoDB (throttle 1 req/s + cache 10 min)
│   ├── enrichment.js           # Imágenes de Wikipedia en lote + cache
│   └── destination-utils.js    # Utilidades puras (slug, merge, derivados)
├── pages/
│   ├── index.astro       # Selección de perfil        (prerender)
│   ├── catalog.astro     # Catálogo: 3 filas + grid   (prerender)
│   ├── login.astro       # Login                      (prerender)
│   ├── register.astro    # Registro                   (prerender)
│   ├── multi-trip.astro  # Planificador multi-destino (prerender)
│   ├── my-trips.astro    # Mis viajes guardados       (prerender)
│   ├── destinations/     # Páginas de detalle (SSR por slug)
│   └── api/
│       ├── destinations.js      # GET /api/destinations (paginado, curado, búsqueda)
│       ├── destinations/[slug].js  # GET /api/destinations/:slug
│       └── generate.js          # POST /api/generate (itinerario con Gemini)
├── styles/
│   ├── fonts.css         # Inter auto-hospedado (variable, 2 subsets)
│   └── global.css
└── layouts/
    └── Layout.astro
database/geodb-migration.sql   # Migración opcional (cache de imágenes + RPC)
supabase-schema.sql            # Schema SQL para Supabase
public/
├── hero.webp            # Hero 175 KB (reemplaza el GIF de 1.6 MB)
└── fonts/               # Inter woff2 (latin + latin-ext)
```

---

## ✅ Funcionalidades implementadas

- [x] **Catálogo completo**: 3 filas curadas + grid "Explorar todos los destinos" con
      buscador (debounce 300 ms) y scroll infinito (lotes de 24)
- [x] **API de destinos enriquecida**: GeoDB (ciudades del mundo) → Supabase → fallback local
- [x] Detalle por slug (`/destinations/:slug`) para destinos curados y de GeoDB
- [x] Registro de usuario (`/register`)
- [x] Inicio de sesión (`/login`)
- [x] Cierre de sesión (desde la Navbar)
- [x] Navbar dinámica según estado de sesión
- [x] Generador de itinerarios con IA (Gemini)
- [x] Planificador multi-destino (lista buscable, máx. 50 checkboxes en el DOM)
- [x] "Mis Viajes" con localStorage
- [x] Favoritos con **re-render parcial** (solo se repinta la fila "Mi Lista")
      y migración automática del formato viejo (ids numéricos → slugs)
- [ ] Persistencia de favoritos y viajes en Supabase *(próxima iteración)*
- [ ] Edición de perfil de usuario *(próxima iteración)*

---

## ⚡ Rendimiento (antes / después)

Medido en este repositorio, mismo entorno (Windows, Node 24, dev server en :4399
y `astro build`):

| Métrica | Antes | Después | Δ |
|---|---|---|---|
| HTML de `/multi-trip` | **580,1 KB** (1.663 checkboxes SSR) | **45,5 KB** | **−92 %** |
| Imagen del hero | GIF externo **1.611 KB** (imagui.com) | WebP local **175 KB** | **−89 %** |
| CSS de fuentes | Google Fonts **render-blocking** + CDN externo | Inter auto-hospedado (`font-display: swap`) | −1 request externo |
| CSS de iconos | Font Awesome bloqueaba el primer pintado | Carga asíncrona (`media="print"`) | no bloquea |
| Páginas prerenderizadas | 0 (todas SSR en el request) | **6** (`/`, `/catalog`, `/login`, `/register`, `/multi-trip`, `/my-trips`) | HTML estático en el CDN |
| Listeners de favoritos | 1 por card (miles) | **1 delegado** en el contenedor | −N listeners |
| Requests del grid | catálogo completo de una | 24 por página + `Cache-Control: s-maxage=300` | −85 % payload inicial |
| Queries a Supabase en `/destinations/:slug` | tabla completa (~1.663 filas) | RPC por slug / GeoDB por id | −100 % filas |
| `astro check` (errores) | 223 | **188** (−35; `catalog.astro` 17 → 0) | −16 % |
| Tests unitarios | 9 | **52** | +47 |

Cómo verificar:

```bash
# tamaño del HTML servido (dev)
curl -s localhost:4321/multi-trip | wc -c

# assets del build de producción
ls -la dist/client/_astro
```

**Cadena de fallback**: si falta `GEODB_API_KEY` o Supabase no responde, la API
siempre contesta con el fallback local (15 destinos) y la página nunca queda en
blanco — es exactamente lo que cubre el segundo test E2E.

---

## 🧞 Comandos

| Comando | Acción |
|---|---|
| `npm install` | Instala dependencias |
| `npm run dev` | Servidor de desarrollo en `localhost:4321` |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build |
| `npm run check` | Type-check con Astro |
| `npm test` | Tests unitarios (Vitest) |
| `npm run test:e2e` | Tests E2E (Playwright) |

---

## 🧪 Calidad y CI/CD

Este proyecto incluye:

- **Tests unitarios** con [Vitest](https://vitest.dev) (`npm test`)
- **Tests E2E** con [Playwright](https://playwright.dev) (`npm run test:e2e`)
- **Pipeline CI/CD** con GitHub Actions: `lint → tests → build → e2e → deploy`
- **Type-check** con Astro Check (`npm run check`)

Ver [`CALIDAD.md`](./CALIDAD.md) para más detalles sobre la estrategia de calidad.

---

## 🌿 Ramas del repositorio

| Rama | Descripción |
|---|---|
| `main` | Versión funcional y desplegada en producción |
| `develop` | Integración continua |
| `feature/auth-supabase` | Autenticación y base de datos |
| `feature/...` | Funcionalidades individuales |

---

## 🌐 Producción

URL de producción: https://routeflix.vercel.app (o la URL asignada por Vercel)

---

## 📝 TP3 - DevOps

Repositorio configurado con:
- ✅ `CALIDAD.md` con estrategia de calidad
- ✅ Pipeline CI/CD (GitHub Actions)
- ✅ Tests unitarios (Vitest) y E2E (Playwright)
- ✅ Flujo de Issues y Pull Requests
