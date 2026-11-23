"use client";

import { useMemo, useState } from "react";
import {
  Download,
  Loader2,
  Calendar,
  Smartphone,
  CheckCircle2,
  Clock,
  Filter,
  FileSpreadsheet,
  Eye,
  UserCheck,
} from "lucide-react";
import { WhatsappIcon } from "@/components/icons/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-time-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  type DatosContactoExportar,
  normalizarTelefonoE164,
  generarArchivoVCard,
  generarArchivoGoogleContactsCsv,
  construirDisplayNameContacto,
  obtenerNombrePrimerApellido,
} from "@/lib/contactos/formato-contacto";

export interface ModalExportarContactosProps {
  tituloModulo: string; // Ej: "Alumnos y Matrículas" o "Taller: Ramo Buchón"
  contactos: (DatosContactoExportar & { contactoExportadoEn?: string | null })[];
  contactosFiltradosTabla?: (DatosContactoExportar & { contactoExportadoEn?: string | null })[];
  tipo: "curso" | "taller";
  onMarcarExportados: (ids: string[]) => Promise<{ ok: boolean; error?: string }>;
  onExportacionExitosa?: () => void;
  classNameTrigger?: string;
}

type TipoSeleccion = "pendientes" | "hoy" | "filtrados" | "rango" | "todos";
type FormatoDescarga = "vcf" | "csv";

