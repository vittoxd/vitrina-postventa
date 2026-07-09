"use client";

import { useEffect, useState } from "react";
import { Proyecto } from "@/lib/tipos";

// Devuelve todas las fotos de un proyecto: la galería nueva (imagenes[]) o,
// para proyectos viejos, la portada única (imagen_url).
export function fotosDe(p: Proyecto): string[] {
  if (p.imagenes && p.imagenes.length > 0) return p.imagenes;
  return p.imagen_url ? [p.imagen_url] : [];
}

/**
 * Modal de galería (lightbox) para un proyecto. Se muestra cuando `proyecto`
 * no es null; `onClose` lo cierra. Navega con flechas ‹ ›, miniaturas y
 * teclado (← → y Esc). Es un único componente reutilizado por el home y la
 * página pública de proyectos, para no duplicar la lógica.
 */
export default function GaleriaLightbox({
  proyecto,
  onClose,
}: {
  proyecto: Proyecto | null;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const fotos = proyecto ? fotosDe(proyecto) : [];

  // Al abrir otro proyecto, vuelve a la primera foto.
  useEffect(() => { setIdx(0); }, [proyecto]);

  // Navegación con teclado mientras la galería está abierta.
  useEffect(() => {
    if (!proyecto) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % fotos.length);
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + fotos.length) % fotos.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyecto]);

  if (!proyecto || fotos.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 px-4 py-6"
      onClick={onClose}>
      <button onClick={onClose}
        className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20">×</button>

      <div className="relative flex w-full max-w-4xl items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {fotos.length > 1 && (
          <button onClick={() => setIdx((i) => (i - 1 + fotos.length) % fotos.length)}
            className="absolute left-2 flex size-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20">‹</button>
        )}
        <img src={fotos[idx]} alt={proyecto.titulo}
          className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain" />
        {fotos.length > 1 && (
          <button onClick={() => setIdx((i) => (i + 1) % fotos.length)}
            className="absolute right-2 flex size-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20">›</button>
        )}
      </div>

      <div className="mt-4 w-full max-w-4xl text-center" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-medium text-white">{proyecto.titulo}</p>
        {fotos.length > 1 && (
          <>
            <p className="mt-0.5 text-xs text-white/60">{idx + 1} / {fotos.length}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {fotos.map((url, i) => (
                <button key={url} onClick={() => setIdx(i)}
                  className={`size-14 overflow-hidden rounded-md border-2 transition ${i === idx ? "border-amber-400" : "border-transparent opacity-60 hover:opacity-100"}`}>
                  <img src={url} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
