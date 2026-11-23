// Modal para crear nuevos talleres presenciales en el Panel Admin.
// Estilo visual moderno de dos columnas balanceadas con validaciones inline en rojo y Sonner.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
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
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { crearTallerAction } from "@/server/talleres/acciones";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function ErrorCampo({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return <p className="text-destructive mt-1 text-xs font-semibold">{mensaje}</p>;
}

interface ModalCrearTallerProps {
  trigger?: React.ReactElement;
  onTallerCreado?: (taller: any) => void;
}

export function ModalCrearTaller({ trigger, onTallerCreado }: ModalCrearTallerProps) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Campos del formulario
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [lugar, setLugar] = useState("");
  const [direccion, setDireccion] = useState("");
  const [referencia, setReferencia] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [cuposTotales, setCuposTotales] = useState("25");
  const [precioPen, setPrecioPen] = useState("199.00");
  const [precioPreventaPen, setPrecioPreventaPen] = useState("");
  const [preventaHasta, setPreventaHasta] = useState("");
  const [materialIncluido, setMaterialIncluido] = useState("");
  const [horasAcademicas, setHorasAcademicas] = useState("5");
  const [estado, setEstado] = useState<"publicado" | "inhabilitado">("publicado");

  const limpiarFormulario = () => {
    setNombre("");
    setDescripcion("");
    setFechaInicio("");
    setFechaFin("");
    setLugar("");
    setDireccion("");
    setReferencia("");
    setMapsUrl("");
    setCuposTotales("25");
    setPrecioPen("199.00");
    setPrecioPreventaPen("");
    setPreventaHasta("");
    setMaterialIncluido("");
    setHorasAcademicas("5");
    setEstado("publicado");
    setErrores({});
  };

  const validarFormulario = (): boolean => {
    const nuevos: Record<string, string> = {};

    if (!nombre.trim()) {
      nuevos.nombre = "Ingresa el nombre del taller";
    } else if (nombre.trim().length < 3) {
      nuevos.nombre = "El nombre debe tener al menos 3 caracteres";
    }

    if (!lugar.trim()) {
      nuevos.lugar = "Ingresa el local, hotel o sala del taller";
    }

    if (!fechaInicio) {
      nuevos.fechaInicio = "Selecciona la fecha y hora de inicio";
    }

    if (!fechaFin) {
      nuevos.fechaFin = "Selecciona la fecha y hora de fin";
    }

    if (fechaInicio && fechaFin && new Date(fechaFin) <= new Date(fechaInicio)) {
      nuevos.fechaFin = "La fecha de fin debe ser posterior a la de inicio";
    }

    const cupos = parseInt(cuposTotales, 10);
    if (isNaN(cupos) || cupos <= 0) {
      nuevos.cuposTotales = "Ingresa una cantidad de cupos válida (mínimo 1)";
    }

    const precio = parseFloat(precioPen);
    if (isNaN(precio) || precio < 0) {
      nuevos.precioPen = "Ingresa un precio regular válido";
    }

    if (precioPreventaPen) {
      const prev = parseFloat(precioPreventaPen);
      if (isNaN(prev) || prev < 0) {
        nuevos.precioPreventaPen = "Ingresa un precio de preventa válido";
      } else if (prev >= precio) {
        nuevos.precioPreventaPen = "El precio de preventa debe ser menor al regular";
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
      const res = await crearTallerAction({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        lugar: lugar.trim(),
        direccion: direccion.trim() || undefined,
        referencia: referencia.trim() || undefined,
        maps_url: mapsUrl.trim() || undefined,
        cupos_totales: parseInt(cuposTotales, 10),
        precio_pen: parseFloat(precioPen),
        precio_preventa_pen: precioPreventaPen ? parseFloat(precioPreventaPen) : undefined,
        preventa_hasta: preventaHasta || undefined,
        material_incluido: materialIncluido.trim() || undefined,
        horas_academicas: horasAcademicas ? parseFloat(horasAcademicas) : undefined,
        estado,
      });

      if (!res.ok) {
        toast.error(res.error || "Error al registrar el taller.");
        setCargando(false);
        return;
      }

      toast.success("Taller creado y publicado con éxito");
      limpiarFormulario();
      setAbierto(false);
      onTallerCreado?.(res);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Error inesperado al crear el taller.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <Dialog
      open={abierto}
      onOpenChange={(v) => {
        setAbierto(v);
        if (!v) limpiarFormulario();
      }}
    >
      <DialogTrigger
        render={
          trigger || (
            <Button
              type="button"
              className="rounded-full bg-white font-bold text-[#1e3a8a] shadow-sm hover:bg-slate-100 cursor-pointer"
            >
              <Plus className="mr-1.5 size-4" />
              <span>Crear Nuevo Taller</span>
            </Button>
          )
        }
      />

      <DialogContent className="w-[95vw] sm:w-[92vw] sm:max-w-4xl lg:max-w-5xl 2xl:max-w-6xl p-0 gap-0 overflow-hidden flex flex-col h-[94vh] sm:h-auto sm:max-h-[92vh] rounded-3xl">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col h-full overflow-hidden">
          {/* Cabecera Fija con Despeje para botón Cerrar */}
          <DialogHeader className="shrink-0 border-b px-6 py-4 sm:py-5 bg-card pr-14 sm:pr-16 text-left">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-icon-accent mb-1">
              <Plus className="size-4" />
              <span>GESTIÓN DE TALLERES PRESENCIALES</span>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-black text-heading tracking-tight">
              Crear Nuevo Taller Presencial
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Programa fechas, aforo de cupos, ubicación y precios para emitir tickets automáticos.
            </DialogDescription>
          </DialogHeader>

          {/* Contenido en 2 Columnas Balanceadas */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-7">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {/* COLUMNA 1: Datos Generales y Ubicación */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <span className="size-6 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <h3 className="text-sm font-bold text-heading uppercase tracking-wide">
                    Información y Sede
                  </h3>
                </div>

                <div>
                  <Label htmlFor="crear-nombre" className="mb-1.5 block text-xs font-bold text-heading">
                    Nombre del Taller *
                  </Label>
                  <Input
                    id="crear-nombre"
                    placeholder="Ej: Masterclass Presencial de Globos Lima"
                    value={nombre}
                    onChange={(e) => {
                      setNombre(e.target.value);
                      if (errores.nombre) setErrores((prev) => ({ ...prev, nombre: "" }));
                    }}
                    className={cn(
                      "h-10 text-sm font-semibold",
                      errores.nombre && "border-destructive focus-visible:ring-destructive/30"
                    )}
                    aria-invalid={Boolean(errores.nombre)}
                  />
                  <ErrorCampo mensaje={errores.nombre} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <Label htmlFor="crear-lugar" className="mb-1.5 block text-xs font-bold text-heading">
                      Local / Hotel / Sede *
                    </Label>
                    <Input
                      id="crear-lugar"
                      placeholder="Ej: Hotel Costa del Sol"
                      value={lugar}
                      onChange={(e) => {
                        setLugar(e.target.value);
                        if (errores.lugar) setErrores((prev) => ({ ...prev, lugar: "" }));
                      }}
                      className={cn(
                        "h-10 text-sm",
                        errores.lugar && "border-destructive focus-visible:ring-destructive/30"
                      )}
                      aria-invalid={Boolean(errores.lugar)}
                    />
                    <ErrorCampo mensaje={errores.lugar} />
                  </div>

                  <div>
                    <Label htmlFor="crear-direccion" className="mb-1.5 block text-xs font-bold text-heading">
                      Dirección
                    </Label>
                    <Input
                      id="crear-direccion"
                      placeholder="Ej: Av. Los Cocoteros 505, El Golf, Trujillo"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="crear-referencia" className="mb-1.5 block text-xs font-bold text-heading">
                    Referencia de Ubicación
                  </Label>
                  <Input
                    id="crear-referencia"
                    placeholder="Ej: Frente al Golf y Country Club"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="crear-maps-url" className="mb-1.5 block text-xs font-bold text-heading">
                    Enlace de Google Maps <span className="text-muted-foreground font-normal">(Opcional)</span>
                  </Label>
                  <Input
                    id="crear-maps-url"
                    placeholder="Ej: https://maps.app.goo.gl/... (si lo omites, busca por lugar y dirección)"
                    value={mapsUrl}
                    onChange={(e) => setMapsUrl(e.target.value)}
                    className="h-10 text-xs sm:text-sm font-mono placeholder:font-sans"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Opcional: pega el link directo de Google Maps si deseas fijar la ubicación exacta.
                  </p>
                </div>

                <div>
                  <Label htmlFor="crear-descripcion" className="mb-1.5 block text-xs font-bold text-heading">
                    Descripción del Taller
                  </Label>
                  <Textarea
                    id="crear-descripcion"
                    placeholder="Resumen del contenido y detalles de la experiencia presencial..."
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className="text-xs resize-none h-20"
                  />
                </div>

                <div>
                  <Label htmlFor="crear-materiales" className="mb-1.5 block text-xs font-bold text-heading">
                    Materiales Incluidos (Impreso en el Ticket PDF)
                  </Label>
                  <Textarea
                    id="crear-materiales"
                    placeholder="Ej: Kit de globos Sempertex, inflador eléctrico, calibrador profesional y coffee break VIP..."
                    value={materialIncluido}
                    onChange={(e) => setMaterialIncluido(e.target.value)}
                    className="text-xs resize-none h-20"
                  />
                </div>

                <div>
                  <Label htmlFor="crear-horas" className="mb-1.5 block text-xs font-bold text-heading">
                    Horas Académicas
                  </Label>
                  <Input
                    id="crear-horas"
                    type="number"
                    step="0.5"
                    min="1"
                    placeholder="5"
                    value={horasAcademicas}
                    onChange={(e) => setHorasAcademicas(e.target.value)}
                    className="h-10 text-sm tabular-nums"
                  />
                </div>
              </div>

              {/* COLUMNA 2: Horarios, Precios y Estado */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <span className="size-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <h3 className="text-sm font-bold text-heading uppercase tracking-wide">
                    Fechas, Precios y Publicación
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <Label htmlFor="crear-fechaInicio" className="mb-1.5 block text-xs font-bold text-heading">
                      Fecha y Hora de Inicio *
                    </Label>
                    <DateTimePicker
                      id="crear-fechaInicio"
                      value={fechaInicio}
                      onChange={(val) => {
                        setFechaInicio(val);
                        if (errores.fechaInicio) setErrores((prev) => ({ ...prev, fechaInicio: "" }));
                      }}
                      placeholder="Inicio del taller..."
                      className={cn(errores.fechaInicio && "border-destructive")}
                    />
                    <ErrorCampo mensaje={errores.fechaInicio} />
                  </div>

                  <div>
                    <Label htmlFor="crear-fechaFin" className="mb-1.5 block text-xs font-bold text-heading">
                      Fecha y Hora de Fin *
                    </Label>
                    <DateTimePicker
                      id="crear-fechaFin"
                      value={fechaFin}
                      onChange={(val) => {
                        setFechaFin(val);
                        if (errores.fechaFin) setErrores((prev) => ({ ...prev, fechaFin: "" }));
                      }}
                      placeholder="Fin del taller..."
                      className={cn(errores.fechaFin && "border-destructive")}
                    />
                    <ErrorCampo mensaje={errores.fechaFin} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <Label htmlFor="crear-cupos" className="mb-1.5 block text-xs font-bold text-heading">
                      Aforo Total (Cupos) *
                    </Label>
                    <Input
                      id="crear-cupos"
                      type="number"
                      min="1"
                      value={cuposTotales}
                      onChange={(e) => {
                        setCuposTotales(e.target.value);
                        if (errores.cuposTotales) setErrores((prev) => ({ ...prev, cuposTotales: "" }));
                      }}
                      className={cn(
                        "h-10 text-sm font-semibold tabular-nums",
                        errores.cuposTotales && "border-destructive focus-visible:ring-destructive/30"
                      )}
                    />
                    <ErrorCampo mensaje={errores.cuposTotales} />
                  </div>

                  <div>
                    <Label htmlFor="crear-precio" className="mb-1.5 block text-xs font-bold text-heading">
                      Precio Regular (S/) *
                    </Label>
                    <Input
                      id="crear-precio"
                      type="number"
                      step="0.01"
                      min="0"
                      value={precioPen}
                      onChange={(e) => {
                        setPrecioPen(e.target.value);
                        if (errores.precioPen) setErrores((prev) => ({ ...prev, precioPen: "" }));
                      }}
                      className={cn(
                        "h-10 text-sm font-semibold tabular-nums",
                        errores.precioPen && "border-destructive focus-visible:ring-destructive/30"
                      )}
                    />
                    <ErrorCampo mensaje={errores.precioPen} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <Label htmlFor="crear-preventa" className="mb-1.5 block text-xs font-bold text-heading">
                      Precio Preventa (S/)
                    </Label>
                    <Input
                      id="crear-preventa"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Opcional"
                      value={precioPreventaPen}
                      onChange={(e) => {
                        setPrecioPreventaPen(e.target.value);
                        if (errores.precioPreventaPen) {
                          setErrores((prev) => ({ ...prev, precioPreventaPen: "" }));
                        }
                      }}
                      className={cn(
                        "h-10 text-sm font-semibold tabular-nums",
                        errores.precioPreventaPen && "border-destructive focus-visible:ring-destructive/30"
                      )}
                    />
                    <ErrorCampo mensaje={errores.precioPreventaPen} />
                  </div>

                  <div>
                    <Label htmlFor="crear-preventaHasta" className="mb-1.5 block text-xs font-bold text-heading">
                      Preventa Vigente Hasta
                    </Label>
                    <DateTimePicker
                      id="crear-preventaHasta"
                      value={preventaHasta}
                      onChange={setPreventaHasta}
                      placeholder="Fecha límite preventa..."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="crear-estado" className="mb-1.5 block text-xs font-bold text-heading">
                    Estado Inicial
                  </Label>
                  <Select
                    value={estado}
                    items={[
                      { value: "publicado", label: "Publicado (Visible y en venta)" },
                      { value: "inhabilitado", label: "Inhabilitado (Oculto / Pausado)" },
                    ]}
                    onValueChange={(val: any) => setEstado(val)}
                  >
                    <SelectTrigger id="crear-estado" className="h-10 text-sm font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="publicado">Publicado (Visible y en venta)</SelectItem>
                      <SelectItem value="inhabilitado">Inhabilitado (Oculto / Pausado)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Pie Fijo con Acciones Responsivas (en móvil apilados sin cortes, en desktop alineados a la derecha) */}
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
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  <span>Guardando taller...</span>
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 size-4" />
                  <span>Crear y Publicar Taller</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
