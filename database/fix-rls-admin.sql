-- ─────────────────────────────────────────────────────────────────────
-- Corrige las políticas RLS de "admin" que en realidad eran públicas.
--
-- Antes: "using (true)" en select/update/delete dejaba leer y editar
-- los datos de contacto de TODOS los clientes (nombre, teléfono, email,
-- dirección) a cualquiera que abriera /admin o llamara a la API REST
-- de Supabase directamente con la anon key (que es pública por diseño,
-- viaja en el JS del navegador).
--
-- Ahora: select/update/delete solo funcionan con una sesión real de
-- Supabase Auth (auth.role() = 'authenticated'). El insert público de
-- "cotizaciones" se mantiene: el formulario de cotizar lo necesita y
-- ahí no hay nada sensible que proteger (el cliente está creando SU
-- PROPIA cotización).
--
-- Cómo ejecutar: Supabase Dashboard → SQL Editor → pegar todo → Run.
-- ─────────────────────────────────────────────────────────────────────

-- cotizaciones: quitar las políticas viejas (públicas de verdad)
drop policy if exists "select admin" on cotizaciones;
drop policy if exists "update admin" on cotizaciones;

create policy "select solo autenticados" on cotizaciones
  for select using (auth.role() = 'authenticated');

create policy "update solo autenticados" on cotizaciones
  for update using (auth.role() = 'authenticated');

-- proyectos: mismo problema en insert/delete
drop policy if exists "insert admin" on proyectos;
drop policy if exists "delete admin" on proyectos;

create policy "insert solo autenticados" on proyectos
  for insert with check (auth.role() = 'authenticated');

create policy "update solo autenticados" on proyectos
  for update using (auth.role() = 'authenticated');

create policy "delete solo autenticados" on proyectos
  for delete using (auth.role() = 'authenticated');

-- Verificación rápida: lista las políticas activas en ambas tablas.
-- Deberías ver "authenticated" en el USING/WITH CHECK de todo lo que
-- no sea el insert público de cotizaciones ni el select público de
-- proyectos (el portafolio sí debe verse sin sesión).
select tablename, policyname, cmd, qual, with_check
from pg_policies
where tablename in ('cotizaciones', 'proyectos')
order by tablename, cmd;
