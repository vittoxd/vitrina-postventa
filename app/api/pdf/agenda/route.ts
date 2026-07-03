import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { PDFAgenda } from "@/components/PDFAgenda";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("cotizaciones")
    .select("*")
    .eq("estado", "Contactado")
    .not("fecha_visita", "is", null)
    .order("fecha_visita", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const buffer = await renderToBuffer(createElement(PDFAgenda, { visitas: data ?? [] }));

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="agenda-visitas.pdf"`,
    },
  });
}
