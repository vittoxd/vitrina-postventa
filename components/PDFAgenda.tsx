import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { Cotizacion } from "@/lib/tipos";
import { servicios } from "@/lib/datos";

const s = StyleSheet.create({
  page: { fontSize: 9, padding: 32, color: "#1e293b", fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: "#f59e0b" },
  logoRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  logoBox: { backgroundColor: "#f59e0b", width: 32, height: 32, alignItems: "center", justifyContent: "center", marginRight: 8 },
  logoText: { color: "#ffffff", fontSize: 12, fontFamily: "Helvetica-Bold" },
  empresa: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  sub: { fontSize: 7, color: "#64748b", marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  titulo: { fontSize: 11, fontFamily: "Helvetica-Bold", textAlign: "right" },
  fecha: { fontSize: 8, color: "#64748b", marginTop: 2, textAlign: "right" },
  total: { fontSize: 8, color: "#64748b", marginTop: 8, textAlign: "right" },
  // Items
  item: { marginBottom: 10, borderLeftWidth: 3, borderLeftColor: "#f59e0b", paddingLeft: 10, paddingVertical: 6, backgroundColor: "#fafafa" },
  itemFecha: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#d97706", marginBottom: 3 },
  itemNombre: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  row: { flexDirection: "row", marginBottom: 1 },
  label: { fontSize: 8, color: "#94a3b8", width: 70 },
  val: { fontSize: 8, flex: 1 },
  notas: { marginTop: 4, fontSize: 8, color: "#64748b", fontStyle: "italic" },
  footer: { position: "absolute", bottom: 24, left: 32, right: 32, borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 6, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: "#94a3b8" },
  sinVisitas: { textAlign: "center", color: "#94a3b8", marginTop: 40, fontSize: 10 },
});

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function tituloServicio(slug: string) {
  return servicios.find((s) => s.slug === slug)?.titulo ?? slug;
}

export function PDFAgenda({ visitas }: { visitas: Cotizacion[] }) {
  const hoy = new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });
  const ordenadas = [...visitas].sort((a, b) =>
    new Date(a.fecha_visita!).getTime() - new Date(b.fecha_visita!).getTime()
  );

  return (
    <Document title="Agenda de visitas — IncluWork">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <View style={s.logoRow}>
              <View style={s.logoBox}><Text style={s.logoText}>IW</Text></View>
              <Text style={s.empresa}>IncluWork</Text>
            </View>
            <Text style={s.sub}>Construccion · Remodelacion · Mantencion</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.titulo}>Agenda de visitas</Text>
            <Text style={s.fecha}>Generada el {hoy}</Text>
            <Text style={s.total}>{ordenadas.length} visita{ordenadas.length !== 1 ? "s" : ""} agendada{ordenadas.length !== 1 ? "s" : ""}</Text>
          </View>
        </View>

        {ordenadas.length === 0 ? (
          <Text style={s.sinVisitas}>No hay visitas agendadas.</Text>
        ) : (
          ordenadas.map((c) => (
            <View key={c.id} style={s.item}>
              <Text style={s.itemFecha}>📅 {fmtFecha(c.fecha_visita!)}</Text>
              <Text style={s.itemNombre}>{c.nombre}</Text>
              <View style={s.row}>
                <Text style={s.label}>Servicio</Text>
                <Text style={s.val}>{tituloServicio(c.servicio)}</Text>
              </View>
              <View style={s.row}>
                <Text style={s.label}>Telefono</Text>
                <Text style={s.val}>{c.telefono}</Text>
              </View>
              <View style={s.row}>
                <Text style={s.label}>Email</Text>
                <Text style={s.val}>{c.email}</Text>
              </View>
              <View style={s.row}>
                <Text style={s.label}>Direccion</Text>
                <Text style={s.val}>{c.direccion || c.comuna}</Text>
              </View>
              {c.notas_visita ? <Text style={s.notas}>Nota: {c.notas_visita}</Text> : null}
            </View>
          ))
        )}

        <View style={s.footer}>
          <Text style={s.footerText}>IncluWork SPA · Mujica 168, Rancagua · Chile</Text>
          <Text style={s.footerText}>+56 9 3022 5027 · incluworkltda@gmail.com</Text>
        </View>
      </Page>
    </Document>
  );
}
