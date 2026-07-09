-- ── Precio por material de la cotización ────────────────────────────
-- Permite cotizar materiales de TEXTO LIBRE (que no están en el inventario)
-- con su propio precio. Para materiales del inventario esta columna queda
-- null y el precio sale del inventario (materiales.precio_unit).

alter table cotizacion_materiales
  add column if not exists precio_unit numeric;

notify pgrst, 'reload schema';
