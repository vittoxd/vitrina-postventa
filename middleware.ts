import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Corre en el servidor ANTES de que cualquier página del admin llegue
 * a renderizar. Sin sesión de Supabase Auth válida, redirige a
 * /admin/login en vez de dejar pasar y mostrar datos de clientes.
 *
 * Esto es la mitad "de UX" de la protección: la mitad real que impide
 * leer los datos aunque alguien se salte esta página está en las RLS
 * de Supabase (ver database/fix-rls-admin.sql) — sin eso, cualquiera
 * podría llamar a la API REST de Supabase directo, sin pasar por aquí.
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (user && isLoginPage) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
