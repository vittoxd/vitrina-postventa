import { Servicio } from "./tipos";

export const empresa = {
  nombre: "IncluWork",                 // nombre comercial (con el que los conocen)
  nombreLegal: "DEIPA",                // razón social — ajustar a la exacta (ej: "DEIPA SpA")
  rubro: "Construcción · Remodelación · Mantención",
  eslogan: "Soluciones integrales para tu hogar y empresa, con calidad y garantía real.",
  telefono: "+56 9 8787 3015",
  whatsapp: "56987873015",
  email: "vg88882@gmail.com",
  ciudad: "Chile",
};

export const servicios: Servicio[] = [
  {
    slug: "ventanas-pvc",
    titulo: "Ventanas PVC",
    desc: "Fabricación e instalación de ventanas de PVC a medida, con excelente aislación térmica y acústica.",
    icono: "🪟",
    camposExtra: [
      { name: "cantidad", label: "Cantidad de ventanas", tipo: "number", placeholder: "Ej: 4" },
      { name: "ancho", label: "Ancho aproximado (cm)", tipo: "number", placeholder: "Ej: 120" },
      { name: "alto", label: "Alto aproximado (cm)", tipo: "number", placeholder: "Ej: 160" },
      { name: "color", label: "Color preferido", tipo: "select", opciones: ["Blanco", "Nogal", "Negro", "Gris", "No sé / me orientan"] },
      { name: "tipo_vidrio", label: "Tipo de vidrio", tipo: "select", opciones: ["DVH (doble vidriado hermético)", "Simple", "No sé / me orientan"] },
    ],
  },
  {
    slug: "muebles",
    titulo: "Muebles",
    desc: "Diseño y fabricación de muebles a medida para cocinas, dormitorios, oficinas y más.",
    icono: "🛋️",
    camposExtra: [
      { name: "tipo_mueble", label: "Tipo de mueble", tipo: "select", opciones: ["Cocina", "Dormitorio", "Baño", "Oficina", "Otro"] },
      { name: "metros_lineales", label: "Metros lineales aproximados", tipo: "number", placeholder: "Ej: 4" },
      { name: "material", label: "Material preferido", tipo: "select", opciones: ["MDF lacado", "Melamina", "Madera natural", "No sé / me orientan"] },
      { name: "color_terminacion", label: "Color o terminación deseada", tipo: "text", placeholder: "Ej: Blanco mate, Roble, etc." },
    ],
  },
  {
    slug: "puertas-muebles",
    titulo: "Puertas de muebles",
    desc: "Fabricación y cambio de puertas para muebles existentes, en distintos materiales y acabados.",
    icono: "🚪",
    camposExtra: [
      { name: "cantidad_puertas", label: "Cantidad de puertas", tipo: "number", placeholder: "Ej: 6" },
      { name: "ancho", label: "Ancho de cada puerta (cm)", tipo: "number", placeholder: "Ej: 40" },
      { name: "alto", label: "Alto de cada puerta (cm)", tipo: "number", placeholder: "Ej: 70" },
      { name: "material", label: "Material preferido", tipo: "select", opciones: ["MDF lacado", "Melamina", "Madera natural", "No sé / me orientan"] },
      { name: "color_terminacion", label: "Color o terminación deseada", tipo: "text", placeholder: "Ej: Blanco brillante, Gris mate..." },
    ],
  },
  {
    slug: "aire-acondicionado",
    titulo: "Aire acondicionado",
    desc: "Instalación, mantención y reparación de equipos de aire acondicionado residencial y comercial.",
    icono: "❄️",
    camposExtra: [
      { name: "tipo_servicio", label: "Tipo de servicio", tipo: "select", opciones: ["Instalación nueva", "Mantención", "Reparación"] },
      { name: "cantidad_equipos", label: "Cantidad de equipos", tipo: "number", placeholder: "Ej: 2" },
      { name: "metros2", label: "Metros cuadrados del espacio", tipo: "number", placeholder: "Ej: 25" },
      { name: "tipo_inmueble", label: "Tipo de inmueble", tipo: "select", opciones: ["Casa", "Departamento", "Oficina", "Local comercial"] },
    ],
  },
  {
    slug: "gasfiteria",
    titulo: "Gasfitería",
    desc: "Reparación e instalación de sistemas de agua, gas y alcantarillado en viviendas y locales.",
    icono: "🔧",
    camposExtra: [
      { name: "tipo_trabajo", label: "Tipo de trabajo", tipo: "select", opciones: ["Reparación filtración", "Instalación nueva cañería", "Cambio de artefactos", "Revisión general", "Otro"] },
      { name: "urgencia", label: "¿Es urgente?", tipo: "select", opciones: ["Sí, es urgente", "No, puedo esperar"] },
      { name: "tipo_inmueble", label: "Tipo de inmueble", tipo: "select", opciones: ["Casa", "Departamento", "Local comercial", "Otro"] },
    ],
  },
  {
    slug: "acabados-obras",
    titulo: "Términos y acabados de obras civiles",
    desc: "Estucos, pinturas, cerámicos, cielos y todo tipo de terminaciones para dejar tu obra lista.",
    icono: "🏗️",
    camposExtra: [
      { name: "tipo_terminacion", label: "Tipo de terminación", tipo: "select", opciones: ["Estuco / Pintura", "Cerámicos / Pisos", "Cielos", "Múltiples"] },
      { name: "metros2", label: "Superficie aproximada (m²)", tipo: "number", placeholder: "Ej: 80" },
      { name: "color_referencia", label: "Color o referencia de materiales", tipo: "text", placeholder: "Ej: Blanco, cerámico mármol gris..." },
    ],
  },
  {
    slug: "inspeccion-tecnica",
    titulo: "Inspección técnica de obra",
    desc: "Inspección profesional en terreno para verificar la calidad y avance de tu proyecto de construcción.",
    icono: "📋",
    camposExtra: [
      { name: "tipo_inmueble", label: "Tipo de inmueble", tipo: "select", opciones: ["Casa", "Departamento", "Local comercial", "Otro"] },
      { name: "etapa_obra", label: "Etapa de la obra", tipo: "select", opciones: ["Inicio / fundaciones", "Obra gruesa", "Terminaciones", "Entrega / recepción"] },
      { name: "metros2", label: "Superficie total (m²)", tipo: "number", placeholder: "Ej: 120" },
    ],
  },
];

// Los proyectos ("Trabajos realizados") ya no viven aquí como demo:
// se administran desde /admin (pestaña Proyectos) y se guardan en la
// tabla "proyectos" de Supabase. Ver database/seed-proyectos.sql para
// cargar los 6 ejemplos originales como punto de partida.
