import Link from "next/link";
import { empresa, servicios } from "@/lib/datos";
import { supabasePublic } from "@/lib/supabase-public";
import { Proyecto } from "@/lib/tipos";
import DestacadosGrid from "@/components/DestacadosGrid";

export default async function Home() {
  const { data } = await supabasePublic
    .from("proyectos")
    .select("*")
    .order("destacado", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(3);
  const destacados = (data as Proyecto[]) ?? [];
  const waLink = `https://wa.me/${empresa.whatsapp}?text=Hola, me interesa cotizar un proyecto con IncluWork`;

  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-700 px-5 py-24 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 inline-block rounded-full bg-amber-500/20 px-3 py-1 text-sm font-medium text-amber-300">
            {empresa.rubro}
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
            {empresa.eslogan}
          </h1>
          <p className="mt-4 max-w-xl text-slate-300">
            Ventanas PVC, muebles, aire acondicionado, gasfitería, obras civiles y más.
            Cotiza en minutos y te contactamos en menos de 24 horas.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/servicios" className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-slate-900 hover:bg-amber-400">
              Ver servicios
            </Link>
            <a href={waLink} target="_blank" className="rounded-lg border border-white/30 px-6 py-3 font-semibold hover:bg-white/10">
              💬 WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Nuestros servicios</h2>
          <Link href="/servicios" className="text-sm font-semibold text-amber-600 hover:underline">
            Ver todos →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {servicios.map((s) => (
            <Link
              key={s.slug}
              href={`/servicios/${s.slug}`}
              className="group flex flex-col rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-amber-400 hover:shadow-md transition bg-white"
            >
              <span className="text-3xl">{s.icono}</span>
              <h3 className="mt-3 font-semibold text-slate-900 group-hover:text-amber-600 text-sm">{s.titulo}</h3>
              <p className="mt-1 text-xs text-slate-500 flex-1 line-clamp-2">{s.desc}</p>
              <span className="mt-3 text-xs font-semibold text-amber-600">Cotizar →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Proyectos destacados */}
      <section className="bg-slate-50 px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Trabajos realizados</h2>
            <Link href="/proyectos" className="text-sm font-semibold text-amber-600 hover:underline">
              Ver todos →
            </Link>
          </div>
          <DestacadosGrid destacados={destacados} />
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-5 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-900">¿Tienes un proyecto en mente?</h2>
        <p className="mt-2 text-slate-600">Cuéntanos qué necesitas y te enviamos una cotización sin compromiso.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/servicios" className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-slate-900 hover:bg-amber-400">
            Solicitar cotización
          </Link>
          <a href={waLink} target="_blank" className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50">
            💬 WhatsApp
          </a>
        </div>
      </section>
    </main>
  );
}
