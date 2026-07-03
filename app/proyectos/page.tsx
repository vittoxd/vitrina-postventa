"use client";

import { useEffect, useState } from "react";
import { servicios } from "@/lib/datos";
import { colorDeProyecto } from "@/lib/colores";
import { supabase } from "@/lib/supabase";
import { Proyecto, ServicioSlug } from "@/lib/tipos";

type FiltroServicio = ServicioSlug | "Todos";

export default function ProyectosPage() {
  const [filtro, setFiltro] = useState<FiltroServicio>("Todos");
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);

  useEffect(() => {
    supabase
      .from("proyectos")
      .select("*")
      .order("destacado", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => setProyectos((data as Proyecto[]) ?? []));
  }, []);

  const visibles: Proyecto[] =
    filtro === "Todos" ? proyectos : proyectos.filter((p) => p.categoria === filtro);

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="text-3xl font-extrabold text-slate-900">Trabajos realizados</h1>
      <p className="mt-2 text-slate-600">Explora algunos de los proyectos que hemos completado.</p>

      {/* Filtros por servicio */}
      <div className="mt-6 flex flex-wrap gap-2">
        <FiltroBtn label="Todos" activo={filtro === "Todos"} onClick={() => setFiltro("Todos")} />
        {servicios.map((s) => (
          <FiltroBtn
            key={s.slug}
            label={s.titulo}
            activo={filtro === s.slug}
            onClick={() => setFiltro(s.slug)}
          />
        ))}
      </div>

      {/* Grilla */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visibles.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {p.imagen_url ? (
              <img src={p.imagen_url} alt={p.titulo} className="h-44 w-full object-cover" />
            ) : (
              <div className="flex h-44 items-center justify-center text-white" style={{ background: colorDeProyecto(p.categoria) }}>
                <span className="rounded-full bg-black/20 px-3 py-1 text-xs font-medium">
                  {servicios.find((s) => s.slug === p.categoria)?.titulo ?? p.categoria}
                </span>
              </div>
            )}
            <div className="p-4">
              <h3 className="font-semibold text-slate-900">{p.titulo}</h3>
              <p className="mt-1 text-sm text-slate-600">{p.descripcion}</p>
              <p className="mt-2 text-xs text-slate-400">📍 {p.ubicacion}</p>
            </div>
          </div>
        ))}
      </div>

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
