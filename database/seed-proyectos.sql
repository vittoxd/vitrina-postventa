-- ─────────────────────────────────────────────────────────────────────
-- Carga los 6 proyectos de ejemplo que antes vivían hardcodeados en
-- lib/datos.ts (proyectosDemo), ahora que la home y /proyectos leen
-- de la tabla real. Sin esto, "Trabajos realizados" queda vacío hasta
-- que cargues proyectos de verdad desde /admin.
--
-- Cómo ejecutar: Supabase Dashboard → SQL Editor → pegar → Run.
-- Es seguro correrlo una sola vez (no tiene protección anti-duplicados;
-- si lo corres dos veces, quedarán 12 filas en vez de 6).
-- ─────────────────────────────────────────────────────────────────────

insert into proyectos (titulo, categoria, descripcion, ubicacion, destacado) values
  ('Ventanas PVC — Casa sector sur', 'ventanas-pvc', 'Reemplazo completo de ventanas antiguas por PVC, mejorando aislación.', 'Santiago', true),
  ('Muebles cocina integral', 'muebles', 'Cocina completa con muebles a medida en MDF lacado blanco.', 'Maipú', true),
  ('Instalación aire acondicionado', 'aire-acondicionado', 'Instalación de 3 equipos split para oficina de 80 m².', 'Providencia', true),
  ('Terminaciones obra nueva', 'acabados-obras', 'Estuco, pintura y cerámicos en casa de 2 pisos.', 'Puente Alto', false),
  ('Reparación gasfitería urgente', 'gasfiteria', 'Reparación de cañería rota en baño principal.', 'Las Condes', false),
  ('Puertas mueble cocina', 'puertas-muebles', 'Cambio de 8 puertas de mueble de cocina a melamina mate.', 'Ñuñoa', false);
