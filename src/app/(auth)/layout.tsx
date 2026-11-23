import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Iniciar Sesión | Amorelo",
  description: "Accede a la plataforma de cursos virtuales y panel de gestión de Amorelo.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden bg-[#1A73E8] px-4 py-8 text-slate-800 transition-colors duration-500 sm:px-6 lg:px-8 dark:bg-[#070e24] dark:bg-[radial-gradient(ellipse_100%_85%_at_85%_15%,#1d387d_0%,#142658_35%,#0b1435_70%,#070e24_100%)] dark:text-slate-100">
      {/* ── Capa de degradado radial: Modo Claro (Azul Marca con iluminación ambiental del Hero) ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-100 dark:opacity-0 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(ellipse 110% 90% at 85% 15%, #4d96ff 0%, #257bf0 35%, #1A73E8 65%, #1052bd 100%)",
        }}
      />

      {/* Resplandor ambiental de apoyo (Modo Claro con luz blanca difuminada en las esquinas / Modo Oscuro intacto) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* Esfera luminosa superior derecha */}
        <div className="absolute -top-32 right-0 h-[620px] w-[620px] rounded-full bg-white/20 blur-[140px] dark:bg-[#1d387d]/40 dark:blur-[130px] transition-all duration-500" />
        {/* Esfera luminosa lateral izquierda en Modo Claro para enriquecer el ambiente */}
        <div className="absolute top-1/3 -left-32 h-[480px] w-[480px] rounded-full bg-white/10 blur-[130px] opacity-100 dark:opacity-0 transition-opacity duration-500" />
      </div>

      {/* Barra superior con navegación y selector de tema */}
      <header className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between sm:top-6 sm:left-6 sm:right-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-xs font-bold text-slate-700 shadow-xs backdrop-blur-md transition-all hover:border-blue-500/40 hover:bg-white hover:text-blue-600 hover:shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-white/15 dark:hover:text-white"
        >
          <ArrowLeft className="size-3.5" />
          <span>Volver al inicio</span>
        </Link>

        <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 p-1 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-white/10">
          <ThemeToggle />
        </div>
      </header>

      {/* Contenido principal centrado */}
      <main className="relative z-10 flex w-full items-center justify-center pt-10 sm:pt-6">
        {children}
      </main>
    </div>
  );
}