export function ModalExportarContactos({
  tituloModulo,
  contactos,
  contactosFiltradosTabla,
  tipo,
  onMarcarExportados,
  onExportacionExitosa,
  classNameTrigger,
}: ModalExportarContactosProps) {
  const [abierto, setAbierto] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [marcarComoExportados, setMarcarComoExportados] = useState(true);
  const [formato, setFormato] = useState<FormatoDescarga>("vcf");

  // Rango de fechas con DatePicker del sistema (YYYY-MM-DD)
  const [fechaDesde, setFechaDesde] = useState<string>(() => {
    const hoy = new Date();
    hoy.setDate(hoy.getDate() - 7);
    return hoy.toISOString().split("T")[0];
  });
  const [fechaHasta, setFechaHasta] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Contactos que tienen número telefónico válido
  const conTelefonoValido = useMemo(() => {
    return contactos.filter((c) => Boolean(normalizarTelefonoE164(c.telefono, c.pais)));
  }, [contactos]);

  // Nuevos pendientes de agendar (contactoExportadoEn es null o vacío)
  const pendientes = useMemo(() => {
    return conTelefonoValido.filter((c) => !c.contactoExportadoEn);
  }, [conTelefonoValido]);

  // Inscritos hoy
  const inscritosHoy = useMemo(() => {
    const hoyStr = new Date().toISOString().split("T")[0];
    return conTelefonoValido.filter((c) => {
      try {
        const d = new Date(c.fechaRegistroIso).toISOString().split("T")[0];
        return d === hoyStr;
      } catch {
        return false;
      }
    });
  }, [conTelefonoValido]);

  // Preseleccionar la mejor opción disponible
  const [tipoSeleccion, setTipoSeleccion] = useState<TipoSeleccion>(() => {
    if (pendientes.length > 0) return "pendientes";
    if (inscritosHoy.length > 0) return "hoy";
    return "todos";
  });

  // Filtrar los contactos a exportar según la opción seleccionada
  const contactosObjetivo = useMemo(() => {
    switch (tipoSeleccion) {
      case "pendientes":
        return pendientes;
      case "hoy":
        return inscritosHoy;
      case "filtrados": {
        const fuente = contactosFiltradosTabla || contactos;
        return fuente.filter((c) => Boolean(normalizarTelefonoE164(c.telefono, c.pais)));
      }
      case "rango": {
        const dInicio = new Date(`${fechaDesde}T00:00:00Z`).getTime();
        const dFin = new Date(`${fechaHasta}T23:59:59Z`).getTime();
        return conTelefonoValido.filter((c) => {
          try {
            const t = new Date(c.fechaRegistroIso).getTime();
            return t >= dInicio && t <= dFin;
          } catch {
            return false;
          }
        });
      }
      case "todos":
      default:
        return conTelefonoValido;
    }
  }, [
    tipoSeleccion,
    pendientes,
    inscritosHoy,
    contactosFiltradosTabla,
    contactos,
    conTelefonoValido,
    fechaDesde,
    fechaHasta,
  ]);

  // Muestra de contacto para la vista previa
  const contactoMuestra = contactosObjetivo[0] || conTelefonoValido[0];
  const muestraPreview = useMemo(() => {
    if (!contactoMuestra) return null;
    const { primerNombre, primerApellido } = obtenerNombrePrimerApellido(
      contactoMuestra.nombres,
      contactoMuestra.apellidos,
      contactoMuestra.nombreCompleto
    );
    const displayName = construirDisplayNameContacto(
      primerNombre,
      primerApellido,
      contactoMuestra.fechaRegistroIso,
      tipo
    );
    const tel = normalizarTelefonoE164(contactoMuestra.telefono, contactoMuestra.pais);
    return {
      nombre: displayName,
      telefono: tel,
      cursoOTaller: contactoMuestra.cursoOTallerNombre,
      correo: contactoMuestra.correo || "No registrado",
      documento: contactoMuestra.documento || "DNI: 78945612",
      fechaRegistro: new Date(contactoMuestra.fechaRegistroIso).toLocaleDateString("es-PE"),
    };
  }, [contactoMuestra, tipo]);

  const handleDescargar = async () => {
    if (contactosObjetivo.length === 0) {
      toast.warning("No hay contactos válidos con teléfono para exportar en este grupo.");
      return;
    }

    try {
      setDescargando(true);
      const total = contactosObjetivo.length;
      toast.info(`Generando archivo con ${total} contactos...`, { duration: 2000 });

      const ahora = new Date();
      const fechaSufijo = ahora.toISOString().split("T")[0];
      const tipoSufijo = tipo === "taller" ? "taller" : "alumnos";

      let contenido: string;
      let mimeType: string;
      let extension: string;

      if (formato === "vcf") {
        contenido = generarArchivoVCard(contactosObjetivo);
        mimeType = "text/vcard;charset=utf-8";
        extension = "vcf";
      } else {
        contenido = generarArchivoGoogleContactsCsv(contactosObjetivo);
        mimeType = "text/csv;charset=utf-8;";
        extension = "csv";
      }

      const filename = `contactos-${tipoSufijo}-amorelo-${fechaSufijo}.${extension}`;

      // Descargar archivo en el navegador
      const blob = new Blob([contenido], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Si seleccionó marcar como exportados
      if (marcarComoExportados) {
        const ids = contactosObjetivo.map((c) => c.id);
        const res = await onMarcarExportados(ids);
        if (!res.ok) {
          console.warn("[ModalExportarContactos] No se pudo actualizar estado en BD:", res.error);
        } else {
          onExportacionExitosa?.();
        }
      }

      toast.success(
        `¡${total} contactos descargados en formato .${extension.toUpperCase()}! Ya puedes abrirlos en tu celular o importarlos a Google.`,
        { duration: 5000 }
      );

      setAbierto(false);
    } catch (err: any) {
      console.error("[ModalExportarContactos] Error al exportar:", err);
      toast.error("Ocurrió un error al generar el archivo de contactos.");
    } finally {
      setDescargando(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        onClick={() => setAbierto(true)}
        className={
          classNameTrigger ||
          `h-8 sm:h-9 gap-1.5 sm:gap-2 rounded-xl text-xs font-bold border cursor-pointer shadow-sm transition-all shrink-0 ${
            pendientes.length > 0
              ? "bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500"
              : "bg-background hover:bg-muted text-foreground border-border"
          }`
        }
        title="Exportar lista de contactos para celular y WhatsApp"
      >
        <WhatsappIcon className="size-3.5 sm:size-4 shrink-0 text-white fill-current" />
        <span>Exportar Contactos</span>
        {pendientes.length > 0 ? (
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold tabular-nums bg-white text-emerald-800 shadow-xs">
            {pendientes.length} nuevos
          </span>
        ) : (
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-medium tabular-nums bg-muted text-muted-foreground">
            {conTelefonoValido.length}
          </span>
        )}
      </Button>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        {/* Contenedor responsivo: en mobile deja margen lateral de 16px/1rem y vertical del 12vh, en desktop ancho 4xl/5xl en 2 columnas */}
        <DialogContent className="w-[calc(100vw-2rem)] sm:w-[92vw] md:max-w-3xl lg:max-w-4xl xl:max-w-5xl p-0 gap-0 overflow-hidden rounded-2xl border-border bg-card shadow-2xl flex flex-col max-h-[88vh] sm:max-h-[85vh] my-auto">
          {/* Cabecera con estética institucional Amorelo */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-900 dark:to-teal-950 p-5 sm:p-6 text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-10 sm:size-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shrink-0 shadow-inner">
                <Smartphone className="size-5 sm:size-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>Exportar Contactos a Celular</span>
                  <Badge className="bg-white/20 text-white border-white/30 text-[10px] hidden sm:inline-flex">
                    WhatsApp
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-emerald-100 text-xs sm:text-sm mt-0.5 truncate">
                  Genera el archivo para agregar a tus alumnos a WhatsApp en 1 solo toque.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Cuerpo principal en 2 columnas balanceadas en Desktop (grid lg:grid-cols-12) */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* COLUMNA IZQUIERDA (7 de 12 columnas en Desktop): Controles y Selección */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. Selección de grupo a exportar */}
                <div>
                  <div className="flex items-center gap-2 pb-2 border-b border-border mb-3">
                    <span className="size-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                      1
                    </span>
                    <Label className="text-xs font-bold uppercase tracking-wider text-heading">
                      Selecciona qué contactos descargar
                    </Label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Opción A: Pendientes (Recomendada) */}
                    <button
                      type="button"
                      onClick={() => setTipoSeleccion("pendientes")}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        tipoSeleccion === "pendientes"
                          ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-emerald-600/20 shadow-xs"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Clock className="size-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-xs font-bold text-foreground">Nuevos pendientes</span>
                        </div>
                        <Badge
                          variant={pendientes.length > 0 ? "default" : "secondary"}
                          className={
                            pendientes.length > 0
                              ? "bg-emerald-600 text-white text-[10px] h-5"
                              : "text-[10px] h-5"
                          }
                        >
                          {pendientes.length}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
                        Alumnos con teléfono que aún no has guardado en tu celular.
                      </p>
                    </button>

                    {/* Opción B: Inscritos hoy */}
                    <button
                      type="button"
                      onClick={() => setTipoSeleccion("hoy")}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        tipoSeleccion === "hoy"
                          ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-emerald-600/20 shadow-xs"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-bold text-foreground">Inscritos hoy</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] h-5 font-mono">
                          {inscritosHoy.length}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
                        Ventas y registros de hoy (ideal después de un live o transmisión).
                      </p>
                    </button>

                    {/* Opción C: Filtrados en la tabla */}
                    <button
                      type="button"
                      onClick={() => setTipoSeleccion("filtrados")}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        tipoSeleccion === "filtrados"
                          ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-emerald-600/20 shadow-xs"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Filter className="size-4 text-amber-600 dark:text-amber-400" />
                          <span className="text-xs font-bold text-foreground">Filtro activo</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] h-5 font-mono">
                          {(contactosFiltradosTabla || contactos).length}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
                        Los alumnos que coinciden con tu búsqueda actual en la tabla.
                      </p>
                    </button>

                    {/* Opción D: Rango de fechas */}
                    <button
                      type="button"
                      onClick={() => setTipoSeleccion("rango")}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        tipoSeleccion === "rango"
                          ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-emerald-600/20 shadow-xs"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs font-bold text-foreground">Rango de fechas</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] h-5">
                          Personalizado
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
                        Elige una fecha Desde y Hasta específica.
                      </p>
                    </button>
                  </div>

                  {/* Componentes DatePicker nativos del sistema para Rango de fechas */}
                  {tipoSeleccion === "rango" && (
                    <div className="mt-3 p-3.5 rounded-xl bg-muted/40 border border-border grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200">
                      <div>
                        <Label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">
                          Fecha Desde
                        </Label>
                        <DatePicker
                          value={fechaDesde}
                          onChange={(val) => setFechaDesde(val)}
                          placeholder="Desde..."
                          className="h-9 text-xs bg-background"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">
                          Fecha Hasta
                        </Label>
                        <DatePicker
                          value={fechaHasta}
                          onChange={(val) => setFechaHasta(val)}
                          placeholder="Hasta..."
                          className="h-9 text-xs bg-background"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Selector de formato de archivo */}
                <div>
                  <div className="flex items-center gap-2 pb-2 border-b border-border mb-3">
                    <span className="size-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                      2
                    </span>
                    <Label className="text-xs font-bold uppercase tracking-wider text-heading">
                      Formato del archivo
                    </Label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setFormato("vcf")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        formato === "vcf"
                          ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-600/20 shadow-xs"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                        <Smartphone className="size-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground">Archivo .VCF</span>
                          <Badge className="bg-emerald-600 text-white text-[9px] px-1 py-0 h-4">
                            Móvil
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          Tócalo en tu teléfono (Android / iOS) e importa todo en 1 clic.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormato("csv")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        formato === "csv"
                          ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-600/20 shadow-xs"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="size-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                        <FileSpreadsheet className="size-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-foreground">Google Contacts (.CSV)</span>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          Para importar en contacts.google.com desde una computadora.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA (5 de 12 columnas en Desktop): Vista Previa & Confirmación */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <span className="size-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <Label className="text-xs font-bold uppercase tracking-wide text-heading">
                    Vista Previa y Confirmación
                  </Label>
                </div>

                {/* Tarjeta de simulación de contacto estilo WhatsApp / Celular */}
                {muestraPreview ? (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 p-4 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-3">
                      <Eye className="size-3.5" />
                      <span>Cómo aparecerá en tu agenda:</span>
                    </div>

                    <div className="bg-card rounded-xl border border-border p-3.5 shadow-sm space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                          {muestraPreview.nombre.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                            Nombre en Contactos
                          </span>
                          <span className="font-bold text-sm text-foreground font-mono block truncate">
                            {muestraPreview.nombre}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/60 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-[11px]">Teléfono:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                            {muestraPreview.telefono}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-[11px]">
                            {tipo === "taller" ? "Taller:" : "Curso:"}
                          </span>
                          <span className="font-semibold text-foreground truncate max-w-[170px] text-[11px]">
                            {muestraPreview.cursoOTaller}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-[11px]">Documento:</span>
                          <span className="font-mono text-muted-foreground text-[11px]">
                            {muestraPreview.documento}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                    No hay contactos con teléfono para previsualizar.
                  </div>
                )}

                {/* Checkbox con texto fluido y continuo */}
                <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 flex items-start gap-3">
                  <Checkbox
                    id="marcar-exportados"
                    checked={marcarComoExportados}
                    onCheckedChange={(c) => setMarcarComoExportados(Boolean(c))}
                    className="mt-0.5 shrink-0"
                  />
                  <label
                    htmlFor="marcar-exportados"
                    className="text-xs text-foreground cursor-pointer font-normal leading-relaxed select-none block"
                  >
                    Marcar estos contactos como agendados en el sistema para que no vuelvan a aparecer como pendientes.
                  </label>
                </div>

                {/* Resumen de cantidad a exportar */}
                <div className="rounded-xl bg-card border border-border p-3 text-xs flex items-center justify-between">
                  <span className="text-muted-foreground">Listos para exportar:</span>
                  <Badge variant="outline" className="font-mono font-bold text-emerald-700 dark:text-emerald-300 border-emerald-500/30 bg-emerald-500/10">
                    {contactosObjetivo.length} contactos
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Footer con botones fijos de acción */}
          <DialogFooter className="p-4 sm:p-5 bg-muted/30 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-muted-foreground text-center sm:text-left">
              Total a exportar:{" "}
              <span className="font-bold text-foreground">{contactosObjetivo.length} contactos</span>
              {contactos.length - conTelefonoValido.length > 0 && (
                <span className="block text-[11px] text-amber-600 dark:text-amber-400">
                  ({contactos.length - conTelefonoValido.length} sin teléfono válido omitidos)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAbierto(false)}
                disabled={descargando}
                className="flex-1 sm:flex-none h-9 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleDescargar}
                disabled={descargando || contactosObjetivo.length === 0}
                className="flex-1 sm:flex-none h-9 gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
              >
                {descargando ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                <span>Descargar .{formato.toUpperCase()}</span>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
