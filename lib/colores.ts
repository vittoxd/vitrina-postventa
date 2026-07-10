// Color de fondo cuando un proyecto no tiene imagen. Es un detalle puramente
// visual, derivado de la categoría (texto libre), para que el formulario del
// admin no obligue a elegir un hex y cada categoría tenga siempre el mismo color.

// Colores "bonitos" reservados para las categorías originales (los servicios).
// Cualquier otra categoría escrita a mano se colorea con un hash del texto.
const colorFijo: Record<string, string> = {
  "ventanas-pvc": "#1e3a8a",
  muebles: "#b45309",
  "puertas-muebles": "#115e59",
  "aire-acondicionado": "#0f766e",
  gasfiteria: "#9a3412",
  "acabados-obras": "#312e81",
  "inspeccion-tecnica": "#4c1d95",
};

export function colorDeProyecto(categoria: string): string {
  const cat = (categoria ?? "").trim().toLowerCase();
  if (!cat) return "#334155";
  if (colorFijo[cat]) return colorFijo[cat];

  // Hash estable del texto → tono HSL fijo en saturación/luz (oscuro, para
  // que el texto blanco encima se lea bien). Misma categoría = mismo color.
  let hash = 0;
  for (let i = 0; i < cat.length; i++) {
    hash = cat.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 45%, 30%)`;
}
