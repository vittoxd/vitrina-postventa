-- ── Accesos por trabajador ──────────────────────────────────────────
-- Cada trabajador puede tener asignadas distintas secciones del panel.
-- `secciones` guarda las claves de las pestañas que puede ver.
-- Valores válidos: cotizaciones, postventa, proyectos, inventario, propias.
-- (El dueño ve todo siempre; esta columna solo aplica a trabajadores.)

alter table perfiles
  add column if not exists secciones text[] not null default '{proyectos,propias}';

notify pgrst, 'reload schema';
