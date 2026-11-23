// VALORES MOBILE: todo lo de este bloque (envuelto en `sm:hidden`).
//   - Letra -> fontSize | Grueso de cinta -> ribbonWidth | Onda -> curviness
//   - Alto de la banda -> className (h-28) | Espaciado -> letterSpacing
// El bloque desktop (hidden sm:block) NO se toca: valores ya definidos.

import TextLoop from "@/components/public/text-loop";

export function RibbonDivider() {
  // Dentro del hero: fondo transparente sobre el bg-brand (ya no divide
  // dos secciones, así que el degradado hero/background quedó obsoleto).
  return (
    <section aria-label="Propuesta de valor" className="relative z-10">
      <div className="bg-transparent">
        {/* Mobile */}
        <div className="sm:hidden">
          <TextLoop
            className="h-30"
            fontSize={80}
            ribbonWidth={200}
            letterSpacing={4}
            curviness={2}
            pauseOnHover={false}
            ribbonColor="#1F3A6E"
            color="#FFF4E3"
            uppercase={false}
            // Path extendido para cubrir el viewport mobile. El tiling es
            // automatico (las copias van separadas un string completo), asi
            // que el largo solo afecta cobertura y duracion, no la costura.
            path="M -320 260 Q -160 200 0 260 T 320 260 T 640 260 T 960 260 T 1280 260 T 1600 200 Q 1688 150 1775 260"
            style={{ fontFamily: '"Bricolage Grotesque", system-ui, sans-serif' }}
          />
        </div>
        {/* Desktop (valores definidos, no tocar) */}
        <div className="hidden sm:block">
          <TextLoop
            className="h-50 sm:h-80"
            fontSize={30}
            ribbonWidth={70}
            letterSpacing={2}
            pauseOnHover={false}
            ribbonColor="#1F3A6E"
            color="#FFF4E3"
            uppercase={false}
            // Path extendido para cubrir el viewport desktop. El tiling es
            // automatico (ver text-loop.tsx): valores libres sin retunar.
            path="M -320 260 Q -160 233.6 0 260 T 320 260 T 640 260 T 960 260 T 1280 260 T 1600 260 T 1920 260 Q 2104 233.6 2288 260"
            style={{ fontFamily: '"Bricolage Grotesque", system-ui, sans-serif' }}
          />
        </div>
      </div>
    </section>
  );
}
