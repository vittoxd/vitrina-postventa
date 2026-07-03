import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
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
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
            <Link href="/" className="flex items-center">
              <Image src="/logo.png" alt="IncluWork" width={805} height={322} className="h-10 w-auto object-contain" priority />
            </Link>
            <div className="flex items-center gap-5 text-sm font-medium">
              <Link href="/" className="hidden sm:block hover:text-amber-600">Inicio</Link>
              <Link href="/servicios" className="hover:text-amber-600">Servicios</Link>
              <Link href="/proyectos" className="hidden sm:block hover:text-amber-600">Proyectos</Link>
              <Link href="/postventa" className="hidden sm:block hover:text-amber-600">Post-venta</Link>
            </div>
          </nav>
        </header>

        <div className="flex-1">{children}</div>

        <footer className="border-t border-slate-200 bg-slate-900 px-5 py-8 text-slate-300">
          <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 sm:flex-row">
            <div>
              <p className="font-extrabold text-white text-xl">IncluWork</p>
              <p className="text-sm mt-1 text-slate-400">{empresa.rubro}</p>
            </div>
            <div className="text-sm space-y-1">
              <p>📍 {empresa.ciudad}</p>
              <p>📞 {empresa.telefono}</p>
            </div>
            <div className="text-sm space-y-1">
              <Link href="/servicios" className="block hover:text-white">Servicios</Link>
              <Link href="/proyectos" className="block hover:text-white">Proyectos</Link>
            </div>
          </div>
          <p className="mx-auto mt-6 max-w-6xl text-xs text-slate-500">
            © {new Date().getFullYear()} {empresa.nombre}. Todos los derechos reservados.
          </p>
        </footer>
      </body>
    </html>
  );
}
