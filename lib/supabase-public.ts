import { createClient } from "@supabase/supabase-js";

/**
 * Cliente para lecturas públicas desde Server Components (home,
 * /proyectos, etc). No maneja cookies/sesión — no lo necesita: la
 * política RLS de "proyectos" en select es pública (using (true)),
 * a diferencia de cotizaciones/admin que sí requieren la sesión que
 * maneja lib/supabase.ts (cliente de navegador).
 */
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
