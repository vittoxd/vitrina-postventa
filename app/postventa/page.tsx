"use client";

import { useState } from "react";
import { servicios } from "@/lib/datos";
import { TipoPostventa } from "@/lib/tipos";

type Trabajo = { id: string; nombre: string; servicio: string; created_at: string };
type Paso = "verificar" | "formulario" | "enviado";

const TIPOS: { valor: TipoPostventa; label: string; desc: string; icono: string }[] = [
  { valor: "satisfaccion", label: "Satisfacción", desc: "Cuéntanos tu experiencia", icono: "😊" },
  { valor: "garantia", label: "Garantía", desc: "Necesito una revisión", icono: "🔧" },
  { valor: "consulta", label: "Consulta", desc: "Tengo una pregunta", icono: "❓" },
  { valor: "reclamo", label: "Reclamo", desc: "Tuve un problema", icono: "🚨" },
];

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });
}

function tituloServicio(slug: string) {
  return servicios.find((s) => s.slug === slug)?.titulo ?? slug;
}

export default function PostventaPage() {
  const [paso, setPaso] = useState<Paso>("verificar");
  const [contacto, setContacto] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [trabajoId, setTrabajoId] = useState("");
  const [calificacion, setCalificacion] = useState(0);
  const [tipo, setTipo] = useState<TipoPostventa | "">("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function verificar(e: React.FormEvent) {
    e.preventDefault();
    setBuscando(true);
    setError("");
    const res = await fetch("/api/postventa/verificar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contacto }),
    });
    const data = await res.json();
    setBuscando(false);
    if (!data.encontrado) {
      setError("No encontramos trabajos completados asociados a ese email o teléfono.");
      return;
    }
    setTrabajos(data.trabajos);
    setTrabajoId(data.trabajos[0].id);
    setPaso("formulario");
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!calificacion || !tipo || !mensaje.trim()) return;
    setEnviando(true);
    await fetch("/api/postventa/enviar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cotizacion_id: trabajoId, calificacion, tipo, mensaje }),
    });
    setEnviando(false);
    setPaso("enviado");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 py-14 text-center">
        <p className="text-amber-400 text-sm font-semibold tracking-widest mb-2">POSTVENTA</p>
        <h1 className="text-3xl font-extrabold text-white">¿Cómo estuvo tu experiencia?</h1>
        <p className="mt-2 text-slate-400 text-sm">Ingresa tus datos para acceder al formulario de post-venta</p>
      </div>

      <div className="mx-auto max-w-lg px-5 py-12">

        {/* Paso 1 — Verificar */}
        {paso === "verificar" && (
          <form onSubmit={verificar} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email o teléfono con que cotizaste</label>
              <input
                type="text"
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
                placeholder="ejemplo@correo.com o +56912345678"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>}
            <button
              type="submit"
              disabled={buscando || !contacto}
              className="w-full rounded-xl bg-amber-500 py-3 font-semibold text-slate-900 hover:bg-amber-400 disabled:opacity-60"
            >
              {buscando ? "Buscando…" : "Continuar →"}
            </button>
          </form>
        )}

        {/* Paso 2 — Formulario */}
        {paso === "formulario" && (
          <form onSubmit={enviar} className="space-y-6">

            {/* Selector de trabajo si hay más de uno */}
            {trabajos.length > 1 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <p className="text-sm font-medium text-slate-700 mb-3">¿Sobre cuál trabajo quieres opinar?</p>
                <div className="space-y-2">
                  {trabajos.map((t) => (
                    <label key={t.id} className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition ${trabajoId === t.id ? "border-amber-500 bg-amber-50" : "border-slate-200 hover:bg-slate-50"}`}>
                      <input type="radio" name="trabajo" value={t.id} checked={trabajoId === t.id} onChange={() => setTrabajoId(t.id)} className="accent-amber-500" />
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{tituloServicio(t.servicio)}</p>
                        <p className="text-xs text-slate-500">{fmtFecha(t.created_at)}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Tipo */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <p className="text-sm font-medium text-slate-700 mb-3">¿Qué quieres hacer?</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {TIPOS.map((t) => (
                  <button
                    key={t.valor}
                    type="button"
                    onClick={() => setTipo(t.valor)}
                    className={`rounded-xl border p-3 text-center transition ${tipo === t.valor ? "border-amber-500 bg-amber-50" : "border-slate-200 hover:bg-slate-50"}`}
                  >
                    <p className="text-2xl">{t.icono}</p>
                    <p className="text-xs font-semibold text-slate-700 mt-1">{t.label}</p>
                    <p className="text-xs text-slate-400">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Calificación */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <p className="text-sm font-medium text-slate-700 mb-3">Califica tu experiencia</p>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCalificacion(n)}
                    className={`text-3xl transition-transform hover:scale-110 ${n <= calificacion ? "opacity-100" : "opacity-30"}`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              {calificacion > 0 && (
                <p className="text-center text-xs text-slate-500 mt-2">
                  {["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"][calificacion]}
                </p>
              )}
            </div>

            {/* Mensaje */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {tipo === "reclamo" ? "Describe el problema" : tipo === "consulta" ? "¿Cuál es tu consulta?" : "Cuéntanos tu experiencia"}
              </label>
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                rows={4}
                placeholder="Escribe aquí..."
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-amber-500 focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={enviando || !calificacion || !tipo || !mensaje.trim()}
              className="w-full rounded-xl bg-amber-500 py-3.5 font-semibold text-slate-900 hover:bg-amber-400 disabled:opacity-60"
            >
              {enviando ? "Enviando…" : "Enviar →"}
            </button>
          </form>
        )}

        {/* Paso 3 — Enviado */}
        {paso === "enviado" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
            <p className="text-5xl mb-4">🙌</p>
            <h2 className="text-xl font-bold text-slate-900 mb-2">¡Gracias por tu respuesta!</h2>
            <p className="text-slate-500 text-sm">Tu opinión nos ayuda a mejorar. El equipo de IncluWork la revisará pronto.</p>
          </div>
        )}
      </div>
    </main>
  );
}
