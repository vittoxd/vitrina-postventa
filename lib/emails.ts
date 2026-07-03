import { Resend } from "resend";
import { empresa } from "./datos";

const resend = new Resend(process.env.RESEND_API_KEY);

// WhatsApp vía CallMeBot — desactivado a propósito por ahora (falta
// CALLMEBOT_APIKEY). Para activarlo: escribe "I allow callmebot to
// send me messages" al +34 644 81 66 63 desde el WhatsApp del negocio;
// te responden con la apikey, y la agregas a .env.local / Vercel.
const CALLMEBOT_PHONE = process.env.CALLMEBOT_PHONE ?? "";
const CALLMEBOT_APIKEY = process.env.CALLMEBOT_APIKEY ?? "";

export async function whatsappNuevaCotizacion(data: {
  nombre: string;
  servicio: string;
  telefono: string;
  comuna: string;
}) {
  if (!CALLMEBOT_PHONE || !CALLMEBOT_APIKEY) {
    console.warn("whatsappNuevaCotizacion: CallMeBot desactivado (falta CALLMEBOT_APIKEY) — no se envió aviso por WhatsApp.");
    return;
  }
  const texto = `📋 *Nueva cotización IncluWork*\n*Servicio:* ${data.servicio}\n*Cliente:* ${data.nombre}\n*Teléfono:* ${data.telefono}\n*Comuna:* ${data.comuna}`;
  const url = `https://api.callmebot.com/whatsapp.php?phone=${CALLMEBOT_PHONE}&text=${encodeURIComponent(texto)}&apikey=${CALLMEBOT_APIKEY}`;
  try {
    await fetch(url);
  } catch (e) {
    console.error("Error enviando WhatsApp:", e);
  }
}
const OWNER_EMAIL = empresa.email;
// ⚠️ Sigue usando el dominio compartido de Resend (onboarding@resend.dev).
// Funciona, pero entrega peor (más probable que caiga en spam) que un
// dominio propio verificado. Para pasar a "IncluWork <no-responder@incluwork.cl>"
// hay que verificar el dominio en resend.com/domains (agregar registros
// DNS TXT/MX que Resend indica) — requiere tener el dominio comprado.
const FROM = "IncluWork <onboarding@resend.dev>";

// Email al dueño cuando llega una cotización nueva
export async function emailNuevaCotizacion(data: {
  nombre: string;
  telefono: string;
  email: string;
  comuna: string;
  direccion: string;
  servicio: string;
  descripcion: string;
  camposExtra: Record<string, string>;
}) {
  const extras = Object.entries(data.camposExtra)
    .filter(([, v]) => v)
    .map(([k, v]) => `<li><b>${k.replace(/_/g, " ")}:</b> ${v}</li>`)
    .join("");

  const result = await resend.emails.send({
    from: FROM,
    to: OWNER_EMAIL,
    subject: `Nueva cotización — ${data.servicio} | ${data.nombre}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto">
        <div style="background:#0f172a;padding:20px 24px;border-radius:8px 8px 0 0">
          <span style="background:#f59e0b;color:#fff;font-weight:800;padding:4px 10px;border-radius:6px;font-size:18px">IW</span>
          <span style="color:#fff;font-size:18px;font-weight:700;margin-left:10px">IncluWork</span>
        </div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
          <h2 style="margin:0 0 16px;color:#0f172a">📋 Nueva solicitud de cotización</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:6px 0;color:#64748b;width:120px">Servicio</td><td style="padding:6px 0;font-weight:600">${data.servicio}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b">Nombre</td><td style="padding:6px 0;font-weight:600">${data.nombre}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b">Teléfono</td><td style="padding:6px 0">${data.telefono}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b">Email</td><td style="padding:6px 0">${data.email}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b">Comuna</td><td style="padding:6px 0">${data.comuna}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b">Dirección</td><td style="padding:6px 0">${data.direccion}</td></tr>
          </table>
          <div style="margin-top:16px;background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:12px">
            <p style="margin:0 0 6px;color:#64748b;font-size:12px">DESCRIPCIÓN DEL CLIENTE</p>
            <p style="margin:0;font-size:14px">${data.descripcion}</p>
          </div>
          ${extras ? `<div style="margin-top:12px"><p style="color:#64748b;font-size:12px;margin:0 0 6px">DETALLES ADICIONALES</p><ul style="margin:0;padding-left:16px;font-size:14px">${extras}</ul></div>` : ""}
          <div style="margin-top:24px;text-align:center">
            <a href="https://vitrina-postventa.vercel.app/admin" style="background:#f59e0b;color:#0f172a;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">
              Ver en el panel admin →
            </a>
          </div>
        </div>
        <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:12px">IncluWork SPA · Rancagua, Chile</p>
      </div>
    `,
  });
  console.log("Resend send result:", JSON.stringify(result));
  return result;
}

// Email al cliente cuando se le agenda una visita
export async function emailVisitaAgendada(data: {
  nombre: string;
  email: string;
  servicio: string;
  fechaVisita: string;
  direccion: string;
  notas?: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: data.email,
    subject: `Tu visita fue agendada — IncluWork`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto">
        <div style="background:#0f172a;padding:20px 24px;border-radius:8px 8px 0 0">
          <span style="background:#f59e0b;color:#fff;font-weight:800;padding:4px 10px;border-radius:6px;font-size:18px">IW</span>
          <span style="color:#fff;font-size:18px;font-weight:700;margin-left:10px">IncluWork</span>
        </div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
          <h2 style="margin:0 0 8px;color:#0f172a">✅ Hola ${data.nombre}, tu visita fue agendada</h2>
          <p style="color:#64748b;margin:0 0 20px">Nuestro equipo estará en tu domicilio en la fecha indicada.</p>
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-bottom:16px">
            <p style="margin:0 0 8px;font-size:13px;color:#92400e;font-weight:600">DETALLES DE LA VISITA</p>
            <table style="width:100%;font-size:14px;border-collapse:collapse">
              <tr><td style="padding:4px 0;color:#64748b;width:100px">Servicio</td><td style="padding:4px 0;font-weight:600">${data.servicio}</td></tr>
              <tr><td style="padding:4px 0;color:#64748b">Fecha y hora</td><td style="padding:4px 0;font-weight:700;color:#d97706">${data.fechaVisita}</td></tr>
              <tr><td style="padding:4px 0;color:#64748b">Dirección</td><td style="padding:4px 0">${data.direccion}</td></tr>
            </table>
          </div>
          ${data.notas ? `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:12px;margin-bottom:16px"><p style="margin:0 0 4px;color:#64748b;font-size:12px">NOTAS</p><p style="margin:0;font-size:14px">${data.notas}</p></div>` : ""}
          <p style="font-size:13px;color:#64748b">¿Tienes alguna duda? Escríbenos al <b>+56 9 3022 5027</b> o responde este correo.</p>
        </div>
        <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:12px">IncluWork SPA · Mujica 168, Rancagua · Chile</p>
      </div>
    `,
  });
}
