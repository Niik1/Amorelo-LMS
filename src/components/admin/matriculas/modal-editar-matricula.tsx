"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Calendar,
  GraduationCap,
  Pencil,
  Save,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { obtenerIsoDePais } from "@/lib/paises/paises";
import {
  actualizarMatriculaAction,
  type AlumnoMatriculadoItem,
} from "@/server/matriculas/acciones";
import { type CursoOption } from "./modal-matricular-manual";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function ErrorCampo({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return <p className="text-destructive mt-1 text-xs font-semibold">{mensaje}</p>;
}

interface ModalEditarMatriculaProps {
  matricula: AlumnoMatriculadoItem | null;
  cursos: CursoOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMatriculaActualizada: (actualizada: AlumnoMatriculadoItem) => void;
}

export function ModalEditarMatricula({
  matricula,
  cursos,
  open,
  onOpenChange,
  onMatriculaActualizada,
}: ModalEditarMatriculaProps) {
  const [guardando, setGuardando] = useState(false);

  // Errores de validación interna
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Campos de Alumno
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [pais, setPais] = useState("PE");
  const [tipoDocumento, setTipoDocumento] = useState<"DNI" | "CE" | "PASAPORTE" | "RUC">("DNI");
  const [numeroDocumento, setNumeroDocumento] = useState("");

  // Campos de Matrícula
  const [cursoId, setCursoId] = useState("");
  const [estado, setEstado] = useState<"activa" | "vencida" | "revocada">("activa");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [motivoRevocacion, setMotivoRevocacion] = useState("");

  // Sincronizar estado cuando se abre con una matrícula
  useEffect(() => {
    if (matricula && open) {
      const nom = matricula.nombres || matricula.nombreCompleto.split(" ")[0] || "";
      const ape =
        matricula.apellidos ||
        matricula.nombreCompleto.split(" ").slice(1).join(" ") ||
        "";

      setNombres(nom);
      setApellidos(ape);
      setCorreo(matricula.correo);
      setTelefono(matricula.telefono);
      setPais(obtenerIsoDePais(matricula.pais));
      setTipoDocumento(matricula.tipoDocumento || "DNI");
      setNumeroDocumento(matricula.numeroDocumento || "");
      setCursoId(matricula.cursoId);
      setEstado(matricula.estado);
      setFechaVencimiento(
        matricula.venceEn ? matricula.venceEn.slice(0, 10) : ""
      );
      setMotivoRevocacion("");
      setErrores({});
    }
  }, [matricula, open]);

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

    // 7. Fecha de Vencimiento
    const hoyPeru = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Lima",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    if (!fechaVencimiento) {
      nuevosErrores.fechaVencimiento = "Selecciona la fecha límite de vigencia";
    } else if (estado === "activa" && fechaVencimiento < hoyPeru) {
      nuevosErrores.fechaVencimiento =
        "Para una matrícula activa, la fecha no puede ser anterior a hoy (o cambia el estado a 'Vencida')";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricula) return;

    if (!validarFormulario()) {
      toast.error("Por favor completa los campos marcados en rojo.");
      return;
    }

    setGuardando(true);
    try {
      // Asegurar que expire al final del día en hora de Perú (-05:00) -> 23:59:59.999-05:00
      const fechaIso = new Date(`${fechaVencimiento}T23:59:59.999-05:00`).toISOString();

      const res = await actualizarMatriculaAction({
        matriculaId: matricula.id,
        perfilId: matricula.perfilId,
        nombres,
        apellidos,
        correo: correo.trim(),
        telefono,
        pais,
        tipoDocumento,
        numeroDocumento,
        cursoId,
        venceEn: fechaIso,
        estado,
        motivoRevocacion: estado === "revocada" ? motivoRevocacion : undefined,
      });

      if (!res.ok || !res.matriculaActualizada) {
        toast.error(res.error || "No se pudo actualizar la matrícula.");
        setGuardando(false);
        return;
      }

      toast.success("¡Matrícula y datos del alumno actualizados con éxito!");

      // Notificar al componente padre para reflejar los cambios en vivo
      onMatriculaActualizada({
        ...matricula,
        ...res.matriculaActualizada,
      });

      onOpenChange(false);
    } catch {
      toast.error("Ocurrió un error al guardar los cambios.");
    } finally {
      setGuardando(false);
    }
  };

  const opcionesTiposDoc = [
    { value: "DNI", label: "DNI (Perú)" },
    { value: "CE", label: "Carné de Extranjería" },
    { value: "PASAPORTE", label: "Pasaporte" },
    { value: "RUC", label: "RUC" },
  ];

  const opcionesCursos = cursos.map((c) => ({
    value: c.id,
    label: c.nombre,
  }));

  const opcionesEstado = [
    { value: "activa", label: "Activa (Acceso Vigente)" },
    { value: "vencida", label: "Vencida (Período Caducado)" },
    { value: "revocada", label: "Revocada (Acceso Suspendido)" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-5xl xl:max-w-6xl p-0 gap-0 overflow-hidden flex flex-col h-[94vh] lg:h-auto lg:max-h-[92vh]">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col h-full lg:h-auto overflow-hidden">
          {/* Cabecera Fija */}
          <DialogHeader className="shrink-0 border-b px-6 py-4 sm:py-5 bg-card">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-icon-accent mb-1">
              <Pencil className="size-4" />
              <span>EDICIÓN DE MATRÍCULA</span>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-black text-heading tracking-tight">
              Editar Datos de Matrícula
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Modifica la información del alumno, su curso asignado, vigencia o estado de acceso al aula virtual.
            </DialogDescription>
          </DialogHeader>

          {/* Contenido en 2 Columnas */}
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
                    <Label htmlFor="edit-nombres" className="mb-1.5 block text-xs font-bold text-heading">
                      Nombres *
                    </Label>
                    <Input
                      id="edit-nombres"
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
                    <Label htmlFor="edit-apellidos" className="mb-1.5 block text-xs font-bold text-heading">
                      Apellidos *
                    </Label>
                    <Input
                      id="edit-apellidos"
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
                  <Label htmlFor="edit-correo" className="mb-1.5 block text-xs font-bold text-heading">
                    Correo Electrónico (Login de acceso) *
                  </Label>
                  <Input
                    id="edit-correo"
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
                      Si modificas el correo, el alumno deberá usar esta nueva dirección para iniciar sesión en el aula virtual con su misma clave.
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="edit-telefono" className="mb-1.5 block text-xs font-bold text-heading">
                    Teléfono / WhatsApp *
                  </Label>
                  <SelectorTelefonoAdmin
                    id="edit-telefono"
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
                    <Label htmlFor="edit-tipoDoc" className="mb-1.5 block text-xs font-bold text-heading">
                      Tipo de Documento
                    </Label>
                    <Select
                      value={tipoDocumento}
                      items={opcionesTiposDoc}
                      onValueChange={(val) => val && handleTipoDocumentoChange(val as any)}
                    >
                      <SelectTrigger id="edit-tipoDoc" className="h-10 w-full text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {opcionesTiposDoc.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="edit-numDoc" className="mb-1.5 block text-xs font-bold text-heading">
                      Número de Documento *
                    </Label>
                    <Input
                      id="edit-numDoc"
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

              {/* COLUMNA 2: Matrícula y Acceso al Aula */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <span className="size-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <h3 className="text-sm font-bold text-heading uppercase tracking-wide">
                    Matrícula y Período de Acceso
                  </h3>
                </div>

                <div>
                  <Label htmlFor="edit-curso" className="mb-1.5 block text-xs font-bold text-heading">
                    Curso Asignado *
                  </Label>
                  <Select
                    value={cursoId}
                    items={opcionesCursos}
                    onValueChange={(val) => {
                      if (val) setCursoId(val);
                      if (errores.cursoId) setErrores((prev) => ({ ...prev, cursoId: "" }));
                    }}
                  >
                    <SelectTrigger
                      id="edit-curso"
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
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ErrorCampo mensaje={errores.cursoId} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <Label htmlFor="edit-estado" className="mb-1.5 block text-xs font-bold text-heading">
                      Estado de la Matrícula *
                    </Label>
                    <Select
                      value={estado}
                      items={opcionesEstado}
                      onValueChange={(val) => val && setEstado(val as any)}
                    >
                      <SelectTrigger id="edit-estado" className="h-10 w-full text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {opcionesEstado.map((est) => (
                          <SelectItem key={est.value} value={est.value}>
                            {est.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="edit-fecha" className="mb-1.5 block text-xs font-bold text-heading">
                      Fecha Límite de Vigencia *
                    </Label>
                    <DatePicker
                      id="edit-fecha"
                      value={fechaVencimiento}
                      onChange={(val) => {
                        setFechaVencimiento(val);
                        if (errores.fechaVencimiento) {
                          setErrores((prev) => ({ ...prev, fechaVencimiento: "" }));
                        }
                      }}
                      placeholder="Seleccionar fecha..."
                      className={cn(
                        errores.fechaVencimiento && "border-destructive focus-visible:ring-destructive/30"
                      )}
                    />
                    <ErrorCampo mensaje={errores.fechaVencimiento} />
                  </div>
                </div>

                {estado === "revocada" && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400">
                      <AlertTriangle className="size-4" />
                      <span>Motivo de Suspensión / Revocación</span>
                    </div>
                    <Input
                      placeholder="Ej: Solicitud de reembolso, incumplimiento..."
                      value={motivoRevocacion}
                      onChange={(e) => setMotivoRevocacion(e.target.value)}
                      className="h-9 text-xs bg-card"
                    />
                  </div>
                )}

                <div className="rounded-xl border bg-muted/40 p-3.5 text-xs text-muted-foreground space-y-1">
                  <div className="font-semibold text-heading flex items-center gap-1.5">
                    <GraduationCap className="size-4 text-icon-accent" />
                    <span>Información de Acceso al Aula</span>
                  </div>
                  <p>
                    El alumno mantendrá acceso a todas las clases y módulos del curso seleccionado hasta las 23:59 de la fecha de vigencia establecida.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pie Fijo con Acciones */}
          <div className="shrink-0 flex flex-col-reverse sm:flex-row items-center sm:justify-end gap-2.5 sm:gap-3 border-t px-6 py-4 bg-muted/30">
            <Button
              type="button"
              variant="outline"
              disabled={guardando}
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto rounded-xl font-bold cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={guardando}
              className="w-full sm:w-auto rounded-xl font-bold bg-[#1e3a8a] text-white hover:bg-[#1e3a8a]/90 shadow-sm cursor-pointer"
            >
              <Save className="mr-1.5 size-4" />
              <span>{guardando ? "Guardando..." : "Guardar Cambios"}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
