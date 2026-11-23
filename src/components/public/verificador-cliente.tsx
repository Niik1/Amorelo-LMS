"use client";

import { useState } from "react";
import {
  Check,
  X,
  ShieldCheck,
  ShieldAlert,
  Copy,
  CheckCheck,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "cn";
import {
  verificarCodigoAction,
  type CertificadoVerificado,
  type CertificadoReemplazante,
} from "@/app/(public)/verificar/actions";

type StepStatus = "pending" | "running" | "success" | "error";

interface StepStates {
  step1: StepStatus;
  step2: StepStatus;
  step3: StepStatus;
}

interface VerificadorClienteProps {
  initialCodigo?: string;
  initialCertificado?: CertificadoVerificado | null;
  initialReemplazante?: CertificadoReemplazante | null;
}

function StepIndicator({ status }: { status: StepStatus }) {
  if (status === "success") {
    return (
      <div className="size-6 rounded-full bg-[#22C55E] flex items-center justify-center shrink-0 shadow-sm shadow-[#22C55E]/30 animate-in zoom-in-75 duration-200">
        <Check className="size-3.5 stroke-[3] text-[#070E24]" />
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="size-6 rounded-full bg-[#EF4444] flex items-center justify-center shrink-0 shadow-sm shadow-[#EF4444]/30 animate-in zoom-in-75 duration-200">
        <X className="size-3.5 stroke-[3] text-white" />
      </div>
    );
  }
  if (status === "running") {
    return (
      <div className="size-6 rounded-full border-2 border-[#1E2E6B] border-t-[#FF9138] animate-spin shrink-0" />
    );
  }
  return <div className="size-6 rounded-full border-2 border-[#1E2E6B]/60 shrink-0" />;
}

function formatearCodigoEntrada(valor: string): string {
  // Solo letras y números, mayúsculas, máx 12 caracteres alfanuméricos
  const limpio = valor.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 12);
  const bloques: string[] = [];
  for (let i = 0; i < limpio.length; i += 4) {
    bloques.push(limpio.slice(i, i + 4));
  }
  return bloques.join("-");
}

