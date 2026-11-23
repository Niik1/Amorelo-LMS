import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Lock, ShieldCheck, Headphones } from "lucide-react";
import { ForceLightTheme } from "@/components/theme-force-light";

export const metadata: Metadata = {
  title: "Checkout Seguro | Amorelo",
  description: "Finaliza tu inscripción a la Masterclass de Decoración y Globos de Amorelo.",
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="force-light min-h-screen bg-[#f8f9fb] text-[#38241a] antialiased">
      <ForceLightTheme />

      {/* Header Limpio / Sin distracciones de navegación */}
      <header className="border-b border-black/10 bg-white shadow-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src="/images/logo/logoA.svg"
              alt="Amorelo"
              width={160}
              height={48}
              priority
              className="h-12 sm:h-14 w-auto"
            />
          </Link>

          <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 sm:gap-6">
            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
              <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
              <span className="hidden sm:inline">Compra 100% segura</span>
              <span className="sm:hidden">Seguro</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-slate-500">
              <Lock className="size-3.5 text-slate-400" />
              <span>Encriptación SSL 256 bits</span>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>

      {/* Footer Minimalista */}
      <footer className="border-t border-black/10 bg-white py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Amorelo. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            <Link href="/legal/terminos" className="hover:text-slate-900 transition-colors">
              Términos de servicio
            </Link>
            <Link href="/legal/privacidad" className="hover:text-slate-900 transition-colors">
              Política de privacidad
            </Link>
            <a
              href="https://wa.me/51945729551?text=Hola,%20tengo%20dudas%20con%20el%20pago%20del%20curso"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[#1A73E8] font-bold hover:underline"
            >
              <Headphones className="size-3.5" />
              <span>¿Necesitas ayuda? Escríbenos</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
