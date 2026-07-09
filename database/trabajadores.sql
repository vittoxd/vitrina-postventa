-- ── Trabajadores / roles ────────────────────────────────────────────
-- Tabla de perfiles: asocia cada usuario de Supabase Auth con un rol.
--   'dueño'      → ve y hace todo (incl. crear trabajadores).
--   'trabajador' → acceso limitado: solo Cotizaciones y Post-venta.
--
-- Los trabajadores se crean desde el panel (sección Trabajadores), que
-- llama a una API server-side con la service role key. Aquí solo se crea
-- la tabla y se marca al dueño actual.

create table if not exists perfiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  rol        text not null default 'trabajador',
  created_at timestamptz not null default now()
);

alter table perfiles enable row level security;

-- Cualquier usuario autenticado puede LEER su propio rol (y el de otros;
-- no es dato sensible). Insertar/borrar solo lo hace la service role key,
-- que salta las RLS — por eso no hay policy de insert/update/delete.
drop policy if exists "perfiles select autenticados" on perfiles;
create policy "perfiles select autenticados" on perfiles
  for select using (auth.role() = 'authenticated');

-- Marca como DUEÑO a todas las cuentas que existen HOY (solo está la del
-- admin; aún no hay trabajadores). Los trabajadores se crean después vía
-- la API con rol 'trabajador', así que no se ven afectados por esto.
insert into perfiles (id, email, rol)
select id, email, 'dueño' from auth.users
on conflict (id) do update set rol = 'dueño';

notify pgrst, 'reload schema';
