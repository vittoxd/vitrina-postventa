import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { emailNuevaCotizacion } from "@/lib/emails";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const OWNER_EMAIL = "vitorioxde@gmail.com";
const FROM = "IncluWork <onboarding@resend.dev>";

export async function POST(req: NextRequest) {
  const { cotizacion_id, calificacion, tipo, mensaje } = await req.json();

  if (!cotizacion_id || !calificacion || !tipo || !mensaje) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  // Verificar que la cotización existe y está cerrada
  const { data: cot, error: fetchError } = await supabase
    .from("cotizaciones")
    .select("id, nombre, email, servicio, estado")
    .eq("id", cotizacion_id)
    .eq("estado", "Cerrado")
    .single();

  if (fetchError || !cot) {
    return NextResponse.json({ error: "Cotización no válida" }, { status: 404 });
  }

  const { error } = await supabase.from("postventa").insert([{
    cotizacion_id,
    calificacion,
    tipo,
    mensaje,
  }]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Email al admin solo si es reclamo o consulta
  if (tipo === "reclamo" || tipo === "consulta" || tipo === "garantia") {
    const etiqueta = tipo === "reclamo" ? "🚨 Reclamo" : tipo === "garantia" ? "🔧 Garantía" : "❓ Consulta";
    const estrellas = "⭐".repeat(calificacion);
    try {
      await resend.emails.send({
        from: FROM,
        to: OWNER_EMAIL,
        subject: `${etiqueta} post-venta — ${cot.nombre}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:auto">
            <div style="background:#0f172a;padding:20px 24px;border-radius:8px 8px 0 0">
              <span style="background:#f59e0b;color:#fff;font-weight:800;padding:4px 10px;border-radius:6px;font-size:18px">IW</span>
              <span style="color:#fff;font-size:18px;font-weight:700;margin-left:10px">IncluWork — Post-venta</span>
            </div>
            <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
              <h2 style="margin:0 0 16px;color:#0f172a">${etiqueta} recibido</h2>
              <table style="width:100%;border-collapse:collapse;font-size:14px">
                <tr><td style="padding:6px 0;color:#64748b;width:120px">Cliente</td><td style="padding:6px 0;font-weight:600">${cot.nombre}</td></tr>
                <tr><td style="padding:6px 0;color:#64748b">Email</td><td style="padding:6px 0">${cot.email}</td></tr>
                <tr><td style="padding:6px 0;color:#64748b">Calificación</td><td style="padding:6px 0">${estrellas} (${calificacion}/5)</td></tr>
              </table>
              <div style="margin-top:16px;background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:12px">
                <p style="margin:0 0 6px;color:#64748b;font-size:12px">MENSAJE</p>
                <p style="margin:0;font-size:14px">${mensaje}</p>
              </div>
              <div style="margin-top:24px;text-align:center">
                <a href="https://vitrina-postventa.vercel.app/admin" style="background:#f59e0b;color:#0f172a;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">
                  Ver en el panel admin →
                </a>
              </div>
            </div>
          </div>
        `,
      });
    } catch (e) {
      console.error("Error enviando email post-venta:", e);
    }
  }

  return NextResponse.json({ ok: true });
}
