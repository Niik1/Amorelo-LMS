import type { Metadata } from "next";
import { HeroPresencial } from "@/components/public/hero-presencial";
import { IncluyePresencial } from "@/components/public/incluye-presencial";
import { FormularioPresencial } from "@/components/public/formulario-presencial";
import { UbicacionPresencial } from "@/components/public/ubicacion-presencial";

export const metadata: Metadata = {
  title: "Taller Presencial en Lima | Amorelo",
  description:
    "Taller presencial intensivo de decoración, globos y lettering en el centro de Lima. Cupos limitados por fecha.",
};

export default function PresencialPage() {
  return (
    <main className="min-h-screen bg-bg-alt">
      <HeroPresencial />
      <IncluyePresencial />
      <FormularioPresencial />
      <UbicacionPresencial />
    </main>
  );
}
