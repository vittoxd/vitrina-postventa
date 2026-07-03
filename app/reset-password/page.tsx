"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [listoParaEscribir, setListoParaEscribir] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // El link de "reset password" trae la sesión en el fragmento de la
    // URL (#access_token=...). El cliente de Supabase la detecta sola
    // al cargar la página (detectSessionInUrl); acá solo confirmamos
    // que quedó una sesión válida antes de mostrar el formulario.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setListoParaEscribir(true);
      } else {
        setError("Este link ya no es válido o expiró. Pide uno nuevo desde Supabase.");
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmacion) {
      setError("Las dos contraseñas no coinciden.");
      return;
    }

    setCargando(true);
    const { error } = await supabase.auth.updateUser({ password });
    setCargando(false);

    if (error) {
      setError("No se pudo cambiar la contraseña: " + error.message);
      return;
    }

    router.push("/admin/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div className="mb-6 text-center">
          <span className="inline-flex size-10 items-center justify-center rounded-lg bg-amber-500 font-extrabold text-white">
            IW
          </span>
          <h1 className="mt-3 text-lg font-bold text-slate-900">Nueva contraseña</h1>
          <p className="text-sm text-slate-500">IncluWork</p>
        </div>

        {listoParaEscribir ? (
          <>
            <label className="mb-3 block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Contraseña nueva</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
              />
            </label>

            <label className="mb-4 block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Repite la contraseña</span>
              <input
                type="password"
                required
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
              />
            </label>

            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
            >
              {cargando ? "Guardando..." : "Guardar contraseña"}
            </button>
          </>
        ) : (
          !error && <p className="text-center text-sm text-slate-500">Verificando el link...</p>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
      </form>
    </div>
  );
}
