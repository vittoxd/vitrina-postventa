-- ── Galería de imágenes por proyecto ────────────────────────────────
-- El formulario de Proyectos pasa de "una URL" a "subir varias fotos".
-- Las fotos van a un bucket público de Supabase Storage llamado "proyectos"
-- y sus URLs se guardan en proyectos.imagenes (array). imagen_url se sigue
-- llenando con la primera foto (portada), para no romper lo que ya la usa.

-- 1) Columna con la galería.
alter table proyectos add column if not exists imagenes text[] not null default '{}';

-- 2) Bucket público para las fotos.
insert into storage.buckets (id, name, public)
values ('proyectos', 'proyectos', true)
on conflict (id) do update set public = true;

-- 3) Políticas de Storage para el bucket "proyectos":
--    lectura pública, y subir/actualizar/borrar solo usuarios autenticados
--    (dueño y trabajadores logueados en el panel).
drop policy if exists "proyectos lectura publica" on storage.objects;
create policy "proyectos lectura publica" on storage.objects
  for select using (bucket_id = 'proyectos');

drop policy if exists "proyectos subir autenticados" on storage.objects;
create policy "proyectos subir autenticados" on storage.objects
  for insert to authenticated with check (bucket_id = 'proyectos');

drop policy if exists "proyectos actualizar autenticados" on storage.objects;
create policy "proyectos actualizar autenticados" on storage.objects
  for update to authenticated using (bucket_id = 'proyectos');

drop policy if exists "proyectos borrar autenticados" on storage.objects;
create policy "proyectos borrar autenticados" on storage.objects
  for delete to authenticated using (bucket_id = 'proyectos');

notify pgrst, 'reload schema';
