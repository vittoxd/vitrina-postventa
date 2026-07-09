"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { servicios } from "@/lib/datos";
import { colorDeProyecto } from "@/lib/colores";
import { Cotizacion, EstadoCotizacion, Material, Postventa, Proyecto, ServicioSlug, TipoPostventa } from "@/lib/tipos";

const proyectoVacio = {
  titulo: "",
  categoria: servicios[0].slug as ServicioSlug,
  descripcion: "",
  ubicacion: "",
  imagenes: [] as string[],   // URLs públicas en Supabase Storage (la 1ª = portada)
  destacado: false,
};

// Fila de material en el formulario de "Nueva cotización".
// material_id vacío + nombre lleno = material de texto libre (no descuenta).
type FilaMat = { material_id: string; nombre: string; cantidad: number; precio: number };
const filaMatVacia = (): FilaMat => ({ material_id: "", nombre: "", cantidad: 1, precio: 0 });

// Secciones (pestañas) del panel. "trabajadores" es exclusiva del dueño.
type Seccion = "cotizaciones" | "postventa" | "proyectos" | "inventario" | "propias" | "trabajadores";

// Secciones que se le pueden asignar a un trabajador (todas menos "trabajadores").
const SECCIONES_ASIGNABLES: { key: Seccion; label: string }[] = [
  { key: "cotizaciones", label: "📋 Cotizaciones" },
  { key: "postventa", label: "💬 Post-venta" },
  { key: "proyectos", label: "🏗️ Proyectos" },
  { key: "inventario", label: "📦 Inventario" },
  { key: "propias", label: "🧾 Cotizaciones propias" },
];

const colorEstado: Record<EstadoCotizacion, string> = {
  Pendiente: "bg-amber-100 text-amber-800",
  Contactado: "bg-blue-100 text-blue-800",
  Cerrado: "bg-green-100 text-green-800",
};

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function tituloServicio(slug: string) {
  return servicios.find((s) => s.slug === slug)?.titulo ?? slug;
}

const colorTipo: Record<TipoPostventa, string> = {
  satisfaccion: "bg-green-100 text-green-800",
  consulta: "bg-blue-100 text-blue-800",
  reclamo: "bg-red-100 text-red-800",
  garantia: "bg-orange-100 text-orange-800",
};
const iconoTipo: Record<TipoPostventa, string> = {
  satisfaccion: "😊",
  consulta: "❓",
  reclamo: "🚨",
  garantia: "🔧",
};

