import { ServicioSlug } from "./tipos";

// Color de fondo cuando un proyecto no tiene imagen. Antes vivía como
// columna "color" en la tabla proyectos; se movió aquí (derivado de la
// categoría) porque es un detalle puramente visual, no un dato del
// negocio — así el formulario del admin no obliga a elegir un hex.
const colorPorCategoria: Record<ServicioSlug, string> = {
  "ventanas-pvc": "#1e3a8a",
  muebles: "#b45309",
  "puertas-muebles": "#115e59",
  "aire-acondicionado": "#0f766e",
  gasfiteria: "#9a3412",
  "acabados-obras": "#312e81",
  "inspeccion-tecnica": "#4c1d95",
};

export function colorDeProyecto(categoria: ServicioSlug): string {
  return colorPorCategoria[categoria] ?? "#334155";
}
