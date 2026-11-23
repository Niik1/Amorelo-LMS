"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  registrarReclamoPublicoAction,
  type RegistrarReclamoInput,
} from "@/server/reclamos/acciones-publicas";
import { cn } from "@/lib/utils";

const IDEAS_PEDIDO = [
  "Reembolso del taller",
  "Reprogramación de clase",
  "Disculpas formales",
] as const;

export function FormularioLibroReclamaciones() {
  const [tipo, setTipo] = useState<"reclamo" | "queja">("reclamo");
  const [tipoDocumento, setTipoDocumento] = useState<"DNI" | "CE" | "PASAPORTE" | "RUC">("DNI");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [consumidorNombres, setConsumidorNombres] = useState("");
  const [consumidorApellidos, setConsumidorApellidos] = useState("");
  const [domicilio, setDomicilio] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");

  const [esMenorEdad, setEsMenorEdad] = useState(false);
  const [representanteNombre, setRepresentanteNombre] = useState("");
  const [representanteDocumento, setRepresentanteDocumento] = useState("");

  const [bienContratado, setBienContratado] = useState<"producto" | "servicio">("servicio");
  const [descripcionBien, setDescripcionBien] = useState("");
  const [montoReclamado, setMontoReclamado] = useState("");
  const [moneda, setMoneda] = useState<"PEN" | "USD">("PEN");
  const [ordenId, setOrdenId] = useState("");

  const [detalle, setDetalle] = useState("");
  const [pedidoConsumidor, setPedidoConsumidor] = useState("");

  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [declaraVeracidad, setDeclaraVeracidad] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const [minutosEsperaRateLimit, setMinutosEsperaRateLimit] = useState<number | null>(null);

  // Rate limit por navegador/dispositivo: 15 minutos entre envíos
  useEffect(() => {
    const verificarRateLimit = () => {
      try {
        const guardado = localStorage.getItem("amorelo_ultimo_reclamo_ts");
        if (guardado) {
          const ts = parseInt(guardado, 10);
          const diffMs = Date.now() - ts;
          const quinceMinMs = 15 * 60 * 1000;
          if (diffMs < quinceMinMs) {
            const restanteMin = Math.ceil((quinceMinMs - diffMs) / (60 * 1000));
            setMinutosEsperaRateLimit(restanteMin);
          } else {
            setMinutosEsperaRateLimit(null);
          }
        }
      } catch {
        // En caso de modo incógnito o localStorage bloqueado
      }
    };

    verificarRateLimit();
    const interval = setInterval(verificarRateLimit, 15000);
    return () => clearInterval(interval);
  }, []);

  const [resultadoExitoso, setResultadoExitoso] = useState<{
    id: string;
    numero: string;
    creadoEn?: string;
    fechaLimiteRespuesta?: string;
    correo: string;
    tipo: string;
    bien: string;
  } | null>(null);

  const fechaHoy = useMemo(() => {
    return new Intl.DateTimeFormat("es-PE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }, []);

  const fechaHoraExito = useMemo(() => {
    const fecha = resultadoExitoso?.creadoEn ? new Date(resultadoExitoso.creadoEn) : new Date();
    try {
      const fechaStr = new Intl.DateTimeFormat("es-PE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(fecha);
      const horaStr = new Intl.DateTimeFormat("es-PE", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }).format(fecha);
      return `${fechaStr} a las ${horaStr}`;
    } catch {
      return fechaHoy;
    }
  }, [resultadoExitoso?.creadoEn, fechaHoy]);

  // Validación reactiva de cada sección para el Stepper "TU HOJA"
  const docValido = Boolean(
    tipoDocumento === "DNI"
      ? /^\d{8}$/.test(numeroDocumento.trim())
      : tipoDocumento === "RUC"
      ? /^\d{11}$/.test(numeroDocumento.trim())
      : numeroDocumento.trim().length >= 4
  );

  const telefonoValido = !telefono.trim() || /^\d{9}$/.test(telefono.trim());

  const seccion1Completa = Boolean(
    tipoDocumento &&
      docValido &&
      consumidorNombres.trim().length >= 2 &&
      consumidorApellidos.trim().length >= 2 &&
      domicilio.trim().length >= 5 &&
      correo.trim().includes("@") &&
      telefonoValido &&
      (!esMenorEdad || (representanteNombre.trim().length >= 3 && representanteDocumento.trim().length >= 4))
  );

  const seccion2Completa = Boolean(
    bienContratado &&
    descripcionBien.trim().length >= 3 &&
    ordenId.trim().length >= 3
  );

  const seccion3Completa = Boolean(
    tipo &&
    detalle.trim().length >= 10 &&
    detalle.trim().length <= 700 &&
    pedidoConsumidor.trim().length >= 5 &&
    pedidoConsumidor.trim().length <= 350
  );

  const seccion4Completa = Boolean(declaraVeracidad && aceptaTerminos);

  const seccionesCompletas = useMemo(() => {
    let count = 0;
    if (seccion1Completa) count++;
    if (seccion2Completa) count++;
    if (seccion3Completa) count++;
    if (seccion4Completa) count++;
    return count;
  }, [seccion1Completa, seccion2Completa, seccion3Completa, seccion4Completa]);

  const agregarIdeaPedido = (idea: string) => {
    setPedidoConsumidor((prev) => {
      const limpia = prev.trim();
      const nueva = limpia ? (limpia.toLowerCase().includes(idea.toLowerCase()) ? limpia : `${limpia}; ${idea}`) : idea;
      return nueva.slice(0, 350);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    if (minutosEsperaRateLimit) {
      setErrorValidacion(`Por seguridad, debes esperar aproximadamente ${minutosEsperaRateLimit} minuto(s) antes de enviar otra reclamación.`);
      return;
    }

    if (!numeroDocumento.trim()) {
      setErrorValidacion("Ingresa el número de tu documento de identidad.");
      return;
    }
    if (tipoDocumento === "DNI" && !/^\d{8}$/.test(numeroDocumento.trim())) {
      setErrorValidacion("El DNI debe contener exactamente 8 dígitos numéricos.");
      return;
    }
    if (tipoDocumento === "RUC" && !/^\d{11}$/.test(numeroDocumento.trim())) {
      setErrorValidacion("El RUC debe contener exactamente 11 dígitos numéricos.");
      return;
    }
    if ((tipoDocumento === "CE" || tipoDocumento === "PASAPORTE") && !/^[A-Za-z0-9]{4,12}$/.test(numeroDocumento.trim())) {
      setErrorValidacion("El documento debe contener entre 4 y 12 caracteres alfanuméricos.");
      return;
    }

    if (!consumidorNombres.trim() || !consumidorApellidos.trim()) {
      setErrorValidacion("Ingresa tus nombres y apellidos completos.");
      return;
    }
    if (consumidorNombres.trim().length > 50 || consumidorApellidos.trim().length > 50) {
      setErrorValidacion("Nombres y apellidos no deben exceder los 50 caracteres cada uno.");
      return;
    }

    if (telefono.trim() && !/^\d{9}$/.test(telefono.trim())) {
      setErrorValidacion("El teléfono celular debe contener exactamente 9 dígitos numéricos.");
      return;
    }

    if (!domicilio.trim() || domicilio.trim().length < 5) {
      setErrorValidacion("Ingresa tu dirección de domicilio completa (mínimo 5 caracteres).");
      return;
    }
    if (domicilio.trim().length > 150) {
      setErrorValidacion("La dirección de domicilio no debe exceder los 150 caracteres.");
      return;
    }

    if (!correo.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
      setErrorValidacion("Ingresa un correo electrónico válido para enviarte la constancia.");
      return;
    }

    if (esMenorEdad) {
      if (!representanteNombre.trim() || !representanteDocumento.trim()) {
        setErrorValidacion("Para menores de edad, debes indicar el nombre y documento del padre o apoderado.");
        return;
      }
      if (representanteNombre.trim().length > 50) {
        setErrorValidacion("El nombre del representante no debe exceder los 50 caracteres.");
        return;
      }
      if (representanteDocumento.trim().length > 12) {
        setErrorValidacion("El documento del representante no debe exceder los 12 caracteres.");
        return;
      }
    }

    if (!descripcionBien.trim()) {
      setErrorValidacion("Indica qué producto, curso o taller compraste o contrataste.");
      return;
    }
    if (descripcionBien.trim().length > 120) {
      setErrorValidacion("La descripción del bien no debe exceder los 120 caracteres.");
      return;
    }

    if (!ordenId.trim() || ordenId.trim().length < 3) {
      setErrorValidacion("Debes ingresar el N.° de orden o pedido de tu compra (mínimo 3 caracteres).");
      return;
    }

    if (detalle.trim().length < 10) {
      setErrorValidacion("Describe con mayor detalle los hechos ocurridos (mínimo 10 caracteres).");
      return;
    }
    if (detalle.trim().length > 700) {
      setErrorValidacion("El detalle del reclamo no debe exceder los 700 caracteres.");
      return;
    }

    if (pedidoConsumidor.trim().length < 5) {
      setErrorValidacion("Indica qué solución o pedido concreto solicitas a Amorelo.");
      return;
    }
    if (pedidoConsumidor.trim().length > 350) {
      setErrorValidacion("El pedido concreto no debe exceder los 350 caracteres.");
      return;
    }

    if (!declaraVeracidad) {
      setErrorValidacion("Debes declarar la veracidad de los datos consignados según la ley.");
      return;
    }

    if (!aceptaTerminos) {
      setErrorValidacion("Debes autorizar el tratamiento de tus datos para la resolución del reclamo.");
      return;
    }

    setCargando(true);

    try {
      const payload: RegistrarReclamoInput = {
        tipo,
        tipoDocumento,
        numeroDocumento: numeroDocumento.trim(),
        consumidorNombres: consumidorNombres.trim(),
        consumidorApellidos: consumidorApellidos.trim(),
        domicilio: domicilio.trim(),
        telefono: telefono.trim() || undefined,
        correo: correo.trim().toLowerCase(),
        esMenorEdad,
        representanteNombre: esMenorEdad ? representanteNombre.trim() : undefined,
        representanteDocumento: esMenorEdad ? representanteDocumento.trim() : undefined,
        bienContratado,
        descripcionBien: descripcionBien.trim(),
        montoReclamado: montoReclamado ? parseFloat(montoReclamado) : undefined,
        moneda: montoReclamado ? moneda : undefined,
        ordenId: ordenId.trim(),
        detalle: detalle.trim(),
        pedidoConsumidor: pedidoConsumidor.trim(),
      };

      const res = await registrarReclamoPublicoAction(payload);

      if (!res.ok || !res.id || !res.numero) {
        setErrorValidacion(res.error || "Ocurrió un error al procesar la reclamación.");
        setCargando(false);
        return;
      }

      // Guardar marca de tiempo de envío exitoso para el rate limit en este dispositivo
      try {
        localStorage.setItem("amorelo_ultimo_reclamo_ts", Date.now().toString());
        setMinutosEsperaRateLimit(15);
      } catch {}

      setResultadoExitoso({
        id: res.id,
        numero: res.numero,
        creadoEn: res.creadoEn,
        fechaLimiteRespuesta: res.fechaLimiteRespuesta,
        correo: correo.trim().toLowerCase(),
        tipo: tipo === "reclamo" ? "Reclamo" : "Queja",
        bien: descripcionBien.trim(),
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setErrorValidacion("Error de conexión al registrar. Por favor revisa tu internet.");
    } finally {
      setCargando(false);
    }
  };

  // --- Vista Principal con Punto 1, Punto 2, Punto 3 y Punto 4 ---
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:max-w-[1400px]">
      <div className="flex flex-col gap-8 sm:gap-10">
        {/* PUNTO 1: Cabecera limpia alineada a la izquierda */}
        <header className="text-left">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
            Libro de Reclamaciones
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-blue-200/80">
            Registra un reclamo o una queja sobre un curso, taller o producto de Amorelo. Te enviamos la constancia y una copia en PDF a tu correo.
          </p>
        </header>

        {/* PUNTO 2: Tarjeta del Proveedor ancha (5 columnas) */}
        <section
          aria-label="Datos del Proveedor"
          className="w-full rounded-2xl border border-blue-600/30 bg-[#1A73E8] p-5 text-white shadow-md backdrop-blur-sm transition-colors duration-300 sm:p-6 dark:border-blue-400/25 dark:bg-[#0D1A4F]/90 dark:text-inherit dark:shadow-[0_4px_30px_rgba(0,0,0,0.3)]"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 lg:gap-6">
            {/* 1. Proveedor */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 dark:text-blue-300/70">
                PROVEEDOR
              </span>
              <span className="text-sm font-bold text-white dark:text-white">
                Amorelo
              </span>
            </div>

            {/* 2. RUC */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 dark:text-blue-300/70">
                RUC
              </span>
              <span className="font-mono text-sm font-semibold text-white dark:text-white">
                10729729221
              </span>
            </div>

            {/* 3. Fecha de Registro */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 dark:text-blue-300/70">
                FECHA DE REGISTRO
              </span>
              <span className="text-sm font-semibold text-white dark:text-white">
                {fechaHoy}
              </span>
            </div>

            {/* 4. Número de Hoja */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 dark:text-blue-300/70">
                N.° DE HOJA
              </span>
              <span className="text-sm font-semibold text-white dark:text-blue-400">
                Se asigna al enviar
              </span>
            </div>

            {/* 5. Atención */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 dark:text-blue-300/70">
                ATENCIÓN
              </span>
              <a
                href="mailto:brayan@amorelo.pe"
                className="text-xs font-medium text-white transition-colors hover:text-white/80 hover:underline dark:text-blue-100 dark:hover:text-blue-300"
              >
                brayan@amorelo.pe
              </a>
              <a
                href="tel:+51945729551"
                className="font-mono text-xs text-white transition-colors hover:text-white/80 hover:underline dark:text-blue-200/80 dark:hover:text-blue-300"
              >
                +51 945729551
              </a>
            </div>
          </div>
        </section>

        {resultadoExitoso ? (
          /* TARJETA DE ÉXITO POST-ENVÍO (MAQUETADO EXACTO) */
          <div className="mx-auto my-6 w-full max-w-xl px-2 sm:px-4">
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-xl transition-colors duration-300 dark:border-blue-400/25 dark:bg-[#0D1A4F]">
              <div className="text-center">
                {/* Ícono circular verde con check */}
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <Check className="size-7 stroke-[2.5]" />
                </div>

                <h2 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Hoja de reclamación registrada
                </h2>

                <p className="mt-2 text-sm text-slate-600 dark:text-blue-200/80 leading-relaxed">
                  Enviamos la constancia y una copia en PDF a{" "}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {resultadoExitoso.correo}
                  </span>
                  .
                </p>
              </div>

              {/* Línea divisoria */}
              <div className="my-6 border-b border-slate-200/80 dark:border-blue-400/20" />

              {/* Cuadrícula 2x2 con datos reales */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 text-left">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500 dark:text-blue-300/70">
                    N.° de hoja
                  </span>
                  <span className="font-mono text-base font-extrabold tracking-wide text-slate-900 dark:text-white">
                    {resultadoExitoso.numero}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500 dark:text-blue-300/70">
                    Fecha y hora
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {fechaHoraExito}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500 dark:text-blue-300/70">
                    Manifestación
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {resultadoExitoso.tipo}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500 dark:text-blue-300/70">
                    Bien
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                    {resultadoExitoso.bien}
                  </span>
                </div>
              </div>

              {/* Botón único: Ir al inicio */}
              <div className="mt-8 flex justify-center">
                <Link
                  href="/"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1A73E8] px-8 text-sm font-bold text-white shadow-md transition-all hover:bg-[#155fc0] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  Ir al inicio
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>

        {/* ALERTA DE RATE LIMIT CLIENTE */}
        {minutosEsperaRateLimit && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-sm font-medium text-amber-700 dark:text-amber-300">
            <Clock className="size-5 shrink-0 mt-0.5" />
            <span>
              Ya has registrado una reclamación recientemente desde este navegador. Por seguridad, debes esperar aproximadamente {minutosEsperaRateLimit} minuto{minutosEsperaRateLimit > 1 ? "s" : ""} antes de enviar otra hoja.
            </span>
          </div>
        )}

        {/* ALERTA DE ERROR DE VALIDACIÓN GLOBAL */}
        {errorValidacion && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-sm font-medium text-red-600 dark:text-red-400">
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
            <span>{errorValidacion}</span>
          </div>
        )}

        {/* PUNTO 3 & 4: ESTRUCTURA DE 2 COLUMNAS (DESKTOP) Y ADAPTATIVA (MÓVIL) */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr]">
          {/* COLUMNA IZQUIERDA: TARJETA "TU HOJA" (STICKY EN DESKTOP / COMPACTA EN MÓVIL) */}
          <aside className="w-full lg:sticky lg:top-28 xl:top-32 lg:self-start h-fit z-20">
            {/* Versión Escritorio / Tablet (Sticky) */}
            <div className="hidden lg:flex lg:flex-col lg:gap-5 rounded-2xl border border-blue-600/30 bg-[#1A73E8] p-5 text-white shadow-md backdrop-blur-sm transition-colors duration-300 dark:border-blue-400/25 dark:bg-[#0D1A4F]/90 dark:text-inherit">
              <span className="text-[11px] font-bold uppercase tracking-widest text-white/85 dark:text-blue-300/70">
                TU HOJA
              </span>

              {/* Lista de pasos con círculos / checks */}
              <nav aria-label="Progreso del formulario" className="flex flex-col gap-3.5">
                {/* Paso 1 */}
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all",
                      seccion1Completa
                        ? "bg-emerald-500 text-white shadow-xs"
                        : "bg-white text-[#1A73E8] shadow-xs dark:border dark:border-blue-400/30 dark:bg-[#081033] dark:text-blue-200"
                    )}
                  >
                    {seccion1Completa ? <Check className="size-4" /> : "1"}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold transition-colors",
                      seccion1Completa
                        ? "text-white"
                        : "text-white/90 dark:text-blue-200/70"
                    )}
                  >
                    Consumidor reclamante
                  </span>
                </div>

                {/* Paso 2 */}
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all",
                      seccion2Completa
                        ? "bg-emerald-500 text-white shadow-xs"
                        : "bg-white text-[#1A73E8] shadow-xs dark:border dark:border-blue-400/30 dark:bg-[#081033] dark:text-blue-200"
                    )}
                  >
                    {seccion2Completa ? <Check className="size-4" /> : "2"}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold transition-colors",
                      seccion2Completa
                        ? "text-white"
                        : "text-white/90 dark:text-blue-200/70"
                    )}
                  >
                    Bien contratado
                  </span>
                </div>

                {/* Paso 3 */}
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all",
                      seccion3Completa
                        ? "bg-emerald-500 text-white shadow-xs"
                        : "bg-white text-[#1A73E8] shadow-xs dark:border dark:border-blue-400/30 dark:bg-[#081033] dark:text-blue-200"
                    )}
                  >
                    {seccion3Completa ? <Check className="size-4" /> : "3"}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold transition-colors",
                      seccion3Completa
                        ? "text-white"
                        : "text-white/90 dark:text-blue-200/70"
                    )}
                  >
                    Detalle del reclamo
                  </span>
                </div>

                {/* Paso 4 */}
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all",
                      seccion4Completa
                        ? "bg-emerald-500 text-white shadow-xs"
                        : "bg-white text-[#1A73E8] shadow-xs dark:border dark:border-blue-400/30 dark:bg-[#081033] dark:text-blue-200"
                    )}
                  >
                    {seccion4Completa ? <Check className="size-4" /> : "4"}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold transition-colors",
                      seccion4Completa
                        ? "text-white"
                        : "text-white/90 dark:text-blue-200/70"
                    )}
                  >
                    Confirmación
                  </span>
                </div>
              </nav>

              {/* Barra de Progreso Desktop */}
              <div className="border-t border-white/20 pt-3 dark:border-blue-400/20">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/25 dark:bg-[#081033]">
                  <div
                    className="h-full bg-white transition-all duration-300 dark:bg-blue-400"
                    style={{ width: `${(seccionesCompletas / 4) * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-center text-[11px] font-semibold text-white/90 dark:text-blue-300/70">
                  {seccionesCompletas} de 4 secciones completas
                </p>
              </div>
            </div>

            {/* Versión Móvil: Barra Compacta Horizontal */}
            <div className="block lg:hidden rounded-2xl border border-blue-600/30 bg-[#1A73E8] p-4 text-white shadow-md backdrop-blur-sm dark:border-blue-400/25 dark:bg-[#0D1A4F]/90 dark:text-inherit">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/85 dark:text-blue-300/70">
                TU HOJA
              </span>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/25 dark:bg-[#081033]">
                <div
                  className="h-full bg-white transition-all duration-300 dark:bg-blue-400"
                  style={{ width: `${(seccionesCompletas / 4) * 100}%` }}
                />
              </div>
              <p className="mt-2 text-xs font-semibold text-white/90 dark:text-blue-200/80">
                {seccionesCompletas} de 4 secciones completas
              </p>
            </div>
          </aside>

          {/* COLUMNA DERECHA: FORMULARIO PRINCIPAL */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* SECCIÓN 1: IDENTIFICACIÓN DEL CONSUMIDOR */}
            <section
              aria-label="Identificación del consumidor"
              className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-xs backdrop-blur-sm transition-colors duration-300 sm:p-7 dark:border-blue-400/25 dark:bg-[#0D1A4F]/90"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#1A73E8] text-xs font-bold text-white shadow-xs dark:bg-blue-400/20 dark:text-blue-300">
                  1
                </span>
                <div>
                  <h2 className="font-heading text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
                    Identificación del consumidor reclamante
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-blue-200/70">
                    Los datos de quien presenta el reclamo.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {/* Tipo Documento */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-blue-300/80">
                        TIPO DE DOCUMENTO
                      </label>
                      <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-blue-300/50">
                        OBLIGATORIO
                      </span>
                    </div>
                    <Select
                      value={tipoDocumento}
                      onValueChange={(val) => {
                        if (val) {
                          const nuevoTipo = val as "DNI" | "CE" | "PASAPORTE" | "RUC";
                          setTipoDocumento(nuevoTipo);
                          if (nuevoTipo === "DNI") {
                            setNumeroDocumento((prev) => prev.replace(/\D/g, "").slice(0, 8));
                          } else if (nuevoTipo === "RUC") {
                            setNumeroDocumento((prev) => prev.replace(/\D/g, "").slice(0, 11));
                          } else {
                            setNumeroDocumento((prev) => prev.replace(/[^A-Za-z0-9]/g, "").slice(0, 12).toUpperCase());
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="h-11 w-full rounded-xl border border-slate-200/90 bg-slate-50/80 px-3.5 text-sm font-medium text-slate-900 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-400/25 dark:bg-[#081033] dark:text-white dark:focus-visible:ring-blue-400">
                        <SelectValue placeholder="Tipo de documento" />
                      </SelectTrigger>
                      <SelectContent className="z-50 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-blue-400/30 dark:bg-[#0c1642] dark:text-white">
                        <SelectItem value="DNI" className="cursor-pointer rounded-xl py-2.5 text-xs font-semibold text-slate-900 hover:bg-slate-100 dark:text-white dark:hover:bg-blue-600/30 dark:focus:bg-blue-600/30">
                          DNI
                        </SelectItem>
                        <SelectItem value="CE" className="cursor-pointer rounded-xl py-2.5 text-xs font-semibold text-slate-900 hover:bg-slate-100 dark:text-white dark:hover:bg-blue-600/30 dark:focus:bg-blue-600/30">
                          Carné de Extranjería (CE)
                        </SelectItem>
                        <SelectItem value="PASAPORTE" className="cursor-pointer rounded-xl py-2.5 text-xs font-semibold text-slate-900 hover:bg-slate-100 dark:text-white dark:hover:bg-blue-600/30 dark:focus:bg-blue-600/30">
                          Pasaporte
                        </SelectItem>
                        <SelectItem value="RUC" className="cursor-pointer rounded-xl py-2.5 text-xs font-semibold text-slate-900 hover:bg-slate-100 dark:text-white dark:hover:bg-blue-600/30 dark:focus:bg-blue-600/30">
                          RUC
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Número Documento */}
                  <div className="sm:col-span-2">
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-blue-300/80">
                        NÚMERO DE DOCUMENTO
                      </label>
                      <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-blue-300/50">
                        OBLIGATORIO
                      </span>
                    </div>
                    <Input
                      type="text"
                      inputMode={tipoDocumento === "DNI" || tipoDocumento === "RUC" ? "numeric" : "text"}
                      required
                      placeholder={
                        tipoDocumento === "DNI"
                          ? "8 dígitos numéricos"
                          : tipoDocumento === "RUC"
                          ? "11 dígitos numéricos"
                          : "Hasta 12 alfanuméricos"
                      }
                      maxLength={tipoDocumento === "DNI" ? 8 : tipoDocumento === "RUC" ? 11 : 12}
                      value={numeroDocumento}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (tipoDocumento === "DNI") {
                          setNumeroDocumento(val.replace(/\D/g, "").slice(0, 8));
                        } else if (tipoDocumento === "RUC") {
                          setNumeroDocumento(val.replace(/\D/g, "").slice(0, 11));
                        } else {
                          setNumeroDocumento(val.replace(/[^A-Za-z0-9]/g, "").slice(0, 12).toUpperCase());
                        }
                      }}
                      className="h-11 rounded-xl border-slate-200/90 bg-slate-50/80 text-slate-900 dark:border-blue-400/25 dark:bg-[#081033] dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Nombres */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-blue-300/80">
                        NOMBRES
                      </label>
                      <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-blue-300/50">
                        OBLIGATORIO
                      </span>
                    </div>
                    <Input
                      type="text"
                      required
                      placeholder="Tus nombres"
                      maxLength={50}
                      value={consumidorNombres}
                      onChange={(e) => setConsumidorNombres(e.target.value.slice(0, 50))}
                      className="h-11 rounded-xl border-slate-200/90 bg-slate-50/80 text-slate-900 dark:border-blue-400/25 dark:bg-[#081033] dark:text-white"
                    />
                  </div>

                  {/* Apellidos */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-blue-300/80">
                        APELLIDOS
                      </label>
                      <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-blue-300/50">
                        OBLIGATORIO
                      </span>
                    </div>
                    <Input
                      type="text"
                      required
                      placeholder="Tus apellidos"
                      maxLength={50}
                      value={consumidorApellidos}
                      onChange={(e) => setConsumidorApellidos(e.target.value.slice(0, 50))}
                      className="h-11 rounded-xl border-slate-200/90 bg-slate-50/80 text-slate-900 dark:border-blue-400/25 dark:bg-[#081033] dark:text-white"
                    />
                  </div>
                </div>

                {/* Domicilio */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-blue-300/80">
                      DOMICILIO
                    </label>
                    <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-blue-300/50">
                      OBLIGATORIO
                    </span>
                  </div>
                  <Input
                    type="text"
                    required
                    placeholder="Av. Ejemplo 123, Miraflores, Lima"
                    maxLength={150}
                    value={domicilio}
                    onChange={(e) => setDomicilio(e.target.value.slice(0, 150))}
                    className="h-11 rounded-xl border-slate-200/90 bg-slate-50/80 text-slate-900 dark:border-blue-400/25 dark:bg-[#081033] dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Teléfono */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-blue-300/80">
                        TELÉFONO O CELULAR
                      </label>
                      <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-blue-300/40">
                        OPCIONAL
                      </span>
                    </div>
                    <Input
                      type="tel"
                      inputMode="numeric"
                      placeholder="999 888 777 (9 dígitos)"
                      maxLength={9}
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value.replace(/\D/g, "").slice(0, 9))}
                      className="h-11 rounded-xl border-slate-200/90 bg-slate-50/80 text-slate-900 dark:border-blue-400/25 dark:bg-[#081033] dark:text-white"
                    />
                  </div>

                  {/* Correo */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-blue-300/80">
                        CORREO ELECTRÓNICO
                      </label>
                      <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-blue-300/50">
                        OBLIGATORIO
                      </span>
                    </div>
                    <Input
                      type="email"
                      required
                      placeholder="tu@correo.com"
                      maxLength={100}
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      className="h-11 rounded-xl border-slate-200/90 bg-slate-50/80 text-slate-900 dark:border-blue-400/25 dark:bg-[#081033] dark:text-white"
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-blue-200/60">
                  Enviaremos a este correo la constancia y una copia en PDF de tu hoja de reclamación.
                </p>

                {/* Switch Menor de Edad */}
                <div className="mt-2 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 transition-colors dark:border-blue-400/20 dark:bg-[#081033]/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        ¿Eres menor de edad?
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-blue-200/70">
                        Si marcas sí, completa los datos de tu padre, madre o representante legal.
                      </p>
                    </div>
                    <Switch
                      checked={esMenorEdad}
                      onCheckedChange={(checked) => setEsMenorEdad(checked)}
                    />
                  </div>

                  {esMenorEdad && (
                    <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2 dark:border-blue-400/20">
                      <div>
                        <div className="mb-1.5 flex items-center justify-between">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-blue-300/80">
                            NOMBRE COMPLETO DEL REPRESENTANTE
                          </label>
                          <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-blue-300/50">
                            OBLIGATORIO
                          </span>
                        </div>
                        <Input
                          type="text"
                          required={esMenorEdad}
                          placeholder="Padre, madre o representante legal"
                          maxLength={50}
                          value={representanteNombre}
                          onChange={(e) => setRepresentanteNombre(e.target.value.slice(0, 50))}
                          className="h-11 rounded-xl border-slate-200/90 bg-white text-slate-900 dark:border-blue-400/25 dark:bg-[#060c28] dark:text-white"
                        />
                      </div>
                      <div>
                        <div className="mb-1.5 flex items-center justify-between">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-blue-300/80">
                            DOCUMENTO DEL REPRESENTANTE
                          </label>
                          <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-blue-300/50">
                            OBLIGATORIO
                          </span>
                        </div>
                        <Input
                          type="text"
                          inputMode="numeric"
                          required={esMenorEdad}
                          placeholder="Solo números (hasta 12 dígitos)"
                          maxLength={12}
                          value={representanteDocumento}
                          onChange={(e) => setRepresentanteDocumento(e.target.value.replace(/\D/g, "").slice(0, 12))}
                          className="h-11 rounded-xl border-slate-200/90 bg-white text-slate-900 dark:border-blue-400/25 dark:bg-[#060c28] dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* SECCIÓN 2: IDENTIFICACIÓN DEL BIEN CONTRATADO */}
            <section
              aria-label="Identificación del bien contratado"
              className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-xs backdrop-blur-sm transition-colors duration-300 sm:p-7 dark:border-blue-400/25 dark:bg-[#0D1A4F]/90"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#1A73E8] text-xs font-bold text-white shadow-xs dark:bg-blue-400/20 dark:text-blue-300">
                  2
                </span>
                <div>
                  <h2 className="font-heading text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
                    Identificación del bien contratado
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-blue-200/70">
                    Qué compraste o contrataste en Amorelo.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-4">
                {/* Tipo de Bien */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-blue-300/80">
                      TIPO DE BIEN
                    </label>
                    <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-blue-300/50">
                      OBLIGATORIO
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Tarjeta Producto */}
                    <button
                      type="button"
                      onClick={() => setBienContratado("producto")}
                      className={cn(
                        "cursor-pointer rounded-xl border p-4 text-left transition-all",
                        bienContratado === "producto"
                          ? "border-[#1A73E8] bg-blue-50/70 shadow-xs ring-2 ring-[#1A73E8]/30 dark:border-blue-400 dark:bg-[#12215a] dark:ring-blue-400/30"
                          : "border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/80 dark:border-blue-400/20 dark:bg-[#081033] dark:hover:bg-[#0b1642]"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded-full border",
                            bienContratado === "producto"
                              ? "border-[#1A73E8] dark:border-blue-400"
                              : "border-slate-400 dark:border-blue-300/40"
                          )}
                        >
                          {bienContratado === "producto" && (
                            <div className="size-2 rounded-full bg-[#1A73E8] dark:bg-blue-400" />
                          )}
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-900 dark:text-white">
                          PRODUCTO
                        </span>
                      </div>
                      <p className="mt-1 pl-6 text-[11px] font-medium text-slate-500 dark:text-blue-200/60">
                        MATERIALES, KITS U OTROS ARTÍCULOS.
                      </p>
                    </button>

                    {/* Tarjeta Servicio */}
                    <button
                      type="button"
                      onClick={() => setBienContratado("servicio")}
                      className={cn(
                        "cursor-pointer rounded-xl border p-4 text-left transition-all",
                        bienContratado === "servicio"
                          ? "border-[#1A73E8] bg-blue-50/70 shadow-xs ring-2 ring-[#1A73E8]/30 dark:border-blue-400 dark:bg-[#12215a] dark:ring-blue-400/30"
                          : "border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/80 dark:border-blue-400/20 dark:bg-[#081033] dark:hover:bg-[#0b1642]"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded-full border",
                            bienContratado === "servicio"
                              ? "border-[#1A73E8] dark:border-blue-400"
                              : "border-slate-400 dark:border-blue-300/40"
                          )}
                        >
                          {bienContratado === "servicio" && (
                            <div className="size-2 rounded-full bg-[#1A73E8] dark:bg-blue-400" />
                          )}
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-900 dark:text-white">
                          SERVICIO
                        </span>
                      </div>
                      <p className="mt-1 pl-6 text-[11px] font-medium text-slate-500 dark:text-blue-200/60">
                        CURSOS VIRTUALES, TALLERES O CLASES.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Descripción del Bien */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-blue-300/80">
                      DESCRIPCIÓN DEL BIEN
                    </label>
                    <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-blue-300/50">
                      OBLIGATORIO
                    </span>
                  </div>
                  <Input
                    type="text"
                    required
                    placeholder="Taller presencial de decoración con globos"
                    value={descripcionBien}
                    onChange={(e) => setDescripcionBien(e.target.value)}
                    className="h-11 rounded-xl border-slate-200/90 bg-slate-50/80 text-slate-900 dark:border-blue-400/25 dark:bg-[#081033] dark:text-white"
                  />
                </div>

                {/* Monto y Moneda */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-blue-300/80">
                        MONTO RECLAMADO
                      </label>
                      <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-blue-300/40">
                        OPCIONAL
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute top-1/2 left-3.5 -translate-y-1/2 font-bold text-sm text-slate-500 dark:text-blue-300/70">
                        {moneda === "PEN" ? "S/" : "$"}
                      </span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        placeholder="120"
                        value={montoReclamado}
                        onChange={(e) => setMontoReclamado(e.target.value)}
                        className="h-11 pl-9 rounded-xl border-slate-200/90 bg-slate-50/80 text-slate-900 dark:border-blue-400/25 dark:bg-[#081033] dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-blue-300/80">
                        MONEDA
                      </label>
                      <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-blue-300/40">
                        OPCIONAL
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMoneda("PEN")}
                        className={cn(
                          "cursor-pointer flex items-center justify-center gap-2 rounded-xl border h-11 px-3 text-xs font-bold transition-all",
                          moneda === "PEN"
                            ? "border-[#1A73E8] bg-blue-50/70 text-slate-900 ring-2 ring-[#1A73E8]/30 dark:border-blue-400 dark:bg-[#12215a] dark:text-white dark:ring-blue-400/30"
                            : "border-slate-200/80 bg-slate-50/50 text-slate-600 hover:bg-slate-100/80 dark:border-blue-400/20 dark:bg-[#081033] dark:text-blue-200/70 dark:hover:bg-[#0b1642]"
                        )}
                      >
                        <div
                          className={cn(
                            "size-3.5 rounded-full border flex items-center justify-center",
                            moneda === "PEN"
                              ? "border-[#1A73E8] dark:border-blue-400"
                              : "border-slate-400 dark:border-blue-300/40"
                          )}
                        >
                          {moneda === "PEN" && (
                            <div className="size-1.5 rounded-full bg-[#1A73E8] dark:bg-blue-400" />
                          )}
                        </div>
                        <span>SOLES <span className="text-[10px] font-mono text-slate-400 dark:text-blue-300/60">S/ PEN</span></span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMoneda("USD")}
                        className={cn(
                          "cursor-pointer flex items-center justify-center gap-2 rounded-xl border h-11 px-3 text-xs font-bold transition-all",
                          moneda === "USD"
                            ? "border-[#1A73E8] bg-blue-50/70 text-slate-900 ring-2 ring-[#1A73E8]/30 dark:border-blue-400 dark:bg-[#12215a] dark:text-white dark:ring-blue-400/30"
                            : "border-slate-200/80 bg-slate-50/50 text-slate-600 hover:bg-slate-100/80 dark:border-blue-400/20 dark:bg-[#081033] dark:text-blue-200/70 dark:hover:bg-[#0b1642]"
                        )}
                      >
                        <div
                          className={cn(
                            "size-3.5 rounded-full border flex items-center justify-center",
                            moneda === "USD"
                              ? "border-[#1A73E8] dark:border-blue-400"
                              : "border-slate-400 dark:border-blue-300/40"
                          )}
                        >
                          {moneda === "USD" && (
                            <div className="size-1.5 rounded-full bg-[#1A73E8] dark:bg-blue-400" />
                          )}
                        </div>
                        <span>DÓLARES <span className="text-[10px] font-mono text-slate-400 dark:text-blue-300/60">$ USD</span></span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* N° Orden o Pedido */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-blue-300/80">
                      N.° DE ORDEN O PEDIDO
                    </label>
                    <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-blue-300/50">
                      OBLIGATORIO
                    </span>
                  </div>
                  <Input
                    type="text"
                    required
                    maxLength={30}
                    placeholder="Ej. ORD-10492 o código de compra"
                    value={ordenId}
                    onChange={(e) => setOrdenId(e.target.value.slice(0, 30))}
                    className="h-11 rounded-xl border-slate-200/90 bg-slate-50/80 text-slate-900 dark:border-blue-400/25 dark:bg-[#081033] dark:text-white"
                  />
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-blue-200/60">
                    Ingresa el identificador de compra generado al adquirir el bien o servicio.
                  </p>
                </div>
              </div>
            </section>

            {/* SECCIÓN 3: DETALLE DE LA RECLAMACIÓN */}
            <section
              aria-label="Detalle de la reclamación"
              className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-xs backdrop-blur-sm transition-colors duration-300 sm:p-7 dark:border-blue-400/25 dark:bg-[#0D1A4F]/90"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#1A73E8] text-xs font-bold text-white shadow-xs dark:bg-blue-400/20 dark:text-blue-300">
                  3
                </span>
                <div>
                  <h2 className="font-heading text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
                    Detalle de la reclamación
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-blue-200/70">
                    Cuéntanos lo que pasó y qué solución esperas.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-4">
                {/* Tipo de Manifestación */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-blue-300/80">
                      TIPO DE MANIFESTACIÓN
                    </label>
                    <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-blue-300/50">
                      OBLIGATORIO
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Reclamo */}
                    <button
                      type="button"
                      onClick={() => setTipo("reclamo")}
                      className={cn(
                        "cursor-pointer rounded-xl border p-4 text-left transition-all",
                        tipo === "reclamo"
                          ? "border-[#1A73E8] bg-blue-50/70 shadow-xs ring-2 ring-[#1A73E8]/30 dark:border-blue-400 dark:bg-[#12215a] dark:ring-blue-400/30"
                          : "border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/80 dark:border-blue-400/20 dark:bg-[#081033] dark:hover:bg-[#0b1642]"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded-full border",
                            tipo === "reclamo"
                              ? "border-[#1A73E8] dark:border-blue-400"
                              : "border-slate-400 dark:border-blue-300/40"
                          )}
                        >
                          {tipo === "reclamo" && (
                            <div className="size-2 rounded-full bg-[#1A73E8] dark:bg-blue-400" />
                          )}
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-900 dark:text-white">
                          RECLAMO
                        </span>
                      </div>
                      <p className="mt-1 pl-6 text-[11px] font-medium text-slate-500 dark:text-blue-200/60 leading-relaxed">
                        DISCONFORMIDAD RELACIONADA A LOS BIENES O SERVICIOS ADQUIRIDOS.
                      </p>
                    </button>

                    {/* Queja */}
                    <button
                      type="button"
                      onClick={() => setTipo("queja")}
                      className={cn(
                        "cursor-pointer rounded-xl border p-4 text-left transition-all",
                        tipo === "queja"
                          ? "border-[#1A73E8] bg-blue-50/70 shadow-xs ring-2 ring-[#1A73E8]/30 dark:border-blue-400 dark:bg-[#12215a] dark:ring-blue-400/30"
                          : "border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/80 dark:border-blue-400/20 dark:bg-[#081033] dark:hover:bg-[#0b1642]"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded-full border",
                            tipo === "queja"
                              ? "border-[#1A73E8] dark:border-blue-400"
                              : "border-slate-400 dark:border-blue-300/40"
                          )}
                        >
                          {tipo === "queja" && (
                            <div className="size-2 rounded-full bg-[#1A73E8] dark:bg-blue-400" />
                          )}
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-900 dark:text-white">
                          QUEJA
                        </span>
                      </div>
                      <p className="mt-1 pl-6 text-[11px] font-medium text-slate-500 dark:text-blue-200/60 leading-relaxed">
                        DISCONFORMIDAD CON LA ATENCIÓN AL PÚBLICO O MALESTAR QUE NO INVOLUCRA DIRECTAMENTE EL PRODUCTO.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Detalle */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-blue-300/80">
                      DETALLE DEL RECLAMO O QUEJA
                    </label>
                    <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-blue-300/50">
                      OBLIGATORIO
                    </span>
                  </div>
                  <Textarea
                    required
                    rows={4}
                    maxLength={700}
                    placeholder="Describe de manera clara, precisa y cronológica lo sucedido (máximo 700 caracteres)..."
                    value={detalle}
                    onChange={(e) => setDetalle(e.target.value.slice(0, 700))}
                    className="rounded-xl border-slate-200/90 bg-slate-50/80 text-slate-900 dark:border-blue-400/25 dark:bg-[#081033] dark:text-white"
                  />
                  <div className="mt-1 flex justify-end">
                    <span className="font-mono text-[11px] text-slate-400 dark:text-blue-300/50">
                      {detalle.length} / 700
                    </span>
                  </div>
                </div>

                {/* Pedido Concreto */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-blue-300/80">
                      PEDIDO DEL CONSUMIDOR
                    </label>
                    <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-blue-300/50">
                      OBLIGATORIO
                    </span>
                  </div>
                  <Textarea
                    required
                    rows={3}
                    maxLength={350}
                    placeholder="Indica qué solución o pedido concreto solicitas a Amorelo (máximo 350 caracteres)..."
                    value={pedidoConsumidor}
                    onChange={(e) => setPedidoConsumidor(e.target.value.slice(0, 350))}
                    className="rounded-xl border-slate-200/90 bg-slate-50/80 text-slate-900 dark:border-blue-400/25 dark:bg-[#081033] dark:text-white"
                  />
                  <div className="mt-1 flex justify-end">
                    <span className="font-mono text-[11px] text-slate-400 dark:text-blue-300/50">
                      {pedidoConsumidor.length} / 350
                    </span>
                  </div>

                  {/* Ideas sugeridas interactivas */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-blue-300/60">
                      Ideas:
                    </span>
                    {IDEAS_PEDIDO.map((idea) => (
                      <button
                        key={idea}
                        type="button"
                        onClick={() => agregarIdeaPedido(idea)}
                        className="cursor-pointer rounded-full border border-blue-500/20 bg-blue-50/70 px-3 py-1 text-xs font-medium text-[#1A73E8] transition-all hover:bg-blue-100 hover:border-blue-500/40 dark:border-blue-400/25 dark:bg-[#081033] dark:text-blue-300 dark:hover:bg-[#121f52]"
                      >
                        {idea}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* SECCIÓN 4: CONFIRMACIÓN Y DECLARACIÓN LEGAL */}
            <section
              aria-label="Confirmación y declaración legal"
              className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-xs backdrop-blur-sm transition-colors duration-300 sm:p-7 dark:border-blue-400/25 dark:bg-[#0D1A4F]/90"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#1A73E8] text-xs font-bold text-white shadow-xs dark:bg-blue-400/20 dark:text-blue-300">
                  4
                </span>
                <div>
                  <h2 className="font-heading text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
                    Confirmación y declaración legal
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-blue-200/70">
                    Ambas casillas son obligatorias para enviar la hoja.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                {/* Casilla 1 */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setDeclaraVeracidad((prev) => !prev)}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      setDeclaraVeracidad((prev) => !prev);
                    }
                  }}
                  className="cursor-pointer select-none rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 transition-all hover:bg-slate-100/70 dark:border-blue-400/20 dark:bg-[#081033]/60 dark:hover:bg-[#0b1642]"
                >
                  <div className="flex items-start gap-3 pointer-events-none">
                    <Checkbox
                      checked={declaraVeracidad}
                      className="mt-0.5 rounded-md border-slate-300 data-[state=checked]:bg-[#1A73E8] data-[state=checked]:border-[#1A73E8] data-checked:bg-[#1A73E8] data-checked:border-[#1A73E8] dark:border-blue-400/30 dark:data-[state=checked]:bg-white dark:data-[state=checked]:text-slate-900 dark:data-checked:bg-white dark:data-checked:text-slate-900"
                    />
                    <span className="text-xs font-bold uppercase leading-relaxed tracking-wide text-slate-800 dark:text-blue-100">
                      DECLARO SER EL TITULAR DEL SERVICIO O PRODUCTO Y QUE LOS DATOS CONSIGNADOS SON VERDADEROS.
                    </span>
                  </div>
                </div>

                {/* Casilla 2 */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setAceptaTerminos((prev) => !prev)}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      setAceptaTerminos((prev) => !prev);
                    }
                  }}
                  className="cursor-pointer select-none rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 transition-all hover:bg-slate-100/70 dark:border-blue-400/20 dark:bg-[#081033]/60 dark:hover:bg-[#0b1642]"
                >
                  <div className="flex items-start gap-3">
                    <div className="pointer-events-none shrink-0 mt-0.5">
                      <Checkbox
                        checked={aceptaTerminos}
                        className="rounded-md border-slate-300 data-[state=checked]:bg-[#1A73E8] data-[state=checked]:border-[#1A73E8] data-checked:bg-[#1A73E8] data-checked:border-[#1A73E8] dark:border-blue-400/30 dark:data-[state=checked]:bg-white dark:data-[state=checked]:text-slate-900 dark:data-checked:bg-white dark:data-checked:text-slate-900"
                      />
                    </div>
                    <span className="text-xs font-bold uppercase leading-relaxed tracking-wide text-slate-800 dark:text-blue-100">
                      ACEPTO LA{" "}
                      <Link
                        href="/legal/privacidad"
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-600 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
                      >
                        POLÍTICA DE PRIVACIDAD
                      </Link>{" "}
                      PARA FINES EXCLUSIVOS DE LA RESOLUCIÓN DEL RECLAMO.
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* BARRA DE ENVÍO */}
            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500 dark:text-blue-200/70 leading-relaxed max-w-md">
                Recibirás la constancia y una copia en PDF en el correo que indicaste.
              </p>

              <Button
                type="submit"
                disabled={cargando || Boolean(minutosEsperaRateLimit)}
                className="h-12 w-full sm:w-auto px-8 rounded-xl text-sm font-bold shadow-md transition-all bg-[#1A73E8] hover:bg-[#1557B0] text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 dark:shadow-[0_0_20px_rgba(255,255,255,0.15)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {cargando ? (
                  <div className="flex items-center gap-2">
                    <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>Enviando hoja…</span>
                  </div>
                ) : minutosEsperaRateLimit ? (
                  <div className="flex items-center gap-2">
                    <Clock className="size-4" />
                    <span>Espera {minutosEsperaRateLimit} min para enviar otra</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4" />
                    <span>Enviar hoja de reclamación</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </>
    )}
  </div>
</div>
  );
}
