// ─────────────────────────────────────────────────────────────
// Tipos del dominio (demo). Sin base de datos: datos de ejemplo.
// ─────────────────────────────────────────────────────────────

export type Categoria = "Ventanas" | "Construcción" | "Remodelación";

export type Proyecto = {
  id: string;
  titulo: string;
  categoria: Categoria;
  descripcion: string;
  ubicacion: string;
  // color de fondo para la "foto" simulada (placeholder visual sin imágenes reales)
  color: string;
};

export type EstadoSolicitud = "Pendiente" | "Agendado" | "Completado";

export type Solicitud = {
  id: string;
  cliente: string;
  telefono: string;
  tipo: Categoria;
  descripcion: string;
  fechaSolicitud: string; // ISO — define la prioridad (más antigua = más prioritaria)
  estado: EstadoSolicitud;
  tecnicoAsignado?: string; // nombre del personal
  fechaVisita?: string; // ISO
};

export type Tecnico = {
  id: string;
  nombre: string;
  especialidad: Categoria;
  disponible: boolean;
};

export const CATEGORIAS: Categoria[] = ["Ventanas", "Construcción", "Remodelación"];
