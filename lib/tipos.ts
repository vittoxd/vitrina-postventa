// Tipos del dominio — IncluWork

export type ServicioSlug =
  | "ventanas-pvc"
  | "muebles"
  | "puertas-muebles"
  | "aire-acondicionado"
  | "gasfiteria"
  | "acabados-obras"
  | "inspeccion-tecnica";

export type Servicio = {
  slug: ServicioSlug;
  titulo: string;
  desc: string;
  icono: string;
  // Campos extra que aparecen en el formulario de cotización de este servicio
  camposExtra?: CampoExtra[];
};

export type CampoExtra = {
  name: string;
  label: string;
  tipo: "text" | "select" | "number";
  opciones?: string[]; // solo si tipo === "select"
  placeholder?: string;
};

export type Proyecto = {
  id: string;
  titulo: string;
  categoria: string;          // texto libre que escribe quien publica (ej: "Cocinas")
  descripcion: string;
  ubicacion: string;
  imagen_url?: string | null;   // portada = primera de `imagenes` (compat)
  imagenes?: string[];          // galería: URLs públicas en Supabase Storage
  destacado: boolean;
  created_at: string;
};

export type TipoPostventa = "satisfaccion" | "consulta" | "reclamo" | "garantia";

export type Postventa = {
  id: string;
  cotizacion_id: string;
  calificacion: number;
  tipo: TipoPostventa;
  mensaje: string;
  created_at: string;
  // joined
  cotizacion?: Cotizacion;
};

// Estado de una cotización recibida
export type EstadoCotizacion = "Pendiente" | "Contactado" | "Cerrado";

export type Cotizacion = {
  id: string;
  servicio: ServicioSlug;
  nombre: string;
  telefono: string;
  email: string;
  comuna: string;
  direccion: string;
  descripcion: string;
  campos_extra?: Record<string, string>;
  estado: EstadoCotizacion;
  fecha_visita?: string;
  notas_visita?: string;
  // true una vez que el stock de sus materiales se descontó (al cerrarla).
  // Evita descontar dos veces si se reabre y vuelve a cerrar.
  materiales_descontados?: boolean;
  // "cliente" = enviada desde el formulario público; "admin" = creada a mano en el panel.
  origen?: "cliente" | "admin";
  created_at: string;
};

// Inventario: material de la empresa
export type Material = {
  id: string;
  nombre: string;
  unidad: string;          // unidad, m2, metro, kg, litro...
  stock: number;
  stock_minimo: number;    // umbral para alerta de stock bajo
  precio_unit?: number | null;
  created_at: string;
};

// Material asociado a una cotización.
// - tipo "taller": material del inventario que ya se tiene.
// - tipo "comprar": material que hay que comprar para el trabajo.
// - material_id != null  → vinculado al inventario (descuenta stock al cerrar).
// - material_id == null  → material de texto libre (solo lista, no descuenta).
export type CotizacionMaterial = {
  id: string;
  cotizacion_id: string;
  material_id: string | null;
  nombre?: string | null;   // solo para materiales de texto libre
  cantidad: number;
  tipo: "taller" | "comprar";
  created_at: string;
};
