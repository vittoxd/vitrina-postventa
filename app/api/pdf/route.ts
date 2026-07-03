import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import type { ReactElement } from "react";
import { PDFCotizacion } from "@/components/PDFCotizacion";

export async function POST(req: NextRequest) {
  const body = await req.json();

  // @react-pdf/renderer 4.5.1 aún no publica tipos compatibles con
  // React 19 (su DocumentProps espera exactamente su propio <Document>,
  // no cualquier ReactElement). El "as" es solo para el chequeo de
  // tipos: en tiempo de ejecución PDFCotizacion sí renderiza un
  // <Document> válido.
  const buffer = await renderToBuffer(
    createElement(PDFCotizacion, body) as ReactElement<never, never>
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="cotizacion-${body.numeroPedido}.pdf"`,
    },
  });
}
