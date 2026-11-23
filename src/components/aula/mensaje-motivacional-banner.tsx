import { Sparkles, Quote } from "lucide-react";
import type { EntradaMensajeBanner } from "@/lib/validators/configuracion";

interface MensajeMotivacionalBannerProps {
  mensajeBanner: EntradaMensajeBanner | null;
}

export function MensajeMotivacionalBanner({
  mensajeBanner,
}: MensajeMotivacionalBannerProps) {
  if (!mensajeBanner || !mensajeBanner.activo || !mensajeBanner.mensaje?.trim()) {
    return null;
  }

  return (
    <div className="relative mt-5 flex w-full flex-col justify-between overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-5 shadow-sm backdrop-blur-md transition-all lg:mt-0 lg:max-w-md">
      {/* Luz ambiental decorativa interna */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-amber-300/15 blur-2xl" />

      {/* Cabecera de la tarjeta con badge */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-amber-200">
          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
          <span>Palabras del Mentor</span>
        </div>
        <Quote className="h-4 w-4 text-white/40" />
      </div>

      {/* Contenido del mensaje completo */}
      <div className="relative z-10 my-3.5">
        <p className="text-sm font-medium italic leading-relaxed text-blue-50 break-words sm:text-[15px]">
          “{mensajeBanner.mensaje}”
        </p>
      </div>

      {/* Firma */}
      <div className="relative z-10 flex items-center justify-end border-t border-white/10 pt-2 text-xs font-bold tracking-wide text-white/85">
        <span>— {mensajeBanner.autor || "Brayan Rodriguez"} 🎈</span>
      </div>
    </div>
  );
}
