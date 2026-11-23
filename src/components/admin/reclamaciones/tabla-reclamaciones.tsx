// Tabla interactiva de gestión del Libro de Reclamaciones en el Panel Admin.
// Estilo visual y de diseño 100% unificado con el módulo de Certificados Oficiales.
// Utiliza componentes UI reutilizables (ModuloBanner, FiltroPildoras, TablaContenedorCard).

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  MessageSquareWarning,
  RefreshCw,
  Search,
  Send,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-time-picker";
import { ModuloBanner } from "@/components/ui/modulo-banner";
import { FiltroPildoras, type OpcionPildora } from "@/components/ui/filtro-pildoras";
import { TablaContenedorCard } from "@/components/ui/tabla-contenedor-card";
import { cn } from "@/lib/utils";
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
import { WhatsappIcon } from "@/components/icons/whatsapp-icon";
import { type ItemReclamoAdmin } from "@/server/reclamos/acciones-admin";
import { ModalDetalleReclamo } from "./modal-detalle-reclamo";
import { ModalResponderReclamo } from "./modal-responder-reclamo";
import { BotonExportarTablaExcel } from "@/components/admin/shared/boton-exportar-tabla-excel";

const PERIODOS_FECHA: OpcionPildora[] = [
  { id: "todas", label: "Todas las fechas" },
  { id: "hoy", label: "Hoy" },
  { id: "7dias", label: "Últimos 7 días" },
  { id: "este_mes", label: "Este mes" },
  { id: "mes_anterior", label: "Mes anterior" },
  { id: "personalizado", label: "Personalizado" },
];

const TIPOS_OPCIONES = [
  { valor: "todos", etiqueta: "Todos los tipos" },
  { valor: "reclamo", etiqueta: "Solo Reclamos (bienes o servicios)" },
  { valor: "queja", etiqueta: "Solo Quejas (atención al público)" },
] as const;

