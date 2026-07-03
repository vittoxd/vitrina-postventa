"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { servicios } from "@/lib/datos";
import { colorDeProyecto } from "@/lib/colores";
import { Cotizacion, EstadoCotizacion, Postventa, Proyecto, ServicioSlug, TipoPostventa } from "@/lib/tipos";

const proyectoVacio = {
  titulo: "",
  categoria: servicios[0].slug as ServicioSlug,
  descripcion: "",
  ubicacion: "",
  imagen_url: "",
  destacado: false,
};

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
  const [seccion, setSeccion] = useState<"cotizaciones" | "postventa" | "proyectos">("cotizaciones");
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

  async function cargar() {
    setCargando(true);
    const [{ data: cots }, { data: pvs }, { data: prys }] = await Promise.all([
      supabase.from("cotizaciones").select("*").order("created_at", { ascending: false }),
      supabase.from("postventa").select("*, cotizacion:cotizaciones(*)").order("created_at", { ascending: false }),
      supabase.from("proyectos").select("*").order("destacado", { ascending: false }).order("created_at", { ascending: false }),
    ]);
    setCotizaciones((cots as Cotizacion[]) ?? []);
    setPostventas((pvs as (Postventa & { cotizacion: Cotizacion })[]) ?? []);
    setProyectos((prys as Proyecto[]) ?? []);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, []);

  function editarProyecto(p: Proyecto) {
    setEditandoId(p.id);
    setFormProyecto({
      titulo: p.titulo,
      categoria: p.categoria,
      descripcion: p.descripcion,
      ubicacion: p.ubicacion,
      imagen_url: p.imagen_url ?? "",
      destacado: p.destacado,
    });
  }

  function cancelarEdicionProyecto() {
    setEditandoId(null);
    setFormProyecto(proyectoVacio);
  }

  async function guardarProyecto(e: React.FormEvent) {
    e.preventDefault();
    setGuardandoProyecto(true);
    const payload = { ...formProyecto, imagen_url: formProyecto.imagen_url || null };

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
    setCotizaciones((prev) => prev.map((c) => (c.id === id ? { ...c, estado } : c)));
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

  const visibles = filtro === "Todos" ? cotizaciones : cotizaciones.filter((c) => c.estado === filtro);
  const stats = {
    total: cotizaciones.length,
    pendientes: cotizaciones.filter((c) => c.estado === "Pendiente").length,
    contactados: cotizaciones.filter((c) => c.estado === "Contactado").length,
    cerrados: cotizaciones.filter((c) => c.estado === "Cerrado").length,
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

      {/* Tabs de sección */}
      <div className="flex gap-2 mb-8 border-b border-slate-200 pb-0">
        {(["cotizaciones", "postventa", "proyectos"] as const).map((s) => (
          <button key={s} onClick={() => setSeccion(s)}
            className={`px-5 py-2.5 text-sm font-semibold capitalize rounded-t-lg border-b-2 transition ${seccion === s ? "border-amber-500 text-amber-600 bg-amber-50" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            {s === "cotizaciones" && "📋 Cotizaciones"}
            {s === "postventa" && `💬 Post-venta ${postventas.length > 0 ? `(${postventas.length})` : ""}`}
            {s === "proyectos" && `🏗️ Proyectos ${proyectos.length > 0 ? `(${proyectos.length})` : ""}`}
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

      {seccion === "cotizaciones" && <>
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <Stat label="Total" valor={stats.total} color="text-slate-700" />
        <Stat label="Pendientes" valor={stats.pendientes} color="text-amber-600" />
        <Stat label="Contactados" valor={stats.contactados} color="text-blue-600" />
        <Stat label="Cerrados" valor={stats.cerrados} color="text-green-600" />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(["Todos", "Pendiente", "Contactado", "Cerrado"] as const).map((op) => (
          <button key={op} onClick={() => setFiltro(op)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${filtro === op ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-100"}`}>
            {op}
          </button>
        ))}
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
                <Link href={`/admin/generar/${c.id}`}
                  className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-amber-400 whitespace-nowrap">
                  📄 Generar PDF
                </Link>
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
              <label className="block text-xs font-medium text-slate-700 mb-1">URL de imagen (opcional)</label>
              <input value={formProyecto.imagen_url}
                onChange={(e) => setFormProyecto({ ...formProyecto, imagen_url: e.target.value })}
                placeholder="https://..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
              <p className="mt-1 text-xs text-slate-400">Sin imagen, se muestra un color según el servicio.</p>
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
