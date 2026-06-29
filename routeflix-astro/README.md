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
```

Las encontrás en: **Supabase → tu proyecto → Settings → API**

### 3. Crear las tablas en Supabase

En el **SQL Editor** de Supabase, ejecutá el contenido de [`supabase-schema.sql`](./supabase-schema.sql).

Esto crea:
- `destinations` — catálogo de destinos con RLS
- `user_trips` — viajes guardados por usuario

### 4. Levantar el proyecto
```bash
npm run dev
```

---

## 📁 Estructura del proyecto

```text
src/
├── components/
│   ├── Navbar.astro      # Navbar con estado de sesión (login/logout)
│   ├── Hero.astro
│   ├── Card.astro
│   └── Row.astro
├── data/
│   └── destinations.js   # Fallback local (mientras la DB no está conectada)
├── lib/
│   ├── supabase.js       # Cliente de Supabase
│   ├── auth.js           # Helpers de autenticación
│   └── destinations-db.js # CRUD de destinos
├── pages/
│   ├── index.astro       # Selección de perfil
│   ├── catalog.astro     # Catálogo principal (lee desde Supabase)
│   ├── login.astro       # Login
│   ├── register.astro    # Registro
│   ├── multi-trip.astro  # Planificador multi-destino
│   ├── my-trips.astro    # Mis viajes guardados
│   ├── destinations/     # Páginas de detalle
│   └── api/
│       └── destinations.js  # GET /api/destinations → Supabase
└── layouts/
    └── Layout.astro
supabase-schema.sql        # Schema SQL para Supabase
.env.example               # Template de variables de entorno
```

---

## ✅ Funcionalidades implementadas

- [x] Catálogo de destinos (con fallback a JSON local si Supabase no está conectado)
- [x] Registro de usuario (`/register`)
- [x] Inicio de sesión (`/login`)
- [x] Cierre de sesión (desde la Navbar)
- [x] Navbar dinámica según estado de sesión
- [x] Generador de itinerarios con IA (Gemini)
- [x] Planificador multi-destino
- [x] "Mis Viajes" con localStorage
- [x] Favoritos
- [ ] Persistencia de favoritos y viajes en Supabase *(próxima iteración)*
- [ ] Edición de perfil de usuario *(próxima iteración)*

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