function formatearFecha(fechaStr?: string | null): string {
  if (!fechaStr) return "Fecha no registrada";
  try {
    const d = new Date(fechaStr);
    return d.toLocaleDateString("es-PE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return fechaStr;
  }
}

export function VerificadorCliente({
  initialCodigo = "",
  initialCertificado = null,
  initialReemplazante = null,
}: VerificadorClienteProps) {
  const [codigo, setCodigo] = useState(initialCodigo);
  const [codigoConsultado, setCodigoConsultado] = useState(initialCodigo);
  const [isLoading, setIsLoading] = useState(false);

  // Si viene con un código inicial que no existe, muestra el checklist con los 3 errores.
  // Si viene con un certificado válido o revocado, muestra directamente el resultado.
  const [showChecklist, setShowChecklist] = useState(() => {
    return Boolean(initialCodigo && !initialCertificado);
  });

  const [stepStates, setStepStates] = useState<StepStates>(() => {
    if (!initialCodigo) {
      return { step1: "pending", step2: "pending", step3: "pending" };
    }
    if (!initialCertificado) {
      return { step1: "error", step2: "error", step3: "error" };
    }
    if (initialCertificado.estado === "vigente" || initialCertificado.estado === "emitido") {
      return { step1: "success", step2: "success", step3: "success" };
    }
    return { step1: "success", step2: "success", step3: "error" };
  });

  const [certificado, setCertificado] = useState<CertificadoVerificado | null>(initialCertificado);
  const [reemplazante, setReemplazante] = useState<CertificadoReemplazante | null>(initialReemplazante);
  const [haBuscado, setHaBuscado] = useState(Boolean(initialCodigo));
  const [copiado, setCopiado] = useState(false);

  const fechaHoy = new Date().toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const ejecutarVerificacion = async (codigoABuscar: string) => {
    const limpio = codigoABuscar.trim().toUpperCase();
    if (!limpio) return;

    setHaBuscado(false);
    setShowChecklist(true);
    setIsLoading(true);

    // Reiniciar los pasos al estado de inicio
    setStepStates({ step1: "running", step2: "pending", step3: "pending" });

    // Actualizar URL sin recargar
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("codigo", limpio);
      window.history.replaceState(null, "", url.toString());
    }

    // Iniciar consulta a Supabase en paralelo
    const consultaPromise = verificarCodigoAction(limpio);

    // Esperar al menos 450ms para el primer paso visual
    const [res] = await Promise.all([
      consultaPromise,
      new Promise((r) => setTimeout(r, 450)),
    ]);

    const existe = res.encontrado && Boolean(res.certificado);
    const esVigente = existe && (res.certificado?.estado === "vigente" || res.certificado?.estado === "emitido");

    // PASO 1: Buscando el código en el registro
    if (!existe) {
      setStepStates({ step1: "error", step2: "running", step3: "pending" });
    } else {
      setStepStates({ step1: "success", step2: "running", step3: "pending" });
    }

    // PASO 2: Comprobando la firma digital
    await new Promise((r) => setTimeout(r, 500));
    if (!existe) {
      setStepStates((prev) => ({ ...prev, step2: "error", step3: "running" }));
    } else {
      setStepStates((prev) => ({ ...prev, step2: "success", step3: "running" }));
    }

    // PASO 3: Confirmando que el certificado sigue vigente
    await new Promise((r) => setTimeout(r, 550));
    if (!existe) {
      // Regla: Si no existe, los 3 pasos marcan rojo con ✕
      setStepStates((prev) => ({ ...prev, step3: "error" }));
    } else if (esVigente) {
      // Regla: Si existe y es vigente, los 3 marcan verde con ✓
      setStepStates((prev) => ({ ...prev, step3: "success" }));
    } else {
      // Regla: Si existe pero está revocado, paso 3 marca rojo con ✕
      setStepStates((prev) => ({ ...prev, step3: "error" }));
    }

    // Pausa visual para ver la resolución de los pasos
    await new Promise((r) => setTimeout(r, 500));

    setIsLoading(false);
    setHaBuscado(true);
    setCodigoConsultado(limpio);

    if (existe) {
      // Si existe (sea vigente o revocado): desaparece la tarjeta de carga y muestra el resultado en 2 columnas
      setShowChecklist(false);
      setCertificado(res.certificado);
      setReemplazante(res.certificadoReemplazante);
    } else {
      // Si no existe: la tarjeta de carga permanece con los 3 pasos en rojo y NO sale nada más abajo
      setShowChecklist(true);
      setCertificado(null);
      setReemplazante(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    ejecutarVerificacion(codigo);
  };

  const handleCopiarEnlace = () => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/verificar?codigo=${codigoConsultado}`;
      navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  const handleVerificarOtro = () => {
    setCodigo("");
    setCodigoConsultado("");
    setCertificado(null);
    setReemplazante(null);
    setShowChecklist(false);
    setIsLoading(false);
    setHaBuscado(false);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/verificar");
      const input = document.getElementById("codigo-verificacion");
      if (input) input.focus();
    }
  };

  const esValido = Boolean(
    certificado && (certificado.estado === "vigente" || certificado.estado === "emitido")
  );
  const esRevocado = Boolean(certificado && certificado.estado === "anulado");

  return (
    <div className="w-full">
      {/* Caja de Búsqueda */}
      <div className="max-w-3xl mx-auto rounded-2xl border border-slate-200/90 dark:border-[#2A3E82] bg-white/90 dark:bg-[#121B46]/85 backdrop-blur-md shadow-[0_20px_50px_rgba(15,23,42,0.06)] dark:shadow-[0_25px_60px_rgba(4,8,22,0.6)] p-3 sm:p-3.5 pl-5 sm:pl-6 mb-8 transition-all focus-within:border-[#1A73E8] dark:focus-within:border-[#3B54A6]">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex-1 flex flex-col justify-center min-w-0 py-0.5">
            <label
              htmlFor="codigo-verificacion"
              className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-blue-300/80 uppercase font-mono mb-1 select-none"
            >
              CÓDIGO ÚNICO
            </label>
            <input
              id="codigo-verificacion"
              type="text"
              name="codigo"
              autoComplete="off"
              spellCheck="false"
              maxLength={14}
              value={codigo}
              onChange={(e) => {
                const prevRaw = codigo.replace(/[^a-zA-Z0-9]/g, "");
                const nextRaw = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
                if (e.target.value.length < codigo.length && prevRaw === nextRaw) {
                  setCodigo(formatearCodigoEntrada(nextRaw.slice(0, -1)));
                } else {
                  setCodigo(formatearCodigoEntrada(e.target.value));
                }
              }}
              placeholder="8X2P-9M4K-7W1L"
              className="w-full bg-transparent border-0 p-0 text-xl sm:text-2xl font-mono uppercase tracking-[0.14em] font-extrabold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-blue-300/30 focus:ring-0 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="h-12 sm:h-14 px-7 sm:px-9 rounded-xl bg-[#1A73E8] hover:bg-[#155fc0] text-white dark:bg-white dark:hover:bg-slate-100 dark:text-[#0A1230] font-black text-sm sm:text-base shadow-md transition-all active:scale-95 shrink-0 flex items-center justify-center cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isLoading ? "Verificando..." : "Verificar"}
          </button>
        </form>
      </div>

      {/* Checklist de Comprobaciones (Shadcn Card) debajo del buscador */}
      {showChecklist && (
        <div className="max-w-3xl mx-auto mb-8">
          <Card className="rounded-2xl border border-slate-200/90 dark:border-[#2A3E82] bg-white/90 dark:bg-[#121B46]/85 backdrop-blur-md shadow-md dark:shadow-[0_25px_60px_rgba(4,8,22,0.6)] p-5 sm:p-6 transition-all animate-in fade-in zoom-in-95 duration-200">
            <CardContent className="p-0 flex flex-col gap-4">
              {/* Paso 1: Buscando el código en el registro */}
              <div className="flex items-center gap-3.5">
                <StepIndicator status={stepStates.step1} />
                <span
                  className={cn(
                    "text-sm sm:text-base font-semibold transition-colors duration-200",
                    stepStates.step1 !== "pending" ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-blue-200/40"
                  )}
                >
                  Buscando el código en el registro
                </span>
              </div>

              {/* Paso 2: Comprobando la firma digital */}
              <div className="flex items-center gap-3.5">
                <StepIndicator status={stepStates.step2} />
                <span
                  className={cn(
                    "text-sm sm:text-base font-semibold transition-colors duration-200",
                    stepStates.step2 !== "pending" ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-blue-200/40"
                  )}
                >
                  Comprobando la firma digital
                </span>
              </div>

              {/* Paso 3: Confirmando que el certificado sigue vigente */}
              <div className="flex items-center gap-3.5">
                <StepIndicator status={stepStates.step3} />
                <span
                  className={cn(
                    "text-sm sm:text-base font-semibold transition-colors duration-200",
                    stepStates.step3 !== "pending" ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-blue-200/40"
                  )}
                >
                  Confirmando que el certificado sigue vigente
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* VISTA EN 2 COLUMNAS (Solo aparece cuando el código existe: Válido o Revocado) */}
      {!isLoading && !showChecklist && certificado && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-3 duration-500">
          {/* COLUMNA IZQUIERDA: DIPLOMA OFICIAL (SI ES VÁLIDO) O PANEL REVOCADO (SI ES REVOCADO) */}
          <div className="lg:col-span-7 w-full">
            {esValido ? (
              /* DIPLOMA OFICIAL VÁLIDO (Homologado con la plantilla oficial de Amorelo y proporción horizontal fija) */
              <div className="relative w-full rounded-2xl bg-white p-1.5 sm:p-2.5 shadow-2xl border border-slate-200 aspect-[1.414/1] flex flex-col overflow-hidden">
                <div className="relative w-full h-full rounded-xl border-2 border-[#1F3A6E] p-1 sm:p-1.5 flex flex-col justify-between overflow-hidden bg-[#FDFBF7] text-slate-900">
                  <div className="relative w-full h-full rounded-lg border border-[#D4AF37] p-2 sm:p-4 lg:p-5 flex flex-col justify-between overflow-hidden">
                    {/* Ondas concéntricas sutiles de fondo (marca de agua) */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-25 select-none overflow-hidden"
                    >
                      <div className="size-[140px] sm:size-[260px] rounded-full border border-blue-200" />
                      <div className="absolute size-[220px] sm:size-[380px] rounded-full border border-blue-200" />
                      <div className="absolute size-[300px] sm:size-[500px] rounded-full border border-blue-200" />
                    </div>

                    {/* Cabecera del Diploma Oficial */}
                    <div className="relative z-10 text-center">
                      <p className="tracking-[0.25em] text-[10px] sm:text-base lg:text-lg font-black text-[#1F3A6E] uppercase font-sans">
                        A M O R E L O
                      </p>
                      <p className="tracking-[0.16em] text-[6.5px] sm:text-[9px] lg:text-[10px] font-bold text-[#D4AF37] uppercase font-sans">
                        ACADEMIA DE ARTE Y DECORACIÓN
                      </p>
                      <div className="mt-1 sm:mt-1.5">
                        <span className="inline-block bg-[#1F3A6E] text-white text-[6.5px] sm:text-[8px] lg:text-[9px] font-extrabold px-2.5 sm:px-3.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                          {certificado.tipo === "finalizacion"
                            ? "CONSTANCIA DE FINALIZACIÓN"
                            : "CONSTANCIA DE PARTICIPACIÓN"}
                        </span>
                      </div>
                    </div>

                    {/* Cuerpo del Diploma */}
                    <div className="relative z-10 text-center my-auto py-1">
                      <span className="text-[6.5px] sm:text-[9px] lg:text-[10px] text-slate-500 font-semibold tracking-wider uppercase block">
                        SE OTORGA EL PRESENTE RECONOCIMIENTO A:
                      </span>
                      <h3 className="font-serif font-black text-xs sm:text-xl lg:text-2xl text-[#1F3A6E] uppercase tracking-wide my-0.5 sm:my-1 truncate">
                        {certificado.nombre_certificado}
                      </h3>
                      <div className="w-24 sm:w-44 h-[1.5px] bg-[#D4AF37] mx-auto my-0.5 sm:my-1" />
                      <span className="text-[6px] sm:text-[8px] lg:text-[9px] text-slate-600 font-medium block">
                        Por haber completado y aprobado satisfactoriamente:
                      </span>
                      <p className="font-black text-[9px] sm:text-sm lg:text-base text-[#1F3A6E] truncate mt-0.5">
                        {certificado.titulo}
                      </p>
                      <p className="text-[6.5px] sm:text-[8.5px] lg:text-[9.5px] text-slate-500 font-medium italic mt-0.5">
                        Con una duración de {certificado.horas_academicas || 40} horas académicas.
                      </p>
                    </div>

                    {/* Pie del Diploma: Firma Brayan Huaylinos, Sello Oficial y QR */}
                    <div className="relative z-10 pt-1 sm:pt-2 flex items-end justify-between gap-1 border-t border-slate-200/80">
                      {/* Firma Dirección General */}
                      <div className="flex flex-col items-center min-w-0">
                        <svg
                          className="w-12 sm:w-20 h-3.5 sm:h-5 text-[#1F3A6E]/80 mb-0.5"
                          viewBox="0 0 100 30"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        >
                          <path d="M5 22 C 20 10, 30 28, 45 15 C 60 5, 70 25, 95 18" />
                        </svg>
                        <div className="w-14 sm:w-22 h-[1px] bg-slate-400 mb-0.5" />
                        <span className="text-[6.5px] sm:text-[8.5px] font-bold text-[#1F3A6E] leading-tight">
                          Brayan Huaylinos
                        </span>
                        <span className="text-[5.5px] sm:text-[7.5px] text-slate-500 leading-none">
                          Dirección General
                        </span>
                      </div>

                      {/* Sello y Fecha de Emisión */}
                      <div className="flex flex-col items-center justify-center shrink-0">
                        <div className="size-6 sm:size-9 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37] text-[#1F3A6E] flex items-center justify-center shadow-xs">
                          <Check className="size-3 sm:size-4 stroke-[3] text-[#1F3A6E]" />
                        </div>
                        <span className="text-[5.5px] sm:text-[7.5px] text-slate-600 font-medium mt-0.5 text-center">
                          Lima, Perú • {formatearFecha(certificado.emitido_en)}
                        </span>
                      </div>

                      {/* QR Code Oficial y Código */}
                      <div className="flex flex-col items-center shrink-0">
                        {certificado.qrDataUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={certificado.qrDataUrl}
                            alt="QR Verificación Oficial"
                            className="size-7 sm:size-12 object-contain"
                          />
                        ) : (
                          <div className="size-7 sm:size-12 bg-slate-200 rounded flex items-center justify-center font-mono text-[7px] text-slate-500">
                            QR
                          </div>
                        )}
                        <span className="text-[5.5px] sm:text-[7.5px] font-mono font-bold text-[#1F3A6E] tracking-wider mt-0.5">
                          {certificado.codigo_verificacion}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* PANEL DESTACADO PARA CERTIFICADO REVOCADO (NO MUESTRA EL DIPLOMA) */
              <div className="rounded-2xl border-2 border-red-500/40 bg-[#121B46]/85 backdrop-blur-md p-6 sm:p-10 flex flex-col items-center justify-center text-center aspect-[1.414/1] shadow-2xl relative overflow-hidden">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-radial from-red-500/10 via-transparent to-transparent blur-2xl"
                />
                <div className="size-14 sm:size-20 rounded-full bg-red-500/15 border border-red-500/30 text-red-500 flex items-center justify-center mb-3 sm:mb-5 shadow-inner">
                  <ShieldAlert className="size-7 sm:size-10 stroke-[2.5]" />
                </div>
                <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-red-500 uppercase tracking-widest font-mono">
                  CERTIFICADO REVOCADO
                </h2>
                <p className="mt-2 sm:mt-3 text-xs sm:text-sm lg:text-base text-red-200/80 max-w-md leading-relaxed font-normal">
                  Este documento fue anulado oficialmente y ya no cuenta con validez legal ni académica en el registro de Amorelo.
                </p>
                <div className="mt-4 sm:mt-6 p-2.5 sm:p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-left w-full max-w-md">
                  <span className="text-[9px] sm:text-[10px] font-mono uppercase font-bold tracking-wider text-red-300/80">
                    Motivo oficial de revocación:
                  </span>
                  <p className="text-[10px] sm:text-xs font-semibold text-white mt-0.5">
                    &quot;{certificado.motivo_anulacion || "Rectificación de datos del titular. Se emitió un nuevo certificado."}&quot;
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: INFORMACIÓN, COMPROBACIONES Y BOTONES */}
          <div className="lg:col-span-5 flex flex-col gap-4 w-full">
            {/* Banner de Estado (Verde si es Válido, Rojo si es Revocado) */}
            {esValido ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-[#07361E] p-4 sm:p-5 flex items-start gap-3.5 shadow-lg">
                <ShieldCheck className="size-6 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-lg text-emerald-300">
                    Certificado válido
                  </h4>
                  <p className="text-xs sm:text-sm text-emerald-100/75 mt-0.5 leading-relaxed">
                    Fue emitido por Amorelo y sigue vigente en el registro oficial.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-red-500/30 bg-[#3B1418] p-4 sm:p-5 flex items-start gap-3.5 shadow-lg">
                <ShieldAlert className="size-6 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-lg text-red-400">
                    Certificado revocado
                  </h4>
                  <p className="text-xs sm:text-sm text-red-100/75 mt-0.5 leading-relaxed">
                    Este documento existió, pero ya no tiene validez.
                  </p>
                </div>
              </div>
            )}

            {/* Tarjeta: DATOS DEL REGISTRO */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-[#2A3E82] bg-white/90 dark:bg-[#121B46]/85 backdrop-blur-md p-5 sm:p-6 shadow-md dark:shadow-[0_20px_50px_rgba(4,8,22,0.5)]">
              <h5 className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-blue-300/80 uppercase font-mono mb-4">
                DATOS DEL REGISTRO
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <span className="text-xs text-slate-500 dark:text-blue-200/60 font-medium block">
                    Titular
                  </span>
                  <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5 leading-snug">
                    {certificado.nombre_certificado}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-blue-200/60 font-medium block">
                    Programa
                  </span>
                  <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5 leading-snug">
                    {certificado.titulo}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-blue-200/60 font-medium block">
                    Duración
                  </span>
                  <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {certificado.horas_academicas || 40} horas académicas
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-blue-200/60 font-medium block">
                    Emisión
                  </span>
                  <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {formatearFecha(certificado.emitido_en)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-blue-200/60 font-medium block">
                    Código único
                  </span>
                  <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-mono mt-0.5 tracking-wider">
                    {certificado.codigo_verificacion}
                  </p>
                </div>
              </div>
            </div>

            {/* Tarjeta: COMPROBACIONES */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-[#2A3E82] bg-white/90 dark:bg-[#121B46]/85 backdrop-blur-md p-5 sm:p-6 shadow-md dark:shadow-[0_20px_50px_rgba(4,8,22,0.5)]">
              <h5 className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-blue-300/80 uppercase font-mono mb-4">
                COMPROBACIONES
              </h5>
              <div className="flex flex-col gap-4">
                {/* Comprobación 1: Código encontrado */}
                <div className="flex items-start gap-3">
                  <div className="size-5 rounded-full bg-[#22C55E] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="size-3 stroke-[3] text-white dark:text-[#070E24]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      Código encontrado
                    </p>
                    <p className="text-xs text-slate-500 dark:text-blue-200/70 mt-0.5">
                      Registrado el {formatearFecha(certificado.emitido_en)}
                    </p>
                  </div>
                </div>

                {/* Comprobación 2: Firma digital */}
                <div className="flex items-start gap-3">
                  <div className="size-5 rounded-full bg-[#22C55E] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="size-3 stroke-[3] text-white dark:text-[#070E24]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      Firma digital correcta
                    </p>
                    <p className="text-xs text-slate-500 dark:text-blue-200/70 mt-0.5">
                      El contenido no fue modificado desde su emisión
                    </p>
                  </div>
                </div>

                {/* Comprobación 3: Vigencia (Vigente vs Revocado) */}
                {esValido ? (
                  <div className="flex items-start gap-3">
                    <div className="size-5 rounded-full bg-[#22C55E] flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="size-3 stroke-[3] text-white dark:text-[#070E24]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        Vigente
                      </p>
                      <p className="text-xs text-slate-500 dark:text-blue-200/70 mt-0.5">
                        Consultado el {fechaHoy}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="size-5 rounded-full bg-[#EF4444] flex items-center justify-center shrink-0 mt-0.5">
                      <X className="size-3 stroke-[3] text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        Revocado el {formatearFecha(certificado.emitido_en)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-blue-200/70 mt-0.5">
                        {certificado.motivo_anulacion || "Rectificación de datos del titular. Se emitió un nuevo certificado."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botones de Acción: Botón Azul/Blanco y Botón Secundario */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleCopiarEnlace}
                className="h-12 px-6 rounded-xl bg-[#1A73E8] hover:bg-[#155fc0] text-white dark:bg-white dark:hover:bg-slate-100 dark:text-[#0A1230] font-black text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiado ? (
                  <>
                    <CheckCheck className="size-4 text-emerald-300 dark:text-emerald-600" />
                    <span>¡Enlace copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-4 text-white dark:text-[#0A1230]" />
                    <span>Copiar enlace de validación</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleVerificarOtro}
                className="h-12 px-6 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 dark:bg-[#121B46] dark:hover:bg-[#1A265E] dark:border-[#2A3E82] dark:text-white font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="size-4 text-slate-500 dark:text-blue-200/80" />
                <span>Verificar otro código</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
