"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { servicios } from "@/lib/datos";
import { ServicioSlug } from "@/lib/tipos";
import { use } from "react";

type Props = { params: Promise<{ slug: string }> };

export default function CotizarPage({ params }: Props) {
  const { slug } = use(params);
  const router = useRouter();
  const servicio = servicios.find((s) => s.slug === (slug as ServicioSlug));

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  if (!servicio) {
    return (
      <main className="mx-auto max-w-xl px-5 py-20 text-center">
        <p className="text-slate-600">Servicio no encontrado.</p>
        <Link href="/servicios" className="mt-4 inline-block text-amber-600 hover:underline">
          Ver servicios
        </Link>
      </main>
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setError("");

    const form = e.currentTarget;
    const data = new FormData(form);

    const campos_extra: Record<string, string> = {};
    servicio!.camposExtra?.forEach((c) => {
      campos_extra[c.name] = data.get(c.name) as string;
    });

    const body = {
      servicio: servicio!.slug,
      nombre: data.get("nombre"),
      telefono: data.get("telefono"),
      email: data.get("email"),
      comuna: data.get("comuna"),
      descripcion: data.get("descripcion"),
      campos_extra,
    };

    const res = await fetch("/api/cotizar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push("/gracias");
    } else {
      setError("Hubo un error al enviar. Por favor intenta de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-14">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/servicios" className="hover:text-amber-600">Servicios</Link>
        {" / "}
        <Link href={`/servicios/${servicio.slug}`} className="hover:text-amber-600">{servicio.titulo}</Link>
        {" / "}
        <span className="text-slate-800">Cotizar</span>
      </nav>

      <div className="flex items-center gap-3 mb-8">
        <span className="text-4xl">{servicio.icono}</span>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Solicitar cotización</h1>
          <p className="text-sm text-slate-500">{servicio.titulo}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Datos personales */}
        <fieldset className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <legend className="text-sm font-semibold text-slate-700 px-1">Tus datos</legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Nombre completo" name="nombre" placeholder="Juan Pérez" required />
            <Campo label="Teléfono" name="telefono" placeholder="+56 9 1234 5678" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Email" name="email" placeholder="juan@email.com" type="email" required />
            <Campo label="Comuna / Ciudad" name="comuna" placeholder="Santiago" required />
          </div>
          <Campo label="Dirección" name="direccion" placeholder="Ej: Av. Los Aromos 123, depto 4B" required />
        </fieldset>

        {/* Campos específicos del servicio */}
        {servicio.camposExtra && servicio.camposExtra.length > 0 && (
          <fieldset className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <legend className="text-sm font-semibold text-slate-700 px-1">Detalles del servicio</legend>
            {servicio.camposExtra.map((campo) =>
              campo.tipo === "select" ? (
                <div key={campo.name}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{campo.label}</label>
                  <select
                    name={campo.name}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value="">Selecciona una opción</option>
                    {campo.opciones?.map((op) => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <Campo
                  key={campo.name}
                  label={campo.label}
                  name={campo.name}
                  placeholder={campo.placeholder}
                  type={campo.tipo}
                />
              )
            )}
          </fieldset>
        )}

        {/* Descripción libre */}
        <fieldset className="rounded-2xl border border-slate-200 bg-white p-6">
          <legend className="text-sm font-semibold text-slate-700 px-1">Cuéntanos qué necesitas</legend>
          <textarea
            name="descripcion"
            required
            rows={4}
            placeholder="Describe con detalle lo que necesitas, el lugar, condiciones especiales, etc."
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none resize-none"
          />
        </fieldset>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-lg bg-amber-500 py-3 font-semibold text-slate-900 hover:bg-amber-400 disabled:opacity-60"
        >
          {enviando ? "Enviando…" : "Enviar solicitud"}
        </button>

        <p className="text-xs text-center text-slate-400">
          Te contactamos en menos de 24 horas hábiles. Sin compromiso.
        </p>
      </form>
    </main>
  );
}

function Campo({
  label, name, placeholder, type = "text", required = false,
}: {
  label: string; name: string; placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
      />
    </div>
  );
}
