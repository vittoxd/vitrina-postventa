import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { emailVisitaAgendada } from "@/lib/emails";
import { servicios } from "@/lib/datos";

export async function POST(req: NextRequest) {
  const { id, fecha_visita, notas_visita } = await req.json();

  // Leer la cotización para tener datos del cliente
  const { data: cot, error: fetchError } = await supabase
    .from("cotizaciones").select("*").eq("id", id).single();

  if (fetchError || !cot) {
    return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 });
  }

  // Actualizar estado y fecha de visita
  const { error } = await supabase
    .from("cotizaciones")
    .update({ estado: "Contactado", fecha_visita, notas_visita: notas_visita ?? "" })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Email al cliente
  try {
    const tituloServicio = servicios.find((s) => s.slug === cot.servicio)?.titulo ?? cot.servicio;
    // fecha_visita es YYYY-MM-DD — parseamos con hora fija para evitar desfase UTC
    const [y, m, d] = fecha_visita.split("-").map(Number);
    const fechaFormateada = new Date(y, m - 1, d).toLocaleDateString("es-CL", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric",
    });

    await emailVisitaAgendada({
      nombre: cot.nombre,
      email: cot.email,
      servicio: tituloServicio,
      fechaVisita: fechaFormateada,
      direccion: cot.direccion ?? cot.comuna,
      notas: notas_visita,
    });
  } catch (e) {
    console.error("Error enviando email al cliente:", e);
  }

  return NextResponse.json({ ok: true });
}
