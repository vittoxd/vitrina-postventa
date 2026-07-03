import Link from "next/link";
import { servicios } from "@/lib/datos";

export const metadata = { title: "Servicios — IncluWork" };

export default function ServiciosPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="text-3xl font-extrabold text-slate-900">Nuestros servicios</h1>
      <p className="mt-2 text-slate-600 max-w-xl">
        Selecciona el servicio que necesitas y completa un formulario rápido. Te contactamos a la brevedad con una cotización sin compromiso.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {servicios.map((s) => (
          <Link
            key={s.slug}
            href={`/servicios/${s.slug}`}
            className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-amber-400 hover:shadow-md"
          >
            <span className="text-4xl">{s.icono}</span>
            <h2 className="mt-4 text-lg font-semibold text-slate-900 group-hover:text-amber-600">
              {s.titulo}
            </h2>
            <p className="mt-2 text-sm text-slate-600 flex-1">{s.desc}</p>
            <span className="mt-5 text-sm font-semibold text-amber-600 group-hover:underline">
              Cotizar →
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
