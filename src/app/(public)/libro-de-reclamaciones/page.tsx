import type { Metadata } from "next";
import { FormularioLibroReclamaciones } from "@/components/public/reclamos/formulario-libro-reclamaciones";

export const metadata: Metadata = {
  title: "Libro de Reclamaciones Virtual | Amorelo",
  description:
    "Formulario oficial del Libro de Reclamaciones Virtual de Amorelo. Conforme a la Ley N° 29571 y las disposiciones de INDECOPI.",
};

export default function LibroReclamacionesPage() {
  return (
    <main className="relative min-h-[calc(100vh-160px)] w-full bg-[#F1F4F9] pt-28 pb-16 text-slate-800 transition-colors duration-300 sm:pt-36 sm:pb-24 lg:pt-40 dark:bg-[#070e24] dark:bg-[radial-gradient(ellipse_100%_85%_at_85%_15%,#1d387d_0%,#142658_35%,#0b1435_70%,#070e24_100%)] dark:text-slate-100">
      {/* Resplandor ambiental de pantalla completa (abarca todo el viewport sin cortes de caja) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-32 right-0 h-[620px] w-[620px] rounded-full bg-blue-500/10 blur-[150px] dark:bg-[#1d387d]/40" />
      </div>

      <div className="relative z-10 w-full">
        <FormularioLibroReclamaciones />
      </div>
    </main>
  );
}
