import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { empresa } from "@/lib/datos";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${empresa.nombre} — ${empresa.rubro}`,
  description: empresa.eslogan,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-slate-800">
        {/* Navegación */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
            <Link href="/" className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500 text-white">A</span>
              {empresa.nombre}
            </Link>
            <div className="flex items-center gap-5 text-sm font-medium">
              <Link href="/" className="hover:text-amber-600">Inicio</Link>
              <Link href="/proyectos" className="hover:text-amber-600">Proyectos</Link>
              <Link href="/admin" className="rounded-lg bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700">
                Panel admin
              </Link>
            </div>
          </nav>
        </header>

        <div className="flex-1">{children}</div>

        {/* Pie */}
        <footer className="border-t border-slate-200 bg-slate-900 px-5 py-8 text-slate-300">
          <div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 sm:flex-row">
            <div>
              <p className="font-bold text-white">{empresa.nombre}</p>
              <p className="text-sm">{empresa.rubro}</p>
            </div>
            <div className="text-sm">
              <p>📍 {empresa.ciudad}</p>
              <p>📞 {empresa.telefono}</p>
            </div>
          </div>
          <p className="mx-auto mt-6 max-w-6xl text-xs text-slate-500">
            © 2026 {empresa.nombre}. Demo de presentación.
          </p>
        </footer>
      </body>
    </html>
  );
}
