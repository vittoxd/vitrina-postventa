"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { servicios } from "@/lib/datos";
import { Cotizacion } from "@/lib/tipos";
import type { ItemPDF } from "@/components/PDFCotizacion";

type Props = { params: Promise<{ id: string }> };

const itemVacio = (): ItemPDF => ({
  pos: "", descripcion: "", color: "", dimensiones: "", uds: 1, m2Unit: 0, precioUnit: 0,
});

export default function GenerarPDFPage({ params }: Props) {
  const { id } = use(params);
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
  const [items, setItems] = useState<ItemPDF[]>([itemVacio()]);
  const [nota, setNota] = useState("");
  const [numeroPedido, setNumeroPedido] = useState("");
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    supabase.from("cotizaciones").select("*").eq("id", id).single()
      .then(({ data }) => {
        if (data) {
          const c = data as Cotizacion;
          setCotizacion(c);
          setNumeroPedido(`COT-${c.created_at.slice(0, 10).replace(/-/g, "")}-${id.slice(0, 4).toUpperCase()}`);

          // Pre-llenar el primer ítem con los datos que ingresó el cliente
          const ex = c.campos_extra ?? {};
          const ancho = ex["ancho"] ? `${ex["ancho"]} cm` : "";
          const alto  = ex["alto"]  ? `${ex["alto"]} cm`  : "";
          const dim   = ancho && alto ? `${ancho} x ${alto}` : ancho || alto || "";
          const uds   = ex["cantidad"] ? parseInt(ex["cantidad"]) : ex["cantidad_puertas"] ? parseInt(ex["cantidad_puertas"]) : 1;

          setItems([{
            pos: "V1",
            descripcion: "",
            color: ex["color"] ?? ex["color_terminacion"] ?? ex["color_referencia"] ?? "",
            dimensiones: dim,
            uds,
            m2Unit: 0,
            precioUnit: 0,
          }]);
        }
      });
  }, [id]);

  function tituloServicio(slug: string) {
    return servicios.find((s) => s.slug === slug)?.titulo ?? slug;
  }

  function agregarItem() {
    setItems((prev) => [...prev, itemVacio()]);
  }

  function eliminarItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  function actualizarItem(i: number, campo: keyof ItemPDF, valor: string | number) {
    setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, [campo]: valor } : it));
  }

  const subtotal = items.reduce((acc, it) => acc + it.precioUnit * it.uds, 0);
  const iva = Math.round(subtotal * 0.19);
  const total = subtotal + iva;

  const fecha = new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });

  async function descargarPDF() {
    if (!cotizacion) return;
    setGenerando(true);
    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numeroPedido,
          cliente: `${cotizacion.nombre} — ${cotizacion.email}`,
          fecha,
          servicio: tituloServicio(cotizacion.servicio),
          comuna: cotizacion.comuna,
          items,
          nota,
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
    } catch (e) {
      alert("Error al generar el PDF. Intenta de nuevo.");
    } finally {
      setGenerando(false);
    }
  }

  if (!cotizacion) return <p className="p-10 text-slate-500">Cargando…</p>;

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin" className="text-sm text-amber-600 hover:underline">← Volver al admin</Link>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900">Generar cotización PDF</h1>
        </div>
      </div>

      {/* Datos del cliente (solo lectura) */}
      <div className="grid sm:grid-cols-4 gap-3 mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <Dato label="Cliente" valor={cotizacion.nombre} />
        <Dato label="Teléfono" valor={cotizacion.telefono} />
        <Dato label="Email" valor={cotizacion.email} />
        <Dato label="Comuna" valor={cotizacion.comuna} />
        <Dato label="Servicio" valor={tituloServicio(cotizacion.servicio)} />
        <div className="sm:col-span-3">
          <Dato label="Descripción del cliente" valor={cotizacion.descripcion} />
        </div>
      </div>

      {/* Datos extra del cliente */}
      {cotizacion.campos_extra && Object.keys(cotizacion.campos_extra).length > 0 && (
        <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4">
          <p className="text-xs font-semibold text-amber-800 uppercase mb-2">Datos que ingresó el cliente</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(cotizacion.campos_extra).map(([k, v]) => (
              v ? (
                <div key={k}>
                  <p className="text-xs text-amber-700 capitalize">{k.replace(/_/g, " ")}</p>
                  <p className="text-sm font-semibold text-amber-900">{v}</p>
                </div>
              ) : null
            ))}
          </div>
        </div>
      )}

      {/* N° pedido editable */}
      <div className="mb-6 flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700 shrink-0">N° Cotización:</label>
        <input
          value={numeroPedido}
          onChange={(e) => setNumeroPedido(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono focus:border-amber-500 focus:outline-none"
        />
      </div>

      {/* Tabla de ítems */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-white text-xs">
            <tr>
              <th className="px-3 py-2 text-left w-16">Pos.</th>
              <th className="px-3 py-2 text-left">Descripción</th>
              <th className="px-3 py-2 text-left w-28">Color</th>
              <th className="px-3 py-2 text-left w-32">Dimensiones</th>
              <th className="px-3 py-2 text-right w-14">Uds</th>
              <th className="px-3 py-2 text-right w-20">M² unit.</th>
              <th className="px-3 py-2 text-right w-28">Precio unit. ($)</th>
              <th className="px-3 py-2 text-right w-28">Total ($)</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="px-3 py-1.5">
                  <input value={it.pos} onChange={(e) => actualizarItem(i, "pos", e.target.value)}
                    placeholder={`V${i + 1}`} className="w-full rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:border-amber-400" />
                </td>
                <td className="px-3 py-1.5">
                  <input value={it.descripcion} onChange={(e) => actualizarItem(i, "descripcion", e.target.value)}
                    placeholder="Ej: Ventana corredera 2 hojas móviles" className="w-full rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:border-amber-400" />
                </td>
                <td className="px-3 py-1.5">
                  <input value={it.color} onChange={(e) => actualizarItem(i, "color", e.target.value)}
                    placeholder="Nogal" className="w-full rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:border-amber-400" />
                </td>
                <td className="px-3 py-1.5">
                  <input value={it.dimensiones} onChange={(e) => actualizarItem(i, "dimensiones", e.target.value)}
                    placeholder="1.20 x 1.60 m" className="w-full rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:border-amber-400" />
                </td>
                <td className="px-3 py-1.5">
                  <input type="number" min={1} value={it.uds} onChange={(e) => actualizarItem(i, "uds", +e.target.value)}
                    className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-right focus:outline-none focus:border-amber-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                </td>
                <td className="px-3 py-1.5">
                  <input type="number" min={0} step={0.01} value={it.m2Unit} onChange={(e) => actualizarItem(i, "m2Unit", +e.target.value)}
                    className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-right focus:outline-none focus:border-amber-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                </td>
                <td className="px-3 py-1.5">
                  <input type="number" min={0} value={it.precioUnit} onChange={(e) => actualizarItem(i, "precioUnit", +e.target.value)}
                    className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-right focus:outline-none focus:border-amber-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                </td>
                <td className="px-3 py-1.5 text-right font-medium text-slate-700 text-xs whitespace-nowrap">
                  $ {(it.precioUnit * it.uds).toLocaleString("es-CL")}
                </td>
                <td className="pr-2">
                  {items.length > 1 && (
                    <button onClick={() => eliminarItem(i)} className="text-slate-400 hover:text-red-500 text-lg leading-none">×</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="px-4 py-3 border-t border-slate-100">
          <button onClick={agregarItem} className="text-sm text-amber-600 hover:underline font-medium">
            + Agregar ítem
          </button>
        </div>
      </div>

      {/* Totales */}
      <div className="mt-4 flex justify-end">
        <div className="space-y-1 text-sm min-w-[200px]">
          <div className="flex justify-between text-slate-600">
            <span>Base imponible</span>
            <span>$ {subtotal.toLocaleString("es-CL")}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>IVA 19%</span>
            <span>$ {iva.toLocaleString("es-CL")}</span>
          </div>
          <div className="flex justify-between font-bold text-slate-900 text-base border-t border-slate-200 pt-2 mt-2">
            <span>Total</span>
            <span>$ {total.toLocaleString("es-CL")}</span>
          </div>
        </div>
      </div>

      {/* Nota */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-slate-700 mb-1">Nota (opcional)</label>
        <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={2}
          placeholder="Ej: Forma de pago, plazo de entrega, condiciones especiales…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none resize-none" />
      </div>

      {/* Botón descargar */}
      <div className="mt-8">
        <button
          onClick={descargarPDF}
          disabled={generando}
          className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-slate-900 hover:bg-amber-400 disabled:opacity-60"
        >
          {generando ? "Generando PDF…" : "⬇ Descargar PDF"}
        </button>
      </div>
    </main>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 uppercase">{label}</p>
      <p className="text-sm font-medium text-slate-800 mt-0.5">{valor}</p>
    </div>
  );
}
