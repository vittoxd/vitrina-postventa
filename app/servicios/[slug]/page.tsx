import Link from "next/link";
import { notFound } from "next/navigation";
import { servicios } from "@/lib/datos";
import { ServicioSlug } from "@/lib/tipos";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return servicios.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const s = servicios.find((x) => x.slug === slug);
  return { title: s ? `${s.titulo} — IncluWork` : "Servicio" };
}

export default async function ServicioDetallePage({ params }: Props) {
  const { slug } = await params;
  const servicio = servicios.find((s) => s.slug === (slug as ServicioSlug));
  if (!servicio) notFound();

  return (
    <main className="mx-auto max-w-4xl px-5 py-14">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-amber-600">Inicio</Link>
        {" / "}
        <Link href="/servicios" className="hover:text-amber-600">Servicios</Link>
        {" / "}
        <span className="text-slate-800">{servicio.titulo}</span>
      </nav>

      {/* Encabezado */}
      <div className="flex items-center gap-4">
        <span className="text-5xl">{servicio.icono}</span>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">{servicio.titulo}</h1>
          <p className="mt-1 text-slate-600 max-w-xl">{servicio.desc}</p>
        </div>
      </div>

      {/* CTA principal */}
      <div className="mt-10 rounded-2xl bg-amber-50 border border-amber-200 p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-900 text-lg">¿Te interesa este servicio?</p>
          <p className="text-sm text-slate-600 mt-1">
            Completa el formulario y te contactamos con una cotización sin compromiso.
          </p>
        </div>
        <Link
          href={`/cotizar/${servicio.slug}`}
          className="shrink-0 rounded-lg bg-amber-500 px-6 py-3 font-semibold text-slate-900 hover:bg-amber-400 text-center"
        >
          Solicitar cotización
        </Link>
      </div>

      {/* Qué incluye (genérico) */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-900">¿Cómo funciona?</h2>
        <ol className="mt-4 space-y-3">
          {[
            "Completas el formulario con tus datos y lo que necesitas.",
            "Nuestro equipo revisa tu solicitud y te contacta dentro de 24 horas.",
            "Coordinamos una visita o videollamada para evaluar el proyecto.",
            "Recibes tu cotización detallada sin compromiso.",
          ].map((paso, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-700">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-500 text-xs font-bold text-white">
                {i + 1}
              </span>
              {paso}
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-10 flex gap-3">
        <Link
          href={`/cotizar/${servicio.slug}`}
          className="rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-700"
        >
          Solicitar cotización
        </Link>
        <Link
          href="/servicios"
          className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
        >
          Ver otros servicios
        </Link>
      </div>
    </main>
  );
}
