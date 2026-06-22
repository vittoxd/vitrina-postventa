"use client";

import { useState } from "react";
import { proyectos } from "@/lib/datos";
import { CATEGORIAS, Categoria } from "@/lib/tipos";

export default function ProyectosPage() {
  const [filtro, setFiltro] = useState<Categoria | "Todos">("Todos");

  const visibles = filtro === "Todos" ? proyectos : proyectos.filter((p) => p.categoria === filtro);
  const opciones: (Categoria | "Todos")[] = ["Todos", ...CATEGORIAS];

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="text-3xl font-extrabold text-slate-900">Nuestros proyectos</h1>
      <p className="mt-2 text-slate-600">Explora algunos de los trabajos que hemos realizado.</p>

      {/* Filtro por categoría */}
      <div className="mt-6 flex flex-wrap gap-2">
        {opciones.map((op) => (
          <button
            key={op}
            onClick={() => setFiltro(op)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filtro === op
                ? "bg-slate-900 text-white"
                : "border border-slate-300 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {op}
          </button>
        ))}
      </div>

      {/* Grilla de proyectos */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visibles.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex h-44 items-center justify-center text-white" style={{ background: p.color }}>
              <span className="rounded-full bg-black/20 px-3 py-1 text-xs font-medium">{p.categoria}</span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-slate-900">{p.titulo}</h3>
              <p className="mt-1 text-sm text-slate-600">{p.descripcion}</p>
              <p className="mt-2 text-xs text-slate-400">📍 {p.ubicacion}</p>
            </div>
          </div>
        ))}
      </div>

      {visibles.length === 0 && (
        <p className="mt-10 text-center text-slate-500">No hay proyectos en esta categoría.</p>
      )}
    </main>
  );
}