export default function AdminPage() {
  const router = useRouter();
  const [seccion, setSeccion] = useState<Seccion>("cotizaciones");
  // Rol del usuario logueado. null mientras carga; "trabajador" = acceso
  // limitado a las secciones que le asignaron; cualquier otro = dueño (ve todo).
  const [rol, setRol] = useState<string | null>(null);
  const esTrabajador = rol === "trabajador";
  // Secciones que el trabajador logueado tiene permitidas (solo aplica a trabajadores).
  const [misSecciones, setMisSecciones] = useState<Seccion[]>([]);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [postventas, setPostventas] = useState<(Postventa & { cotizacion: Cotizacion })[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<EstadoCotizacion | "Todos">("Todos");

  // Modal de agendamiento
  const [modalId, setModalId] = useState<string | null>(null);
  const [fechaVisita, setFechaVisita] = useState("");
  const [notasVisita, setNotasVisita] = useState("");
  const [agendando, setAgendando] = useState(false);

  // Formulario de proyectos (crear / editar)
  const [formProyecto, setFormProyecto] = useState(proyectoVacio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [guardandoProyecto, setGuardandoProyecto] = useState(false);
  const [subiendoImg, setSubiendoImg] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null); // arrastre para reordenar fotos

  // Modal "Nueva cotización" creada a mano por el admin (para clientes
  // que llegan por teléfono/presencial, no por el formulario de la web).
  // Se guarda como una cotización normal; luego se le arma el PDF con
  // precios desde el generador existente (/admin/generar/[id]).
  const [modalNueva, setModalNueva] = useState(false);
  const [creandoNueva, setCreandoNueva] = useState(false);
  // Id de la cotización propia cuyo PDF se está generando (para el spinner del botón).
  const [generandoPdfId, setGenerandoPdfId] = useState<string | null>(null);
  const nuevaVacia = {
    nombre: "", telefono: "", email: "", comuna: "",
    servicio: servicios[0].slug as ServicioSlug, descripcion: "",
  };
  const [formNueva, setFormNueva] = useState(nuevaVacia);
  // Materiales de la nueva cotización: del taller (inventario) y a comprar.
  const [matTaller, setMatTaller] = useState<FilaMat[]>([]);
  const [matComprar, setMatComprar] = useState<FilaMat[]>([]);

  // Inventario de materiales
  const [materiales, setMateriales] = useState<Material[]>([]);
  const materialVacio = { nombre: "", unidad: "unidad", stock: 0, stock_minimo: 0, precio_unit: "" };
  const [formMaterial, setFormMaterial] = useState(materialVacio);
  const [editandoMaterialId, setEditandoMaterialId] = useState<string | null>(null);
  const [guardandoMaterial, setGuardandoMaterial] = useState(false);

  // Trabajadores (solo dueño)
  const [trabajadores, setTrabajadores] = useState<{ id: string; email: string; created_at: string; secciones: Seccion[] }[]>([]);
  const seccionesPorDefecto: Seccion[] = ["proyectos", "propias"];
  const [formTrab, setFormTrab] = useState<{ email: string; password: string; secciones: Seccion[] }>({ email: "", password: "", secciones: seccionesPorDefecto });
  const [creandoTrab, setCreandoTrab] = useState(false);
  // Edición inline de los accesos de un trabajador ya creado.
  const [editAccesosId, setEditAccesosId] = useState<string | null>(null);
  const [editAccesos, setEditAccesos] = useState<Seccion[]>([]);
  const [guardandoAccesos, setGuardandoAccesos] = useState(false);

  async function cargar() {
    setCargando(true);
    const [{ data: cots }, { data: pvs }, { data: prys }, { data: mats }] = await Promise.all([
      supabase.from("cotizaciones").select("*").order("created_at", { ascending: false }),
      supabase.from("postventa").select("*, cotizacion:cotizaciones(*)").order("created_at", { ascending: false }),
      supabase.from("proyectos").select("*").order("destacado", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("materiales").select("*").order("nombre", { ascending: true }),
    ]);
    setCotizaciones((cots as Cotizacion[]) ?? []);
    setPostventas((pvs as (Postventa & { cotizacion: Cotizacion })[]) ?? []);
    setProyectos((prys as Proyecto[]) ?? []);
    setMateriales((mats as Material[]) ?? []);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, []);

  // Averigua el rol y las secciones permitidas del usuario actual.
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("perfiles").select("rol, secciones").eq("id", user.id).single();
      setRol(data?.rol ?? "dueño"); // sin perfil = dueño (cuenta admin original)
      setMisSecciones((data?.secciones as Seccion[]) ?? []);
    })();
  }, []);

  // Pestañas visibles para el trabajador: las que le asignaron, en orden fijo.
  const tabsTrabajador = SECCIONES_ASIGNABLES.map((s) => s.key).filter((k) => misSecciones.includes(k));

  // El trabajador arranca en una sección que sí tenga permitida.
  useEffect(() => {
    if (esTrabajador && tabsTrabajador.length > 0 && !tabsTrabajador.includes(seccion)) {
      setSeccion(tabsTrabajador[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esTrabajador, misSecciones, seccion]);

  // Carga la lista de trabajadores desde la API segura (solo dueño).
  async function cargarTrabajadores() {
    const res = await fetch("/api/trabajadores");
    const json = await res.json();
    if (res.ok) setTrabajadores(json.trabajadores ?? []);
  }
  useEffect(() => {
    if (seccion === "trabajadores" && !esTrabajador) cargarTrabajadores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seccion, esTrabajador]);

  // Marca/desmarca una sección en el formulario de nuevo trabajador.
  function toggleSeccionNueva(key: Seccion) {
    setFormTrab((f) => ({
      ...f,
      secciones: f.secciones.includes(key) ? f.secciones.filter((s) => s !== key) : [...f.secciones, key],
    }));
  }

  async function crearTrabajador(e: React.FormEvent) {
    e.preventDefault();
    if (formTrab.secciones.length === 0) { alert("Marca al menos una sección a la que el trabajador pueda entrar."); return; }
    setCreandoTrab(true);
    const res = await fetch("/api/trabajadores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formTrab),
    });
    const json = await res.json();
    setCreandoTrab(false);
    if (!res.ok) { alert("No se pudo crear el trabajador:\n" + (json.error ?? "")); return; }
    setFormTrab({ email: "", password: "", secciones: seccionesPorDefecto });
    cargarTrabajadores();
    alert("✅ Trabajador creado.\n\nYa puede entrar al panel con ese correo y contraseña.");
  }

  // ── Editar accesos de un trabajador existente ───────────────────────
  function abrirEdicionAccesos(t: { id: string; secciones: Seccion[] }) {
    setEditAccesosId(t.id);
    setEditAccesos(t.secciones ?? []);
  }
  function toggleAccesoEdit(key: Seccion) {
    setEditAccesos((prev) => prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]);
  }
  async function guardarAccesos(id: string) {
    if (editAccesos.length === 0) { alert("El trabajador debe tener al menos una sección."); return; }
    setGuardandoAccesos(true);
    const res = await fetch("/api/trabajadores", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, secciones: editAccesos }),
    });
    setGuardandoAccesos(false);
    if (!res.ok) { const j = await res.json(); alert("No se pudo guardar:\n" + (j.error ?? "")); return; }
    setEditAccesosId(null);
    cargarTrabajadores();
  }

  async function eliminarTrabajador(id: string) {
    if (!confirm("¿Eliminar este trabajador? Ya no podrá entrar al panel.")) return;
    const res = await fetch("/api/trabajadores", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) { const j = await res.json(); alert("No se pudo eliminar:\n" + (j.error ?? "")); return; }
    cargarTrabajadores();
  }

  // Genera una contraseña legible al azar para dársela al trabajador.
  function generarPassword() {
    const chars = "abcdefghijkmnpqrstuvwxyz23456789";
    let p = "";
    for (let i = 0; i < 10; i++) p += chars[Math.floor(Math.random() * chars.length)];
    setFormTrab((f) => ({ ...f, password: p }));
  }

  function editarProyecto(p: Proyecto) {
    setEditandoId(p.id);
    setFormProyecto({
      titulo: p.titulo,
      categoria: p.categoria,
      descripcion: p.descripcion,
      ubicacion: p.ubicacion,
      // Compat: proyectos viejos solo tenían imagen_url (una sola).
      imagenes: p.imagenes?.length ? p.imagenes : (p.imagen_url ? [p.imagen_url] : []),
      destacado: p.destacado,
    });
  }

  function cancelarEdicionProyecto() {
    setEditandoId(null);
    setFormProyecto(proyectoVacio);
  }

  // Sube una o varias imágenes al bucket "proyectos" de Supabase Storage y
  // agrega sus URLs públicas al formulario. La primera de la lista es la portada.
  async function subirImagenes(files: FileList | null) {
    if (!files || files.length === 0) return;
    setSubiendoImg(true);
    const nuevas: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const nombre = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("proyectos").upload(nombre, file, { cacheControl: "3600", upsert: false });
      if (error) { alert("No se pudo subir " + file.name + ":\n" + error.message); continue; }
      const { data } = supabase.storage.from("proyectos").getPublicUrl(nombre);
      nuevas.push(data.publicUrl);
    }
    setFormProyecto((f) => ({ ...f, imagenes: [...f.imagenes, ...nuevas] }));
    setSubiendoImg(false);
  }

  function quitarImagen(url: string) {
    setFormProyecto((f) => ({ ...f, imagenes: f.imagenes.filter((u) => u !== url) }));
  }

  // Mueve una imagen al inicio para dejarla como portada.
  function hacerPortada(url: string) {
    setFormProyecto((f) => ({ ...f, imagenes: [url, ...f.imagenes.filter((u) => u !== url)] }));
  }

  // Reordena la galería arrastrando: saca la foto de `from` y la mete en `to`.
  function reordenarImagenes(from: number, to: number) {
    if (from === to) return;
    setFormProyecto((f) => {
      const arr = [...f.imagenes];
      const [movida] = arr.splice(from, 1);
      arr.splice(to, 0, movida);
      return { ...f, imagenes: arr };
    });
  }

  async function guardarProyecto(e: React.FormEvent) {
    e.preventDefault();
    setGuardandoProyecto(true);
    const { imagenes, ...resto } = formProyecto;
    const payload = { ...resto, imagenes, imagen_url: imagenes[0] ?? null };

    if (editandoId) {
      await supabase.from("proyectos").update(payload).eq("id", editandoId);
    } else {
      await supabase.from("proyectos").insert(payload);
    }

    setGuardandoProyecto(false);
    cancelarEdicionProyecto();
    cargar();
  }

  async function eliminarProyecto(id: string) {
    if (!confirm("¿Eliminar este proyecto del portafolio? No se puede deshacer.")) return;
    await supabase.from("proyectos").delete().eq("id", id);
    if (editandoId === id) cancelarEdicionProyecto();
    cargar();
  }

  async function agendar() {
    if (!modalId || !fechaVisita) return;
    setAgendando(true);
    await fetch("/api/agendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: modalId, fecha_visita: fechaVisita, notas_visita: notasVisita }),
    });
    setModalId(null);
    setFechaVisita("");
    setNotasVisita("");
    setAgendando(false);
    cargar();
  }

  async function cambiarEstado(id: string, estado: EstadoCotizacion) {
    await supabase.from("cotizaciones").update({ estado }).eq("id", id);

    // Al CERRAR una cotización se descuenta el stock de sus materiales,
    // una sola vez (bandera materiales_descontados).
    let descontado = false;
    if (estado === "Cerrado") {
      const cot = cotizaciones.find((c) => c.id === id);
      if (cot && !cot.materiales_descontados) {
        await descontarInventario(id);
        await supabase.from("cotizaciones").update({ materiales_descontados: true }).eq("id", id);
        descontado = true;
        cargar(); // refresca el stock del inventario en pantalla
      }
    }

    setCotizaciones((prev) => prev.map((c) =>
      c.id === id
        ? { ...c, estado, materiales_descontados: c.materiales_descontados || descontado }
        : c
    ));
  }

  // Descuenta del inventario las cantidades de los materiales vinculados
  // a esta cotización. Si algún stock queda negativo, avisa pero deja pasar.
  async function descontarInventario(cotizacionId: string) {
    const { data: links } = await supabase
      .from("cotizacion_materiales")
      .select("cantidad, material:materiales(id, nombre, stock)")
      .eq("cotizacion_id", cotizacionId);

    const filas = (links ?? []) as unknown as { cantidad: number; material: { id: string; nombre: string; stock: number } | null }[];
    if (filas.length === 0) return;

    const faltantes: string[] = [];
    for (const l of filas) {
      if (!l.material) continue;
      const nuevo = Number(l.material.stock) - Number(l.cantidad);
      if (nuevo < 0) faltantes.push(`• ${l.material.nombre}: queda ${nuevo}`);
      await supabase.from("materiales").update({ stock: nuevo }).eq("id", l.material.id);
    }

    if (faltantes.length > 0) {
      alert("⚠️ Stock insuficiente (quedó en negativo):\n\n" + faltantes.join("\n") + "\n\nRecuerda reponer el material.");
    }
  }

  // ── Inventario: CRUD de materiales ──────────────────────────────────
  function editarMaterial(m: Material) {
    setEditandoMaterialId(m.id);
    setFormMaterial({
      nombre: m.nombre,
      unidad: m.unidad,
      stock: m.stock,
      stock_minimo: m.stock_minimo,
      precio_unit: m.precio_unit != null ? String(m.precio_unit) : "",
    });
  }

  function cancelarEdicionMaterial() {
    setEditandoMaterialId(null);
    setFormMaterial(materialVacio);
  }

  async function guardarMaterial(e: React.FormEvent) {
    e.preventDefault();
    setGuardandoMaterial(true);
    const payload = {
      nombre: formMaterial.nombre,
      unidad: formMaterial.unidad,
      stock: Number(formMaterial.stock),
      stock_minimo: Number(formMaterial.stock_minimo),
      precio_unit: formMaterial.precio_unit === "" ? null : Number(formMaterial.precio_unit),
    };
    if (editandoMaterialId) {
      await supabase.from("materiales").update(payload).eq("id", editandoMaterialId);
    } else {
      await supabase.from("materiales").insert(payload);
    }
    setGuardandoMaterial(false);
    cancelarEdicionMaterial();
    cargar();
  }

  async function eliminarMaterial(id: string) {
    if (!confirm("¿Eliminar este material del inventario? No se puede deshacer.")) return;
    await supabase.from("materiales").delete().eq("id", id);
    if (editandoMaterialId === id) cancelarEdicionMaterial();
    cargar();
  }

  async function crearCotizacion(e: React.FormEvent) {
    e.preventDefault();
    setCreandoNueva(true);
    const { data: cot, error } = await supabase.from("cotizaciones").insert({
      servicio: formNueva.servicio,
      nombre: formNueva.nombre,
      telefono: formNueva.telefono,
      email: formNueva.email,
      comuna: formNueva.comuna,
      direccion: "",
      descripcion: formNueva.descripcion,
      campos_extra: {},
      estado: "Pendiente",
      origen: "admin",
    }).select("id").single();

    if (error || !cot) {
      setCreandoNueva(false);
      alert("No se pudo crear la cotización:\n" + (error?.message ?? "sin datos devueltos"));
      return;
    }

    // Guardar los materiales asociados. Los que tienen material_id (del
    // inventario, sean "taller" o "comprar") descuentan stock al cerrar;
    // los de texto libre solo quedan como lista.
    const filas = [
      ...matTaller
        .filter((r) => r.material_id && r.cantidad > 0)
        .map((r) => ({ cotizacion_id: cot.id, material_id: r.material_id, nombre: null, cantidad: r.cantidad, tipo: "taller" })),
      ...matComprar
        .filter((r) => (r.material_id || r.nombre.trim()) && r.cantidad > 0)
        .map((r) => ({
          cotizacion_id: cot.id,
          material_id: r.material_id || null,
          nombre: r.material_id ? null : r.nombre.trim(),
          cantidad: r.cantidad,
          tipo: "comprar",
          // Precio propio solo para materiales de texto libre (los del
          // inventario toman su precio de la tabla materiales).
          precio_unit: r.material_id ? null : (r.precio || null),
        })),
    ];
    if (filas.length > 0) {
      const { error: errMat } = await supabase.from("cotizacion_materiales").insert(filas);
      if (errMat) alert("La cotización se creó, pero falló al guardar los materiales:\n" + errMat.message);
    }

    setCreandoNueva(false);
    setModalNueva(false);
    setFormNueva(nuevaVacia);
    setMatTaller([]);
    setMatComprar([]);
    cargar();
  }

  // Genera y descarga el PDF de una cotización propia directamente (1 clic),
  // armando los ítems desde sus materiales (precio del inventario; los de
  // texto libre van en $0). No pasa por el generador manual.
  async function descargarPDFPropia(c: Cotizacion) {
    setGenerandoPdfId(c.id);
    try {
      const { data: links } = await supabase
        .from("cotizacion_materiales")
        .select("cantidad, nombre, tipo, precio_unit, material:materiales(nombre, precio_unit)")
        .eq("cotizacion_id", c.id);

      const filas = (links ?? []) as unknown as {
        cantidad: number; nombre: string | null; tipo: string; precio_unit: number | null;
        material: { nombre: string; precio_unit: number | null } | null;
      }[];

      const items = filas.map((f, i) => ({
        pos: `M${i + 1}`,
        descripcion: (f.material?.nombre ?? f.nombre ?? "Material") + (f.tipo === "comprar" ? " (a comprar)" : ""),
        color: "",
        dimensiones: "",
        uds: f.cantidad,
        m2Unit: 0,
        // Precio propio de la fila (texto libre) o, si es del inventario, el suyo.
        precioUnit: Number(f.precio_unit ?? f.material?.precio_unit ?? 0),
      }));

      // Sin materiales: al menos una línea con el servicio.
      if (items.length === 0) {
        items.push({ pos: "1", descripcion: tituloServicio(c.servicio), color: "", dimensiones: "", uds: 1, m2Unit: 0, precioUnit: 0 });
      }

      const numeroPedido = `COT-${c.created_at.slice(0, 10).replace(/-/g, "")}-${c.id.slice(0, 4).toUpperCase()}`;
      const fecha = new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });

      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numeroPedido,
          cliente: `${c.nombre}${c.email ? " — " + c.email : ""}`,
          fecha,
          servicio: tituloServicio(c.servicio),
          comuna: c.comuna,
          items,
          nota: c.descripcion ?? "",
        }),
      });
      if (!res.ok) throw new Error("Error generando PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cotizacion-${numeroPedido}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("No se pudo generar el PDF. Intenta de nuevo.");
    } finally {
      setGenerandoPdfId(null);
    }
  }

  async function descargarAgenda() {
    const res = await fetch("/api/pdf/agenda");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "agenda-visitas.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  // "Cotizaciones" muestra las que envían los clientes; "Cotizaciones
  // propias" muestra las que crea el admin a mano (origen === "admin").
  const baseLista = seccion === "propias"
    ? cotizaciones.filter((c) => c.origen === "admin")
    : cotizaciones.filter((c) => c.origen !== "admin");
  const visibles = filtro === "Todos" ? baseLista : baseLista.filter((c) => c.estado === filtro);
  const materialesBajoStock = materiales.filter((m) => m.stock <= m.stock_minimo).length;
  const stats = {
    total: baseLista.length,
    pendientes: baseLista.filter((c) => c.estado === "Pendiente").length,
    contactados: baseLista.filter((c) => c.estado === "Contactado").length,
    cerrados: baseLista.filter((c) => c.estado === "Cerrado").length,
  };
  const modalCot = cotizaciones.find((c) => c.id === modalId);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">

      {/* Modal de agendamiento */}
      {modalId && modalCot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Agendar visita</h2>
            <p className="text-sm text-slate-500 mb-5">
              Cliente: <span className="font-semibold text-slate-700">{modalCot.nombre}</span> — {tituloServicio(modalCot.servicio)}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha y hora de la visita</label>
                <input
                  type="date"
                  value={fechaVisita}
                  onChange={(e) => setFechaVisita(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notas (opcional)</label>
                <textarea
                  value={notasVisita}
                  onChange={(e) => setNotasVisita(e.target.value)}
                  rows={3}
                  placeholder="Ej: Llevar taladro, coordinar con portero..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500">
                📧 Se enviará un email automático a <b>{modalCot.email}</b> con la fecha de visita.
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={agendar}
                disabled={!fechaVisita || agendando}
                className="flex-1 rounded-lg bg-amber-500 py-2.5 font-semibold text-slate-900 hover:bg-amber-400 disabled:opacity-60"
              >
                {agendando ? "Agendando…" : "Confirmar y enviar email"}
              </button>
              <button
                onClick={() => { setModalId(null); setFechaVisita(""); setNotasVisita(""); }}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal "Nueva cotización" (creada a mano por el admin) */}
      {modalNueva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <form onSubmit={crearCotizacion} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Nueva cotización</h2>
            <p className="text-sm text-slate-500 mb-5">
              Para un cliente que llegó por teléfono, WhatsApp o presencial. Luego le armas el PDF con precios desde <b>Generar PDF</b>.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del cliente</label>
                <input required value={formNueva.nombre}
                  onChange={(e) => setFormNueva({ ...formNueva, nombre: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                <input value={formNueva.telefono}
                  onChange={(e) => setFormNueva({ ...formNueva, telefono: e.target.value })}
                  placeholder="+56 9 ..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" value={formNueva.email}
                  onChange={(e) => setFormNueva({ ...formNueva, email: e.target.value })}
                  placeholder="cliente@correo.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Comuna</label>
                <input value={formNueva.comuna}
                  onChange={(e) => setFormNueva({ ...formNueva, comuna: e.target.value })}
                  placeholder="Ej: Rancagua"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Servicio</label>
                <select value={formNueva.servicio}
                  onChange={(e) => setFormNueva({ ...formNueva, servicio: e.target.value as ServicioSlug })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none">
                  {servicios.map((s) => <option key={s.slug} value={s.slug}>{s.titulo}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción del trabajo</label>
                <textarea required rows={3} value={formNueva.descripcion}
                  onChange={(e) => setFormNueva({ ...formNueva, descripcion: e.target.value })}
                  placeholder="Qué necesita el cliente..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none resize-none" />
              </div>
            </div>

            {/* Materiales del taller (del inventario, descuentan stock) */}
            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-800">🔧 Materiales del taller</label>
                <button type="button" onClick={() => setMatTaller([...matTaller, filaMatVacia()])}
                  className="text-xs font-medium text-green-700 hover:underline">+ agregar</button>
              </div>
              <p className="mb-2 text-xs text-slate-400">Del inventario. Descuentan stock al cerrar la cotización.</p>
              {matTaller.length === 0 && <p className="text-xs text-slate-400">— sin materiales —</p>}
              <div className="space-y-2">
                {matTaller.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select value={r.material_id}
                      onChange={(e) => setMatTaller(matTaller.map((x, idx) => idx === i ? { ...x, material_id: e.target.value } : x))}
                      className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none">
                      <option value="">Elegir material…</option>
                      {materiales.map((m) => <option key={m.id} value={m.id}>{m.nombre} ({m.stock} {m.unidad})</option>)}
                    </select>
                    <input type="number" min={1} value={r.cantidad}
                      onChange={(e) => setMatTaller(matTaller.map((x, idx) => idx === i ? { ...x, cantidad: +e.target.value } : x))}
                      className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-right focus:border-amber-500 focus:outline-none" />
                    <button type="button" onClick={() => setMatTaller(matTaller.filter((_, idx) => idx !== i))}
                      className="px-1 text-lg leading-none text-slate-400 hover:text-red-500">×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Materiales a comprar (inventario o texto libre) */}
            <div className="mt-5 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-800">🛒 Materiales a comprar</label>
                <button type="button" onClick={() => setMatComprar([...matComprar, filaMatVacia()])}
                  className="text-xs font-medium text-green-700 hover:underline">+ agregar</button>
              </div>
              <p className="mb-2 text-xs text-slate-400">Del inventario (descuenta stock, precio del inventario) o texto libre (nombre + cantidad + precio, no descuenta). El precio va al PDF.</p>
              {matComprar.length === 0 && <p className="text-xs text-slate-400">— sin materiales —</p>}
              <div className="space-y-2">
                {matComprar.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select value={r.material_id}
                      onChange={(e) => setMatComprar(matComprar.map((x, idx) => idx === i ? { ...x, material_id: e.target.value } : x))}
                      className="w-40 rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none">
                      <option value="">Texto libre…</option>
                      {materiales.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                    </select>
                    <input value={r.nombre} disabled={!!r.material_id}
                      onChange={(e) => setMatComprar(matComprar.map((x, idx) => idx === i ? { ...x, nombre: e.target.value } : x))}
                      placeholder={r.material_id ? "(del inventario)" : "Ej: Cemento"}
                      className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400" />
                    <input type="number" min={1} value={r.cantidad}
                      onChange={(e) => setMatComprar(matComprar.map((x, idx) => idx === i ? { ...x, cantidad: +e.target.value } : x))}
                      title="Cantidad"
                      className="w-16 rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-right focus:border-amber-500 focus:outline-none" />
                    <input type="number" min={0} value={r.material_id ? "" : r.precio || ""} disabled={!!r.material_id}
                      onChange={(e) => setMatComprar(matComprar.map((x, idx) => idx === i ? { ...x, precio: +e.target.value } : x))}
                      placeholder={r.material_id ? "$ inv." : "$ precio"}
                      title={r.material_id ? "Precio del inventario" : "Precio unitario"}
                      className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-right focus:border-amber-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400" />
                    <button type="button" onClick={() => setMatComprar(matComprar.filter((_, idx) => idx !== i))}
                      className="px-1 text-lg leading-none text-slate-400 hover:text-red-500">×</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button type="submit" disabled={creandoNueva}
                className="flex-1 rounded-lg bg-green-600 py-2.5 font-semibold text-white hover:bg-green-500 disabled:opacity-60">
                {creandoNueva ? "Creando…" : "Crear cotización"}
              </button>
              <button type="button" onClick={() => { setModalNueva(false); setFormNueva(nuevaVacia); setMatTaller([]); setMatComprar([]); }}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs de sección. El trabajador solo ve Proyectos y Cotizaciones propias. */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-200 pb-0">
        {(esTrabajador
          ? tabsTrabajador
          : (["cotizaciones", "postventa", "proyectos", "inventario", "propias", "trabajadores"] as Seccion[])
        ).map((s) => (
          <button key={s} onClick={() => setSeccion(s)}
            className={`px-5 py-2.5 text-sm font-semibold capitalize rounded-t-lg border-b-2 transition ${seccion === s ? "border-amber-500 text-amber-600 bg-amber-50" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            {s === "cotizaciones" && "📋 Cotizaciones"}
            {s === "postventa" && `💬 Post-venta ${postventas.length > 0 ? `(${postventas.length})` : ""}`}
            {s === "proyectos" && `🏗️ Proyectos ${proyectos.length > 0 ? `(${proyectos.length})` : ""}`}
            {s === "inventario" && <>📦 Inventario {materialesBajoStock > 0 && <span className="ml-1 rounded-full bg-red-100 px-1.5 py-0.5 text-xs text-red-700">{materialesBajoStock} bajo</span>}</>}
            {s === "propias" && "🧾 Cotizaciones propias"}
            {s === "trabajadores" && "👷 Trabajadores"}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Panel de administración</h1>
          <p className="mt-1 text-slate-500">IncluWork — solicitudes de cotización</p>
        </div>
        <div className="flex gap-2">
          <button onClick={descargarAgenda} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">
            📅 Descargar agenda
          </button>
          <button onClick={cargar} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">
            🔄 Actualizar
          </button>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push("/admin/login"); router.refresh(); }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {(seccion === "cotizaciones" || seccion === "propias") && <>
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <Stat label="Total" valor={stats.total} color="text-slate-700" />
        <Stat label="Pendientes" valor={stats.pendientes} color="text-amber-600" />
        <Stat label="Contactados" valor={stats.contactados} color="text-blue-600" />
        <Stat label="Cerrados" valor={stats.cerrados} color="text-green-600" />
      </div>

      {/* Filtros + crear cotización a mano */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <div className="flex flex-wrap gap-2">
          {(["Todos", "Pendiente", "Contactado", "Cerrado"] as const).map((op) => (
            <button key={op} onClick={() => setFiltro(op)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${filtro === op ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-100"}`}>
              {op}
            </button>
          ))}
        </div>
        {seccion === "propias" && (
          <button onClick={() => setModalNueva(true)}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500">
            + Nueva cotización
          </button>
        )}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {cargando && <p className="text-sm text-slate-500">Cargando cotizaciones…</p>}
        {!cargando && visibles.length === 0 && <p className="text-sm text-slate-500">No hay solicitudes en esta categoría.</p>}

        {visibles.map((c) => (
          <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-900">{c.nombre}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorEstado[c.estado]}`}>{c.estado}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{tituloServicio(c.servicio)}</span>
                </div>
                <p className="text-sm text-slate-600">{c.descripcion}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                  <span>📞 {c.telefono}</span>
                  <span>✉️ {c.email}</span>
                  <span>📍 {c.direccion || c.comuna}</span>
                  <span>🕐 {fmtFecha(c.created_at)}</span>
                </div>
                {c.fecha_visita && (
                  <p className="text-xs font-medium text-blue-600">📅 Visita: {fmtFecha(c.fecha_visita)}</p>
                )}
                {c.campos_extra && Object.keys(c.campos_extra).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {Object.entries(c.campos_extra).filter(([,v]) => v).map(([k, v]) => (
                      <span key={k} className="rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-xs text-slate-600">
                        {k.replace(/_/g, " ")}: {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 flex-col gap-2 items-end">
                {c.origen === "admin" ? (
                  <button onClick={() => descargarPDFPropia(c)} disabled={generandoPdfId === c.id}
                    className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-amber-400 whitespace-nowrap disabled:opacity-60">
                    {generandoPdfId === c.id ? "Generando…" : "⬇ Descargar PDF"}
                  </button>
                ) : (
                  <Link href={`/admin/generar/${c.id}`}
                    className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-amber-400 whitespace-nowrap">
                    📄 Generar PDF
                  </Link>
                )}
                <div className="flex gap-2 flex-wrap justify-end">
                  {c.estado === "Pendiente" && (
                    <button onClick={() => setModalId(c.id)}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500">
                      📅 Agendar visita
                    </button>
                  )}
                  {c.estado !== "Cerrado" && (
                    <button onClick={() => cambiarEstado(c.id, "Cerrado")}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500">
                      → Cerrado
                    </button>
                  )}
                  {c.estado === "Contactado" && (
                    <button onClick={() => setModalId(c.id)}
                      className="rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50">
                      ✏️ Reagendar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      </>}

      {/* Sección Post-venta */}
      {seccion === "postventa" && (
        <div className="space-y-3">
          {cargando && <p className="text-sm text-slate-500">Cargando…</p>}
          {!cargando && postventas.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <p className="text-3xl mb-3">💬</p>
              <p className="text-slate-500 text-sm">Aún no hay respuestas de post-venta.</p>
              <p className="text-slate-400 text-xs mt-1">Aparecen aquí cuando un cliente completa el formulario en /postventa</p>
            </div>
          )}
          {postventas.map((pv) => (
            <div key={pv.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900">{pv.cotizacion?.nombre ?? "Cliente"}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorTipo[pv.tipo]}`}>
                      {iconoTipo[pv.tipo]} {pv.tipo.charAt(0).toUpperCase() + pv.tipo.slice(1)}
                    </span>
                    <span className="text-sm">{"⭐".repeat(pv.calificacion)}</span>
                  </div>
                  <p className="text-sm text-slate-600">{pv.mensaje}</p>
                  <div className="flex flex-wrap gap-x-4 text-xs text-slate-400">
                    <span>🔧 {tituloServicio(pv.cotizacion?.servicio ?? "")}</span>
                    <span>✉️ {pv.cotizacion?.email}</span>
                    <span>🕐 {fmtFecha(pv.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {seccion === "proyectos" && (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* Formulario crear/editar */}
          <form onSubmit={guardarProyecto} className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <h2 className="font-semibold text-slate-900">
              {editandoId ? "Editar proyecto" : "Nuevo proyecto"}
            </h2>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Título</label>
              <input required value={formProyecto.titulo}
                onChange={(e) => setFormProyecto({ ...formProyecto, titulo: e.target.value })}
                placeholder="Ej: Ventanas PVC — Casa sector sur"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Servicio</label>
              <select value={formProyecto.categoria}
                onChange={(e) => setFormProyecto({ ...formProyecto, categoria: e.target.value as ServicioSlug })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none">
                {servicios.map((s) => <option key={s.slug} value={s.slug}>{s.titulo}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Descripción</label>
              <textarea required rows={3} value={formProyecto.descripcion}
                onChange={(e) => setFormProyecto({ ...formProyecto, descripcion: e.target.value })}
                placeholder="Qué se hizo, con qué materiales, etc."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Ubicación</label>
              <input required value={formProyecto.ubicacion}
                onChange={(e) => setFormProyecto({ ...formProyecto, ubicacion: e.target.value })}
                placeholder="Ej: Rancagua"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Fotos del trabajo (opcional)</label>
              <label className={`flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 px-3 py-5 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/40 ${subiendoImg ? "opacity-60 pointer-events-none" : ""}`}>
                <span className="text-2xl">🖼️</span>
                <span className="text-xs font-medium text-slate-600">{subiendoImg ? "Subiendo…" : "Haz clic para subir fotos"}</span>
                <span className="text-[11px] text-slate-400">Puedes elegir varias a la vez</span>
                <input type="file" accept="image/*" multiple hidden disabled={subiendoImg}
                  onChange={(e) => { subirImagenes(e.target.files); e.target.value = ""; }} />
              </label>
              {formProyecto.imagenes.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {formProyecto.imagenes.map((url, i) => (
                    <div key={url}
                      draggable
                      onDragStart={() => setDragIdx(i)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => { if (dragIdx !== null) reordenarImagenes(dragIdx, i); setDragIdx(null); }}
                      onDragEnd={() => setDragIdx(null)}
                      className={`group relative aspect-square cursor-move overflow-hidden rounded-lg border border-slate-200 ${dragIdx === i ? "opacity-40" : ""}`}>
                      <img src={url} alt="" className="pointer-events-none size-full object-cover" />
                      {i === 0 && (
                        <span className="absolute left-1 top-1 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">Portada</span>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 transition group-hover:opacity-100">
                        {i !== 0 && (
                          <button type="button" onClick={() => hacerPortada(url)}
                            className="rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-white" title="Poner de portada">★</button>
                        )}
                        <button type="button" onClick={() => quitarImagen(url)}
                          className="rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-red-600 hover:bg-white" title="Quitar">×</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-1 text-xs text-slate-400">Arrastra las fotos para ordenarlas · la primera es la portada. Sin fotos, se muestra un color según el servicio.</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={formProyecto.destacado}
                onChange={(e) => setFormProyecto({ ...formProyecto, destacado: e.target.checked })} />
              Destacar en la portada
            </label>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={guardandoProyecto}
                className="flex-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60">
                {guardandoProyecto ? "Guardando..." : editandoId ? "Guardar cambios" : "Crear proyecto"}
              </button>
              {editandoId && (
                <button type="button" onClick={cancelarEdicionProyecto}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {/* Lista de proyectos existentes */}
          <div className="space-y-3">
            {proyectos.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
                <p className="text-3xl mb-3">🏗️</p>
                <p className="text-slate-500 text-sm">Todavía no hay proyectos en el portafolio.</p>
              </div>
            )}
            {proyectos.map((p) => (
              <div key={p.id} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="size-16 shrink-0 overflow-hidden rounded-lg">
                  {p.imagen_url ? (
                    <img src={p.imagen_url} alt={p.titulo} className="size-full object-cover" />
                  ) : (
                    <div className="size-full" style={{ background: colorDeProyecto(p.categoria) }} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 text-sm">{p.titulo}</p>
                    {p.destacado && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Destacado</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{tituloServicio(p.categoria)} · 📍 {p.ubicacion}</p>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{p.descripcion}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <button onClick={() => editarProyecto(p)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50">
                    Editar
                  </button>
                  <button onClick={() => eliminarProyecto(p.id)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Sección Inventario */}
      {seccion === "inventario" && (
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          {/* Formulario crear/editar material */}
          <form onSubmit={guardarMaterial} className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <h2 className="font-semibold text-slate-900">
              {editandoMaterialId ? "Editar material" : "Nuevo material"}
            </h2>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nombre del material</label>
              <input required value={formMaterial.nombre}
                onChange={(e) => setFormMaterial({ ...formMaterial, nombre: e.target.value })}
                placeholder="Ej: Perfil PVC blanco, Vidrio DVH..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Unidad</label>
                <select value={formMaterial.unidad}
                  onChange={(e) => setFormMaterial({ ...formMaterial, unidad: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none">
                  {["unidad", "m2", "metro", "kg", "litro", "saco", "rollo", "plancha"].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Stock actual</label>
                <input type="number" min={0} step="any" value={formMaterial.stock}
                  onChange={(e) => setFormMaterial({ ...formMaterial, stock: +e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Stock mínimo (alerta)</label>
                <input type="number" min={0} step="any" value={formMaterial.stock_minimo}
                  onChange={(e) => setFormMaterial({ ...formMaterial, stock_minimo: +e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Precio unit. (opcional)</label>
                <input type="number" min={0} value={formMaterial.precio_unit}
                  onChange={(e) => setFormMaterial({ ...formMaterial, precio_unit: e.target.value })}
                  placeholder="$"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={guardandoMaterial}
                className="flex-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60">
                {guardandoMaterial ? "Guardando..." : editandoMaterialId ? "Guardar cambios" : "Agregar material"}
              </button>
              {editandoMaterialId && (
                <button type="button" onClick={cancelarEdicionMaterial}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">
                  Cancelar
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400">El stock se descuenta solo cuando marcas una cotización como <b>Cerrado</b>.</p>
          </form>

          {/* Lista de materiales */}
          <div className="space-y-3">
            {materiales.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
                <p className="text-3xl mb-3">📦</p>
                <p className="text-slate-500 text-sm">Todavía no hay materiales en el inventario.</p>
                <p className="text-slate-400 text-xs mt-1">Agrégalos con el formulario de la izquierda.</p>
              </div>
            )}
            {materiales.length > 0 && (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900 text-white text-xs">
                    <tr>
                      <th className="px-4 py-2 text-left">Material</th>
                      <th className="px-3 py-2 text-left">Unidad</th>
                      <th className="px-3 py-2 text-right">Stock</th>
                      <th className="px-3 py-2 text-right">Mínimo</th>
                      <th className="px-3 py-2 text-right">Precio</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {materiales.map((m) => {
                      const bajo = m.stock <= m.stock_minimo;
                      return (
                        <tr key={m.id} className={`border-t border-slate-100 ${bajo ? "bg-red-50" : ""}`}>
                          <td className="px-4 py-2 font-medium text-slate-800">
                            {m.nombre}
                            {bajo && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">⚠️ stock bajo</span>}
                          </td>
                          <td className="px-3 py-2 text-slate-500">{m.unidad}</td>
                          <td className={`px-3 py-2 text-right font-semibold ${bajo ? "text-red-600" : "text-slate-800"}`}>{m.stock}</td>
                          <td className="px-3 py-2 text-right text-slate-400">{m.stock_minimo}</td>
                          <td className="px-3 py-2 text-right text-slate-500">{m.precio_unit != null ? `$ ${m.precio_unit.toLocaleString("es-CL")}` : "—"}</td>
                          <td className="px-3 py-2 text-right whitespace-nowrap">
                            <button onClick={() => editarMaterial(m)}
                              className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium hover:bg-slate-50">Editar</button>
                            <button onClick={() => eliminarMaterial(m.id)}
                              className="ml-2 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Eliminar</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sección Trabajadores (solo dueño) */}
      {seccion === "trabajadores" && !esTrabajador && (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* Crear trabajador */}
          <form onSubmit={crearTrabajador} className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <h2 className="font-semibold text-slate-900">Nuevo trabajador</h2>
            <p className="text-xs text-slate-500">
              Le creas una cuenta con correo y contraseña, y eliges a qué secciones puede entrar.
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Correo del trabajador</label>
              <input required type="email" value={formTrab.email}
                onChange={(e) => setFormTrab({ ...formTrab, email: e.target.value })}
                placeholder="trabajador@correo.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Contraseña</label>
              <div className="flex gap-2">
                <input required value={formTrab.password}
                  onChange={(e) => setFormTrab({ ...formTrab, password: e.target.value })}
                  placeholder="mínimo 6 caracteres"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
                <button type="button" onClick={generarPassword}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium hover:bg-slate-50 whitespace-nowrap">
                  🎲 Generar
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-400">Anótala y pásasela al trabajador — no se puede recuperar después.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">¿A qué secciones puede entrar?</label>
              <div className="space-y-1.5">
                {SECCIONES_ASIGNABLES.map((s) => (
                  <label key={s.key} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={formTrab.secciones.includes(s.key)}
                      onChange={() => toggleSeccionNueva(s.key)} />
                    <span className="text-slate-700">{s.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <button type="submit" disabled={creandoTrab}
              className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60">
              {creandoTrab ? "Creando..." : "Crear cuenta de trabajador"}
            </button>
          </form>

          {/* Lista de trabajadores */}
          <div className="space-y-3">
            {trabajadores.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
                <p className="text-3xl mb-3">👷</p>
                <p className="text-slate-500 text-sm">Todavía no hay trabajadores con cuenta.</p>
                <p className="text-slate-400 text-xs mt-1">Crea el primero con el formulario de la izquierda.</p>
              </div>
            )}
            {trabajadores.map((t) => (
              <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">✉️ {t.email}</p>
                    <p className="text-xs text-slate-400">Cuenta creada el {fmtFecha(t.created_at)}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => (editAccesosId === t.id ? setEditAccesosId(null) : abrirEdicionAccesos(t))}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                      {editAccesosId === t.id ? "Cerrar" : "Accesos"}
                    </button>
                    <button onClick={() => eliminarTrabajador(t.id)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                      Eliminar
                    </button>
                  </div>
                </div>

                {/* Chips de accesos actuales */}
                {editAccesosId !== t.id && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(t.secciones ?? []).length === 0 && <span className="text-xs text-slate-400">Sin accesos</span>}
                    {SECCIONES_ASIGNABLES.filter((s) => (t.secciones ?? []).includes(s.key)).map((s) => (
                      <span key={s.key} className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs text-amber-700">{s.label}</span>
                    ))}
                  </div>
                )}

                {/* Editor de accesos */}
                {editAccesosId === t.id && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="mb-2 text-xs font-medium text-slate-600">Marca las secciones a las que puede entrar:</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SECCIONES_ASIGNABLES.map((s) => (
                        <label key={s.key} className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm cursor-pointer hover:bg-slate-50">
                          <input type="checkbox" checked={editAccesos.includes(s.key)}
                            onChange={() => toggleAccesoEdit(s.key)} />
                          <span className="text-slate-700 text-xs">{s.label}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => guardarAccesos(t.id)} disabled={guardandoAccesos}
                        className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-60">
                        {guardandoAccesos ? "Guardando…" : "Guardar accesos"}
                      </button>
                      <button onClick={() => setEditAccesosId(null)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

function Stat({ label, valor, color }: { label: string; valor: number; color: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-extrabold ${color}`}>{valor}</p>
    </div>
  );
}
