"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  DollarSign,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Mail,
  Package,
  Phone,
  Receipt,
  RotateCcw,
  Search,
  Sparkles,
  User,
} from "lucide-react";
import { WhatsappIcon } from "@/components/icons/whatsapp-icon";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-time-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { marcarOrdenReembolsadaAction } from "@/server/ordenes/acciones";
import { generarComprobanteManualAction } from "@/server/comprobantes/acciones";
import { BotonExportarTablaExcel } from "@/components/admin/shared/boton-exportar-tabla-excel";

export type OrdenItem = {
  id: string;
  numero_orden: string;
  tipo_orden?: "curso" | "taller" | string;
  canal: string;
  moneda: string;
  total: number;
  monto_pagado: number | null;
  saldo_pendiente?: number | null;
  estado: string;
  estado_acceso: string | null;
  pagada_en: string | null;
  creado_en: string;
  clientes: {
    nombres: string;
    apellidos: string;
    correo: string;
    telefono: string | null;
  } | null;
  orden_items: {
    id: string;
    curso_id?: string | null;
    taller_id?: string | null;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }[];
  comprobantes?:
    | {
        id: string;
        serie: string;
        numero: number;
        tipo_documento: string;
      }[]
    | {
        id: string;
        serie: string;
        numero: number;
        tipo_documento: string;
      }
    | null;
};

export interface ItemOpcion {
  id: string;
  nombre: string;
}

export interface TablaOrdenesProps {
  ordenesIniciales: OrdenItem[];
  cursosDisponibles?: ItemOpcion[];
  talleresDisponibles?: ItemOpcion[];
}

const CANALES = [
  { valor: "todos", etiqueta: "Todos los canales" },
  { valor: "web", etiqueta: "Web / Mercado Pago" },
  { valor: "whatsapp", etiqueta: "WhatsApp / Yape" },
] as const;

const PERIODOS_FECHA = [
  { valor: "todas", etiqueta: "Todas las fechas" },
  { valor: "hoy", etiqueta: "Hoy" },
  { valor: "7dias", etiqueta: "Últimos 7 días" },
  { valor: "este_mes", etiqueta: "Este mes" },
  { valor: "mes_anterior", etiqueta: "Mes anterior" },
  { valor: "personalizado", etiqueta: "Personalizado" },
] as const;

