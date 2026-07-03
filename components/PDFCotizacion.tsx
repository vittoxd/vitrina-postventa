import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const s = StyleSheet.create({
  page: { fontSize: 9, padding: 32, color: "#1e293b", fontFamily: "Helvetica" },
  // Header
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: "#f59e0b" },
  logoRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  logoBox: { backgroundColor: "#f59e0b", width: 32, height: 32, alignItems: "center", justifyContent: "center", marginRight: 8 },
  logoText: { color: "#ffffff", fontSize: 12, fontFamily: "Helvetica-Bold" },
  empresa: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#0f172a" },
  rubro: { fontSize: 7, color: "#64748b", marginTop: 2 },
  pedidoLabel: { fontSize: 7, color: "#94a3b8", textAlign: "right" },
  pedidoVal: { fontSize: 10, fontFamily: "Helvetica-Bold", textAlign: "right", marginTop: 1, marginBottom: 4 },
  // Info cliente
  infoRow: { flexDirection: "row", marginBottom: 14 },
  infoBlock: { flex: 1, backgroundColor: "#f8fafc", padding: 8, marginRight: 6 },
  infoLabel: { fontSize: 7, color: "#94a3b8", marginBottom: 2 },
  infoVal: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  // Tabla
  tableHeader: { flexDirection: "row", backgroundColor: "#1e293b", paddingVertical: 4, paddingHorizontal: 6, marginBottom: 1 },
  thText: { color: "#ffffff", fontSize: 7, fontFamily: "Helvetica-Bold" },
  rowEven: { flexDirection: "row", paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  rowOdd:  { flexDirection: "row", paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: "#e2e8f0", backgroundColor: "#f8fafc" },
  cell: { fontSize: 8 },
  // Cols
  cPos:    { width: 28 },
  cDesc:   { flex: 1 },
  cColor:  { width: 50 },
  cDim:    { width: 68 },
  cUds:    { width: 22, textAlign: "right" },
  cM2:     { width: 36, textAlign: "right" },
  cPrecio: { width: 54, textAlign: "right" },
  cTotal:  { width: 54, textAlign: "right" },
  // Totales
  totalesBox: { alignItems: "flex-end", marginTop: 10 },
  totalRow: { flexDirection: "row", marginBottom: 3 },
  tLabel: { fontSize: 9, color: "#64748b", width: 100, textAlign: "right" },
  tVal:   { fontSize: 9, width: 72, textAlign: "right" },
  grandRow: { flexDirection: "row", borderTopWidth: 1.5, borderTopColor: "#f59e0b", paddingTop: 4, marginTop: 2 },
  gLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", width: 100, textAlign: "right" },
  gVal:   { fontSize: 11, fontFamily: "Helvetica-Bold", width: 72, textAlign: "right", color: "#d97706" },
  // Nota
  nota: { marginTop: 20, backgroundColor: "#fffbeb", padding: 8, borderLeftWidth: 3, borderLeftColor: "#f59e0b" },
  notaText: { fontSize: 8, color: "#92400e" },
  // Footer
  footer: { position: "absolute", bottom: 24, left: 32, right: 32, borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 6, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: "#94a3b8" },
});

export type ItemPDF = {
  pos: string;
  descripcion: string;
  color: string;
  dimensiones: string;
  uds: number;
  m2Unit: number;
  precioUnit: number;
};

type Props = {
  numeroPedido: string;
  cliente: string;
  fecha: string;
  servicio: string;
  comuna: string;
  items: ItemPDF[];
  nota?: string;
};

function fmt(n: number) {
  return `$ ${n.toLocaleString("es-CL")}`;
}

