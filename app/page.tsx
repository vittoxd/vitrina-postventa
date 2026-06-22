import Link from "next/link";
import { empresa, servicios, proyectos } from "@/lib/datos";

export default function Home() {
  const destacados = proyectos.slice(0, 3);
  const waLink = `https://wa.me/${empresa.whatsapp}?text=Hola, me interesa cotizar un proyecto`;

  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-700 px-5 py-20 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 inline-block rounded-full bg-amber-500/20 px-3 py-1 text-sm font-medium text-amber-300">
            {empresa.rubro}
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
            {empresa.eslogan}
          </h1>
          <p className="mt-4 max-w-xl text-slate-300">
            Más de una década dando vida a proyectos de ventanas, construcción y remodelación
            con materiales de calidad y garantía real.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={waLink} target="_blank" className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-slate-900 hover:bg-amber-400">
              💬 Cotizar por WhatsApp
            </a>
            <Link href="/proyectos" className="rounded-lg border border-white/30 px-6 py-3 font-semibold hover:bg-white/10">
              Ver proyectos
            </Link>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-bold text-slate-900">Nuestros servicios</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {servicios.map((s) => (
            <div key={s.titulo} className="rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="text-3xl">{s.icono}</div>
              <h3 className="mt-3 font-semibold text-slate-900">{s.titulo}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Proyectos destacados */}
      <section className="bg-slate-50 px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Proyectos destacados</h2>
            <Link href="/proyectos" className="text-sm font-semibold text-amber-600 hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {destacados.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex h-40 items-center justify-center text-white" style={{ background: p.color }}>
                  <span className="text-sm font-medium opacity-80">{p.categoria}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900">{p.titulo}</h3>
                  <p className="mt-1 text-sm text-slate-600">{p.descripcion}</p>
                  <p className="mt-2 text-xs text-slate-400">📍 {p.ubicacion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA contacto */}
      <section className="mx-auto max-w-6xl px-5 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-900">¿Tienes un proyecto en mente?</h2>
        <p className="mt-2 text-slate-600">Escríbenos y te entregamos una cotización sin compromiso.</p>
        <a href={waLink} target="_blank" className="mt-6 inline-block rounded-lg bg-amber-500 px-6 py-3 font-semibold text-slate-900 hover:bg-amber-400">
          💬 Contactar por WhatsApp
        </a>
      </section>
    </main>
  );
}
