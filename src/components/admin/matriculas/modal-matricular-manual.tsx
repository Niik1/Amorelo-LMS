"use client";

import { useState } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  GraduationCap,
  KeyRound,
  MessageCircle,
  Sparkles,
  UserPlus,
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
import { DatePicker } from "@/components/ui/date-time-picker";
import {
  SelectorTelefonoAdmin,
  obtenerReglaTelefono,
} from "@/components/admin/selector-telefono-admin";
import {
  matricularAlumnoManualAction,
  type DatosMatriculaManual,
  type MatriculaManualResultado,
} from "@/server/matriculas/acciones";
import { toast } from "sonner";
import { WhatsappIcon } from "@/components/icons/whatsapp-icon";
import { cn } from "@/lib/utils";

function ErrorCampo({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return <p className="text-destructive mt-1 text-xs font-semibold">{mensaje}</p>;
}

export type CursoOption = {
  id: string;
  nombre: string;
  precio_pen: number;
};

export function ModalMatricularManual({
  cursos,
  onMatriculaExitosa,
  triggerVariant = "primary",
}: {
  cursos: CursoOption[];
  onMatriculaExitosa: () => void;
  triggerVariant?: "white" | "primary";
}) {
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState<
    Extract<MatriculaManualResultado, { ok: true }> | null
  >(null);
  const [copiado, setCopiado] = useState(false);

  // Errores de validación interna
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Campos del formulario
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [pais, setPais] = useState("PE");
  const [tipoDocumento, setTipoDocumento] = useState<"DNI" | "CE" | "PASAPORTE" | "RUC">("DNI");
  const [numeroDocumento, setNumeroDocumento] = useState("");

  const [cursoId, setCursoId] = useState(cursos[0]?.id || "");
  const [tipoVigencia, setTipoVigencia] = useState<"12_meses" | "personalizada">("12_meses");
  const [fechaVencimientoPersonalizada, setFechaVencimientoPersonalizada] = useState("");

  const cursoActual = cursos.find((c) => c.id === cursoId) || cursos[0];
  const [canalPago, setCanalPago] = useState<"whatsapp" | "yape" | "transferencia" | "efectivo" | "cortesia">("whatsapp");
  const [monto, setMonto] = useState(cursoActual?.precio_pen?.toString() || "150");
  const [referenciaPago, setReferenciaPago] = useState("");
  const [notas, setNotas] = useState("");

  const limpiarFormulario = () => {
    setNombres("");
    setApellidos("");
    setCorreo("");
    setTelefono("");
    setPais("PE");
    setTipoDocumento("DNI");
    setNumeroDocumento("");
    setTipoVigencia("12_meses");
    setFechaVencimientoPersonalizada("");
    setCanalPago("whatsapp");
    setMonto(cursoActual?.precio_pen?.toString() || "150");
    setReferenciaPago("");
    setNotas("");
    setResultado(null);
    setCopiado(false);
    setErrores({});
  };

  const handleCambiarCurso = (id: string | null) => {
    if (!id) return;
    setCursoId(id);
    if (errores.cursoId) {
      setErrores((prev) => ({ ...prev, cursoId: "" }));
    }
    const sel = cursos.find((c) => c.id === id);
    if (sel && canalPago !== "cortesia") {
      setMonto(sel.precio_pen.toString());
    }
  };

  const handleNombresChange = (val: string) => {
    setNombres(val);
    if (errores.nombres) setErrores((prev) => ({ ...prev, nombres: "" }));
  };

  const handleApellidosChange = (val: string) => {
    setApellidos(val);
    if (errores.apellidos) setErrores((prev) => ({ ...prev, apellidos: "" }));
  };

  const handleCorreoChange = (val: string) => {
    setCorreo(val);
    if (errores.correo) setErrores((prev) => ({ ...prev, correo: "" }));
  };

  const handleTelefonoChange = (val: string) => {
    setTelefono(val);
    if (errores.telefono) setErrores((prev) => ({ ...prev, telefono: "" }));
  };

  const handleTipoDocumentoChange = (tipo: "DNI" | "CE" | "PASAPORTE" | "RUC") => {
    setTipoDocumento(tipo);
    setNumeroDocumento("");
    if (errores.numeroDocumento) setErrores((prev) => ({ ...prev, numeroDocumento: "" }));
  };

  const handleNumeroDocumentoChange = (val: string) => {
    let filtrado = val;
    if (tipoDocumento === "DNI") {
      filtrado = val.replace(/\D/g, "").slice(0, 8);
    } else if (tipoDocumento === "RUC") {
      filtrado = val.replace(/\D/g, "").slice(0, 11);
    } else if (tipoDocumento === "CE") {
      filtrado = val.replace(/\D/g, "").slice(0, 9);
    } else if (tipoDocumento === "PASAPORTE") {
      filtrado = val.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12).toUpperCase();
    }
    setNumeroDocumento(filtrado);
    if (errores.numeroDocumento) {
      setErrores((prev) => ({ ...prev, numeroDocumento: "" }));
    }
  };

  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    // 1. Nombres (mínimo 3 caracteres)
    const nomTrim = nombres.trim();
    if (!nomTrim) {
      nuevosErrores.nombres = "Ingresa los nombres del alumno";
    } else if (nomTrim.length < 3) {
      nuevosErrores.nombres = "Ingresa un nombre válido (mínimo 3 caracteres)";
    }

    // 2. Apellidos (mínimo 2 caracteres)
    const apeTrim = apellidos.trim();
    if (!apeTrim) {
      nuevosErrores.apellidos = "Ingresa los apellidos del alumno";
    } else if (apeTrim.length < 2) {
      nuevosErrores.apellidos = "Ingresa los apellidos (mínimo 2 caracteres)";
    }

    // 3. Correo
    const correoTrim = correo.trim().toLowerCase();
    const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!correoTrim) {
      nuevosErrores.correo = "Ingresa el correo electrónico del alumno";
    } else if (!regexEmail.test(correoTrim)) {
      nuevosErrores.correo = "Ingresa un correo electrónico válido (ej: alumno@gmail.com)";
    }

    // 4. Teléfono según país
    const regla = obtenerReglaTelefono(pais);
    const telLimpio = telefono.replace(/\D/g, "");
    if (!telLimpio) {
      nuevosErrores.telefono = "Ingresa el número de WhatsApp";
    } else if (telLimpio.length !== regla.digitos) {
      nuevosErrores.telefono = `El teléfono debe tener exactamente ${regla.digitos} dígitos`;
    }

    // 5. Documento
    const docTrim = numeroDocumento.trim();
    if (!docTrim) {
      nuevosErrores.numeroDocumento = "Ingresa el número de documento";
    } else if (tipoDocumento === "DNI" && docTrim.length !== 8) {
      nuevosErrores.numeroDocumento = "El DNI debe tener exactamente 8 dígitos numéricos";
    } else if (tipoDocumento === "RUC" && docTrim.length !== 11) {
      nuevosErrores.numeroDocumento = "El RUC debe tener exactamente 11 dígitos numéricos";
    } else if (tipoDocumento === "CE" && docTrim.length !== 9) {
      nuevosErrores.numeroDocumento = "El Carné de Extranjería debe tener 9 dígitos";
    } else if (tipoDocumento === "PASAPORTE" && (docTrim.length < 6 || docTrim.length > 12)) {
      nuevosErrores.numeroDocumento = "El Pasaporte debe tener entre 6 y 12 caracteres";
    }

    // 6. Curso
    if (!cursoId) {
      nuevosErrores.cursoId = "Por favor selecciona un curso";
    }

    // 7. Período personalizado
    if (tipoVigencia === "personalizada") {
      const hoyPeru = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Lima",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());

      if (!fechaVencimientoPersonalizada) {
        nuevosErrores.fechaVencimientoPersonalizada = "Selecciona la fecha límite de acceso";
      } else if (fechaVencimientoPersonalizada < hoyPeru) {
        nuevosErrores.fechaVencimientoPersonalizada = "La fecha límite no puede ser anterior al día de hoy";
      }
    }

    // 8. Monto
    if (canalPago !== "cortesia" && (monto === "" || isNaN(Number(monto)) || Number(monto) < 0)) {
      nuevosErrores.monto = "Ingresa un monto válido";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) {
      toast.error("Por favor completa los campos marcados en rojo.");
      return;
    }

    setGuardando(true);
    try {
      const datos: DatosMatriculaManual = {
        nombres,
        apellidos,
        correo,
        telefono,
        pais,
        tipoDocumento,
        numeroDocumento,
        cursoId,
        tipoVigencia,
        fechaVencimientoPersonalizada:
          tipoVigencia === "personalizada" ? fechaVencimientoPersonalizada : undefined,
        canalPago,
        monto: Number(monto) || 0,
        referenciaPago,
        notas,
      };

      const res = await matricularAlumnoManualAction(datos);
      if (!res.ok) {
        toast.error(res.error);
        setGuardando(false);
        return;
      }

      setResultado(res);
      toast.success("Matrícula completada con éxito");
      onMatriculaExitosa();
    } catch {
      toast.error("Error al procesar la matrícula.");
    } finally {
      setGuardando(false);
    }
  };

  const copiarMensajeWhatsApp = () => {
    if (!resultado?.mensajeWhatsApp) return;
    navigator.clipboard.writeText(resultado.mensajeWhatsApp);
    setCopiado(true);
    toast.success("¡Mensaje copiado! Listo para enviar por WhatsApp.");
    setTimeout(() => setCopiado(false), 3000);
  };

  const abrirChatWhatsApp = () => {
    if (!resultado) return;
    const cleanPhone = resultado.alumno.telefono.replace(/[^0-9]/g, "");
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
      resultado.mensajeWhatsApp
    )}`;
    window.open(url, "_blank");
  };

  return (
    <Dialog
      open={abierto}
      onOpenChange={(v) => {
        setAbierto(v);
        if (!v) {
          limpiarFormulario();
        }
      }}
    >
      <DialogTrigger
        render={
          <Button
            type="button"
            className={
              triggerVariant === "white"
                ? "rounded-full bg-white font-bold text-[#1e3a8a] shadow-sm hover:bg-slate-100"
                : "rounded-full font-bold shadow-sm"
            }
          >
            <UserPlus className="mr-1.5 size-4" />
            <span>Matricular Alumno (Manual)</span>
          </Button>
        }
      />

      <DialogContent className="w-[96vw] max-w-5xl xl:max-w-6xl 2xl:max-w-7xl p-0 gap-0 overflow-hidden flex flex-col h-[94vh] lg:h-auto lg:max-h-[92vh]">
        {resultado ? (
          /* Vista de Éxito con Credenciales y WhatsApp */
          <div className="p-6 sm:p-8 overflow-y-auto">
            <div className="flex flex-col items-center text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-8" />
              </div>
              <h3 className="mt-4 text-xl font-extrabold text-heading">
                ¡Matrícula Exitosa!
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                El alumno ha sido registrado y matriculado en el aula virtual.
              </p>
            </div>

            {/* Resumen de Acceso */}
            <div className="mt-6 rounded-2xl border bg-muted/40 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                <div>
                  <span className="text-muted-foreground font-semibold block">Alumno:</span>
                  <span className="font-bold text-heading text-sm">
                    {resultado.alumno.nombreCompleto}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold block">Curso:</span>
                  <span className="font-bold text-[#1A73E8]">
                    {resultado.alumno.cursoNombre}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold block">Usuario / Correo:</span>
                  <span className="font-mono font-bold text-heading">
                    {resultado.alumno.correo}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold block">Contraseña:</span>
                  {resultado.alumno.claveTemporal ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {resultado.alumno.claveTemporal}
                      </span>
                      <span className="text-[10px] text-muted-foreground">(Temporal)</span>
                    </div>
                  ) : (
                    <span className="font-semibold text-muted-foreground">
                      Ya posee cuenta activa
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Mensaje formateado para WhatsApp */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-heading flex items-center gap-1.5">
                  <MessageCircle className="size-4 text-emerald-600 dark:text-emerald-400" />
                  Mensaje listo para enviar por WhatsApp:
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={copiarMensajeWhatsApp}
                  className="h-7 text-xs font-bold text-primary hover:text-primary cursor-pointer"
                >
                  {copiado ? (
                    <>
                      <Check className="size-3.5 text-emerald-600" />
                      <span className="text-emerald-600">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>Copiar mensaje</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-xl border bg-muted/30 p-4 font-mono text-[11px] leading-relaxed text-foreground whitespace-pre-wrap select-all">
                {resultado.mensajeWhatsApp}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  limpiarFormulario();
                  setAbierto(false);
                }}
                className="w-full sm:w-auto rounded-xl font-bold cursor-pointer"
              >
                Cerrar
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={copiarMensajeWhatsApp}
                className="w-full sm:w-auto rounded-xl font-bold cursor-pointer"
              >
                <Copy className="mr-1.5 size-4" />
                <span>{copiado ? "¡Copiado!" : "Copiar Texto"}</span>
              </Button>

              {resultado.alumno.telefono && (
                <Button
                  type="button"
                  onClick={abrirChatWhatsApp}
                  className="w-full sm:w-auto rounded-xl bg-[#25D366] text-white hover:bg-[#20ba59] font-bold shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <WhatsappIcon className="mr-1.5 size-4" />
                  <span>Abrir WhatsApp Web</span>
                  <ExternalLink className="size-3.5 ml-1 opacity-70" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Formulario de Matrícula Manual con layout en 2 Columnas */
          <form onSubmit={handleSubmit} noValidate className="flex flex-col h-full lg:h-auto overflow-hidden">
            {/* Cabecera Fija */}
            <DialogHeader className="shrink-0 border-b px-6 py-4 sm:py-5 bg-card">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-icon-accent mb-1">
                <GraduationCap className="size-4" />
                <span>GESTIÓN DE ESTUDIANTES</span>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-black text-heading tracking-tight">
                Matricular Alumno Manualmente
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Registra a un estudiante que pagó por WhatsApp, Yape, transferencia o beca para crear su acceso inmediato al aula.
              </DialogDescription>
            </DialogHeader>

            {/* Contenido en 2 Columnas Balanceadas */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-7">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* COLUMNA 1: Datos Personales del Alumno */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <span className="size-6 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                      1
                    </span>
                    <h3 className="text-sm font-bold text-heading uppercase tracking-wide">
                      Datos del Alumno
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <Label htmlFor="nombres" className="mb-1.5 block text-xs font-bold text-heading">
                        Nombres *
                      </Label>
                      <Input
                        id="nombres"
                        placeholder="Ej: Rosa María"
                        value={nombres}
                        onChange={(e) => handleNombresChange(e.target.value)}
                        className={cn(
                          "h-10 text-sm",
                          errores.nombres && "border-destructive focus-visible:ring-destructive/30"
                        )}
                        aria-invalid={Boolean(errores.nombres)}
                      />
                      <ErrorCampo mensaje={errores.nombres} />
                    </div>

                    <div>
                      <Label htmlFor="apellidos" className="mb-1.5 block text-xs font-bold text-heading">
                        Apellidos *
                      </Label>
                      <Input
                        id="apellidos"
                        placeholder="Ej: Morales Flores"
                        value={apellidos}
                        onChange={(e) => handleApellidosChange(e.target.value)}
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
                    <Label htmlFor="correo" className="mb-1.5 block text-xs font-bold text-heading">
                      Correo Electrónico (Login de acceso) *
                    </Label>
                    <Input
                      id="correo"
                      type="email"
                      placeholder="alumno@correo.com"
                      value={correo}
                      onChange={(e) => handleCorreoChange(e.target.value)}
                      className={cn(
                        "h-10 text-sm",
                        errores.correo && "border-destructive focus-visible:ring-destructive/30"
                      )}
                      aria-invalid={Boolean(errores.correo)}
                    />
                    {errores.correo ? (
                      <ErrorCampo mensaje={errores.correo} />
                    ) : (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Servirá como usuario para ingresar al aula virtual.
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="telefono" className="mb-1.5 block text-xs font-bold text-heading">
                      Teléfono / WhatsApp *
                    </Label>
                    <SelectorTelefonoAdmin
                      id="telefono"
                      paisSeleccionado={pais}
                      onCambiarPais={(p) => {
                        setPais(p);
                        if (errores.telefono) setErrores((prev) => ({ ...prev, telefono: "" }));
                      }}
                      valorTelefono={telefono}
                      onCambiarTelefono={handleTelefonoChange}
                      hasError={Boolean(errores.telefono)}
                    />
                    <ErrorCampo mensaje={errores.telefono} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <Label htmlFor="tipoDocumento" className="mb-1.5 block text-xs font-bold text-heading">
                        Tipo de Documento
                      </Label>
                      <Select
                        value={tipoDocumento}
                        items={[
                          { value: "DNI", label: "DNI (Perú)" },
                          { value: "CE", label: "Carné de Extranjería" },
                          { value: "PASAPORTE", label: "Pasaporte" },
                          { value: "RUC", label: "RUC" },
                        ]}
                        onValueChange={(val) => handleTipoDocumentoChange(val as any)}
                      >
                        <SelectTrigger id="tipoDocumento" className="h-10 w-full text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DNI">DNI (Perú)</SelectItem>
                          <SelectItem value="CE">Carné de Extranjería</SelectItem>
                          <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                          <SelectItem value="RUC">RUC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="numDoc" className="mb-1.5 block text-xs font-bold text-heading">
                        Número de Documento *
                      </Label>
                      <Input
                        id="numDoc"
                        placeholder={
                          tipoDocumento === "DNI"
                            ? "Ej: 72849102 (8 dígitos)"
                            : tipoDocumento === "RUC"
                            ? "Ej: 20601234567 (11 dígitos)"
                            : tipoDocumento === "CE"
                            ? "Ej: 001234567 (9 dígitos)"
                            : "Ej: A1234567 (6-12 car.)"
                        }
                        value={numeroDocumento}
                        onChange={(e) => handleNumeroDocumentoChange(e.target.value)}
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

                {/* COLUMNA 2: Curso, Período y Pago */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <span className="size-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                      2
                    </span>
                    <h3 className="text-sm font-bold text-heading uppercase tracking-wide">
                      Curso, Acceso y Pago
                    </h3>
                  </div>

                  <div>
                    <Label htmlFor="curso" className="mb-1.5 block text-xs font-bold text-heading">
                      Curso a Matricular *
                    </Label>
                    <Select
                      value={cursoId}
                      items={cursos.map((c) => ({
                        value: c.id,
                        label: `${c.nombre} (S/ ${Number(c.precio_pen).toFixed(2)})`,
                      }))}
                      onValueChange={handleCambiarCurso}
                    >
                      <SelectTrigger
                        id="curso"
                        aria-invalid={Boolean(errores.cursoId)}
                        className={cn(
                          "h-10 w-full text-sm",
                          errores.cursoId && "border-destructive focus-visible:ring-destructive/30"
                        )}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {cursos.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nombre} (S/ {Number(c.precio_pen).toFixed(2)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <ErrorCampo mensaje={errores.cursoId} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <Label htmlFor="tipoVigencia" className="mb-1.5 block text-xs font-bold text-heading">
                        Período de Acceso
                      </Label>
                      <Select
                        value={tipoVigencia}
                        items={[
                          { value: "12_meses", label: "12 Meses (Estándar)" },
                          { value: "personalizada", label: "Personalizada" },
                        ]}
                        onValueChange={(val) => setTipoVigencia(val as any)}
                      >
                        <SelectTrigger id="tipoVigencia" className="h-10 w-full text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12_meses">12 Meses (Estándar)</SelectItem>
                          <SelectItem value="personalizada">Personalizada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="fechaVencimiento" className="mb-1.5 block text-xs font-bold text-heading">
                        Fecha Límite
                      </Label>
                      {tipoVigencia === "personalizada" ? (
                        <div>
                          <DatePicker
                            id="fechaVencimiento"
                            value={fechaVencimientoPersonalizada}
                            onChange={(val) => {
                              setFechaVencimientoPersonalizada(val);
                              if (errores.fechaVencimientoPersonalizada) {
                                setErrores((prev) => ({ ...prev, fechaVencimientoPersonalizada: "" }));
                              }
                            }}
                            placeholder="Elegir fecha..."
                            className={cn(
                              errores.fechaVencimientoPersonalizada && "border-destructive focus-visible:ring-destructive/30"
                            )}
                          />
                          <ErrorCampo mensaje={errores.fechaVencimientoPersonalizada} />
                        </div>
                      ) : (
                        <div className="h-10 rounded-xl border border-border/80 bg-muted/40 px-3 flex items-center text-xs text-muted-foreground font-semibold">
                          1 año de acceso al aula
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    <div>
                      <Label htmlFor="canalPago" className="mb-1.5 block text-xs font-bold text-heading">
                        Canal de Venta
                      </Label>
                      <Select
                        value={canalPago}
                        items={[
                          { value: "whatsapp", label: "WhatsApp / Yape / Plin" },
                          { value: "transferencia", label: "Transferencia Bancaria" },
                          { value: "efectivo", label: "Efectivo / Presencial" },
                          { value: "cortesia", label: "Beca / Cortesía (S/ 0)" },
                        ]}
                        onValueChange={(val) => {
                          const v = val as any;
                          setCanalPago(v);
                          if (v === "cortesia") setMonto("0");
                          else if (monto === "0" && cursoActual) setMonto(cursoActual.precio_pen.toString());
                        }}
                      >
                        <SelectTrigger id="canalPago" className="h-10 w-full text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="whatsapp">WhatsApp / Yape / Plin</SelectItem>
                          <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                          <SelectItem value="efectivo">Efectivo / Presencial</SelectItem>
                          <SelectItem value="cortesia">Beca / Cortesía (S/ 0)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="montoCobrado" className="mb-1.5 block text-xs font-bold text-heading">
                        Monto Cobrado (S/)
                      </Label>
                      <Input
                        id="montoCobrado"
                        type="number"
                        step="0.01"
                        value={monto}
                        aria-invalid={Boolean(errores.monto)}
                        onChange={(e) => {
                          setMonto(e.target.value);
                          if (errores.monto) setErrores((prev) => ({ ...prev, monto: "" }));
                        }}
                        className={cn(
                          "h-10 text-sm font-semibold tabular-nums",
                          errores.monto && "border-destructive focus-visible:ring-destructive/30"
                        )}
                      />
                      <ErrorCampo mensaje={errores.monto} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <Label htmlFor="referenciaPago" className="mb-1.5 block text-xs font-bold text-heading">
                        N° Operación / Ref.
                      </Label>
                      <Input
                        id="referenciaPago"
                        placeholder="Ej: Yape #94821"
                        value={referenciaPago}
                        onChange={(e) => setReferenciaPago(e.target.value)}
                        className="h-10 text-sm"
                      />
                    </div>

                    <div>
                      <Label htmlFor="notas" className="mb-1.5 block text-xs font-bold text-heading">
                        Notas Internas (Opcional)
                      </Label>
                      <Input
                        id="notas"
                        placeholder="Ej: Pagó por Yape al WhatsApp"
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Fijo con estilo de Cursos */}
            <div className="sticky bottom-0 shrink-0 z-10 border-t bg-card px-6 py-4 flex flex-col-reverse sm:flex-row items-center sm:justify-between gap-3 shadow-lg">
              <span className="text-xs text-muted-foreground hidden sm:block">
                Se creará la cuenta y clave temporal automáticamente para el alumno.
              </span>
              <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAbierto(false)}
                  className="w-full sm:w-auto rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={guardando}
                  className="w-full sm:w-auto rounded-xl font-bold bg-[#1e3a8a] text-white hover:bg-[#1e3a8a]/90 cursor-pointer shadow-md"
                >
                  <Sparkles className="mr-1.5 size-4" />
                  <span>{guardando ? "Matriculando alumno..." : "Completar Matrícula"}</span>
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
