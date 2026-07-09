"use client";

import { useState } from "react";
import { servicios } from "@/lib/datos";
import { colorDeProyecto } from "@/lib/colores";
import { Proyecto } from "@/lib/tipos";
import GaleriaLightbox, { fotosDe } from "@/components/GaleriaLightbox";

// Grilla de "Trabajos realizados" del home. Recibe los destacados desde el
// componente de servidor y hace clickeables las fotos para abrir la galería.
export default function DestacadosGrid({ destacados }: { destacados: Proyecto[] }) {
  const [galeria, setGaleria] = useState<Proyecto | null>(null);

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-3">
        {destacados.length === 0 && (
          <p className="col-span-3 text-center text-sm text-slate-500">Todavía no hay proyectos publicados.</p>
        )}
        {destacados.map((p) => {
          const fotos = fotosDe(p);
          return (
            <div key={p.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {fotos.length > 0 ? (
                <button type="button" onClick={() => setGaleria(p)}
                  className="group relative block h-40 w-full cursor-pointer overflow-hidden">
                  <img src={fotos[0]} alt={p.titulo} className="h-40 w-full object-cover transition group-hover:scale-105" />
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800">🔍 Ver fotos</span>
                  </span>
                  {fotos.length > 1 && (
                    <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">🖼️ {fotos.length}</span>
                  )}
                </button>
              ) : (
                <div className="flex h-40 items-center justify-center text-white" style={{ background: colorDeProyecto(p.categoria) }}>
                  <span className="rounded-full bg-black/20 px-3 py-1 text-xs font-medium">
                    {servicios.find((s) => s.slug === p.categoria)?.titulo ?? p.categoria}
                  </span>
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-slate-900 text-sm">{p.titulo}</h3>
                <p className="mt-1 text-xs text-slate-600">{p.descripcion}</p>
                <p className="mt-2 text-xs text-slate-400">📍 {p.ubicacion}</p>
              </div>
            </div>
          );
        })}
      </div>

      <GaleriaLightbox proyecto={galeria} onClose={() => setGaleria(null)} />
    </>
  );
}
