import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { emailNuevaCotizacion, whatsappNuevaCotizacion } from "@/lib/emails";
import { servicios } from "@/lib/datos";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { error } = await supabase.from("cotizaciones").insert([{
    servicio: body.servicio,
    nombre: body.nombre,
    telefono: body.telefono,
    email: body.email,
    comuna: body.comuna,
    direccion: body.direccion ?? "",
    descripcion: body.descripcion,
    campos_extra: body.campos_extra ?? {},
    estado: "Pendiente",
  }]);

  if (error) {
    console.error("Error guardando cotización:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Email al dueño
  try {
    const tituloServicio = servicios.find((s) => s.slug === body.servicio)?.titulo ?? body.servicio;
    const resultado = await emailNuevaCotizacion({
      nombre: body.nombre,
      telefono: body.telefono,
      email: body.email,
      comuna: body.comuna,
      direccion: body.direccion ?? "",
      servicio: tituloServicio,
      descripcion: body.descripcion,
      camposExtra: body.campos_extra ?? {},
    });
    console.log("Resend resultado:", JSON.stringify(resultado));
  } catch (e) {
    console.error("Error enviando email al dueño:", e);
  }

  // WhatsApp al dueño (no bloqueante)
  const tituloServicioWsp = servicios.find((s) => s.slug === body.servicio)?.titulo ?? body.servicio;
  whatsappNuevaCotizacion({
    nombre: body.nombre,
    servicio: tituloServicioWsp,
    telefono: body.telefono,
    comuna: body.comuna,
  });

  return NextResponse.json({ ok: true });
}
