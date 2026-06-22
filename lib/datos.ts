// ─────────────────────────────────────────────────────────────
// Datos de ejemplo para el demo (luego vendrían de una base de datos).
// ─────────────────────────────────────────────────────────────

import { Proyecto, Solicitud, Tecnico } from "./tipos";

export const empresa = {
  nombre: "Aluvent",
  rubro: "Ventanas · Construcción · Remodelación",
  eslogan: "Construimos y renovamos tus espacios con calidad y garantía.",
  telefono: "+56 9 1234 5678",
  whatsapp: "56912345678",
  ciudad: "Rancagua, Chile",
};

export const servicios = [
  { titulo: "Ventanas de Aluminio y PVC", desc: "Fabricación e instalación a medida, con aislación térmica y acústica.", icono: "🪟" },
  { titulo: "Construcción", desc: "Ampliaciones, obra gruesa y terminaciones con materiales certificados.", icono: "🏗️" },
  { titulo: "Remodelación", desc: "Renovamos cocinas, baños y espacios completos llave en mano.", icono: "🛠️" },
];

export const proyectos: Proyecto[] = [
  { id: "p1", titulo: "Ventanas termopanel — Casa Los Aromos", categoria: "Ventanas", descripcion: "Reemplazo completo de ventanas por termopanel, mejorando aislación.", ubicacion: "Rancagua", color: "#1e3a8a" },
  { id: "p2", titulo: "Ampliación living — Condominio El Sol", categoria: "Construcción", descripcion: "Ampliación de 24 m² con estructura y terminaciones.", ubicacion: "Machalí", color: "#b45309" },
  { id: "p3", titulo: "Remodelación de cocina integral", categoria: "Remodelación", descripcion: "Cocina nueva: muebles, cubierta de cuarzo e iluminación.", ubicacion: "Graneros", color: "#0f766e" },
  { id: "p4", titulo: "Cierre perimetral con ventanales", categoria: "Ventanas", descripcion: "Ventanales de piso a cielo para terraza techada.", ubicacion: "Rancagua", color: "#312e81" },
  { id: "p5", titulo: "Obra gruesa — Vivienda 2 pisos", categoria: "Construcción", descripcion: "Construcción de obra gruesa habitacional desde cero.", ubicacion: "Rengo", color: "#9a3412" },
  { id: "p6", titulo: "Remodelación de baño", categoria: "Remodelación", descripcion: "Baño completo: cerámicos, grifería y mueble a medida.", ubicacion: "Machalí", color: "#115e59" },
];

// Solicitudes de post-venta — la fecha define la prioridad (más antigua primero)
export const solicitudes: Solicitud[] = [
  { id: "s1", cliente: "María Soto", telefono: "+56 9 8888 1111", tipo: "Ventanas", descripcion: "Una ventana del living quedó con filtración de agua.", fechaSolicitud: "2026-06-15T10:00:00", estado: "Pendiente" },
  { id: "s2", cliente: "Jorge Pérez", telefono: "+56 9 8888 2222", tipo: "Remodelación", descripcion: "Ajuste de puerta de mueble de cocina.", fechaSolicitud: "2026-06-16T09:30:00", estado: "Pendiente" },
  { id: "s3", cliente: "Constructora Andes", telefono: "+56 9 8888 3333", tipo: "Construcción", descripcion: "Revisión de terminación en muro ampliado.", fechaSolicitud: "2026-06-17T14:00:00", estado: "Agendado", tecnicoAsignado: "Pedro Rojas", fechaVisita: "2026-06-23T11:00:00" },
  { id: "s4", cliente: "Carla Núñez", telefono: "+56 9 8888 4444", tipo: "Ventanas", descripcion: "Cambio de manilla en ventana del dormitorio.", fechaSolicitud: "2026-06-18T16:20:00", estado: "Completado", tecnicoAsignado: "Luis Vega", fechaVisita: "2026-06-21T10:00:00" },
];

export const tecnicos: Tecnico[] = [
  { id: "t1", nombre: "Pedro Rojas", especialidad: "Construcción", disponible: true },
  { id: "t2", nombre: "Luis Vega", especialidad: "Ventanas", disponible: true },
  { id: "t3", nombre: "Daniela Muñoz", especialidad: "Remodelación", disponible: false },
];
