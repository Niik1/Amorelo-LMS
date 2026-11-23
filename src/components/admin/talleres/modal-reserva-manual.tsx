// Modal para registrar reservas manuales con adelanto o pago total (Fase 4 - Item 4.4).
// Estilo visual moderno de dos columnas balanceadas, validaciones inline en rojo y 0% scroll horizontal.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Send,
  CheckCircle2,
  Copy,
  ExternalLink,
  RefreshCw,
  Ticket,
  Check,
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-time-picker";
import { WhatsappIcon } from "@/components/icons/whatsapp-icon";
import { registrarReservaManualAction } from "@/server/talleres/acciones";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function ErrorCampo({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return <p className="text-destructive mt-1 text-xs font-semibold">{mensaje}</p>;
}

interface ModalReservaManualProps {
  tallerId: string;
  tallerNombre: string;
  precioTotal: number;
  tallerFechaInicio?: string;
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ModalReservaManual({
  tallerId,
  tallerNombre,
  precioTotal,
  tallerFechaInicio,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: ModalReservaManualProps) {
  const router = useRouter();
  const [internalAbierto, setInternalAbierto] = useState(false);
  const abierto = controlledOpen !== undefined ? controlledOpen : internalAbierto;
  const setAbierto = setControlledOpen || setInternalAbierto;
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Form State
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState<"DNI" | "CE" | "PASAPORTE" | "RUC">("DNI");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [tipoPago, setTipoPago] = useState<"total" | "adelanto">("adelanto");
  const [montoPagado, setMontoPagado] = useState(String(Math.min(50, precioTotal)));
  const [fechaLimiteSaldo, setFechaLimiteSaldo] = useState("");
  const [canal, setCanal] = useState<"whatsapp" | "transferencia" | "yape" | "efectivo">("whatsapp");
  const [notas, setNotas] = useState("");

  // Resultado
  const [resultado, setResultado] = useState<{
    ticketCodigo: string;
    tokenAcceso: string;
    ticketUrl: string;
    mensajeWhatsApp: string;
    telefono: string;
  } | null>(null);

  const [copiado, setCopiado] = useState(false);
  const [copiadoUrl, setCopiadoUrl] = useState(false);

  const saldoCalculado = Math.max(0, precioTotal - Number(montoPagado || 0));

  const limpiarFormulario = () => {
    setNombres("");
    setApellidos("");
    setCorreo("");
    setTelefono("");
    setTipoDocumento("DNI");
    setNumeroDocumento("");
    setTipoPago("adelanto");
    setMontoPagado(String(Math.min(50, precioTotal)));
    setFechaLimiteSaldo("");
    setCanal("whatsapp");
    setNotas("");
    setResultado(null);
    setErrores({});
  };

  const handleTipoPagoChange = (tipo: "total" | "adelanto") => {
    setTipoPago(tipo);
    if (tipo === "total") {
      setMontoPagado(String(precioTotal));
    } else {
      setMontoPagado(String(Math.min(50, precioTotal)));
    }
  };

  const validarFormulario = (): boolean => {
    const nuevos: Record<string, string> = {};

    if (!nombres.trim()) {
      nuevos.nombres = "Ingresa los nombres del asistente";
    } else if (nombres.trim().length < 2) {
      nuevos.nombres = "El nombre debe tener al menos 2 caracteres";
    }

    if (!apellidos.trim()) {
      nuevos.apellidos = "Ingresa los apellidos del asistente";
    } else if (apellidos.trim().length < 2) {
      nuevos.apellidos = "Los apellidos deben tener al menos 2 caracteres";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correo.trim()) {
      nuevos.correo = "Ingresa el correo electrónico";
    } else if (!emailRegex.test(correo.trim())) {
      nuevos.correo = "Ingresa un correo electrónico válido";
    }

    const telLimpio = telefono.replace(/\D/g, "");
    if (!telefono.trim()) {
      nuevos.telefono = "Ingresa el número de WhatsApp / Teléfono";
    } else if (telLimpio.length < 9) {
      nuevos.telefono = "Ingresa un teléfono válido de al menos 9 dígitos numéricos";
    }

    const docLimpio = numeroDocumento.trim();
    if (!docLimpio) {
      nuevos.numeroDocumento = "Ingresa el número de documento";
    } else {
      if (tipoDocumento === "DNI" && !/^\d{8}$/.test(docLimpio)) {
        nuevos.numeroDocumento = "El DNI debe tener exactamente 8 dígitos numéricos";
      } else if (tipoDocumento === "RUC" && !/^\d{11}$/.test(docLimpio)) {
        nuevos.numeroDocumento = "El RUC debe tener exactamente 11 dígitos numéricos";
      } else if (tipoDocumento === "CE" && !/^\d{9,12}$/.test(docLimpio)) {
        nuevos.numeroDocumento = "El Carnet de Extranjería debe tener entre 9 y 12 dígitos";
      } else if (tipoDocumento === "PASAPORTE" && docLimpio.length < 6) {
        nuevos.numeroDocumento = "El pasaporte debe tener al menos 6 caracteres";
      }
    }

    const monto = parseFloat(montoPagado);
    if (isNaN(monto) || monto <= 0) {
      nuevos.montoPagado = "Ingresa un monto pagado válido mayor a 0";
    } else if (monto > precioTotal) {
      nuevos.montoPagado = `El monto no puede superar el precio total (S/ ${precioTotal.toFixed(2)})`;
    }

    if (tipoPago === "adelanto" && saldoCalculado > 0) {
      if (!fechaLimiteSaldo) {
        nuevos.fechaLimiteSaldo = "Selecciona la fecha límite para cancelar el saldo restante";
      } else {
        const fechaLimiteObj = new Date(`${fechaLimiteSaldo}T23:59:59`);
        const ahora = new Date();
        ahora.setHours(0, 0, 0, 0);

        if (fechaLimiteObj < ahora) {
          nuevos.fechaLimiteSaldo = "La fecha límite no puede ser anterior al día de hoy";
        } else if (tallerFechaInicio) {
          const tallerInicioObj = new Date(tallerFechaInicio);
          if (fechaLimiteObj > tallerInicioObj) {
            nuevos.fechaLimiteSaldo = "La fecha límite no puede ser posterior al inicio del taller";
          }
        }
      }
    }

    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) {
      toast.error("Por favor completa los campos marcados en rojo.");
      return;
    }

    setCargando(true);

    try {
      const res = await registrarReservaManualAction({
        tallerId,
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        correo: correo.trim().toLowerCase(),
        telefono: telefono.trim(),
        tipoDocumento,
        numeroDocumento: numeroDocumento.trim(),
        tipoPago,
        montoPagado: parseFloat(montoPagado),
        saldoPendiente: tipoPago === "adelanto" ? saldoCalculado : 0,
        fechaLimiteSaldo: tipoPago === "adelanto" && saldoCalculado > 0 ? fechaLimiteSaldo : undefined,
        canal,
        notas: notas.trim() || undefined,
      });

      if (!res.ok) {
        toast.error(res.error || "No se pudo registrar la reserva.");
        setCargando(false);
        return;
      }

      toast.success("¡Reserva de cupo registrada con éxito!");
      setResultado({
        ticketCodigo: res.ticketCodigo || "",
        tokenAcceso: res.tokenAcceso || "",
        ticketUrl: res.ticketUrl || "",
        mensajeWhatsApp: res.mensajeWhatsApp || "",
        telefono: res.telefono || telefono,
      });
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Error inesperado al registrar la reserva.");
    } finally {
      setCargando(false);
    }
  };

  const handleCopiarMensaje = async () => {
    if (!resultado?.mensajeWhatsApp) return;
    try {
      await navigator.clipboard.writeText(resultado.mensajeWhatsApp);
      setCopiado(true);
      toast.success("Mensaje copiado al portapapeles");
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("No se pudo copiar el texto.");
    }
  };

  const handleCopiarUrl = async () => {
    if (!resultado?.ticketUrl) return;
    try {
      await navigator.clipboard.writeText(resultado.ticketUrl);
      setCopiadoUrl(true);
      toast.success("Enlace del ticket copiado");
      setTimeout(() => setCopiadoUrl(false), 2000);
    } catch {
      toast.error("No se pudo copiar el enlace.");
    }
  };

  const handleAbrirWhatsApp = () => {
    if (!resultado) return;
    const prefijo = resultado.telefono.startsWith("51")
      ? resultado.telefono
      : `51${resultado.telefono.replace(/\D/g, "")}`;
    const url = `https://wa.me/${prefijo}?text=${encodeURIComponent(resultado.mensajeWhatsApp)}`;
    window.open(url, "_blank");
  };

  return (
    <Dialog
      open={abierto}
      onOpenChange={(v) => {
        setAbierto(v);
        if (!v) limpiarFormulario();
      }}
    >
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : controlledOpen === undefined ? (
        <DialogTrigger
          render={
            <Button
              type="button"
              className="rounded-full bg-white font-bold text-[#1e3a8a] shadow-sm hover:bg-slate-100 cursor-pointer"
            >
              <UserPlus className="mr-1.5 size-4" />
              <span>Nueva Reserva Manual</span>
            </Button>
          }
        />
      ) : null}

      <DialogContent className="w-[95vw] sm:w-[92vw] sm:max-w-3xl lg:max-w-4xl p-0 gap-0 overflow-hidden flex flex-col h-[94vh] sm:h-auto sm:max-h-[92vh] rounded-3xl">
        {resultado ? (
          /* RESULTADO EXITOSO */
          <div className="flex flex-col h-full overflow-hidden">
            <DialogHeader className="shrink-0 border-b px-6 py-4 sm:py-5 bg-card pr-14 sm:pr-16 text-left">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                <CheckCircle2 className="size-4" />
                <span>CONFIRMACIÓN DE RESERVA</span>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-black text-heading tracking-tight">
                ¡Reserva Registrada con Éxito!
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                Ticket Código: <span className="font-mono font-bold text-heading">{resultado.ticketCodigo}</span> — {tallerNombre}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 sm:p-7 space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="size-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div className="min-w-0">
                  <p className="font-bold text-sm text-heading">Cupo asegurado para el asistente</p>
                  <p className="text-xs text-muted-foreground truncate">
                    El asistente ha sido registrado en la lista oficial del taller presencial.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-heading">
                  Enlace Personal del Ticket Digital
                </Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={resultado.ticketUrl}
                    className="font-mono text-xs bg-muted/40 select-all h-10"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopiarUrl}
                    className="h-10 px-3 shrink-0 rounded-xl font-bold cursor-pointer"
                    title="Copiar enlace"
                  >
                    {copiadoUrl ? (
                      <Check className="size-4 text-emerald-600" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.open(resultado.ticketUrl, "_blank")}
                    className="h-10 px-3 shrink-0 rounded-xl font-bold cursor-pointer"
                    title="Abrir ticket digital"
                  >
                    <ExternalLink className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-heading">
                  Mensaje de Confirmación para el Asistente
                </Label>
                <div className="p-4 bg-muted/30 rounded-2xl border border-border text-xs whitespace-pre-line font-sans text-foreground max-h-48 overflow-y-auto select-all leading-relaxed">
                  {resultado.mensajeWhatsApp}
                </div>
              </div>
            </div>

            <div className="shrink-0 flex flex-col-reverse sm:flex-row items-center sm:justify-between gap-2.5 sm:gap-3 border-t px-6 py-4 bg-muted/30">
              <Button
                type="button"
                variant="outline"
                onClick={limpiarFormulario}
                className="w-full sm:w-auto rounded-xl font-bold cursor-pointer"
              >
                Registrar Otra Reserva
              </Button>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopiarMensaje}
                  className="w-full sm:w-auto rounded-xl font-bold cursor-pointer gap-2"
                >
                  <Copy className="size-4" />
                  <span>{copiado ? "¡Copiado!" : "Copiar Mensaje"}</span>
                </Button>

                <Button
                  type="button"
                  onClick={handleAbrirWhatsApp}
                  className="w-full sm:w-auto rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer gap-2 shadow-sm"
                >
                  <WhatsappIcon className="size-4" />
                  <span>Enviar por WhatsApp</span>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* FORMULARIO DE RESERVA MANUAL EN 2 COLUMNAS BALANCEADAS */
          <form onSubmit={handleSubmit} noValidate className="flex flex-col h-full overflow-hidden">
            {/* Cabecera Fija */}
            <DialogHeader className="shrink-0 border-b px-6 py-4 sm:py-5 bg-card pr-14 sm:pr-16 text-left">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-icon-accent mb-1">
                <UserPlus className="size-4" />
                <span>GESTIÓN DE ASISTENTES Y RESERVAS</span>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-black text-heading tracking-tight">
                Registrar Reserva de Taller
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                {tallerNombre} — Precio Regular: S/ {Number(precioTotal).toFixed(2)}
              </DialogDescription>
            </DialogHeader>

            {/* Contenido en 2 Columnas Balanceadas (0% scroll horizontal) */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 sm:p-7">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                {/* COLUMNA 1: Datos Personales del Asistente */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <span className="size-6 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                      1
                    </span>
                    <h3 className="text-sm font-bold text-heading uppercase tracking-wide">
                      Datos del Asistente
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <Label htmlFor="reserva-nombres" className="mb-1.5 block text-xs font-bold text-heading">
                        Nombres *
                      </Label>
                      <Input
                        id="reserva-nombres"
                        placeholder="Ej: Laura"
                        value={nombres}
                        onChange={(e) => {
                          setNombres(e.target.value);
                          if (errores.nombres) setErrores((prev) => ({ ...prev, nombres: "" }));
                        }}
                        className={cn(
                          "h-10 text-sm",
                          errores.nombres && "border-destructive focus-visible:ring-destructive/30"
                        )}
                        aria-invalid={Boolean(errores.nombres)}
                      />
                      <ErrorCampo mensaje={errores.nombres} />
                    </div>

                    <div>
                      <Label htmlFor="reserva-apellidos" className="mb-1.5 block text-xs font-bold text-heading">
                        Apellidos *
                      </Label>
                      <Input
                        id="reserva-apellidos"
                        placeholder="Ej: Mendoza Gómez"
                        value={apellidos}
                        onChange={(e) => {
                          setApellidos(e.target.value);
                          if (errores.apellidos) setErrores((prev) => ({ ...prev, apellidos: "" }));
                        }}
                        className={cn(
                          "h-10 text-sm",
                          errores.apellidos && "border-destructive focus-visible:ring-destructive/30"
                        )}
                        aria-invalid={Boolean(errores.apellidos)}
                      />
                      <ErrorCampo mensaje={errores.apellidos} />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reserva-correo" className="mb-1.5 block text-xs font-bold text-heading">
                      Correo Electrónico *
                    </Label>
                    <Input
                      id="reserva-correo"
                      type="email"
                      placeholder="laura@ejemplo.com"
                      value={correo}
                      onChange={(e) => {
                        setCorreo(e.target.value);
                        if (errores.correo) setErrores((prev) => ({ ...prev, correo: "" }));
                      }}
                      className={cn(
                        "h-10 text-sm",
                        errores.correo && "border-destructive focus-visible:ring-destructive/30"
                      )}
                      aria-invalid={Boolean(errores.correo)}
                    />
                    <ErrorCampo mensaje={errores.correo} />
                  </div>

                  <div>
                    <Label htmlFor="reserva-telefono" className="mb-1.5 block text-xs font-bold text-heading">
                      Teléfono / WhatsApp *
                    </Label>
                    <Input
                      id="reserva-telefono"
                      type="tel"
                      placeholder="987654321"
                      value={telefono}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setTelefono(val);
                        if (errores.telefono) setErrores((prev) => ({ ...prev, telefono: "" }));
                      }}
                      className={cn(
                        "h-10 text-sm font-mono",
                        errores.telefono && "border-destructive focus-visible:ring-destructive/30"
                      )}
                      aria-invalid={Boolean(errores.telefono)}
                    />
                    <ErrorCampo mensaje={errores.telefono} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <Label htmlFor="reserva-tipoDoc" className="mb-1.5 block text-xs font-bold text-heading">
                        Tipo de Documento
                      </Label>
                      <Select
                        value={tipoDocumento}
                        items={[
                          { value: "DNI", label: "DNI (8 dígitos)" },
                          { value: "CE", label: "Carnet Extranjería" },
                          { value: "PASAPORTE", label: "Pasaporte" },
                          { value: "RUC", label: "RUC (11 dígitos)" },
                        ]}
                        onValueChange={(val: any) => {
                          setTipoDocumento(val);
                          setNumeroDocumento("");
                          if (errores.numeroDocumento) {
                            setErrores((prev) => ({ ...prev, numeroDocumento: "" }));
                          }
                        }}
                      >
                        <SelectTrigger id="reserva-tipoDoc" className="h-10 text-sm font-semibold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DNI">DNI (8 dígitos)</SelectItem>
                          <SelectItem value="CE">Carnet Extranjería</SelectItem>
                          <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                          <SelectItem value="RUC">RUC (11 dígitos)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="reserva-numDoc" className="mb-1.5 block text-xs font-bold text-heading">
                        Número de Documento *
                      </Label>
                      <Input
                        id="reserva-numDoc"
                        placeholder={
                          tipoDocumento === "DNI"
                            ? "8 dígitos"
                            : tipoDocumento === "RUC"
                            ? "11 dígitos"
                            : "Número de documento"
                        }
                        value={numeroDocumento}
                        onChange={(e) => {
                          const soloNums =
                            tipoDocumento === "PASAPORTE"
                              ? e.target.value.toUpperCase()
                              : e.target.value.replace(/\D/g, "");
                          setNumeroDocumento(soloNums);
                          if (errores.numeroDocumento) {
                            setErrores((prev) => ({ ...prev, numeroDocumento: "" }));
                          }
                        }}
                        className={cn(
                          "h-10 text-sm font-mono",
                          errores.numeroDocumento && "border-destructive focus-visible:ring-destructive/30"
                        )}
                        aria-invalid={Boolean(errores.numeroDocumento)}
                      />
                      <ErrorCampo mensaje={errores.numeroDocumento} />
                    </div>
                  </div>
                </div>

                {/* COLUMNA 2: Pago y Condiciones de Reserva */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <span className="size-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                      2
                    </span>
                    <h3 className="text-sm font-bold text-heading uppercase tracking-wide">
                      Condiciones de Pago y Reserva
                    </h3>
                  </div>

                  <div>
                    <Label className="mb-1.5 block text-xs font-bold text-heading">
                      Modalidad de Pago
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={tipoPago === "adelanto" ? "default" : "outline"}
                        onClick={() => handleTipoPagoChange("adelanto")}
                        className={cn(
                          "h-10 text-xs font-bold rounded-xl cursor-pointer transition-all",
                          tipoPago === "adelanto"
                            ? "bg-[#1e3a8a] text-white hover:bg-[#172554] shadow-xs"
                            : "border-border text-foreground hover:bg-muted"
                        )}
                      >
                        Adelanto / Seña (WhatsApp)
                      </Button>
                      <Button
                        type="button"
                        variant={tipoPago === "total" ? "default" : "outline"}
                        onClick={() => handleTipoPagoChange("total")}
                        className={cn(
                          "h-10 text-xs font-bold rounded-xl cursor-pointer transition-all",
                          tipoPago === "total"
                            ? "bg-[#1e3a8a] text-white hover:bg-[#172554] shadow-xs"
                            : "border-border text-foreground hover:bg-muted"
                        )}
                      >
                        Pago Completo (100%)
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <Label htmlFor="reserva-monto" className="mb-1.5 block text-xs font-bold text-heading">
                        Monto Pagado (S/) *
                      </Label>
                      <Input
                        id="reserva-monto"
                        type="number"
                        min="1"
                        max={precioTotal}
                        step="0.01"
                        value={montoPagado}
                        onChange={(e) => {
                          setMontoPagado(e.target.value);
                          if (errores.montoPagado) setErrores((prev) => ({ ...prev, montoPagado: "" }));
                        }}
                        className={cn(
                          "h-10 text-sm font-bold tabular-nums",
                          errores.montoPagado && "border-destructive focus-visible:ring-destructive/30"
                        )}
                        aria-invalid={Boolean(errores.montoPagado)}
                      />
                      <ErrorCampo mensaje={errores.montoPagado} />
                    </div>

                    <div>
                      <Label htmlFor="reserva-canal" className="mb-1.5 block text-xs font-bold text-heading">
                        Canal de Pago
                      </Label>
                      <Select
                        value={canal}
                        items={[
                          { value: "whatsapp", label: "WhatsApp Directo" },
                          { value: "yape", label: "Yape / Plin" },
                          { value: "transferencia", label: "Transferencia Bancaria" },
                          { value: "efectivo", label: "Efectivo en Puerta" },
                        ]}
                        onValueChange={(val: any) => setCanal(val)}
                      >
                        <SelectTrigger id="reserva-canal" className="h-10 text-sm font-semibold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="whatsapp">WhatsApp Directo</SelectItem>
                          <SelectItem value="yape">Yape / Plin</SelectItem>
                          <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                          <SelectItem value="efectivo">Efectivo en Puerta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {tipoPago === "adelanto" && (
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 overflow-hidden">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div>
                          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                            Saldo Restante a Pagar:
                          </span>
                          <p className="text-base font-black text-amber-800 dark:text-amber-200 tabular-nums mt-0.5">
                            S/ {saldoCalculado.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="reserva-fechaLimite" className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1">
                            Fecha Límite de Saldo *
                          </Label>
                          <DatePicker
                            id="reserva-fechaLimite"
                            value={fechaLimiteSaldo}
                            onChange={(val) => {
                              setFechaLimiteSaldo(val);
                              if (errores.fechaLimiteSaldo) {
                                setErrores((prev) => ({ ...prev, fechaLimiteSaldo: "" }));
                              }
                            }}
                            placeholder="Elegir fecha límite"
                          />
                          <ErrorCampo mensaje={errores.fechaLimiteSaldo} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="reserva-notas" className="mb-1.5 block text-xs font-bold text-heading">
                      Notas o Referencia de Reserva (Opcional)
                    </Label>
                    <Textarea
                      id="reserva-notas"
                      placeholder="Ej: Se acordó pago de saldo el día del taller en efectivo..."
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      className="text-xs resize-none h-18"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pie Fijo con Acciones Responsivas (sin desbordes ni scroll horizontal) */}
            <div className="shrink-0 flex flex-col-reverse sm:flex-row items-center sm:justify-end gap-2.5 sm:gap-3 border-t px-6 py-4 bg-muted/30">
              <Button
                type="button"
                variant="outline"
                disabled={cargando}
                onClick={() => {
                  limpiarFormulario();
                  setAbierto(false);
                }}
                className="w-full sm:w-auto rounded-xl font-bold cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={cargando}
                className="w-full sm:w-auto rounded-xl font-bold bg-[#1e3a8a] text-white hover:bg-[#1e3a8a]/90 shadow-sm cursor-pointer"
              >
                {cargando ? (
                  <>
                    <RefreshCw className="mr-2 size-4 animate-spin" />
                    <span>Registrando cupo...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-1.5 size-4" />
                    <span>Confirmar Reserva de Cupo</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