function CampoSelect<T extends string>({
  id,
  etiqueta,
  valor,
  opciones,
  className,
  onCambio,
}: {
  id: string;
  etiqueta: string;
  valor: T;
  opciones: readonly { valor: T; etiqueta: string }[] | { valor: T; etiqueta: string }[];
  className?: string;
  onCambio: (nuevo: T) => void;
}) {
  const etiquetaSeleccionada = opciones.find((o) => o.valor === valor)?.etiqueta;

  return (
    <div className={cn("flex flex-col gap-1.5", className ?? "w-full sm:w-72 lg:w-80")}>
      <Label htmlFor={id} className="text-[13px] font-medium text-foreground">
        {etiqueta}
      </Label>
      <Select
        value={valor}
        items={opciones.map((o) => ({ value: o.valor, label: o.etiqueta }))}
        onValueChange={(v) => onCambio(v as T)}
      >
        <SelectTrigger
          id={id}
          title={etiquetaSeleccionada}
          className="h-10 w-full rounded-xl border-border bg-card text-xs font-medium"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          align="start"
          alignItemWithTrigger={false}
          className="w-[var(--anchor-width)] sm:w-max min-w-[var(--anchor-width)] max-w-[calc(100vw-2.5rem)] sm:max-w-lg rounded-2xl shadow-xl overflow-hidden"
        >
          {opciones.map((o) => (
            <SelectItem
              key={o.valor}
              value={o.valor}
              title={o.etiqueta}
              className="text-xs font-medium cursor-pointer py-2.5"
            >
              <span className="block truncate flex-1 min-w-0">{o.etiqueta}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function obtenerBadgeEstado(estado: string) {
  switch (estado) {
    case "pagada":
      return {
        label: "Pagada",
        className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold",
      };
    case "parcial":
      return {
        label: "Parcial (Adelanto)",
        className: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 font-bold",
      };
    case "pendiente":
      return {
        label: "Pendiente",
        className: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-bold",
      };
    case "expirada":
      return {
        label: "Expirada",
        className: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30 font-bold",
      };
    case "reembolsada":
      return {
        label: "Reembolsada",
        className: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 font-bold",
      };
    case "vencida":
      return {
        label: "Cupo Liberado",
        className: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 font-bold",
      };
    case "cancelada":
      return {
        label: "Cancelada",
        className: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 font-bold",
      };
    case "fallida":
      return {
        label: "Fallida",
        className: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 font-bold",
      };
    default:
      return {
        label: estado,
        className: "bg-muted text-muted-foreground border-border font-bold",
      };
  }
}

export function obtenerBadgeCanal(canal: string) {
  switch (canal) {
    case "whatsapp":
    case "manual":
      return {
        label: "WhatsApp / Yape",
        className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold",
      };
    case "web":
      return {
        label: "Web / MP",
        className: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 font-bold",
      };
    default:
      return {
        label: canal,
        className: "bg-muted text-muted-foreground border-border font-bold",
      };
  }
}

export function TablaOrdenes({
  ordenesIniciales,
  cursosDisponibles = [],
  talleresDisponibles = [],
}: TablaOrdenesProps) {
  const router = useRouter();
  const [ordenes, setOrdenes] = useState<OrdenItem[]>(ordenesIniciales);

  useEffect(() => {
    setOrdenes(ordenesIniciales);
  }, [ordenesIniciales]);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<
    "todas" | "pagada" | "parcial" | "pendiente" | "expirada" | "cancelada" | "reembolsada" | "vencida"
  >("todas");
  const [filtroCanal, setFiltroCanal] = useState<string>("todos");
  const [filtroCurso, setFiltroCurso] = useState<string>("todos");
  const [filtroTaller, setFiltroTaller] = useState<string>("todos");
  const [filtroFecha, setFiltroFecha] = useState<string>("todas");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [filtroConcepto, setFiltroConcepto] = useState<string>("todos");
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenItem | null>(null);
  const [ordenParaReembolsar, setOrdenParaReembolsar] = useState<OrdenItem | null>(null);
  const [motivoReembolso, setMotivoReembolso] = useState("");
  const [procesandoReembolso, setProcesandoReembolso] = useState(false);
  const [emitiendoComprobanteId, setEmitiendoComprobanteId] = useState<string | null>(null);

  const rangoFechasInvalido = useMemo(() => {
    if (filtroFecha !== "personalizado") return false;
    if (!fechaDesde || !fechaHasta) return false;
    return fechaHasta < fechaDesde;
  }, [filtroFecha, fechaDesde, fechaHasta]);

  const handleFechaDesdeChange = (val: string) => {
    setFechaDesde(val);
    if (fechaHasta && val && fechaHasta < val) {
      toast.error("El rango de fechas es inválido: la fecha final no puede ser anterior a la inicial.");
    }
  };

  const handleFechaHastaChange = (val: string) => {
    setFechaHasta(val);
    if (fechaDesde && val && val < fechaDesde) {
      toast.error("El rango de fechas es inválido: la fecha final no puede ser anterior a la inicial.");
    }
  };

  const handleEmitirComprobante = async (ordenId: string) => {
    setEmitiendoComprobanteId(ordenId);
    try {
      toast.info("Emitiendo boleta interna...");
      const res = await generarComprobanteManualAction(ordenId);
      if (res.ok && res.comprobanteId) {
        toast.success(`Comprobante ${res.numeroCompleto} emitido exitosamente.`);
        router.refresh();
        // Actualizar el estado local
        const partes = (res.numeroCompleto || "").split("-");
        const nuevaBoleta = {
          id: res.comprobanteId,
          serie: partes[0] || "B001",
          numero: parseInt(partes[1] || "1", 10),
          tipo_documento: "boleta",
        };

        setOrdenes((prev) =>
          prev.map((o) =>
            o.id === ordenId
              ? {
                  ...o,
                  comprobantes: nuevaBoleta,
                }
              : o
          )
        );

        setOrdenSeleccionada((prev) =>
          prev && prev.id === ordenId
            ? {
                ...prev,
                comprobantes: nuevaBoleta,
              }
            : prev
        );
      } else {
        toast.error(res.error || "No se pudo emitir el comprobante.");
      }
    } catch {
      toast.error("Ocurrió un error al emitir el comprobante.");
    } finally {
      setEmitiendoComprobanteId(null);
    }
  };

  const ejecutarReembolso = async () => {
    if (!ordenParaReembolsar) return;

    setProcesandoReembolso(true);
    try {
      const res = await marcarOrdenReembolsadaAction(ordenParaReembolsar.id, motivoReembolso);
      if (res.ok) {
        toast.success(`Orden #${ordenParaReembolsar.numero_orden} marcada como reembolsada y accesos revocados.`);
        router.refresh();
        setOrdenes((prev) =>
          prev.map((o) => (o.id === ordenParaReembolsar.id ? { ...o, estado: "reembolsada" } : o))
        );
        setOrdenSeleccionada((prev) => (prev ? { ...prev, estado: "reembolsada" } : null));
        setOrdenParaReembolsar(null);
        setMotivoReembolso("");
      } else {
        toast.error(res.error || "No se pudo procesar el reembolso.");
      }
    } catch {
      toast.error("Ocurrió un error al procesar el reembolso.");
    } finally {
      setProcesandoReembolso(false);
    }
  };

  // Opciones para filtros de cursos y talleres
  const opcionesCursos = useMemo(() => {
    return [
      { valor: "todos", etiqueta: "Todos los cursos" },
      ...cursosDisponibles.map((c) => ({ valor: c.id, etiqueta: c.nombre })),
    ];
  }, [cursosDisponibles]);

  const opcionesTalleres = useMemo(() => {
    return [
      { valor: "todos", etiqueta: "Todos los talleres" },
      ...talleresDisponibles.map((t) => ({ valor: t.id, etiqueta: t.nombre })),
    ];
  }, [talleresDisponibles]);

  // Conteos en tiempo real para las píldoras
  const conteos = useMemo(() => {
    return {
      todas: ordenes.length,
      pagada: ordenes.filter((o) => o.estado === "pagada").length,
      parcial: ordenes.filter((o) => o.estado === "parcial").length,
      pendiente: ordenes.filter((o) => o.estado === "pendiente").length,
      expirada: ordenes.filter((o) => o.estado === "expirada").length,
      vencida: ordenes.filter((o) => o.estado === "vencida").length,
      cancelada: ordenes.filter((o) => o.estado === "cancelada" || o.estado === "fallida").length,
      reembolsada: ordenes.filter((o) => o.estado === "reembolsada").length,
    };
  }, [ordenes]);

  // Filtrado reactivo completo
  const ordenesFiltradas = useMemo(() => {
    const ahora = new Date();
    let fechaInicioFiltro: Date | null = null;
    let fechaFinFiltro: Date | null = null;

    if (filtroFecha === "hoy") {
      fechaInicioFiltro = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0);
      fechaFinFiltro = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);
    } else if (filtroFecha === "7dias") {
      fechaInicioFiltro = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
      fechaInicioFiltro.setHours(0, 0, 0, 0);
      fechaFinFiltro = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);
    } else if (filtroFecha === "este_mes") {
      fechaInicioFiltro = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0, 0);
      fechaFinFiltro = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (filtroFecha === "mes_anterior") {
      fechaInicioFiltro = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1, 0, 0, 0, 0);
      fechaFinFiltro = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59, 999);
    } else if (filtroFecha === "personalizado" && !rangoFechasInvalido) {
      if (fechaDesde) {
        const [y, m, d] = fechaDesde.split("-").map(Number);
        fechaInicioFiltro = new Date(y, m - 1, d, 0, 0, 0, 0);
      }
      if (fechaHasta) {
        const [y, m, d] = fechaHasta.split("-").map(Number);
        fechaFinFiltro = new Date(y, m - 1, d, 23, 59, 59, 999);
      }
    }

    return ordenes.filter((o) => {
      const q = busqueda.toLowerCase().trim();
      if (q !== "") {
        const clienteNom = o.clientes
          ? `${o.clientes.nombres} ${o.clientes.apellidos}`.toLowerCase()
          : "";
        const clienteEmail = o.clientes?.correo?.toLowerCase() ?? "";
        const clienteTel = o.clientes?.telefono ?? "";
        const numOrden = o.numero_orden.toLowerCase();
        const itemsText = o.orden_items?.map((i) => i.descripcion.toLowerCase()).join(" ") ?? "";

        const coincide =
          numOrden.includes(q) ||
          clienteNom.includes(q) ||
          clienteEmail.includes(q) ||
          clienteTel.includes(q) ||
          itemsText.includes(q);

        if (!coincide) return false;
      }

      if (filtroEstado === "pagada" && o.estado !== "pagada") return false;
      if (filtroEstado === "parcial" && o.estado !== "parcial") return false;
      if (filtroEstado === "pendiente" && o.estado !== "pendiente") return false;
      if (filtroEstado === "expirada" && o.estado !== "expirada") return false;
      if (filtroEstado === "vencida" && o.estado !== "vencida") return false;
      if (filtroEstado === "cancelada" && o.estado !== "cancelada" && o.estado !== "fallida") return false;
      if (filtroEstado === "reembolsada" && o.estado !== "reembolsada") return false;

      if (filtroCanal !== "todos") {
        if (filtroCanal === "whatsapp" && o.canal !== "whatsapp" && o.canal !== "manual") return false;
        if (filtroCanal === "web" && o.canal !== "web") return false;
      }

      if (filtroCurso !== "todos") {
        const cursoObj = cursosDisponibles.find((c) => c.id === filtroCurso);
        const coincideCurso = o.orden_items?.some((i) => {
          if (i.curso_id && i.curso_id === filtroCurso) return true;
          if (cursoObj && i.descripcion?.trim().toLowerCase() === cursoObj.nombre.trim().toLowerCase()) return true;
          return false;
        });
        if (!coincideCurso) return false;
      }

      if (filtroTaller !== "todos") {
        const tallerObj = talleresDisponibles.find((t) => t.id === filtroTaller);
        const coincideTaller = o.orden_items?.some((i) => {
          if (i.taller_id && i.taller_id === filtroTaller) return true;
          if (tallerObj && i.descripcion?.trim().toLowerCase() === tallerObj.nombre.trim().toLowerCase()) return true;
          return false;
        });
        if (!coincideTaller) return false;
      }

      if (fechaInicioFiltro || fechaFinFiltro) {
        const fechaOrden = new Date(o.creado_en);
        if (fechaInicioFiltro && fechaOrden < fechaInicioFiltro) return false;
        if (fechaFinFiltro && fechaOrden > fechaFinFiltro) return false;
      }

      return true;
    });
  }, [
    ordenes,
    busqueda,
    filtroEstado,
    filtroCanal,
    filtroCurso,
    filtroTaller,
    filtroFecha,
    fechaDesde,
    fechaHasta,
    rangoFechasInvalido,
    cursosDisponibles,
    talleresDisponibles,
  ]);

  const hayFiltrosActivos =
    busqueda.trim() !== "" ||
    filtroEstado !== "todas" ||
    filtroCanal !== "todos" ||
    filtroCurso !== "todos" ||
    filtroTaller !== "todos" ||
    filtroFecha !== "todas" ||
    fechaDesde !== "" ||
    fechaHasta !== "";

  const handleLimpiarFiltros = () => {
    setBusqueda("");
    setFiltroEstado("todas");
    setFiltroCanal("todos");
    setFiltroCurso("todos");
    setFiltroTaller("todos");
    setFiltroFecha("todas");
    setFechaDesde("");
    setFechaHasta("");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Barra de Filtros y Búsqueda — Estilo idéntico a Cupones */}
      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-5 px-5 py-5 sm:px-6">
          {/* Fila 1: Buscador + Píldoras de Estado */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative w-full lg:max-w-md">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por N° orden, cliente o ítem…"
                aria-label="Buscar orden por número, cliente o ítem"
                className="h-10 rounded-xl border-border bg-card pr-3 pl-9 text-sm"
              />
            </div>

            <div
              role="group"
              aria-label="Filtrar por estado de orden"
              className="flex flex-wrap items-center gap-2"
            >
              {(
                [
                  { id: "todas", label: "Todas", conteo: conteos.todas },
                  { id: "pagada", label: "Pagadas", conteo: conteos.pagada },
                  { id: "parcial", label: "Parciales (Adelanto)", conteo: conteos.parcial },
                  { id: "pendiente", label: "Pendientes", conteo: conteos.pendiente },
                  { id: "expirada", label: "Expiradas", conteo: conteos.expirada },
                  { id: "vencida", label: "Cupo Liberado (Vencidas)", conteo: conteos.vencida },
                  { id: "cancelada", label: "Canceladas", conteo: conteos.cancelada },
                  { id: "reembolsada", label: "Reembolsadas", conteo: conteos.reembolsada },
                ] as const
              ).map((filtro) => {
                const activo = filtroEstado === filtro.id;
                return (
                  <button
                    key={filtro.id}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => setFiltroEstado(filtro.id)}
                    className={cn(
                      "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/30 cursor-pointer",
                      activo
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-muted"
                    )}
                  >
                    <span>{filtro.label}</span>
                    <span
                      className={cn(
                        "tabular-nums text-xs",
                        activo ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}
                    >
                      ({filtro.conteo})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fila 2: Canales, Cursos y Talleres */}
          <div className="flex flex-wrap items-end gap-3 border-t pt-4">
            <CampoSelect
              id="filtro-canal"
              etiqueta="Canal de Pago"
              valor={filtroCanal}
              opciones={CANALES}
              className="w-full sm:w-44"
              onCambio={setFiltroCanal}
            />

            <CampoSelect
              id="filtro-curso"
              etiqueta="Cursos Online"
              valor={filtroCurso}
              opciones={opcionesCursos}
              className="w-full sm:w-72 lg:w-80"
              onCambio={setFiltroCurso}
            />

            <CampoSelect
              id="filtro-taller"
              etiqueta="Talleres Presenciales"
              valor={filtroTaller}
              opciones={opcionesTalleres}
              className="w-full sm:w-72 lg:w-80"
              onCambio={setFiltroTaller}
            />
          </div>

          {/* Fila 3: Píldoras de Período de Fecha + Rango Personalizado + Limpiar */}
          <div className="flex flex-wrap items-end gap-3 border-t pt-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-medium text-foreground">
                Período de Fecha
              </Label>
              <div
                role="group"
                aria-label="Filtrar por período de fecha"
                className="flex flex-wrap items-center gap-2"
              >
                {PERIODOS_FECHA.map((p) => {
                  const activo = filtroFecha === p.valor;
                  return (
                    <button
                      key={p.valor}
                      type="button"
                      aria-pressed={activo}
                      onClick={() => setFiltroFecha(p.valor)}
                      className={cn(
                        "inline-flex h-10 items-center rounded-full border px-4 text-sm font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/30 cursor-pointer",
                        activo
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:bg-muted"
                      )}
                    >
                      {p.etiqueta}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selector de Rango Personalizado con DatePicker */}
            {filtroFecha === "personalizado" && (
              <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1.5 w-full sm:w-44">
                    <Label htmlFor="fecha-desde" className="text-[13px] font-medium text-foreground">
                      Desde
                    </Label>
                    <DatePicker
                      id="fecha-desde"
                      value={fechaDesde}
                      onChange={handleFechaDesdeChange}
                      placeholder="Fecha inicio"
                      className={cn(rangoFechasInvalido && "border-destructive focus-visible:ring-destructive/30")}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 w-full sm:w-44">
                    <Label htmlFor="fecha-hasta" className="text-[13px] font-medium text-foreground">
                      Hasta
                    </Label>
                    <DatePicker
                      id="fecha-hasta"
                      value={fechaHasta}
                      onChange={handleFechaHastaChange}
                      placeholder="Fecha fin"
                      className={cn(rangoFechasInvalido && "border-destructive focus-visible:ring-destructive/30")}
                    />
                  </div>
                </div>
                {rangoFechasInvalido && (
                  <p className="text-destructive text-xs font-semibold">
                    La fecha final no puede ser anterior a la inicial.
                  </p>
                )}
              </div>
            )}

            {hayFiltrosActivos && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleLimpiarFiltros}
                className="h-10 px-3 text-muted-foreground hover:text-foreground self-end"
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Contenedor Principal: Tabla en Desktop / Tarjetas en Mobile */}
      <Card className="gap-0 py-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-heading">Órdenes</h2>
            <span
              aria-live="polite"
              className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium tabular-nums"
            >
              Mostrando {ordenesFiltradas.length} de {ordenesIniciales.length} órdenes
            </span>
          </div>

          <BotonExportarTablaExcel
            nombreArchivo="ordenes-amorelo"
            titulo="AMORELO — REGISTRO GENERAL DE ÓRDENES Y VENTAS"
            subtitulo={`Consolidado Comercial y Financiero • Exportado el ${new Date().toLocaleDateString("es-PE")}`}
            nombreHoja="Órdenes"
            totalFiltrados={ordenesFiltradas.length}
            columnas={[
              { header: "N° Orden", key: "numero_orden", width: 14, align: "center" },
              { header: "Fecha y Hora", key: "fecha", width: 20, align: "center" },
              { header: "Cliente", key: "cliente", width: 28, align: "left" },
              { header: "Correo Electrónico", key: "correo", width: 28, align: "left" },
              { header: "Teléfono", key: "telefono", width: 16, align: "center" },
              { header: "Ítems / Detalle", key: "items", width: 34, align: "left" },
              { header: "Canal", key: "canal", width: 14, align: "center" },
              { header: "Moneda", key: "moneda", width: 10, align: "center" },
              { header: "Total", key: "total", width: 15, isCurrency: true },
              { header: "Monto Pagado", key: "monto_pagado", width: 15, isCurrency: true },
              { header: "Saldo Pendiente", key: "saldo_pendiente", width: 15, isCurrency: true },
              { header: "Estado", key: "estado", width: 16, align: "center" },
            ]}
            obtenerFilas={() =>
              ordenesFiltradas.map((o) => ({
                numero_orden: `#${o.numero_orden}`,
                fecha: o.creado_en
                  ? new Date(o.creado_en).toLocaleDateString("es-PE", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-",
                cliente: o.clientes
                  ? `${o.clientes.nombres} ${o.clientes.apellidos}`.trim()
                  : "Cliente Anónimo",
                correo: o.clientes?.correo || "-",
                telefono: o.clientes?.telefono || "-",
                items: o.orden_items?.map((it) => it.descripcion).join(", ") || "-",
                canal: o.canal === "whatsapp" || o.canal === "manual" ? "WhatsApp / Yape" : "Web / MP",
                moneda: o.moneda || "PEN",
                total: Number(o.total || 0),
                monto_pagado: Number(o.monto_pagado || 0),
                saldo_pendiente: Number(o.saldo_pendiente || 0),
                estado:
                  o.estado === "pagada"
                    ? "Pagada"
                    : o.estado === "pendiente"
                    ? "Pendiente"
                    : o.estado === "reembolsada"
                    ? "Reembolsada"
                    : o.estado === "cancelada"
                    ? "Cancelada"
                    : o.estado === "vencida"
                    ? "Cupo Liberado"
                    : o.estado,
              }))
            }
            obtenerTotal={(filas) => {
              const sumaTotal = filas.reduce((acc, f) => acc + Number(f.total || 0), 0);
              const sumaPagado = filas.reduce((acc, f) => acc + Number(f.monto_pagado || 0), 0);
              const sumaSaldo = filas.reduce((acc, f) => acc + Number(f.saldo_pendiente || 0), 0);
              return {
                label: "TOTALES",
                columnaLabel: "numero_orden",
                valores: {
                  total: sumaTotal,
                  monto_pagado: sumaPagado,
                  saldo_pendiente: sumaSaldo,
                },
              };
            }}
          />
        </div>

        {ordenesFiltradas.length === 0 ? (
          <div className="flex h-36 flex-col items-center justify-center gap-1.5 p-6 text-center text-muted-foreground">
            <Receipt className="size-8 opacity-40" />
            <p className="text-sm font-medium">No se encontraron órdenes con los filtros actuales.</p>
          </div>
        ) : (
          <>
            {/* VISTA 1: ESCRITORIO Y LAPTOPS (Tabla inteligente sin scroll horizontal) */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-5">N° Orden</TableHead>
                    <TableHead className="px-4">Cliente</TableHead>
                    {/* Concepto / Ítem: Oculto en laptops (< xl) para no forzar scroll horizontal */}
                    <TableHead className="px-4 hidden xl:table-cell">Concepto / Ítem</TableHead>
                    {/* Canal: Columna dedicada en monitores grandes (2xl), badge anidado en laptops */}
                    <TableHead className="px-4 hidden 2xl:table-cell">Canal</TableHead>
                    <TableHead className="px-4">Monto</TableHead>
                    <TableHead className="px-4">Estado</TableHead>
                    <TableHead className="px-4 text-right">Fecha</TableHead>
                    <TableHead className="px-5 text-right">Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordenesFiltradas.map((o) => {
                    const clienteNombre = o.clientes
                      ? `${o.clientes.nombres} ${o.clientes.apellidos}`.trim()
                      : "Cliente";

                    const itemsDesc = o.orden_items?.length
                      ? o.orden_items.map((i) => i.descripcion).join(", ")
                      : "Masterclass";

                    return (
                      <TableRow key={o.id}>
                        <TableCell className="px-5 font-mono font-bold text-heading">
                          <div>{o.numero_orden}</div>
                          {(() => {
                            const comp = Array.isArray(o.comprobantes)
                              ? o.comprobantes[0]
                              : o.comprobantes;
                            if (comp) {
                              const numComp = `${comp.serie}-${String(comp.numero).padStart(6, "0")}`;
                              return (
                                <a
                                  href={`/api/comprobantes/${comp.id}/pdf`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1e3a8a] hover:underline mt-0.5"
                                  title="Ver Comprobante A4 en PDF"
                                >
                                  <FileText className="size-3 text-muted-foreground" />
                                  <span>{numComp}</span>
                                </a>
                              );
                            }
                            if (o.estado === "pagada") {
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleEmitirComprobante(o.id)}
                                  disabled={emitiendoComprobanteId === o.id}
                                  className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded cursor-pointer mt-1 transition-colors"
                                  title="Emitir Comprobante Serie B001"
                                >
                                  <FileText className="size-2.5" />
                                  <span>
                                    {emitiendoComprobanteId === o.id ? "Emitiendo..." : "Emitir Boleta"}
                                  </span>
                                </button>
                              );
                            }
                            return null;
                          })()}
                        </TableCell>
                        <TableCell className="px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-heading">{clienteNombre}</span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {o.clientes?.correo}
                            </span>
                            {/* En laptops (< 2xl), mostramos el badge de canal aquí para ahorrar columna */}
                            <div className="2xl:hidden mt-1">
                              {(() => {
                                const canalBadge = obtenerBadgeCanal(o.canal);
                                return (
                                  <Badge variant="outline" className={cn(canalBadge.className, "text-[10px] py-0 px-1.5")}>
                                    {canalBadge.label}
                                  </Badge>
                                );
                              })()}
                            </div>
                          </div>
                        </TableCell>
                        {/* Concepto / Ítem (Visible en pantallas xl+) */}
                        <TableCell className="px-4 max-w-[220px] hidden xl:table-cell">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-heading truncate text-xs sm:text-sm">
                              {itemsDesc}
                            </span>
                            <div>
                              <Badge
                                variant="outline"
                                className={
                                  o.tipo_orden === "taller"
                                    ? "text-[10px] py-0 px-1.5 font-bold border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                    : "text-[10px] py-0 px-1.5 font-bold border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                }
                              >
                                {o.tipo_orden === "taller" ? "Taller Presencial" : "Curso Online"}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        {/* Canal (Visible en pantallas 2xl+) */}
                        <TableCell className="px-4 hidden 2xl:table-cell">
                          {(() => {
                            const canalBadge = obtenerBadgeCanal(o.canal);
                            return (
                              <Badge variant="outline" className={canalBadge.className}>
                                {canalBadge.label}
                              </Badge>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="px-4 font-bold text-heading text-sm whitespace-nowrap">
                          <div>S/ {Number(o.total || 0).toFixed(2)}</div>
                          {Number(o.saldo_pendiente || 0) > 0 && (
                            <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 mt-0.5">
                              Pagado S/ {Number(o.monto_pagado || 0).toFixed(2)} (Resta S/ {Number(o.saldo_pendiente || 0).toFixed(2)})
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="px-4 whitespace-nowrap">
                          {(() => {
                            const estadoBadge = obtenerBadgeEstado(o.estado);
                            return (
                              <Badge variant="outline" className={estadoBadge.className}>
                                {estadoBadge.label}
                              </Badge>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="px-4 text-right font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(o.creado_en).toLocaleDateString("es-PE", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="px-5 text-right">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Ver detalle de orden ${o.numero_orden}`}
                            onClick={() => setOrdenSeleccionada(o)}
                            className="rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* VISTA 2: MOBILE (Lista de tarjetas sin scroll horizontal) */}
            <div className="flex flex-col gap-3 p-4 md:hidden border-t">
              {ordenesFiltradas.map((o) => {
                const clienteNombre = o.clientes
                  ? `${o.clientes.nombres} ${o.clientes.apellidos}`.trim()
                  : "Cliente";

                const itemsDesc = o.orden_items?.length
                  ? o.orden_items.map((i) => i.descripcion).join(", ")
                  : "Masterclass";

                return (
                  <div
                    key={o.id}
                    className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs transition-all active:scale-[0.99]"
                  >
                    {/* Fila Superior: N° Orden + Estado */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-heading">
                          {o.numero_orden}
                        </span>
                        {(() => {
                          const comp = Array.isArray(o.comprobantes)
                            ? o.comprobantes[0]
                            : o.comprobantes;
                          if (comp) {
                            const numComp = `${comp.serie}-${String(comp.numero).padStart(6, "0")}`;
                            return (
                              <a
                                href={`/api/comprobantes/${comp.id}/pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1e3a8a] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200"
                                title="Ver Comprobante"
                              >
                                <FileText className="size-3 text-muted-foreground" />
                                <span>{numComp}</span>
                              </a>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      {(() => {
                        const estadoBadge = obtenerBadgeEstado(o.estado);
                        return (
                          <Badge variant="outline" className={cn(estadoBadge.className, "text-xs")}>
                            {estadoBadge.label}
                          </Badge>
                        );
                      })()}
                    </div>

                    {/* Fila Central: Cliente + Correo + Monto */}
                    <div className="flex flex-col gap-1 border-y border-border/60 py-2.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-bold text-heading truncate">
                          {clienteNombre}
                        </span>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-bold text-heading tabular-nums">
                            S/ {Number(o.total || 0).toFixed(2)}
                          </span>
                          {Number(o.saldo_pendiente || 0) > 0 && (
                            <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                              Resta S/ {Number(o.saldo_pendiente || 0).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground truncate">
                        {o.clientes?.correo}
                      </span>
                      {itemsDesc && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge
                            variant="outline"
                            className={
                              o.tipo_orden === "taller"
                                ? "text-[10px] py-0 px-1.5 font-bold border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "text-[10px] py-0 px-1.5 font-bold border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            }
                          >
                            {o.tipo_orden === "taller" ? "Taller" : "Curso"}
                          </Badge>
                          <span className="text-xs text-muted-foreground line-clamp-1 truncate">
                            {itemsDesc}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Fila Inferior: Canal + Fecha + Botón Ojo */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const canalBadge = obtenerBadgeCanal(o.canal);
                          return (
                            <Badge variant="outline" className={cn(canalBadge.className, "text-[11px]")}>
                              {canalBadge.label}
                            </Badge>
                          );
                        })()}
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {new Date(o.creado_en).toLocaleDateString("es-PE", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOrdenSeleccionada(o)}
                        className="h-8 gap-1.5 rounded-full px-3 text-xs font-semibold"
                      >
                        <Eye className="size-3.5" />
                        <span>Ver detalle</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {/* Modal / Dialog de Detalle Completo de la Orden */}
      <Dialog
        open={Boolean(ordenSeleccionada)}
        onOpenChange={(open) => !open && setOrdenSeleccionada(null)}
      >
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-lg sm:max-w-xl md:max-w-2xl max-h-[90vh] p-4 sm:p-6 rounded-3xl overflow-hidden flex flex-col gap-0 text-left">
          {ordenSeleccionada && (
            <>
              <DialogHeader className="pr-10 sm:pr-12 pb-3 shrink-0 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="font-mono text-base sm:text-lg font-bold">
                    Orden #{ordenSeleccionada.numero_orden}
                  </DialogTitle>
                  {(() => {
                    const estadoBadge = obtenerBadgeEstado(ordenSeleccionada.estado);
                    return (
                      <Badge variant="outline" className={cn(estadoBadge.className, "text-xs")}>
                        {estadoBadge.label}
                      </Badge>
                    );
                  })()}
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  Registrada el{" "}
                  {new Date(ordenSeleccionada.creado_en).toLocaleDateString("es-PE", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-3 py-1 text-sm overflow-y-auto overflow-x-hidden min-w-0 flex-1 pr-0.5">
                {/* Sección Cliente */}
                <div className="flex flex-col gap-2 rounded-2xl border bg-muted/30 p-3 sm:p-3.5 min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Datos del Cliente
                  </span>
                  <div className="flex items-center gap-2 font-bold text-heading min-w-0">
                    <User className="size-4 text-muted-foreground shrink-0" />
                    <span className="truncate min-w-0 flex-1 text-xs sm:text-sm">
                      {ordenSeleccionada.clientes
                        ? `${ordenSeleccionada.clientes.nombres} ${ordenSeleccionada.clientes.apellidos}`.trim()
                        : "Sin nombre registrado"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono min-w-0">
                    <Mail className="size-4 text-muted-foreground shrink-0" />
                    <span className="truncate min-w-0 flex-1 text-[11px] sm:text-xs">
                      {ordenSeleccionada.clientes?.correo ?? "Sin correo registrado"}
                    </span>
                  </div>
                  {ordenSeleccionada.clientes?.telefono && (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1.5 border-t border-border/40 mt-0.5 min-w-0">
                      <div className="flex items-center gap-2 font-mono text-muted-foreground shrink-0">
                        <Phone className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs">{ordenSeleccionada.clientes.telefono}</span>
                      </div>
                      <a
                        href={`https://wa.me/${ordenSeleccionada.clientes.telefono.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/15 px-2.5 py-1 text-[11px] font-bold text-emerald-600 transition-colors hover:bg-emerald-600 hover:text-white dark:text-emerald-400 shrink-0"
                      >
                        <WhatsappIcon className="size-3.5" />
                        <span>Abrir WhatsApp</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Sección Ítems */}
                <div className="flex flex-col gap-1.5 min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Ítems Comprados
                  </span>
                  <div className="flex flex-col divide-y divide-border/60 rounded-2xl border bg-card min-w-0 overflow-hidden">
                    {ordenSeleccionada.orden_items && ordenSeleccionada.orden_items.length > 0 ? (
                      ordenSeleccionada.orden_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col gap-1.5 p-3 text-xs min-w-0"
                        >
                          {/* Fila 1: Ícono + Nombre del Producto con wrap legible */}
                          <div className="flex items-start gap-2 min-w-0">
                            <Package className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                            <span className="font-semibold text-heading text-xs sm:text-sm leading-snug break-words min-w-0 flex-1">
                              {item.descripcion}
                            </span>
                          </div>

                          {/* Fila 2: Cantidad y Subtotal */}
                          <div className="flex items-center justify-between pl-6 text-xs min-w-0 pt-0.5">
                            <span className="text-[11px] text-muted-foreground shrink-0">
                              Cantidad: {item.cantidad}
                            </span>
                            <span className="font-bold text-heading tabular-nums whitespace-nowrap shrink-0 text-right">
                              S/ {Number(item.subtotal || item.precio_unitario || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-xs text-muted-foreground">
                        Masterclass / Formación Online
                      </div>
                    )}
                  </div>
                </div>

                {/* Resumen Financiero y Canal */}
                <div className="flex flex-col gap-2 rounded-2xl border bg-muted/20 p-3 sm:p-3.5 min-w-0">
                  <div className="flex items-center justify-between gap-2 text-xs min-w-0">
                    <span className="text-muted-foreground shrink-0">Tipo de Producto:</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[11px] shrink-0 font-bold",
                        ordenSeleccionada.tipo_orden === "taller"
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      )}
                    >
                      {ordenSeleccionada.tipo_orden === "taller" ? "Taller Presencial" : "Curso Online"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs min-w-0">
                    <span className="text-muted-foreground shrink-0">Canal de registro:</span>
                    {(() => {
                      const canalBadge = obtenerBadgeCanal(ordenSeleccionada.canal);
                      return (
                        <Badge variant="outline" className={cn(canalBadge.className, "text-[11px] shrink-0")}>
                          {canalBadge.label}
                        </Badge>
                      );
                    })()}
                  </div>
                  {ordenSeleccionada.pagada_en && (
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground min-w-0">
                      <span className="shrink-0">Fecha de pago:</span>
                      <span className="font-mono text-[11px] shrink-0 text-right">
                        {new Date(ordenSeleccionada.pagada_en).toLocaleDateString("es-PE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                  <Separator className="my-0.5" />
                  <div className="flex items-center justify-between gap-2 text-sm font-bold text-heading min-w-0 pt-0.5">
                    <span className="shrink-0">Total de la Orden:</span>
                    <span className="text-base text-heading tabular-nums shrink-0 text-right">
                      S/ {Number(ordenSeleccionada.total || 0).toFixed(2)}
                    </span>
                  </div>
                  {Number(ordenSeleccionada.saldo_pendiente || 0) > 0 && (
                    <>
                      <div className="flex items-center justify-between gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 min-w-0">
                        <span className="shrink-0">Monto Pagado (Adelanto):</span>
                        <span className="font-mono tabular-nums font-bold shrink-0 text-right">
                          S/ {Number(ordenSeleccionada.monto_pagado || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 min-w-0">
                        <span className="shrink-0">Saldo Restante a Pagar:</span>
                        <span className="font-mono tabular-nums font-extrabold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 shrink-0 text-right">
                          S/ {Number(ordenSeleccionada.saldo_pendiente || 0).toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Comprobante Fiscal / Interno (Serie B001) */}
                <div className="flex items-center justify-between gap-2 rounded-2xl border bg-[#1e3a8a]/5 p-3 sm:p-3.5 min-w-0">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-[#1e3a8a] uppercase tracking-wider">
                      Comprobante de Pago
                    </span>
                    {(() => {
                      const comp = Array.isArray(ordenSeleccionada.comprobantes)
                        ? ordenSeleccionada.comprobantes[0]
                        : ordenSeleccionada.comprobantes;
                      if (comp) {
                        return (
                          <span className="font-mono text-xs font-bold text-foreground">
                            {comp.serie}-{String(comp.numero).padStart(6, "0")} (Control Interno)
                          </span>
                        );
                      }
                      if (ordenSeleccionada.estado === "pagada") {
                        return (
                          <span className="text-xs text-muted-foreground">
                            Pendiente de emisión
                          </span>
                        );
                      }
                      return (
                        <span className="text-xs text-muted-foreground">
                          Se emite al liquidar el 100%
                        </span>
                      );
                    })()}
                  </div>

                  {(() => {
                    const comp = Array.isArray(ordenSeleccionada.comprobantes)
                      ? ordenSeleccionada.comprobantes[0]
                      : ordenSeleccionada.comprobantes;
                    if (comp) {
                      return (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/api/comprobantes/${comp.id}/pdf`, "_blank")}
                          className="h-8 gap-1.5 text-xs text-[#1e3a8a] border-[#1e3a8a]/30 hover:bg-[#1e3a8a]/10 cursor-pointer"
                        >
                          <Eye className="size-3.5" />
                          <span>Ver Boleta A4</span>
                        </Button>
                      );
                    }
                    if (ordenSeleccionada.estado === "pagada") {
                      return (
                        <Button
                          type="button"
                          size="sm"
                          disabled={emitiendoComprobanteId === ordenSeleccionada.id}
                          onClick={() => handleEmitirComprobante(ordenSeleccionada.id)}
                          className="h-8 gap-1.5 text-xs bg-[#1e3a8a] text-white hover:bg-[#1e3a8a]/90 cursor-pointer"
                        >
                          <FileText className="size-3.5" />
                          <span>
                            {emitiendoComprobanteId === ordenSeleccionada.id
                              ? "Emitiendo..."
                              : "Emitir Boleta B001"}
                          </span>
                        </Button>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              <DialogFooter className="pt-3.5 mt-2 border-t flex flex-col-reverse sm:flex-row items-center sm:justify-between gap-2.5 w-full shrink-0">
                {ordenSeleccionada.estado === "pagada" || ordenSeleccionada.estado === "parcial" ? (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={procesandoReembolso}
                    onClick={() => {
                      setMotivoReembolso("");
                      setOrdenParaReembolsar(ordenSeleccionada);
                    }}
                    className="w-full sm:w-auto rounded-full font-bold cursor-pointer h-10"
                  >
                    <RotateCcw className="mr-1.5 size-4" />
                    <span>
                      {procesandoReembolso ? "Procesando reembolso..." : "Marcar como Reembolsada"}
                    </span>
                  </Button>
                ) : (
                  <div className="hidden sm:block" />
                )}

                <Button
                  variant="outline"
                  onClick={() => setOrdenSeleccionada(null)}
                  className="w-full sm:w-auto rounded-full font-bold cursor-pointer h-10"
                >
                  Cerrar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmación de Reembolso (Shadcn UI AlertDialog) */}
      <AlertDialog
        open={Boolean(ordenParaReembolsar)}
        onOpenChange={(open) => {
          if (!open && !procesandoReembolso) {
            setOrdenParaReembolsar(null);
          }
        }}
      >
        <AlertDialogContent className="z-[70] w-[92vw] max-w-md rounded-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-black text-heading flex items-center gap-2">
              <RotateCcw className="size-5 text-rose-600 dark:text-rose-400" />
              <span>¿Confirmar reembolso de la orden #{ordenParaReembolsar?.numero_orden}?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Esta acción marcará la orden como <strong className="text-foreground">Reembolsada</strong> y revocará de inmediato los accesos al aula virtual (si es curso digital) o cancelará la reserva e invalidará el ticket (si es taller presencial). Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-2">
            <Label className="text-xs font-bold text-heading mb-1.5 block">
              Motivo o Detalle del Reembolso (Opcional)
            </Label>
            <Input
              value={motivoReembolso}
              onChange={(e) => setMotivoReembolso(e.target.value)}
              placeholder="Ej: Solicitud del cliente, reprogramación, etc."
              className="h-9 text-xs"
            />
          </div>

          <AlertDialogFooter className="flex sm:justify-end gap-2">
            <AlertDialogCancel
              disabled={procesandoReembolso}
              onClick={() => setOrdenParaReembolsar(null)}
              className="rounded-full cursor-pointer font-bold"
            >
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={procesandoReembolso}
              onClick={ejecutarReembolso}
              className="rounded-full font-bold cursor-pointer"
            >
              <RotateCcw className="mr-1.5 size-4" />
              <span>{procesandoReembolso ? "Procesando..." : "Sí, confirmar reembolso"}</span>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
