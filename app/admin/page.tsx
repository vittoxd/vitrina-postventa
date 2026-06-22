"use client";

// ─────────────────────────────────────────────────────────────
// Panel administrativo (demo) — Gestión de Post-Venta.
// Las solicitudes se ordenan por prioridad (la más antigua primero).
// "Agendar" asigna automáticamente un técnico según especialidad.
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import {
  solicitudes as solicitudesIniciales,
  tecnicos,
} from "@/lib/datos";
import { Solicitud, EstadoSolicitud } from "@/lib/tipos";

const colorEstado: Record<EstadoSolicitud, string> = {
  Pendiente: "bg-amber-100 text-amber-800",
  Agendado: "bg-blue-100 text-blue-800",
  Completado: "bg-green-100 text-green-800",
};

function fmtFecha(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit" }) +
    " " + new Date(iso).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

export default function AdminPage() {
  const [lista, setLista] = useState<Solicitud[]>(solicitudesIniciales);

  // Ordenadas por prioridad: más antigua primero, y pendientes arriba
  const ordenadas = useMemo(() => {
    const peso = { Pendiente: 0, Agendado: 1, Completado: 2 };
    return [...lista].sort(
      (a, b) =>
        peso[a.estado] - peso[b.estado] ||
        +new Date(a.fechaSolicitud) - +new Date(b.fechaSolicitud)
    );
  }, [lista]);

  const stats = {
    pendientes: lista.filter((s) => s.estado === "Pendiente").length,
    agendados: lista.filter((s) => s.estado === "Agendado").length,
    completados: lista.filter((s) => s.estado === "Completado").length,
  };

  // Agendar: asigna automáticamente el técnico de la especialidad correcta y disponible
  function agendar(s: Solicitud) {
    const tecnico =
      tecnicos.find((t) => t.especialidad === s.tipo && t.disponible) ??
      tecnicos.find((t) => t.disponible);
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 2);
    fecha.setHours(10, 0, 0, 0);
    setLista((prev) =>
      prev.map((x) =>
        x.id === s.id
          ? { ...x, estado: "Agendado", tecnicoAsignado: tecnico?.nombre ?? "Por asignar", fechaVisita: fecha.toISOString() }
          : x
      )
    );
  }

  function completar(s: Solicitud) {
    setLista((prev) => prev.map((x) => (x.id === s.id ? { ...x, estado: "Completado" } : x)));
  }

  const agenda = ordenadas.filter((s) => s.estado === "Agendado");

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900">Panel de administración</h1>
      <p className="mt-1 text-slate-600">Gestión de post-venta, agenda y personal.</p>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Pendientes" valor={stats.pendientes} color="text-amber-600" />
        <Stat label="Agendadas" valor={stats.agendados} color="text-blue-600" />
        <Stat label="Completadas" valor={stats.completados} color="text-green-600" />
      </div>

      {/* Solicitudes de post-venta */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-900">Solicitudes de post-venta</h2>
        <p className="mb-3 text-sm text-slate-500">Ordenadas por prioridad (la más antigua primero).</p>
        <div className="space-y-3">
          {ordenadas.map((s, i) => (
            <div key={s.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-bold text-slate-500">
                  {i + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{s.cliente}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorEstado[s.estado]}`}>
                      {s.estado}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{s.tipo}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600">{s.descripcion}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Solicitado: {fmtFecha(s.fechaSolicitud)}
                    {s.tecnicoAsignado && ` · 👷 ${s.tecnicoAsignado} · 📅 ${fmtFecha(s.fechaVisita)}`}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {s.estado === "Pendiente" && (
                  <button onClick={() => agendar(s)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500">
                    Agendar
                  </button>
                )}
                {s.estado === "Agendado" && (
                  <button onClick={() => completar(s)} className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-500">
                    Completar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {/* Agenda */}
        <section>
          <h2 className="text-xl font-bold text-slate-900">Agenda de visitas</h2>
          <div className="mt-3 space-y-2">
            {agenda.length === 0 && <p className="text-sm text-slate-500">Sin visitas agendadas.</p>}
            {agenda.map((s) => (
              <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm">
                <p className="font-semibold text-slate-900">📅 {fmtFecha(s.fechaVisita)}</p>
                <p className="text-slate-600">{s.cliente} — {s.tipo}</p>
                <p className="text-xs text-slate-400">👷 {s.tecnicoAsignado}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Personal */}
        <section>
          <h2 className="text-xl font-bold text-slate-900">Personal</h2>
          <div className="mt-3 space-y-2">
            {tecnicos.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm">
                <div>
                  <p className="font-semibold text-slate-900">{t.nombre}</p>
                  <p className="text-xs text-slate-500">Especialidad: {t.especialidad}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.disponible ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-600"}`}>
                  {t.disponible ? "Disponible" : "Ocupado"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
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
