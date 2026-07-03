import Link from "next/link";

export const metadata = { title: "¡Solicitud enviada! — IncluWork" };

export default function GraciasPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] px-5 text-center">
      <span className="text-6xl">✅</span>
      <h1 className="mt-6 text-3xl font-extrabold text-slate-900">¡Solicitud recibida!</h1>
      <p className="mt-3 text-slate-600 max-w-md">
        Gracias por contactarnos. Nuestro equipo revisará tu solicitud y se pondrá en contacto contigo en menos de 24 horas hábiles.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/servicios"
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Ver más servicios
        </Link>
        <Link
          href="/"
          className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-400"
        >
          Volver al inicio
        </Link>
      </div>

      <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 px-8 py-6 max-w-md text-center">
        <p className="text-slate-500 text-sm">¿Ya tuvimos el gusto de trabajar contigo antes?</p>
        <p className="text-slate-700 font-semibold mt-1">Cuéntanos cómo fue tu experiencia</p>
        <Link
          href="/postventa"
          className="mt-4 inline-block rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
        >
          💬 Ir a Post-venta
        </Link>
      </div>
    </main>
  );
}
