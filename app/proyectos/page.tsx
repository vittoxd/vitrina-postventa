"use client";

import { useEffect, useState } from "react";
import { colorDeProyecto } from "@/lib/colores";
import { supabase } from "@/lib/supabase";
import { Proyecto } from "@/lib/tipos";
import GaleriaLightbox, { fotosDe } from "@/components/GaleriaLightbox";

export default function ProyectosPage() {
  const [filtro, setFiltro] = useState<string>("Todos");
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  // Proyecto cuya galería está abierta (null = cerrada).
  const [galeria, setGaleria] = useState<Proyecto | null>(null);

  useEffect(() => {
    supabase
      .from("proyectos")
      .select("*")
      .order("destacado", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => setProyectos((data as Proyecto[]) ?? []));
  }, []);

  function abrirGaleria(p: Proyecto) {
    if (fotosDe(p).length === 0) return;
    setGaleria(p);
  }

  // Filtros dinámicos: las categorías que realmente escribieron en los proyectos.
  const categorias = [...new Set(proyectos.map((p) => p.categoria).filter(Boolean))].sort();

  const visibles: Proyecto[] =
    filtro === "Todos" ? proyectos : proyectos.filter((p) => p.categoria === filtro);

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="text-3xl font-extrabold text-slate-900">Trabajos realizados</h1>
      <p className="mt-2 text-slate-600">Explora algunos de los proyectos que hemos completado.</p>

      {/* Filtros por categoría (generados de lo que se escribió en los proyectos) */}
      {categorias.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <FiltroBtn label="Todos" activo={filtro === "Todos"} onClick={() => setFiltro("Todos")} />
          {categorias.map((c) => (
            <FiltroBtn key={c} label={c} activo={filtro === c} onClick={() => setFiltro(c)} />
          ))}
        </div>
      )}

      {/* Grilla */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visibles.map((p) => {
          const fotos = fotosDe(p);
          const tieneFotos = fotos.length > 0;
          return (
          <div key={p.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {tieneFotos ? (
              <button type="button" onClick={() => abrirGaleria(p)}
                className="group relative block h-44 w-full cursor-pointer overflow-hidden">
                <img src={fotos[0]} alt={p.titulo} className="h-44 w-full object-cover transition group-hover:scale-105" />
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800">🔍 Ver fotos</span>
                </span>
                {fotos.length > 1 && (
                  <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                    🖼️ {fotos.length}
                  </span>
                )}
              </button>
            ) : (
              <div className="flex h-44 items-center justify-center text-white" style={{ background: colorDeProyecto(p.categoria) }}>
                <span className="rounded-full bg-black/20 px-3 py-1 text-xs font-medium">
                  {p.categoria}
                </span>
              </div>
            )}
            <div className="p-4">
              <h3 className="font-semibold text-slate-900">{p.titulo}</h3>
              <p className="mt-1 text-sm text-slate-600">{p.descripcion}</p>
              <p className="mt-2 text-xs text-slate-400">📍 {p.ubicacion}</p>
            </div>
          </div>
          );
        })}
      </div>

      <GaleriaLightbox proyecto={galeria} onClose={() => setGaleria(null)} />

      {visibles.length === 0 && (
        <p className="mt-10 text-center text-slate-500">No hay proyectos en esta categoría aún.</p>
      )}
    </main>
  );
}

function FiltroBtn({ label, activo, onClick }: { label: string; activo: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
        activo
          ? "bg-slate-900 text-white"
          : "border border-slate-300 text-slate-600 hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );
}
