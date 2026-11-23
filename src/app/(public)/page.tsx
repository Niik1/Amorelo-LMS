import { Hero } from "@/components/public/hero";
import { Temario } from "@/components/public/temario";
import { FinalCta } from "@/components/public/final-cta";

// ISR: la portada se sirve prerenderizada desde el CDN (los cambios de
// `cursos` y de la oferta vigente se reflejan con ≤15s de retraso). El
// registro del clic NO depende de esto: /api/ir/whatsapp resuelve la oferta
// en el momento del clic con el resolver sin caché.
export const revalidate = 15;

export default function HomePage() {
  return (
    <main className="bg-paper flex flex-1 flex-col">
      <Hero />
      <Temario />
      <FinalCta />
    </main>
  );
}
