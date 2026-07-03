import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { PDFCotizacion } from "@/components/PDFCotizacion";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const buffer = await renderToBuffer(
    createElement(PDFCotizacion, body)
  );

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="cotizacion-${body.numeroPedido}.pdf"`,
    },
  });
}
