-- ============================================================
-- Migración GeoDB — RouteFlix
-- Ejecutar en el SQL Editor de Supabase (una sola vez)
-- ============================================================

-- 1) Tabla de enriquecimiento: cache de imágenes obtenidas de
--    Wikipedia/Wikidata para ciudades que NO están en `destinations`.
--    key = título normalizado (sin acentos, minúsculas)
create table if not exists destination_enrichment (
  key        text primary key,
  image      text,
  updated_at timestamptz default now()
);

alter table destination_enrichment enable row level security;

drop policy if exists "enrichment_public_read" on destination_enrichment;
create policy "enrichment_public_read"
  on destination_enrichment for select
  using (true);

drop policy if exists "enrichment_public_insert" on destination_enrichment;
create policy "enrichment_public_insert"
  on destination_enrichment for insert
  with check (true);

drop policy if exists "enrichment_public_update" on destination_enrichment;
create policy "enrichment_public_update"
  on destination_enrichment for update
  using (true);

-- 2) Índice para la vista curada (top por categoría ordenado por rating)
create index if not exists destinations_category_rating_idx
  on destinations (category, rating desc);

-- 3) RPC: buscar 1 destino por su slug sin descargar la tabla completa.
--    Replica exactamente el slugify del front:
--      str.toLowerCase().replace(/[^a-z0-9]+/g, '-')
create or replace function destinations_by_slug(p_slug text)
returns setof destinations
language sql
stable
as $$
  select *
  from destinations
  where lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')) = p_slug
  limit 1;
$$;

grant execute on function destinations_by_slug(text) to anon, authenticated;
