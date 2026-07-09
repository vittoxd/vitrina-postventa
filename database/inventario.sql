-- ─────────────────────────────────────────────────────────────────────
-- Inventario de materiales + descuento automático al cerrar cotización.
--
-- Cómo ejecutar: Supabase Dashboard → SQL Editor → pegar todo → Run.
--
-- Flujo:
--   1. Se administran materiales en la pestaña Inventario del admin.
--   2. Al armar una cotización, cada ítem puede vincularse a un material
--      del inventario (tabla cotizacion_materiales).
--   3. Cuando la cotización pasa a estado "Cerrado", se descuenta el
--      stock UNA sola vez (bandera materiales_descontados).
-- ─────────────────────────────────────────────────────────────────────

-- 1) Catálogo de materiales (inventario)
create table if not exists materiales (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  unidad        text not null default 'unidad',   -- unidad, m2, metro, kg, litro...
  stock         numeric not null default 0,
  stock_minimo  numeric not null default 0,        -- alerta de stock bajo
  precio_unit   numeric,                            -- opcional (costo/venta)
  created_at    timestamptz not null default now()
);

-- 2) Materiales usados por cada cotización (para el descuento)
create table if not exists cotizacion_materiales (
  id            uuid primary key default gen_random_uuid(),
  cotizacion_id uuid not null references cotizaciones(id) on delete cascade,
  material_id   uuid not null references materiales(id) on delete restrict,
  cantidad      numeric not null default 0,
  created_at    timestamptz not null default now()
);

-- 3) Bandera en cotizaciones: evita descontar dos veces
alter table cotizaciones
  add column if not exists materiales_descontados boolean not null default false;

-- 4) RLS: el inventario es interno, solo el admin autenticado lo ve/edita.
alter table materiales enable row level security;
drop policy if exists "materiales solo autenticados" on materiales;
create policy "materiales solo autenticados" on materiales
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table cotizacion_materiales enable row level security;
drop policy if exists "cot_materiales solo autenticados" on cotizacion_materiales;
create policy "cot_materiales solo autenticados" on cotizacion_materiales
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
