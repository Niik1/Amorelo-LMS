"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, Check, MessageCircle } from "lucide-react";
import { Button } from "@/components/public/button";
import { whatsappUrl } from "@/lib/config/site";

interface FechaTaller {
  id: string;
  titulo: string;
  nombreLargo: string;
  horario: string;
  lugar: string;
  cupos: number;
}

const FECHAS_DISPONIBLES: FechaTaller[] = [
  {
    id: "sabado-21",
    titulo: "Sábado 21 de noviembre",
    nombreLargo: "sábado 21 de noviembre",
    horario: "10:00 a. m. a 6:00 p. m.",
    lugar: "Lima Centro",
    cupos: 15,
  },
  {
    id: "domingo-22",
    titulo: "Domingo 22 de noviembre",
    nombreLargo: "domingo 22 de noviembre",
    horario: "10:00 a. m. a 6:00 p. m.",
    lugar: "Lima Centro",
    cupos: 15,
  },
];

export function FormularioPresencial() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState<FechaTaller>(
    FECHAS_DISPONIBLES[0]
  );
  const [estado, setEstado] = useState<"formulario" | "guardado">("formulario");

  // Campos del formulario
  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [celular, setCelular] = useState("");
  const [correo, setCorreo] = useState("");
  const [fuente, setFuente] = useState("");
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  const [codigoGenerado, setCodigoGenerado] = useState("");
  const [errorValidacion, setErrorValidacion] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion("");

    if (!nombre.trim()) {
      setErrorValidacion("Por favor, ingresa tu nombre completo.");
      return;
    }
    if (dni.trim().length !== 8) {
      setErrorValidacion("El DNI debe tener exactamente 8 dígitos.");
      return;
    }
    if (celular.trim().length !== 9) {
      setErrorValidacion("El número de celular debe tener 9 dígitos.");
      return;
    }
    if (!correo.trim() || !correo.includes("@")) {
      setErrorValidacion("Ingresa un correo electrónico válido.");
      return;
    }
    if (!aceptaPrivacidad) {
      setErrorValidacion(
        "Debes aceptar la política de privacidad para continuar."
      );
      return;
    }

    const numeroAleatorio = Math.floor(1000 + Math.random() * 9000);
    const codigo = `PRE-${numeroAleatorio}`;
    setCodigoGenerado(codigo);
    setEstado("guardado");
  };

  const mensajeWhatsapp = `Hola, soy ${nombre.trim()} y quiero llevar el taller presencial del ${fechaSeleccionada.nombreLargo}. Mi código es [${codigoGenerado}].`;
  const urlWhatsappFinal = whatsappUrl(mensajeWhatsapp);

  return (
    <section
      id="fechas"
      aria-labelledby="fechas-title"
      className="relative scroll-mt-20 bg-bg-alt px-4 py-16 sm:px-6 sm:py-24"
    >
      {/* Contenedor envolvente celeste estilo Sección Precios */}
      <div className="mx-auto w-full max-w-[1400px] overflow-hidden rounded-[2.5rem] bg-[#E7F0FE] px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 xl:grid-cols-[1.15fr_0.85fr]">

          {/* ========================================================
              COLUMNA IZQUIERDA: 1. Elige tu fecha
              ======================================================== */}
          <div className="space-y-6">
            <div>
              <span className="inline-flex items-center rounded-full bg-[#1F3A6E] px-5 py-1.5 text-xs font-bold tracking-[0.18em] text-[#FFF4E3] uppercase mb-4">
                Inscripción y fechas
              </span>
              <h2
                id="fechas-title"
                className="font-heading text-3xl font-extrabold tracking-tight text-[#1F3A6E] sm:text-4xl lg:text-5xl"
              >
                1. Elige tu fecha
              </h2>
              <p className="mt-3 text-base text-[#38241A]/80 sm:text-lg">
                Ambas fechas enseñan lo mismo. Solo hay 15 cupos por día.
              </p>
            </div>

            {/* Opciones de fechas */}
            <div className="space-y-4">
              {FECHAS_DISPONIBLES.map((fecha) => {
                const esActiva = fechaSeleccionada.id === fecha.id;

                return (
                  <button
                    key={fecha.id}
                    type="button"
                    onClick={() => setFechaSeleccionada(fecha)}
                    className={`group relative w-full text-left rounded-[2rem] bg-white p-5 sm:p-6 transition-all duration-300 cursor-pointer ${
                      esActiva
                        ? "border-2 border-[#1A73E8] ring-4 ring-[#1A73E8]/20 shadow-[0_20px_50px_-20px_rgba(31,58,110,0.35)] scale-[1.01]"
                        : "border border-[#1F3A6E]/12 shadow-[0_12px_35px_-20px_rgba(31,58,110,0.2)] hover:border-[#1A73E8]/50 hover:shadow-md"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      {/* En móvil: Badge de cupos arriba a la izquierda; en desktop: a la derecha */}
                      <div className="order-1 sm:order-2 self-start">
                        <span className="inline-flex shrink-0 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 shadow-xs">
                          {fecha.cupos} cupos disponibles
                        </span>
                      </div>

                      {/* Contenido: Título en una sola línea, luego hora y ubicación */}
                      <div className="order-2 sm:order-1 min-w-0">
                        <h3 className="font-heading text-lg sm:text-2xl font-bold text-[#1F3A6E] leading-snug">
                          {fecha.titulo}
                        </h3>

                        {/* En móvil: horario en una línea y lugar en otra. En desktop: una sola línea con separador */}
                        <div className="mt-1 text-sm font-medium text-[#38241A]/75">
                          <p className="sm:hidden">{fecha.horario}</p>
                          <p className="sm:hidden text-xs text-[#38241A]/65">{fecha.lugar}</p>
                          <p className="hidden sm:block">
                            {fecha.horario} · {fecha.lugar}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Tarjeta Cómo funciona */}
            <div className="rounded-[2rem] border border-[#1F3A6E]/12 bg-white/80 p-6 backdrop-blur-xs shadow-xs space-y-2">
              <h4 className="font-heading text-base font-bold text-[#1F3A6E] sm:text-lg">
                Cómo funciona
              </h4>
              <p className="text-sm text-[#38241A]/80 leading-relaxed sm:text-base">
                Completas tus datos y quedan guardados como pendientes. Luego te
                llevamos a WhatsApp, donde te enviamos los métodos de pago. Tu
                cupo se confirma solo cuando validamos tu pago.
              </p>
            </div>
          </div>

          {/* ========================================================
              COLUMNA DERECHA: 2. Tus datos (Estilo PrecioCard)
              ======================================================== */}
          <div>
            <div className="relative z-10 rounded-[2rem] bg-white p-6 pt-8 sm:p-9 sm:pt-10 shadow-[0_24px_70px_-30px_rgba(31,58,110,0.45)]">

              {estado === "formulario" ? (
                /* ESTADO 1: FORMULARIO */
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-heading text-2xl font-extrabold text-[#1F3A6E] sm:text-3xl">
                      2. Tus datos
                    </h2>
                  </div>

                  {/* Banner de fecha elegida estilo selector de moneda */}
                  <div className="rounded-full bg-[#E7F0FE] p-1.5 px-4 text-center">
                    <p className="text-sm font-bold text-[#1F3A6E] sm:text-base">
                      Fecha elegida: <span className="capitalize">{fechaSeleccionada.nombreLargo}</span>
                    </p>
                  </div>

                  {errorValidacion && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600">
                      {errorValidacion}
                    </div>
                  )}

                  {/* Nombre completo */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="nombre"
                      className="block text-sm font-bold text-[#1F3A6E]"
                    >
                      Nombre completo
                    </label>
                    <input
                      id="nombre"
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Como quieres que aparezca en tu reconocimiento"
                      className="h-12 w-full rounded-xl border border-[#1F3A6E]/20 bg-[#F8FAFF] px-4 text-base text-[#1F3A6E] placeholder:text-[#38241A]/40 focus:border-[#1A73E8] focus:bg-white focus:ring-4 focus:ring-[#1A73E8]/15 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Fila: DNI y Celular */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="dni"
                        className="block text-sm font-bold text-[#1F3A6E]"
                      >
                        DNI
                      </label>
                      <input
                        id="dni"
                        type="text"
                        required
                        maxLength={8}
                        value={dni}
                        onChange={(e) =>
                          setDni(e.target.value.replace(/\D/g, "").slice(0, 8))
                        }
                        placeholder="8 dígitos"
                        className="h-12 w-full rounded-xl border border-[#1F3A6E]/20 bg-[#F8FAFF] px-4 text-base text-[#1F3A6E] placeholder:text-[#38241A]/40 focus:border-[#1A73E8] focus:bg-white focus:ring-4 focus:ring-[#1A73E8]/15 focus:outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="celular"
                        className="block text-sm font-bold text-[#1F3A6E]"
                      >
                        Celular (WhatsApp)
                      </label>
                      <input
                        id="celular"
                        type="tel"
                        required
                        maxLength={9}
                        value={celular}
                        onChange={(e) =>
                          setCelular(
                            e.target.value.replace(/\D/g, "").slice(0, 9)
                          )
                        }
                        placeholder="9XX XXX XXX"
                        className="h-12 w-full rounded-xl border border-[#1F3A6E]/20 bg-[#F8FAFF] px-4 text-base text-[#1F3A6E] placeholder:text-[#38241A]/40 focus:border-[#1A73E8] focus:bg-white focus:ring-4 focus:ring-[#1A73E8]/15 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Correo electrónico */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="correo"
                      className="block text-sm font-bold text-[#1F3A6E]"
                    >
                      Correo electrónico
                    </label>
                    <input
                      id="correo"
                      type="email"
                      required
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      placeholder="tucorreo@ejemplo.com"
                      className="h-12 w-full rounded-xl border border-[#1F3A6E]/20 bg-[#F8FAFF] px-4 text-base text-[#1F3A6E] placeholder:text-[#38241A]/40 focus:border-[#1A73E8] focus:bg-white focus:ring-4 focus:ring-[#1A73E8]/15 focus:outline-none transition-all"
                    />
                  </div>

                  {/* ¿Cómo te enteraste? (opcional) */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="fuente"
                      className="block text-sm font-bold text-[#1F3A6E]"
                    >
                      ¿Cómo te enteraste?{" "}
                      <span className="font-normal text-[#38241A]/60">
                        (opcional)
                      </span>
                    </label>
                    <input
                      id="fuente"
                      type="text"
                      value={fuente}
                      onChange={(e) => setFuente(e.target.value)}
                      placeholder="Instagram, TikTok, un amigo..."
                      className="h-12 w-full rounded-xl border border-[#1F3A6E]/20 bg-[#F8FAFF] px-4 text-base text-[#1F3A6E] placeholder:text-[#38241A]/40 focus:border-[#1A73E8] focus:bg-white focus:ring-4 focus:ring-[#1A73E8]/15 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Checkbox de privacidad */}
                  <div className="pt-1">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={aceptaPrivacidad}
                        onChange={(e) => setAceptaPrivacidad(e.target.checked)}
                        className="mt-1 size-4.5 rounded-sm border-[#1F3A6E]/30 text-[#1A73E8] focus:ring-[#1A73E8]"
                      />
                      <span className="text-sm text-[#38241A]/80 leading-snug">
                        Acepto la{" "}
                        <Link
                          href="/legal/privacidad"
                          target="_blank"
                          className="font-semibold text-[#1A73E8] underline hover:text-[#1F3A6E]"
                        >
                          política de privacidad
                        </Link>{" "}
                        y que Amorelo use mis datos para gestionar mi
                        inscripción y mi reconocimiento.
                      </span>
                    </label>
                  </div>

                  {/* Botón CTA oficial estilo PrecioCard */}
                  <Button
                    type="submit"
                    className="relative h-14 w-full overflow-hidden bg-[#1A73E8] pr-2 pl-8 text-base font-bold text-[#FFF4E3] transition-colors duration-300 hover:border-[#1A73E8]/40 hover:bg-[#1A73E8] hover:text-[#FFF4E3] active:bg-[#1A73E8] cursor-pointer shadow-lg shadow-[#1A73E8]/25"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute -inset-px origin-right scale-x-0 bg-white transition-transform duration-300 ease-out group-hover/button:scale-x-100 motion-reduce:transition-none"
                    />
                    <span className="relative z-10 flex items-center justify-center gap-3 transition-colors duration-300 group-hover/button:text-[#1A73E8]">
                      Reservar y continuar
                      <span
                        aria-hidden="true"
                        className="inline-flex size-10 items-center justify-center rounded-full bg-white text-[#1A73E8] transition-colors duration-300 group-hover/button:bg-[#1A73E8] group-hover/button:text-white"
                      >
                        <ArrowRightIcon className="size-5" />
                      </span>
                    </span>
                  </Button>

                  <p className="text-center text-xs text-[#38241A]/70 leading-relaxed pt-1">
                    Tus datos se guardan con estado pendiente. Tu cupo aún no
                    está confirmado: se confirma cuando validamos tu pago.
                  </p>
                </form>
              ) : (
                /* ESTADO 2: PANTALLA DATOS GUARDADOS */
                <div className="space-y-6">
                  {/* Ícono de Check verde */}
                  <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-sm">
                    <Check className="size-7 stroke-[3]" />
                  </div>

                  <div>
                    <h2 className="font-heading text-3xl font-extrabold text-[#1F3A6E] sm:text-4xl">
                      Datos guardados
                    </h2>

                    <div className="mt-2.5">
                      <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-4 py-1 text-xs font-bold text-amber-900 shadow-2xs">
                        Estado: pendiente de pago
                      </span>
                    </div>
                  </div>

                  <p className="text-base text-[#38241A]/85 leading-relaxed">
                    Guardamos tus datos para el{" "}
                    <strong className="text-[#1F3A6E] capitalize">
                      {fechaSeleccionada.nombreLargo}
                    </strong>
                    . Tu cupo aún no está confirmado. Te llevamos a WhatsApp para
                    enviarte los métodos de pago; se confirma cuando validemos tu
                    pago.
                  </p>

                  {/* Caja de vista previa del mensaje */}
                  <div className="rounded-2xl border-2 border-dashed border-[#1F3A6E]/25 bg-[#F8FAFF] p-5 space-y-2">
                    <span className="block text-xs font-bold uppercase tracking-wider text-[#1F3A6E]/70">
                      Mensaje que verá Amorelo en WhatsApp
                    </span>
                    <p className="text-base font-semibold text-[#1F3A6E] leading-relaxed">
                      {mensajeWhatsapp}
                    </p>
                  </div>

                  {/* Botón WhatsApp con el componente Button oficial */}
                  <div>
                    <Button
                      render={
                        <a
                          href={urlWhatsappFinal}
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      }
                      nativeButton={false}
                      className="relative h-14 w-full overflow-hidden bg-[#25D366] pr-2 pl-8 text-base font-bold text-white transition-colors duration-300 hover:bg-[#1EBE5D] active:bg-[#1EBE5D] shadow-lg shadow-emerald-600/25"
                    >
                      <span
                        aria-hidden="true"
                        className="absolute -inset-px origin-right scale-x-0 bg-white transition-transform duration-300 ease-out group-hover/button:scale-x-100 motion-reduce:transition-none"
                      />
                      <span className="relative z-10 flex items-center justify-center gap-3 transition-colors duration-300 group-hover/button:text-[#1EBE5D]">
                        Abrir WhatsApp
                        <span
                          aria-hidden="true"
                          className="inline-flex size-10 items-center justify-center rounded-full bg-white text-[#25D366] transition-colors duration-300 group-hover/button:bg-[#25D366] group-hover/button:text-white"
                        >
                          <MessageCircle className="size-5 fill-current" />
                        </span>
                      </span>
                    </Button>
                  </div>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setEstado("formulario")}
                      className="text-sm font-semibold text-[#1F3A6E]/70 underline hover:text-[#1A73E8] transition-colors cursor-pointer"
                    >
                      Volver al formulario para modificar datos
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
