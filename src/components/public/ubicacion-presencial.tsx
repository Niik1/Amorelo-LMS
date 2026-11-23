import { ExternalLink } from "lucide-react";
import { Button } from "@/components/public/button";

export function UbicacionPresencial() {
  const queryDireccion = encodeURIComponent(
    "Jr. Paruro 1457, Cercado de Lima, Perú"
  );
  const mapsEmbedUrl = `https://maps.google.com/maps?q=${queryDireccion}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  const mapsDirectUrl = `https://www.google.com/maps/search/?api=1&query=${queryDireccion}`;

  return (
    <section
      id="ubicacion"
      aria-labelledby="ubicacion-title"
      className="relative bg-bg-alt px-4 py-16 sm:px-6 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          
          {/* ========================================================
              COLUMNA IZQUIERDA: Información del lugar
              ======================================================== */}
          <div className="space-y-6 lg:col-span-5">
            <div>
              <span className="inline-flex items-center rounded-full bg-[#1F3A6E] px-4 py-1.5 text-xs font-bold tracking-[0.18em] text-[#FFF4E3] uppercase mb-4">
                Lugar del taller
              </span>
              <h2
                id="ubicacion-title"
                className="font-heading text-3xl font-extrabold tracking-tight text-[#1F3A6E] sm:text-4xl lg:text-5xl"
              >
                Dónde será
              </h2>
            </div>

            <div className="space-y-1">
              <h3 className="font-heading text-xl font-bold text-[#1F3A6E] sm:text-2xl">
                Jr. Paruro N.° 1457 con Nicolás de Piérola
              </h3>
              <p className="text-base text-[#38241A]/80 sm:text-lg">
                Galería Roggero, 3.er nivel
              </p>
            </div>

            {/* Caja de Referencia en celeste marca suave */}
            <div className="rounded-2xl border border-[#1A73E8]/20 bg-[#E7F0FE] p-4 sm:p-5 shadow-xs">
              <p className="text-sm sm:text-base text-[#1F3A6E] leading-relaxed">
                <strong className="font-bold text-[#1F3A6E]">Referencia:</strong>{" "}
                en la entrada está la Caja Trujillo.
              </p>
            </div>

            {/* Horario */}
            <p className="text-sm font-medium text-[#38241A]/75 sm:text-base">
              Horario: 10:00 a. m. a 6:00 p. m., ambos días.
            </p>

            {/* Botón Abrir en Google Maps con el componente oficial Button */}
            <div className="pt-2">
              <Button
                render={
                  <a
                    href={mapsDirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
                nativeButton={false}
                className="relative h-14 overflow-hidden bg-[#1A73E8] pr-2 pl-8 text-base text-[#FFF4E3] transition-colors duration-300 hover:border-[#1A73E8]/40 hover:bg-[#1A73E8] hover:text-[#FFF4E3] active:bg-[#1A73E8] shadow-lg shadow-[#1A73E8]/25"
              >
                <span
                  aria-hidden="true"
                  className="absolute -inset-px origin-right scale-x-0 bg-white transition-transform duration-300 ease-out group-hover/button:scale-x-100 motion-reduce:transition-none"
                />
                <span className="relative z-10 flex items-center gap-3 transition-colors duration-300 group-hover/button:text-[#1A73E8]">
                  Abrir en Google Maps
                  <span
                    aria-hidden="true"
                    className="inline-flex size-10 items-center justify-center rounded-full bg-white text-[#1A73E8] transition-colors duration-300 group-hover/button:bg-[#1A73E8] group-hover/button:text-white"
                  >
                    <ExternalLink className="size-5" />
                  </span>
                </span>
              </Button>
            </div>
          </div>

          {/* ========================================================
              COLUMNA DERECHA: Mapa interactivo de Google Maps
              ======================================================== */}
          <div className="lg:col-span-7">
            <div className="relative h-[360px] w-full overflow-hidden rounded-[2.5rem] border border-[#1F3A6E]/15 bg-white shadow-[0_24px_70px_-30px_rgba(31,58,110,0.35)] sm:h-[420px] lg:h-[460px]">
              <iframe
                title="Mapa de ubicación del taller presencial en Galería Roggero"
                src={mapsEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
