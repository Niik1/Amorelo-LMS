import { Award, Coffee, PackageCheck } from "lucide-react";

const BENEFICIOS = [
  {
    icono: PackageCheck,
    titulo: "Materiales 100% incluidos",
    descripcion:
      "No necesitas traer nada. Globos burbuja, infladores, confeti, lazos y herramientas listos en tu mesa. Te llevas a casa todos tus proyectos terminados.",
  },
  {
    icono: Coffee,
    titulo: "Coffee break para compartir",
    descripcion:
      "Snacks, café y bebidas para recargar energía durante el día y conectar con otros emprendedores que comparten tu misma pasión.",
  },
  {
    icono: Award,
    titulo: "Reconocimiento de participación",
    descripcion:
      "Diploma oficial firmado por Amorelo que certifica tu capacitación presencial, ideal para respaldar tu aprendizaje ante tus futuros clientes.",
  },
] as const;

export function IncluyePresencial() {
  return (
    <section
      id="incluye"
      aria-labelledby="incluye-title"
      className="relative bg-bg-alt px-4 pt-16 pb-12 sm:px-6 sm:pt-24 sm:pb-16"
    >
      <div className="mx-auto max-w-6xl">
        {/* Cabecera centrada */}
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <span className="inline-flex items-center rounded-full bg-[#1F3A6E] px-4 py-1.5 text-xs font-bold tracking-[0.18em] text-[#FFF4E3] uppercase shadow-xs">
            Todo incluido en tu experiencia
          </span>

          <h2
            id="incluye-title"
            className="font-heading text-3xl font-extrabold tracking-tight text-[#1F3A6E] sm:text-4xl lg:text-5xl text-balance"
          >
            Tú solo ven con ganas de aprender
          </h2>

          <p className="text-base sm:text-lg text-[#38241A]/80 text-balance font-normal">
            Nosotros nos encargamos de todo para que disfrutes tu día al 100%.
          </p>
        </div>

        {/* Grid de 3 Cards con Íconos y Microcopy */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
          {BENEFICIOS.map((item) => {
            const Icono = item.icono;

            return (
              <div
                key={item.titulo}
                className="group relative flex flex-col justify-between rounded-[2rem] border border-[#1F3A6E]/12 bg-white p-7 sm:p-8 shadow-[0_16px_45px_-20px_rgba(31,58,110,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-[#1A73E8]/40 hover:shadow-[0_24px_60px_-20px_rgba(31,58,110,0.28)]"
              >
                <div>
                  {/* Ícono en microcápsula celeste marca */}
                  <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-[#E7F0FE] text-[#1A73E8] shadow-xs transition-colors duration-300 group-hover:bg-[#1A73E8] group-hover:text-white">
                    <Icono className="size-7" />
                  </div>

                  {/* Título de la tarjeta */}
                  <h3 className="font-heading text-xl font-bold text-[#1F3A6E] sm:text-2xl leading-snug">
                    {item.titulo}
                  </h3>

                  {/* Descripción detallada */}
                  <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#38241A]/75 font-normal">
                    {item.descripcion}
                  </p>
                </div>

                {/* Detalle visual sutil inferior */}
                <div
                  aria-hidden="true"
                  className="mt-6 h-1 w-10 rounded-full bg-[#E7F0FE] transition-all duration-300 group-hover:w-16 group-hover:bg-[#1A73E8]"
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
