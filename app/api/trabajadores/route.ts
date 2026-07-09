import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Gestión de cuentas de trabajadores. Todas las operaciones exigen que
// quien llama tenga sesión y sea el DUEÑO (rol != 'trabajador'). Un
// trabajador nunca puede crear ni borrar otras cuentas.

// Secciones del panel que se le pueden asignar a un trabajador.
const SECCIONES_VALIDAS = ["cotizaciones", "postventa", "proyectos", "inventario", "propias"];

// Deja solo las secciones válidas; si queda vacío, usa el acceso por defecto.
function limpiarSecciones(secciones: unknown): string[] {
  const lista = Array.isArray(secciones)
    ? secciones.filter((s) => SECCIONES_VALIDAS.includes(s))
    : [];
  return lista.length > 0 ? lista : ["proyectos", "propias"];
}

// Lee la sesión actual desde las cookies (Supabase Auth vía @supabase/ssr).
async function usuarioActual() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() { /* no-op: no renovamos cookies en esta API */ },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Devuelve el usuario si es dueño, o un objeto de error listo para responder.
async function exigirDueño() {
  const user = await usuarioActual();
  if (!user) return { error: "No has iniciado sesión.", status: 401 as const };
  const { data: perfil } = await supabaseAdmin
    .from("perfiles").select("rol").eq("id", user.id).single();
  // Sin perfil se trata como dueño (compat con la cuenta admin original).
  if (perfil?.rol === "trabajador")
    return { error: "Solo el dueño puede gestionar trabajadores.", status: 403 as const };
  return { user };
}

// Listar trabajadores.
export async function GET() {
  const check = await exigirDueño();
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status });

  const { data, error } = await supabaseAdmin
    .from("perfiles")
    .select("id, email, created_at, secciones")
    .eq("rol", "trabajador")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trabajadores: data ?? [] });
}

// Crear un trabajador (correo + contraseña que define el dueño).
export async function POST(req: Request) {
  const check = await exigirDueño();
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status });

  const { email, password, secciones } = await req.json();
  if (!email || !password || String(password).length < 6)
    return NextResponse.json({ error: "Correo y contraseña (mínimo 6 caracteres) son obligatorios." }, { status: 400 });

  // Crea el usuario ya confirmado (no necesita verificar email).
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { rol: "trabajador" },
  });
  if (error || !data.user)
    return NextResponse.json({ error: error?.message ?? "No se pudo crear la cuenta." }, { status: 400 });

  const { error: errPerfil } = await supabaseAdmin
    .from("perfiles").insert({ id: data.user.id, email, rol: "trabajador", secciones: limpiarSecciones(secciones) });
  if (errPerfil)
    return NextResponse.json({ error: "Cuenta creada, pero falló el perfil: " + errPerfil.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// Editar los accesos (secciones) de un trabajador existente.
export async function PATCH(req: Request) {
  const check = await exigirDueño();
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status });

  const { id, secciones } = await req.json();
  if (!id) return NextResponse.json({ error: "Falta el id del trabajador." }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("perfiles").update({ secciones: limpiarSecciones(secciones) }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

// Eliminar un trabajador.
export async function DELETE(req: Request) {
  const check = await exigirDueño();
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Falta el id del trabajador." }, { status: 400 });

  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await supabaseAdmin.from("perfiles").delete().eq("id", id); // por si el cascade no corrió
  return NextResponse.json({ ok: true });
}