const SLA_OPCIONES = [
  { valor: "todos", etiqueta: "Todos los plazos" },
  { valor: "en_plazo", etiqueta: "En plazo (> 5 días)" },
  { valor: "por_vencer", etiqueta: "Próximos a vencer (≤ 5 días)" },
  { valor: "vencido", etiqueta: "Plazo vencido (sin respuesta)" },
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
        onValueChange={(v) => {
          if (v) onCambio(v as T);
        }}
      >
        <SelectTrigger
          id={id}
          title={etiquetaSeleccionada}
          className="h-10 w-full rounded-xl border-border bg-card text-xs font-medium cursor-pointer"
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

interface TablaReclamacionesProps {
  reclamosIniciales: ItemReclamoAdmin[];
  busquedaInicial?: string;
}

export function TablaReclamaciones({
  reclamosIniciales,
  busquedaInicial = "",
}: TablaReclamacionesProps) {
  const router = useRouter();

  // Estados de filtros
  const [busqueda, setBusqueda] = useState(busquedaInicial);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroSla, setFiltroSla] = useState<string>("todos");
  const [filtroFecha, setFiltroFecha] = useState<string>("todas");
  const [fechaDesde, setFechaDesde] = useState<string>("");
  const [fechaHasta, setFechaHasta] = useState<string>("");

  const rangoFechasInvalido = useMemo(() => {
    if (filtroFecha !== "personalizado") return false;
    if (!fechaDesde || !fechaHasta) return false;
    return fechaHasta < fechaDesde;
  }, [filtroFecha, fechaDesde, fechaHasta]);

  const handleFechaDesdeChange = (val: string) => {
    setFechaDesde(val);
    setPaginaActual(1);
    if (fechaHasta && val && fechaHasta < val) {
      toast.error("El rango de fechas es inválido: la fecha final no puede ser anterior a la inicial.");
    }
  };

  const handleFechaHastaChange = (val: string) => {
    setFechaHasta(val);
    setPaginaActual(1);
    if (fechaDesde && val && val < fechaDesde) {
      toast.error("El rango de fechas es inválido: la fecha final no puede ser anterior a la inicial.");
    }
  };

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 10;

  // Estados de modales
  const [reclamoSeleccionado, setReclamoSeleccionado] = useState<ItemReclamoAdmin | null>(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [modalResponderAbierto, setModalResponderAbierto] = useState(false);

  // Conteos para las píldoras de la Fila 1
  const conteos = useMemo(() => {
    let todos = reclamosIniciales.length;
    let pendientes = 0;
    let respondidos = 0;
    for (const r of reclamosIniciales) {
      if (r.estado === "pendiente" || r.estado === "en_proceso") {
        pendientes++;
      } else if (r.estado === "respondido" || r.estado === "cerrado") {
        respondidos++;
      }
    }
    return { todos, pendientes, respondidos };
  }, [reclamosIniciales]);

  const opcionesEstadoPildoras: OpcionPildora[] = useMemo(
    () => [
      { id: "todos", label: "Todos", conteo: conteos.todos },
      { id: "pendiente", label: "Pendientes", conteo: conteos.pendientes },
      { id: "respondido", label: "Respondidos", conteo: conteos.respondidos },
    ],
    [conteos]
  );

  // Cálculo de SLA (días restantes)
  const calcularSla = (fechaLimiteStr: string, respondido: boolean) => {
    if (respondido) return { dias: 0, estado: "respondido" as const };
    try {
      const ahora = new Date().getTime();
      const limite = new Date(fechaLimiteStr).getTime();
      const diffMs = limite - ahora;
      const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDias < 0) return { dias: Math.abs(diffDias), estado: "vencido" as const };
      if (diffDias <= 5) return { dias: diffDias, estado: "por_vencer" as const };
      return { dias: diffDias, estado: "en_plazo" as const };
    } catch {
      return { dias: 0, estado: "en_plazo" as const };
    }
  };

  const hayFiltrosActivos =
    busqueda.trim() !== "" ||
    filtroEstado !== "todos" ||
    filtroTipo !== "todos" ||
    filtroSla !== "todos" ||
    filtroFecha !== "todas" ||
    Boolean(fechaDesde) ||
    Boolean(fechaHasta);

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroEstado("todos");
    setFiltroTipo("todos");
    setFiltroSla("todos");
    setFiltroFecha("todas");
    setFechaDesde("");
    setFechaHasta("");
    setPaginaActual(1);
  };

  // Filtrado reactivo en cliente
  const reclamosFiltrados = useMemo(() => {
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

    return reclamosIniciales.filter((r) => {
      // 1. Filtro texto (Buscador)
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const coincideNum = r.numero.toLowerCase().includes(q);
        const coincideNombre = r.nombreCompleto.toLowerCase().includes(q);
        const coincideDoc = r.numeroDocumento.toLowerCase().includes(q);
        const coincideCorreo = r.correo.toLowerCase().includes(q);
        const coincideBien = r.descripcionBien.toLowerCase().includes(q);
        if (!coincideNum && !coincideNombre && !coincideDoc && !coincideCorreo && !coincideBien) {
          return false;
        }
      }

      // 2. Filtro Estado (Píldoras Fila 1)
      if (filtroEstado === "pendiente" && r.estado !== "pendiente" && r.estado !== "en_proceso") {
        return false;
      }
      if (filtroEstado === "respondido" && r.estado !== "respondido" && r.estado !== "cerrado") {
        return false;
      }

      // 3. Filtro Tipo (Fila 2)
      if (filtroTipo !== "todos" && r.tipo !== filtroTipo) {
        return false;
      }

      // 4. Filtro SLA (Fila 2)
      if (filtroSla !== "todos") {
        const esRespondido = r.estado === "respondido" || r.estado === "cerrado";
        const sla = calcularSla(r.fechaLimiteRespuesta, esRespondido);
        if (filtroSla === "vencido" && (esRespondido || sla.estado !== "vencido")) return false;
        if (filtroSla === "por_vencer" && (esRespondido || sla.estado !== "por_vencer")) return false;
        if (filtroSla === "en_plazo" && (esRespondido || sla.estado !== "en_plazo")) return false;
      }

      // 5. Filtro Fecha (Fila 3)
      if (fechaInicioFiltro || fechaFinFiltro) {
        const fechaReg = new Date(r.creadoEn);
        if (fechaInicioFiltro && fechaReg < fechaInicioFiltro) return false;
        if (fechaFinFiltro && fechaReg > fechaFinFiltro) return false;
      }

      return true;
    });
  }, [
    reclamosIniciales,
    busqueda,
    filtroEstado,
    filtroTipo,
    filtroSla,
    filtroFecha,
    fechaDesde,
    fechaHasta,
    rangoFechasInvalido,
  ]);

  // Paginación
  const totalPaginas = Math.ceil(reclamosFiltrados.length / elementosPorPagina) || 1;
  const itemsPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * elementosPorPagina;
    return reclamosFiltrados.slice(inicio, inicio + elementosPorPagina);
  }, [reclamosFiltrados, paginaActual]);

  const formatearFechaSimple = (fechaStr: string) => {
    try {
      const d = new Date(fechaStr);
      return new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(d);
    } catch {
      return fechaStr;
    }
  };

  return (
    <div className="flex w-full flex-col gap-6 p-6 sm:p-8">
      {/* Banner Principal Unificado (Espaciado perimetral y botones blancos tipo píldora) */}
      <ModuloBanner
        titulo="Libro de Reclamaciones"
        descripcion="Gestión, atención y trazabilidad de hojas de reclamación conforme a normativa INDECOPI."
        icono={MessageSquareWarning}
        acciones={
          <Button
            type="button"
            onClick={() => router.refresh()}
            className="rounded-full bg-white font-bold text-[#1e3a8a] shadow-sm hover:bg-slate-100 cursor-pointer"
          >
            <RefreshCw className="mr-1.5 size-4" />
            <span>Actualizar</span>
          </Button>
        }
      />

      {/* Barra de Filtros y Búsqueda — Estructura exacta de 3 filas idéntica a Certificados */}
      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-5 px-5 py-5 sm:px-6">
          {/* Fila 1: Buscador + Píldoras de Estado Reutilizables */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative w-full lg:max-w-md">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPaginaActual(1);
                }}
                placeholder="Buscar por N° hoja, consumidor, documento o bien…"
                aria-label="Buscar reclamaciones"
                className="h-10 rounded-xl border-border bg-card pr-3 pl-9 text-sm"
              />
            </div>

            <FiltroPildoras
              ariaLabel="Filtrar por estado de la reclamación"
              opciones={opcionesEstadoPildoras}
              valorActual={filtroEstado}
              onCambio={(v) => {
                setFiltroEstado(v as "todos" | "pendiente" | "respondido");
                setPaginaActual(1);
              }}
            />
          </div>

          {/* Fila 2: Selects de Categorización (Tipo y SLA) */}
          <div className="flex flex-wrap items-end gap-3 border-t pt-4">
            <CampoSelect
              id="filtro-tipo"
              etiqueta="Tipo de Reclamación"
              valor={filtroTipo}
              opciones={TIPOS_OPCIONES}
              className="w-full sm:w-72 lg:w-80"
              onCambio={(v) => {
                setFiltroTipo(v);
                setPaginaActual(1);
              }}
            />

            <CampoSelect
              id="filtro-sla"
              etiqueta="Semáforo de Plazo Legal (SLA)"
              valor={filtroSla}
              opciones={SLA_OPCIONES}
              className="w-full sm:w-72 lg:w-80"
              onCambio={(v) => {
                setFiltroSla(v);
                setPaginaActual(1);
              }}
            />
          </div>

          {/* Fila 3: Píldoras de Período de Fecha + DatePicker Personalizado + Limpiar */}
          <div className="flex flex-wrap items-end gap-3 border-t pt-4">
            <FiltroPildoras
              etiqueta="Período de Fecha"
              ariaLabel="Filtrar por período de fecha"
              opciones={PERIODOS_FECHA}
              valorActual={filtroFecha}
              onCambio={(v) => {
                setFiltroFecha(v);
                setPaginaActual(1);
              }}
            />

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
                onClick={limpiarFiltros}
                className="h-10 rounded-full px-4 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="mr-1.5 size-3.5" />
                <span>Limpiar filtros</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Tabla Oficial de Reclamaciones — Utiliza el contenedor reutilizable TablaContenedorCard */}
      <TablaContenedorCard
        titulo="Reclamaciones"
        totalRegistros={reclamosIniciales.length}
        registrosFiltrados={reclamosFiltrados.length}
        accionesHeader={
          <BotonExportarTablaExcel
            nombreArchivo="libro-reclamaciones-amorelo"
            titulo="AMORELO — LIBRO DE RECLAMACIONES (CONFORME A NORMATIVA INDECOPI)"
            subtitulo={`Registro Legal de Reclamaciones y Quejas • Exportado el ${new Date().toLocaleDateString("es-PE")}`}
            nombreHoja="Reclamaciones"
            totalFiltrados={reclamosFiltrados.length}
            columnas={[
              { header: "N° Hoja", key: "numero", width: 18, align: "center" },
              { header: "Fecha Registro", key: "fecha", width: 16, align: "center" },
              { header: "Tipo", key: "tipo", width: 14, align: "center" },
              { header: "Consumidor", key: "consumidor", width: 28, align: "left" },
              { header: "Tipo Doc", key: "tipo_doc", width: 12, align: "center" },
              { header: "N° Documento", key: "num_doc", width: 16, align: "center" },
              { header: "Correo", key: "correo", width: 28, align: "left" },
              { header: "Teléfono", key: "telefono", width: 16, align: "center" },
              { header: "Bien Contratado", key: "bien", width: 16, align: "center" },
              { header: "Descripción del Bien", key: "descripcion_bien", width: 32, align: "left" },
              { header: "Monto Reclamado", key: "monto", width: 16, isCurrency: true },
              { header: "Plazo SLA", key: "sla", width: 18, align: "center" },
              { header: "Estado", key: "estado", width: 16, align: "center" },
              { header: "Respondido En", key: "respondido_en", width: 16, align: "center" },
            ]}
            obtenerFilas={() =>
              reclamosFiltrados.map((r) => ({
                numero: r.numero,
                fecha: r.creadoEn ? new Date(r.creadoEn).toLocaleDateString("es-PE") : "-",
                tipo: r.tipo === "reclamo" ? "Reclamo" : "Queja",
                consumidor: r.nombreCompleto,
                tipo_doc: r.tipoDocumento,
                num_doc: r.numeroDocumento,
                correo: r.correo,
                telefono: r.telefono || "-",
                bien: r.bienContratado === "servicio" ? "Servicio" : "Producto",
                descripcion_bien: r.descripcionBien || "-",
                monto: r.montoReclamado !== null ? Number(r.montoReclamado) : 0,
                sla: r.fechaLimiteRespuesta ? new Date(r.fechaLimiteRespuesta).toLocaleDateString("es-PE") : "-",
                estado:
                  r.estado === "pendiente"
                    ? "Pendiente"
                    : r.estado === "en_proceso"
                    ? "En proceso"
                    : r.estado === "respondido"
                    ? "Respondido"
                    : "Cerrado",
                respondido_en: r.respondidoEn ? new Date(r.respondidoEn).toLocaleDateString("es-PE") : "-",
              }))
            }
            obtenerTotal={(filas) => {
              const sumaMonto = filas.reduce((acc, f) => acc + Number(f.monto || 0), 0);
              return {
                label: "TOTAL RECLAMADO",
                columnaLabel: "numero",
                valores: {
                  monto: sumaMonto,
                },
              };
            }}
          />
        }
        estaVacio={itemsPaginados.length === 0}
        iconoVacio={MessageSquareWarning}
        mensajeVacio={
          hayFiltrosActivos
            ? "No se encontraron reclamaciones con los filtros aplicados"
            : "No hay reclamaciones registradas"
        }
        submensajeVacio={
          hayFiltrosActivos
            ? "Intenta modificar o limpiar los filtros de búsqueda para ver más resultados."
            : "Las hojas de reclamación que los usuarios ingresen aparecerán en este panel para su atención legal."
        }
        accionVacio={
          hayFiltrosActivos ? (
            <Button
              variant="outline"
              size="sm"
              onClick={limpiarFiltros}
              className="rounded-full text-xs font-semibold cursor-pointer"
            >
              Limpiar filtros
            </Button>
          ) : undefined
        }
        paginacion={{
          paginaActual,
          totalPaginas,
          onCambiarPagina: setPaginaActual,
        }}
      >
        {/* VISTA 1: ESCRITORIO Y LAPTOPS (Degradación progresiva sin scroll horizontal) */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-5">N° Hoja y Fecha</TableHead>
                {/* Consumidor: Oculto en laptops (< xl) */}
                <TableHead className="px-4 hidden xl:table-cell">Consumidor</TableHead>
                {/* Bien Contratado: Dedicado en 2xl (pantallas 23"+) */}
                <TableHead className="px-4 hidden 2xl:table-cell">Bien Contratado</TableHead>
                {/* Tipo: Dedicado en 2xl (pantallas 23"+) */}
                <TableHead className="px-4 hidden 2xl:table-cell">Tipo</TableHead>
                <TableHead className="px-4">Plazo SLA</TableHead>
                {/* Estado: Oculto en laptops (< xl) */}
                <TableHead className="px-4 hidden xl:table-cell">Estado</TableHead>
                <TableHead className="px-5 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemsPaginados.map((r) => {
                const esReclamo = r.tipo === "reclamo";
                const esRespondido = r.estado === "respondido" || r.estado === "cerrado";
                const sla = calcularSla(r.fechaLimiteRespuesta, esRespondido);

                return (
                  <TableRow key={r.id}>
                    {/* N° Hoja y Fecha (+ Badge Tipo y Consumidor en laptops < xl) */}
                    <TableCell className="px-5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-heading text-sm font-mono">
                            {r.numero}
                          </span>
                          <div className="2xl:hidden">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] py-0 px-1.5 font-bold",
                                esReclamo
                                  ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
                                  : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                              )}
                            >
                              {esReclamo ? "Reclamo" : "Queja"}
                            </Badge>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground mt-0.5">
                          {formatearFechaSimple(r.creadoEn)}
                        </span>
                        {/* En laptops (< xl), mostramos el nombre del consumidor aquí */}
                        <span className="xl:hidden text-xs font-semibold text-heading truncate max-w-[170px] mt-0.5">
                          {r.nombreCompleto}
                        </span>
                      </div>
                    </TableCell>

                    {/* Consumidor (Visible en pantallas xl+) */}
                    <TableCell className="px-4 hidden xl:table-cell">
                      <div className="flex flex-col">
                        <span className="font-bold text-heading text-sm max-w-[200px] truncate" title={r.nombreCompleto}>
                          {r.nombreCompleto}
                        </span>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {r.tipoDocumento}: {r.numeroDocumento}
                          </span>
                          <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                            {r.correo}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Bien Contratado (Dedicado en pantallas 2xl+) */}
                    <TableCell className="px-4 hidden 2xl:table-cell">
                      <div className="flex flex-col max-w-[220px]">
                        <span className="font-semibold text-heading text-sm truncate" title={r.descripcionBien}>
                          {r.descripcionBien}
                        </span>
                        <span className="text-xs text-muted-foreground capitalize mt-0.5">
                          {r.bienContratado}{" "}
                          {r.montoReclamado !== null && (
                            <strong className="text-foreground font-semibold">
                              • {r.moneda || "PEN"} {Number(r.montoReclamado).toFixed(2)}
                            </strong>
                          )}
                        </span>
                      </div>
                    </TableCell>

                    {/* Tipo (Dedicado en 2xl+) */}
                    <TableCell className="px-4 hidden 2xl:table-cell whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={
                          esReclamo
                            ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 font-bold"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-bold"
                        }
                      >
                        {esReclamo ? "Reclamo" : "Queja"}
                      </Badge>
                    </TableCell>

                    {/* Plazo SLA */}
                    <TableCell className="px-4 whitespace-nowrap">
                      {esRespondido ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-3.5" />
                          <span>Atendido</span>
                        </span>
                      ) : sla.estado === "vencido" ? (
                        <Badge
                          variant="destructive"
                          className="font-bold gap-1 bg-rose-600 text-white"
                        >
                          <AlertCircle className="size-3" />
                          <span>Vencido hace {sla.dias}d</span>
                        </Badge>
                      ) : sla.estado === "por_vencer" ? (
                        <Badge
                          variant="outline"
                          className="font-bold gap-1 border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                        >
                          <Clock className="size-3" />
                          <span>Vence en {sla.dias}d</span>
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="font-semibold gap-1 border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        >
                          <span>{sla.dias}d restantes</span>
                        </Badge>
                      )}
                    </TableCell>

                    {/* Estado (Visible en pantallas xl+) */}
                    <TableCell className="px-4 hidden xl:table-cell whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={
                          esRespondido
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-bold"
                        }
                      >
                        {esRespondido ? "Respondido" : "Pendiente"}
                      </Badge>
                    </TableCell>

                    {/* Acciones Oficiales (Botones circulares con tooltips) */}
                    <TableCell className="px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botón Ver Detalle Hoja */}
                        <button
                          type="button"
                          onClick={() => {
                            setReclamoSeleccionado(r);
                            setModalDetalleAbierto(true);
                          }}
                          className="size-8 sm:size-9 rounded-full border border-slate-300 bg-slate-100 text-slate-700 shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 transition-colors inline-flex items-center justify-center cursor-pointer"
                          title="Ver Hoja de Reclamación completa"
                        >
                          <Eye className="size-4" />
                        </button>

                        {/* Botón Responder Reclamación */}
                        <button
                          type="button"
                          onClick={() => {
                            setReclamoSeleccionado(r);
                            if (esRespondido) {
                              setModalDetalleAbierto(true);
                            } else {
                              setModalResponderAbierto(true);
                            }
                          }}
                          className={cn(
                            "size-8 sm:size-9 rounded-full border shadow-xs transition-colors inline-flex items-center justify-center cursor-pointer",
                            !esRespondido
                              ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
                              : "border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                          )}
                          title={!esRespondido ? "Responder Reclamación formal" : "Ver respuesta oficial"}
                        >
                          <Send className="size-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* VISTA 2: TARJETAS EN CELULAR (< md) */}
        <div className="flex flex-col gap-3 p-3.5 sm:p-4 md:hidden">
          {itemsPaginados.map((r) => {
            const esReclamo = r.tipo === "reclamo";
            const esRespondido = r.estado === "respondido" || r.estado === "cerrado";
            const sla = calcularSla(r.fechaLimiteRespuesta, esRespondido);
            const cleanPhone = r.telefono?.replace(/[^0-9]/g, "");

            return (
              <div
                key={`mobile-${r.id}`}
                className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs"
              >
                {/* Fila Superior: N° Hoja + Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-heading text-sm font-mono tracking-tight">
                      {r.numero}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      {formatearFechaSimple(r.creadoEn)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge
                      variant="outline"
                      className={
                        esReclamo
                          ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 font-bold text-[10px]"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-bold text-[10px]"
                      }
                    >
                      {esReclamo ? "Reclamo" : "Queja"}
                    </Badge>

                    <Badge
                      variant="outline"
                      className={
                        esRespondido
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold text-[10px]"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-bold text-[10px]"
                      }
                    >
                      {esRespondido ? "Respondido" : "Pendiente"}
                    </Badge>
                  </div>
                </div>

                {/* Fila Central: Consumidor + Bien Contratado */}
                <div className="flex flex-col gap-2 border-y border-border/60 py-2.5 text-xs">
                  {/* Consumidor */}
                  <div className="space-y-0.5">
                    <span className="font-bold text-heading text-sm block">
                      {r.nombreCompleto}
                    </span>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span className="font-mono">{r.tipoDocumento}: {r.numeroDocumento}</span>
                      <span>•</span>
                      <span className="truncate max-w-[200px]">{r.correo}</span>
                    </div>
                    {r.telefono && cleanPhone && (
                      <div className="pt-1">
                        <a
                          href={`https://wa.me/${cleanPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        >
                          <WhatsappIcon className="size-3 text-emerald-600 dark:text-emerald-400" />
                          <span>{r.telefono}</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Bien Reclamado */}
                  <div className="rounded-xl bg-muted/40 dark:bg-slate-900/40 p-3 text-xs flex flex-col gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                        Bien Reclamado ({r.bienContratado}):
                      </span>
                      <p className="font-semibold text-heading text-xs leading-snug">
                        {r.descripcionBien}
                      </p>
                    </div>

                    {/* Fila con Monto a la izquierda y Semáforo SLA a la derecha */}
                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border/40">
                      <div>
                        {r.montoReclamado !== null ? (
                          <span className="font-bold text-foreground text-xs">
                            {r.moneda || "PEN"} {Number(r.montoReclamado).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">
                            Sin monto especificado
                          </span>
                        )}
                      </div>

                      {/* Semáforo SLA a la derecha */}
                      <div className="shrink-0">
                        {esRespondido ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-3.5" />
                            <span>Atendido</span>
                          </span>
                        ) : sla.estado === "vencido" ? (
                          <Badge
                            variant="destructive"
                            className="font-bold gap-1 bg-rose-600 text-white text-[11px]"
                          >
                            <AlertCircle className="size-3" />
                            <span>Vencido hace {sla.dias}d</span>
                          </Badge>
                        ) : sla.estado === "por_vencer" ? (
                          <Badge
                            variant="outline"
                            className="font-bold gap-1 border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[11px]"
                          >
                            <Clock className="size-3" />
                            <span>Vence en {sla.dias}d</span>
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="font-semibold gap-1 border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px]"
                          >
                            <span>{sla.dias}d restantes</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fila Inferior: Únicamente los 2 Botones de Acción */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReclamoSeleccionado(r);
                      setModalDetalleAbierto(true);
                    }}
                    className="w-full rounded-full h-9 text-xs font-semibold gap-1.5 border-border cursor-pointer"
                  >
                    <Eye className="size-3.5" />
                    <span>Ver Hoja</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setReclamoSeleccionado(r);
                      if (esRespondido) {
                        setModalDetalleAbierto(true);
                      } else {
                        setModalResponderAbierto(true);
                      }
                    }}
                    className={cn(
                      "w-full rounded-full h-9 text-xs font-bold gap-1.5 cursor-pointer shadow-xs",
                      !esRespondido
                        ? "bg-[#1e3a8a] hover:bg-[#152e6f] text-white"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    )}
                  >
                    <Send className="size-3.5" />
                    <span>{esRespondido ? "Ver respuesta" : "Responder"}</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </TablaContenedorCard>

      {/* Modales Oficiales */}
      <ModalDetalleReclamo
        reclamo={reclamoSeleccionado}
        abierto={modalDetalleAbierto}
        onOpenChange={setModalDetalleAbierto}
        onAbrirResponder={(rec) => {
          setReclamoSeleccionado(rec);
          setModalResponderAbierto(true);
        }}
      />

      <ModalResponderReclamo
        reclamo={reclamoSeleccionado}
        abierto={modalResponderAbierto}
        onOpenChange={setModalResponderAbierto}
        onRespuestaExitosa={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
