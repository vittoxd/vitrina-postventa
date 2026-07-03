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
  categoria: ServicioSlug;
  descripcion: string;
  ubicacion: string;
  imagen_url?: string | null;
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
  created_at: string;
};