export function PDFCotizacion({ numeroPedido, cliente, fecha, servicio, comuna, items, nota }: Props) {
  const subtotal = items.reduce((acc, it) => acc + it.precioUnit * it.uds, 0);
  const iva = Math.round(subtotal * 0.19);
  const total = subtotal + iva;

  return (
    <Document title={`Cotizacion ${numeroPedido}`}>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <View style={s.logoRow}>
              <View style={s.logoBox}><Text style={s.logoText}>IW</Text></View>
              <Text style={s.empresa}>IncluWork</Text>
            </View>
            <Text style={s.rubro}>Construccion · Remodelacion · Mantencion</Text>
            <Text style={s.rubro}>Mujica 168, Rancagua · +56 9 3022 5027</Text>
          </View>
          <View>
            <Text style={s.pedidoLabel}>N° Cotizacion</Text>
            <Text style={s.pedidoVal}>{numeroPedido}</Text>
            <Text style={s.pedidoLabel}>Fecha</Text>
            <Text style={s.pedidoVal}>{fecha}</Text>
          </View>
        </View>

        {/* Info cliente */}
        <View style={s.infoRow}>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>CLIENTE</Text>
            <Text style={s.infoVal}>{cliente}</Text>
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>SERVICIO</Text>
            <Text style={s.infoVal}>{servicio}</Text>
          </View>
          <View style={[s.infoBlock, { marginRight: 0 }]}>
            <Text style={s.infoLabel}>COMUNA</Text>
            <Text style={s.infoVal}>{comuna}</Text>
          </View>
        </View>

        {/* Tabla */}
        <View style={s.tableHeader}>
          <Text style={[s.thText, s.cPos]}>Pos.</Text>
          <Text style={[s.thText, s.cDesc]}>Descripcion</Text>
          <Text style={[s.thText, s.cColor]}>Color</Text>
          <Text style={[s.thText, s.cDim]}>Dimensiones</Text>
          <Text style={[s.thText, s.cUds]}>Uds</Text>
          <Text style={[s.thText, s.cM2]}>M2 u.</Text>
          <Text style={[s.thText, s.cPrecio]}>P. Unit</Text>
          <Text style={[s.thText, s.cTotal]}>Total</Text>
        </View>

        {items.map((it, i) => {
          const m2Total = +(it.m2Unit * it.uds).toFixed(2);
          const totalItem = it.precioUnit * it.uds;
          const row = i % 2 === 0 ? s.rowEven : s.rowOdd;
          return (
            <View key={i} style={row}>
              <Text style={[s.cell, s.cPos]}>{it.pos}</Text>
              <Text style={[s.cell, s.cDesc]}>{it.descripcion}</Text>
              <Text style={[s.cell, s.cColor]}>{it.color}</Text>
              <Text style={[s.cell, s.cDim]}>{it.dimensiones}</Text>
              <Text style={[s.cell, s.cUds]}>{it.uds}</Text>
              <Text style={[s.cell, s.cM2]}>{m2Total}</Text>
              <Text style={[s.cell, s.cPrecio]}>{fmt(it.precioUnit)}</Text>
              <Text style={[s.cell, s.cTotal]}>{fmt(totalItem)}</Text>
            </View>
          );
        })}

        {/* Totales */}
        <View style={s.totalesBox}>
          <View style={s.totalRow}>
            <Text style={s.tLabel}>Base imponible</Text>
            <Text style={s.tVal}>{fmt(subtotal)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.tLabel}>IVA (19%)</Text>
            <Text style={s.tVal}>{fmt(iva)}</Text>
          </View>
          <View style={s.grandRow}>
            <Text style={s.gLabel}>TOTAL</Text>
            <Text style={s.gVal}>{fmt(total)}</Text>
          </View>
        </View>

        {/* Nota */}
        {nota ? (
          <View style={s.nota}>
            <Text style={s.notaText}>Nota: {nota}</Text>
          </View>
        ) : null}

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>IncluWork SPA · Mujica 168, Rancagua · VI Region · Chile</Text>
          <Text style={s.footerText}>Validez: 15 dias habiles</Text>
        </View>

      </Page>
    </Document>
  );
}
