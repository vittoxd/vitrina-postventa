import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// createBrowserClient (en vez de createClient) guarda la sesión en cookies,
// no solo en localStorage. Eso es lo que le permite a middleware.ts leer
// "¿este visitante tiene sesión?" en el servidor, antes de que la página
// del admin llegue a cargar.
export const supabase = createBrowserClient(url, key);

/*
  ── SQL para ejecutar en Supabase → SQL Editor ──────────────────────────

  create table cotizaciones (
    id          uuid primary key default gen_random_uuid(),
    servicio    text not null,
    nombre      text not null,
    telefono    text not null,
    email       text not null,
    comuna      text not null,
    descripcion text not null,
    campos_extra jsonb,
    estado      text not null default 'Pendiente',
    created_at  timestamptz not null default now()
  );

  create table proyectos (
    id          uuid primary key default gen_random_uuid(),
    titulo      text not null,
    categoria   text not null,
    descripcion text not null,
    ubicacion   text not null,
    imagen_url  text,
    destacado   boolean not null default false,
    created_at  timestamptz not null default now()
  );

  -- ⚠️ Políticas corregidas (2026-07-03): las originales usaban
  -- "using (true)" para select/update/delete, lo que las hacía públicas
  -- pese al nombre "admin" — cualquiera con la anon key podía leer y
  -- editar los datos de contacto de los clientes. Ahora exigen una
  -- sesión de Supabase Auth real (auth.role() = 'authenticated').
  -- Ver database/fix-rls-admin.sql para el script de migración.

  alter table cotizaciones enable row level security;
  create policy "insert público" on cotizaciones for insert with check (true);
  create policy "select solo autenticados" on cotizaciones for select using (auth.role() = 'authenticated');
  create policy "update solo autenticados" on cotizaciones for update using (auth.role() = 'authenticated');

  alter table proyectos enable row level security;
  create policy "select público" on proyectos for select using (true);
  create policy "insert solo autenticados" on proyectos for insert with check (auth.role() = 'authenticated');
  create policy "update solo autenticados" on proyectos for update using (auth.role() = 'authenticated');
  create policy "delete solo autenticados" on proyectos for delete using (auth.role() = 'authenticated');

  ────────────────────────────────────────────────────────────────────── */
