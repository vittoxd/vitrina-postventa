import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import type { ReactElement } from "react";
import { PDFAgenda } from "@/components/PDFAgenda";
import { supabase } from "@/lib/supabase";
import { Cotizacion } from "@/lib/tipos";

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

  // @react-pdf/renderer 4.5.1 aún no publica tipos compatibles con
  // React 19 (ver app/api/pdf/route.ts para el mismo caso).
  const buffer = await renderToBuffer(
    createElement(PDFAgenda, { visitas: (data ?? []) as Cotizacion[] }) as ReactElement<never, never>
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="agenda-visitas.pdf"`,
    },
  });
}
