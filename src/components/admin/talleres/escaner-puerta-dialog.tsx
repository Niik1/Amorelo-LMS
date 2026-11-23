// Componente de Escáner de Puerta con Cámara Web/Móvil y Validación Manual de Tickets.
// Usa html5-qrcode para lectura en tiempo real y soporta ingreso por teclado (TK-XXXX).
// Fase 4: Item 4.3 del Checklist.

"use client";

import { useState, useEffect, useRef } from "react";
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  QrCode,
  Keyboard,
  RefreshCw,
  Sparkles,
  Volume2,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { validarTicketAction } from "@/server/talleres/acciones";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EscanerPuertaDialogProps {
  tallerId?: string;
  tallerNombre?: string;
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type ResultadoValidacion = {
  ok: boolean;
  mensaje: string;
  resultado?: string;
  detalle?: {
    asistente_nombre: string;
    ticket_codigo: string;
    numero_orden: string;
    taller_nombre: string;
    saldo_pendiente: number;
    asistio: boolean;
    validado_en: string | null;
  };
};

export function EscanerPuertaDialog({
  tallerId,
  tallerNombre,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: EscanerPuertaDialogProps) {
  const [internalAbierto, setInternalAbierto] = useState(false);
  const abierto = controlledOpen !== undefined ? controlledOpen : internalAbierto;
  const setAbierto = setControlledOpen || setInternalAbierto;
  const [modo, setModo] = useState<"camara" | "manual">("camara");
  const [codigoManual, setCodigoManual] = useState("");
  const [errorManual, setErrorManual] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoValidacion | null>(null);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [errorCamara, setErrorCamara] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "reader-puerta-html5";

  // Emisor de sonido de retroalimentación
  const reproducirSonido = (tipo: "success" | "error" | "warning") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (tipo === "success") {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {
      // Ignorar restricciones de audio del navegador
    }
  };

  // Detener la cámara
  const detenerCamara = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        console.warn("Error al detener cámara:", e);
      }
      scannerRef.current = null;
    }
    setCamaraActiva(false);
  };

  // Iniciar escaneo con la cámara
  const iniciarCamara = async () => {
    setErrorCamara(null);
    try {
      if (scannerRef.current) {
        await detenerCamara();
      }

      const html5Qr = new Html5Qrcode(containerId);
      scannerRef.current = html5Qr;

      await html5Qr.start(
        { facingMode: "environment" }, // Preferir cámara trasera del móvil
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          // Pausar inmediatamente para evitar escaneos dobles
          await detenerCamara();
          await procesarCodigo(decodedText);
        },
        () => {
          // Scanning frame callback (vacío)
        }
      );

      setCamaraActiva(true);
    } catch (err: any) {
      console.error("Error al iniciar cámara:", err);
      setErrorCamara(
        "No se pudo acceder a la cámara. Revisa los permisos o usa el ingreso manual de código."
      );
      setCamaraActiva(false);
    }
  };

  // Efecto para abrir/cerrar cámara según visibilidad y pestaña
  useEffect(() => {
    if (abierto && modo === "camara" && !resultado) {
      // Esperar que el div se renderice en el DOM
      const timer = setTimeout(() => {
        iniciarCamara();
      }, 300);
      return () => {
        clearTimeout(timer);
        detenerCamara();
      };
    } else {
      detenerCamara();
    }
  }, [abierto, modo, resultado]);

  // Al cerrar el modal por completo
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      detenerCamara();
      setResultado(null);
      setCodigoManual("");
      setErrorManual(null);
    }
    setAbierto(open);
  };

  // Procesar código validado
  const procesarCodigo = async (codigo: string) => {
    if (!codigo || cargando) return;
    setCargando(true);

    try {
      const res = await validarTicketAction(codigo, tallerId);
      const mensajeTexto: string =
        (res.ok ? res.mensaje : res.error) || "Código inválido.";

      if (res.ok) {
        reproducirSonido("success");
        toast.success("¡Ingreso autorizado con éxito!", {
          description: `${res.detalle?.asistente_nombre} (${res.detalle?.ticket_codigo})`,
        });
      } else if (res.resultado === "ya_validado") {
        reproducirSonido("error");
        toast.warning("Ticket ya utilizado previamente", {
          description: mensajeTexto,
        });
      } else {
        reproducirSonido("warning");
        toast.error(mensajeTexto);
      }

      setResultado({
        ok: res.ok,
        mensaje: mensajeTexto,
        resultado: res.resultado,
        detalle: res.detalle,
      });
    } catch (err: any) {
      reproducirSonido("error");
      const errTexto = err.message || "Error al procesar el ticket.";
      toast.error(errTexto);
      setResultado({
        ok: false,
        mensaje: errTexto,
      });
    } finally {
      setCargando(false);
    }
  };

  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoManual.trim()) {
      setErrorManual("Ingresa el código del ticket para validar.");
      toast.error("Por favor completa los campos marcados en rojo.");
      return;
    }
    setErrorManual(null);
    await procesarCodigo(codigoManual.trim());
  };

  const resetearParaSiguiente = () => {
    setResultado(null);
    setCodigoManual("");
    setErrorManual(null);
    if (modo === "camara") {
      setTimeout(() => {
        iniciarCamara();
      }, 200);
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : controlledOpen === undefined ? (
        <DialogTrigger
          render={
            <Button
              type="button"
              className="rounded-full bg-white font-bold text-[#1e3a8a] shadow-sm hover:bg-slate-100 cursor-pointer"
            >
              <Camera className="mr-1.5 size-4" />
              <span>Control de Puerta (Escáner QR)</span>
            </Button>
          }
        />
      ) : null}

      <DialogContent className="w-[92vw] sm:w-[90vw] sm:max-w-xl md:max-w-2xl p-0 overflow-hidden bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 rounded-3xl">
        <DialogHeader className="p-5 pb-4 bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 text-left">
          <div className="flex flex-col gap-3">
            {/* Fila 1: Título con espacio reservado a la derecha para botón cerrar */}
            <div className="flex items-center gap-2.5 pr-10 sm:pr-12">
              <div className="p-2 rounded-xl bg-icon-accent-soft text-icon-accent shrink-0">
                <QrCode className="size-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white truncate">
                  Validador de Puerta
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[240px] sm:max-w-[340px]">
                  {tallerNombre || "Todos los talleres presenciales"}
                </DialogDescription>
              </div>
            </div>

            {/* Fila 2: Alternador de Modos centrado simétricamente */}
            <div className="flex justify-center pt-1">
              <div className="flex w-full max-w-[320px] bg-neutral-200/80 dark:bg-neutral-800 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setModo("camara");
                    setResultado(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    modo === "camara"
                      ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  <Camera className="size-3.5" />
                  <span>Cámara</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModo("manual");
                    detenerCamara();
                    setResultado(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    modo === "manual"
                      ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  <Keyboard className="size-3.5" />
                  <span>Código</span>
                </button>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 sm:p-6">
          {/* VISTA 1: RESULTADO DEL ESCANEO */}
          {resultado ? (
            <div className="flex flex-col items-center text-center py-4 space-y-4">
              {resultado.ok ? (
                <div className="flex flex-col items-center animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 mb-3 shadow-lg shadow-emerald-500/10">
                    <CheckCircle2 className="h-9 w-9 stroke-[2.5]" />
                  </div>
                  <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-semibold text-xs px-3 py-1 uppercase tracking-wider mb-1">
                    Acceso Permitido
                  </Badge>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    {resultado.mensaje}
                  </p>
                </div>
              ) : resultado.resultado === "ya_validado" ? (
                <div className="flex flex-col items-center animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 border-2 border-rose-500 flex items-center justify-center text-rose-600 mb-3 shadow-lg shadow-rose-500/10">
                    <XCircle className="h-9 w-9 stroke-[2.5]" />
                  </div>
                  <Badge variant="destructive" className="font-semibold text-xs px-3 py-1 uppercase tracking-wider mb-1">
                    Ticket Ya Validado
                  </Badge>
                  <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
                    {resultado.mensaje}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 border-2 border-amber-500 flex items-center justify-center text-amber-600 mb-3 shadow-lg shadow-amber-500/10">
                    <AlertTriangle className="h-9 w-9 stroke-[2.5]" />
                  </div>
                  <Badge className="bg-amber-600 hover:bg-amber-600 text-white font-semibold text-xs px-3 py-1 uppercase tracking-wider mb-1">
                    Ingreso No Autorizado
                  </Badge>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    {resultado.mensaje}
                  </p>
                </div>
              )}

              {/* Ficha de Asistente Validado */}
              {resultado.detalle && (
                <div className="w-full bg-neutral-50 dark:bg-neutral-800/80 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 text-left text-xs space-y-2.5">
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-200 dark:border-neutral-700">
                    <span className="text-neutral-500 font-medium">Asistente:</span>
                    <span className="font-bold text-neutral-900 dark:text-white text-sm">
                      {resultado.detalle.asistente_nombre}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">Ticket / Orden:</span>
                    <span className="font-mono font-semibold text-icon-accent">
                      {resultado.detalle.ticket_codigo} ({resultado.detalle.numero_orden})
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">Taller:</span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate max-w-[200px]">
                      {resultado.detalle.taller_nombre}
                    </span>
                  </div>

                  {resultado.detalle.saldo_pendiente > 0 && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-amber-800 dark:text-amber-300">
                      <span className="font-semibold">⚠️ Saldo Pendiente:</span>
                      <span className="font-bold text-sm">
                        S/ {resultado.detalle.saldo_pendiente.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={resetearParaSiguiente}
                className="w-full bg-[#1e3a8a] hover:bg-[#172554] text-white gap-2 font-semibold h-11"
              >
                <RefreshCw className="h-4 w-4" />
                Escanear Siguiente Asistente
              </Button>
            </div>
          ) : (
            /* VISTA 2: ESCÁNER ACTIVO O FORMULARIO MANUAL */
            <div>
              {modo === "camara" ? (
                <div className="flex flex-col items-center">
                  <div className="relative w-full max-w-[280px] sm:max-w-[340px] aspect-square rounded-2xl overflow-hidden bg-black border-2 border-[#1e3a8a] shadow-inner flex items-center justify-center mx-auto">
                    <div id={containerId} className="w-full h-full" />

                    {!camaraActiva && !errorCamara && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/90 text-white p-4 text-center">
                        <RefreshCw className="h-8 w-8 animate-spin text-blue-400 mb-2" />
                        <p className="text-xs font-medium">Iniciando cámara trasera...</p>
                      </div>
                    )}

                    {errorCamara && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/95 text-white p-5 text-center space-y-3">
                        <AlertTriangle className="h-8 w-8 text-amber-400" />
                        <p className="text-xs text-neutral-300">{errorCamara}</p>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setModo("manual")}
                          className="text-xs"
                        >
                          Usar código manual
                        </Button>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-3 text-center">
                    Apunta la cámara al código QR impreso o en el celular del asistente.
                  </p>
                </div>
              ) : (
                /* MODO MANUAL */
                <form onSubmit={handleSubmitManual} noValidate className="space-y-4 py-3">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Código de Ticket o Token de Acceso *
                    </label>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Ej: TK-7842 o demo-taller-ticket"
                        value={codigoManual}
                        onChange={(e) => {
                          setCodigoManual(e.target.value.toUpperCase());
                          if (errorManual) setErrorManual(null);
                        }}
                        className={cn(
                          "font-mono text-center tracking-widest uppercase font-bold text-base h-12 border-neutral-300 dark:border-neutral-700",
                          errorManual && "border-destructive focus-visible:ring-destructive/30"
                        )}
                        aria-invalid={Boolean(errorManual)}
                        autoFocus
                      />
                      {errorManual && (
                        <p className="text-destructive mt-1.5 text-xs font-semibold text-center">
                          {errorManual}
                        </p>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 text-center">
                      Ingresa los 4 dígitos o código alfanumérico visible en la entrada del alumno.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={cargando}
                    className="w-full bg-[#1e3a8a] hover:bg-[#172554] text-white font-medium h-11 gap-2 cursor-pointer"
                  >
                    {cargando ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Validando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Validar Ingreso
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
