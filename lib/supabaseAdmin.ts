import { createClient } from "@supabase/supabase-js";

// ⚠️ SOLO servidor. Este cliente usa la SERVICE ROLE KEY, que salta las
// políticas RLS y puede administrar usuarios (crear/borrar cuentas). NUNCA
// lo importes desde un componente "use client" ni expongas la key al
// navegador: solo debe usarse en API routes (app/api/**).
//
// La key va en .env.local como SUPABASE_SERVICE_ROLE_KEY (sin el prefijo
// NEXT_PUBLIC_, justamente para que no llegue al cliente).
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
