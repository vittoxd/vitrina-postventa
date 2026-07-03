import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { contacto } = await req.json();
  if (!contacto) return NextResponse.json({ error: "Falta contacto" }, { status: 400 });

  // Normalizar: quitar espacios, guiones y prefijo +56 / 56
  const valor = contacto.trim();
  const soloDigitos = valor.replace(/\D/g, "").replace(/^56/, "");

  const { data, error } = await supabase
    .from("cotizaciones")
    .select("id, nombre, servicio, created_at, email, telefono")
    .eq("estado", "Cerrado")
    .or(`email.ilike.${valor},telefono.ilike.%${soloDigitos}%`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    return NextResponse.json({ encontrado: false });
  }

  return NextResponse.json({ encontrado: true, trabajos: data });
}
