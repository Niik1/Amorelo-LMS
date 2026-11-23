// Modal para rectificar datos personales del titular y reemitir el certificado oficial.
// Estilo visual homologado con diseño de auditoría en dos columnas balanceadas y tarjetas semánticas.

"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  FileText,
  Loader2,
  Mail,
  Pencil,
  ShieldCheck,
  Sparkles,
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
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  rectificarCertificadoAction,
  type ItemCertificadoAdmin,
} from "@/server/certificados/acciones-admin";

function ErrorCampo({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return <p className="text-destructive mt-1 text-xs font-semibold">{mensaje}</p>;
}

interface ModalRectificarCertificadoProps {
  certificado: ItemCertificadoAdmin | null;
  abierto: boolean;
  onOpenChange: (open: boolean) => void;
  onCompletado: () => void;
}

export function ModalRectificarCertificado({
  certificado,
  abierto,
  onOpenChange,
  onCompletado,
}: ModalRectificarCertificadoProps) {
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [motivo, setMotivo] = useState("");
  const [actualizarPerfil, setActualizarPerfil] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Sincronizar campos cuando se abre con un certificado seleccionado
  const handleOpenChange = (open: boolean) => {
    if (open && certificado) {
      let initNombres = certificado.nombresAlumno || "";
      let initApellidos = certificado.apellidosAlumno || "";

      if (!initNombres && !initApellidos && certificado.nombreAlumno) {
        const partes = certificado.nombreAlumno.trim().split(" ");
        const medio = Math.ceil(partes.length / 2);
        initNombres = partes.slice(0, medio).join(" ");
        initApellidos = partes.slice(medio).join(" ");
      }

      setNombres(initNombres);
      setApellidos(initApellidos);
      setMotivo("");
      setActualizarPerfil(true);
      setErrores({});
    }
    onOpenChange(open);
  };

  const nombreCompleto = `${nombres.trim()} ${apellidos.trim()}`.trim();

  const handleNombresChange = (val: string) => {
    setNombres(val);
    if (errores.nombres) setErrores((prev) => ({ ...prev, nombres: "" }));
  };

  const handleApellidosChange = (val: string) => {
    setApellidos(val);
    if (errores.apellidos) setErrores((prev) => ({ ...prev, apellidos: "" }));
  };

  const handleMotivoChange = (val: string) => {
    setMotivo(val);
    if (errores.motivo) setErrores((prev) => ({ ...prev, motivo: "" }));
  };

  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {};
    const nomTrim = nombres.trim();
    if (!nomTrim) {
      nuevosErrores.nombres = "Ingresa los nombres del titular.";
    } else if (nomTrim.length < 2) {
      nuevosErrores.nombres = "Los nombres deben tener al menos 2 caracteres.";
    }

    const apeTrim = apellidos.trim();
    if (!apeTrim) {
      nuevosErrores.apellidos = "Ingresa los apellidos del titular.";
    } else if (apeTrim.length < 2) {
      nuevosErrores.apellidos = "Los apellidos deben tener al menos 2 caracteres.";
    }

    const motTrim = motivo.trim();
    if (!motTrim) {
      nuevosErrores.motivo = "Indica el motivo de la rectificación.";
    } else if (motTrim.length < 5) {
      nuevosErrores.motivo = "El motivo debe tener al menos 5 caracteres.";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certificado) return;

    if (!validarFormulario()) {
      toast.error("Por favor completa los campos marcados en rojo.");
      return;
    }

    setCargando(true);
    try {
      const res = await rectificarCertificadoAction({
        certificadoId: certificado.id,
        nuevoNombre: nombreCompleto,
        nuevosNombres: nombres.trim(),
        nuevosApellidos: apellidos.trim(),
        motivo: motivo.trim(),
        actualizarPerfil,
      });

      if (res.ok) {
        toast.success("Certificado rectificado con éxito", {
          description: `Nuevo código emitido: ${res.nuevoCodigo}`,
        });
        onCompletado();
        onOpenChange(false);
      } else {
        toast.error(res.error || "No se pudo rectificar el certificado.");
      }
    } catch {
      toast.error("Error inesperado al rectificar el certificado.");
    } finally {
      setCargando(false);
    }
  };

  if (!certificado) return null;

  return (
    <Dialog open={abierto} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] sm:w-[92vw] sm:max-w-4xl lg:max-w-5xl 2xl:max-w-6xl p-0 gap-0 overflow-hidden flex flex-col h-[94vh] sm:h-auto sm:max-h-[92vh] rounded-3xl">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col h-full overflow-hidden">
          {/* Cabecera Fija con Despeje para botón Cerrar */}
          <DialogHeader className="shrink-0 border-b px-6 py-4 sm:py-5 bg-card pr-14 sm:pr-16 text-left">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-icon-accent mb-1">
              <Pencil className="size-4" />
              <span>GESTIÓN DE CERTIFICADOS OFICIALES</span>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-black text-heading tracking-tight">
              Rectificar y Reemitir Certificado
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Corrige el nombre o apellidos del titular con trazabilidad legal y anulación del código anterior.
            </DialogDescription>
          </DialogHeader>

          {/* Contenido en 2 Columnas Balanceadas */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-7">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-start">
              {/* COLUMNA 1: Certificado a Sustituir */}
              <div className="space-y-3.5">
                {/* Cabecera Sección 1: Número 1 preservando exactamente su estilo actual */}
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <span className="size-6 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <h3 className="text-sm font-bold text-heading uppercase tracking-wide">
                    Certificado a Sustituir
                  </h3>
                </div>

                {/* Banner de Acción Irreversible de Auditoría */}
                <div className="flex items-start gap-3 p-3.5 rounded-2xl border border-amber-500/25 bg-amber-500/10 text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="size-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-amber-700 dark:text-amber-300">
                      Acción irreversible de auditoría
                    </p>
                    <p className="text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                      El código actual <span className="font-mono font-bold text-amber-950 dark:text-amber-100">{certificado.codigoVerificacion}</span> pasará a estado <span className="font-bold text-amber-950 dark:text-amber-100">Anulado</span>. En el validador público enlazará al nuevo certificado corregido.
                    </p>
                  </div>
                </div>

                {/* Tarjeta: Programa y Titular Actual */}
                <div className="p-4 rounded-2xl border border-border/70 bg-card/60 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-bold">
                        Programa
                      </span>
                      <span className="font-bold text-heading block mt-0.5 leading-snug">
                        {certificado.tituloPrograma}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-bold">
                        Titular Actual
                      </span>
                      <span className="font-bold text-heading block mt-0.5 leading-snug">
                        {certificado.nombreAlumno}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tarjeta: Documento y Correo Bloqueados */}
                <div className="p-4 rounded-2xl border border-border/70 bg-card/60">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-bold flex items-center gap-1.5">
                        <ShieldCheck className="size-3.5 text-muted-foreground" />
                        <span>Documento (Bloqueado)</span>
                      </span>
                      <span className="font-mono font-bold text-heading block mt-0.5">
                        {certificado.documentoAlumno
                          ? (certificado.documentoAlumno.includes(":")
                              ? certificado.documentoAlumno
                              : `DNI: ${certificado.documentoAlumno}`)
                          : "Sin documento"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-bold flex items-center gap-1.5">
                        <Mail className="size-3.5 text-muted-foreground" />
                        <span>Correo (Bloqueado)</span>
                      </span>
                      <span className="font-semibold text-heading truncate block mt-0.5" title={certificado.correoAlumno || ""}>
                        {certificado.correoAlumno || "Sin correo registrado"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Nota al pie de seguridad legal */}
                <p className="text-[11px] text-muted-foreground italic leading-relaxed pt-0.5">
                  * Por seguridad fiscal y legal, el DNI y el correo no pueden ser alterados; están asociados a la cuenta del alumno.
                </p>
              </div>

              {/* COLUMNA 2: Datos Corregidos del Titular */}
              <div className="space-y-3.5">
                {/* Cabecera Sección 2 */}
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <span className="size-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                    2
                  </span>
                  <h3 className="text-sm font-bold text-heading uppercase tracking-wide">
                    Datos Corregidos del Titular
                  </h3>
                </div>

                {/* Campos Nombres y Apellidos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <Label htmlFor="edit-nombres" className="mb-1.5 block text-xs font-bold text-heading">
                      Nombres *
                    </Label>
                    <Input
                      id="edit-nombres"
                      value={nombres}
                      onChange={(e) => handleNombresChange(e.target.value)}
                      placeholder="Ej: Nikcey"
                      className={cn(
                        "h-10 text-sm font-semibold rounded-xl",
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
                      value={apellidos}
                      onChange={(e) => handleApellidosChange(e.target.value)}
                      placeholder="Ej: Bada Gutierrez"
                      className={cn(
                        "h-10 text-sm font-semibold rounded-xl",
                        errores.apellidos && "border-destructive focus-visible:ring-destructive/30"
                      )}
                      aria-invalid={Boolean(errores.apellidos)}
                    />
                    <ErrorCampo mensaje={errores.apellidos} />
                  </div>
                </div>

                {/* Vista previa: Nombre oficial tal como figurará en el diploma */}
                <div className="p-3.5 rounded-2xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-950/25">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wide">
                    <FileText className="size-4" />
                    <span>Nombre oficial tal como figurará en el diploma</span>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-heading truncate min-h-[1.5rem]">
                    {nombreCompleto || "—"}
                  </p>
                </div>

                {/* Campo Motivo de la Corrección */}
                <div>
                  <Label htmlFor="edit-motivo" className="mb-1.5 block text-xs font-bold text-heading">
                    Motivo de la Corrección *
                  </Label>
                  <Input
                    id="edit-motivo"
                    value={motivo}
                    onChange={(e) => handleMotivoChange(e.target.value)}
                    placeholder="Ej: Corrección ortográfica en apellido a solicitud del alumno"
                    className={cn(
                      "h-10 text-sm rounded-xl",
                      errores.motivo && "border-destructive focus-visible:ring-destructive/30"
                    )}
                    aria-invalid={Boolean(errores.motivo)}
                  />
                  <ErrorCampo mensaje={errores.motivo} />
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Este motivo quedará guardado para trazabilidad interna y auditoría.
                  </p>
                </div>

                {/* Checkbox Shadcn estilizado en tarjeta */}
                <div className="p-3.5 rounded-2xl border border-border/70 bg-card/60">
                  <label htmlFor="actualizar-perfil" className="flex items-start gap-3 cursor-pointer select-none">
                    <Checkbox
                      id="actualizar-perfil"
                      checked={actualizarPerfil}
                      onCheckedChange={(checked) => setActualizarPerfil(checked === true)}
                      className="mt-0.5"
                    />
                    <div className="text-xs space-y-0.5">
                      <span className="font-bold text-heading block">
                        Actualizar también estos datos en la base de datos (ficha del alumno)
                      </span>
                      <span className="text-muted-foreground text-[11px] block leading-relaxed">
                        Garantiza que sus próximas inscripciones a talleres o cursos salgan automáticamente con este nombre corregido.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Pie Fijo con Acciones */}
          <div className="shrink-0 flex flex-col-reverse sm:flex-row items-center sm:justify-end gap-2.5 sm:gap-3 border-t px-6 py-4 bg-muted/30">
            <Button
              type="button"
              variant="outline"
              disabled={cargando}
              onClick={() => onOpenChange(false)}
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
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                  <span>Reemitiendo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="mr-1.5 size-4" />
                  <span>Reemitir Certificado</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

