"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Check,
  Copy,
  Eye,
  FileText,
  Receipt,
  RotateCcw,
  Search,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-time-picker";
import { ModuloBanner } from "@/components/ui/modulo-banner";
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
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { type ComprobanteItem } from "@/server/comprobantes/acciones";
import { BotonExportarTablaExcel } from "@/components/admin/shared/boton-exportar-tabla-excel";

export interface TablaComprobantesProps {
  comprobantesIniciales: ComprobanteItem[];
}

const PERIODOS_FECHA = [
  { valor: "todas", etiqueta: "Todas las fechas" },
  { valor: "hoy", etiqueta: "Hoy" },
  { valor: "7dias", etiqueta: "Últimos 7 días" },
  { valor: "este_mes", etiqueta: "Este mes" },
  { valor: "mes_anterior", etiqueta: "Mes anterior" },
  { valor: "personalizado", etiqueta: "Personalizado" },
] as const;

export function TablaComprobantes({ comprobantesIniciales }: TablaComprobantesProps) {
  const [comprobantes, setComprobantes] = useState<ComprobanteItem[]>(comprobantesIniciales);

  useEffect(() => {
    setComprobantes(comprobantesIniciales);
  }, [comprobantesIniciales]);

  // Estados de búsqueda y filtros reactivos
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipoDoc, setFiltroTipoDoc] = useState<"todos" | "boleta" | "factura">("todos");
  const [filtroFecha, setFiltroFecha] = useState<string>("todas");
  const [fechaDesde, setFechaDesde] = useState<string>("");
  const [fechaHasta, setFechaHasta] = useState<string>("");

  // Validación de rango personalizado
  const rangoFechasInvalido = useMemo(() => {
    if (filtroFecha === "personalizado" && fechaDesde && fechaHasta) {
      return fechaHasta < fechaDesde;
    }
    return false;
  }, [filtroFecha, fechaDesde, fechaHasta]);

  const handleFechaDesdeChange = (nuevaFecha: string) => {
    setFechaDesde(nuevaFecha);
    if (filtroFecha === "personalizado" && nuevaFecha && fechaHasta && fechaHasta < nuevaFecha) {
      toast.error("El rango de fechas es inválido: la fecha final no puede ser anterior a la inicial.");
    }
  };

  const handleFechaHastaChange = (nuevaFecha: string) => {
    setFechaHasta(nuevaFecha);
    if (filtroFecha === "personalizado" && fechaDesde && nuevaFecha && nuevaFecha < fechaDesde) {
      toast.error("El rango de fechas es inválido: la fecha final no puede ser anterior a la inicial.");
    }
  };

  // Estado para copiar códigos al portapapeles
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Modal de Detalle Horizontal
  const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState<ComprobanteItem | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  // Conteos dinámicos para las píldoras de tipo de documento
  const conteos = useMemo(() => {
    let todos = comprobantes.length;
    let boletas = 0;
    let facturas = 0;

    for (const c of comprobantes) {
      if (c.tipo_documento === "factura") facturas++;
      else boletas++;
    }

    return { todos, boletas, facturas };
  }, [comprobantes]);

  // Rangos de fecha reactivos
  const { fechaInicioFiltro, fechaFinFiltro } = useMemo(() => {
    const ahora = new Date();
    if (filtroFecha === "hoy") {
      const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0);
      const fin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);
      return { fechaInicioFiltro: inicio, fechaFinFiltro: fin };
    }
    if (filtroFecha === "7dias") {
      const inicio = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
      inicio.setHours(0, 0, 0, 0);
      const fin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);
      return { fechaInicioFiltro: inicio, fechaFinFiltro: fin };
    }
    if (filtroFecha === "este_mes") {
      const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0, 0);
      const fin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);
      return { fechaInicioFiltro: inicio, fechaFinFiltro: fin };
    }
    if (filtroFecha === "mes_anterior") {
      const inicio = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1, 0, 0, 0, 0);
      const fin = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59, 999);
      return { fechaInicioFiltro: inicio, fechaFinFiltro: fin };
    }
    if (filtroFecha === "personalizado") {
      if (rangoFechasInvalido) {
        return { fechaInicioFiltro: null, fechaFinFiltro: null };
      }
      let inicio: Date | null = null;
      let fin: Date | null = null;
      if (fechaDesde) {
        const [y, m, d] = fechaDesde.split("-").map(Number);
        inicio = new Date(y, m - 1, d, 0, 0, 0, 0);
      }
      if (fechaHasta) {
        const [y, m, d] = fechaHasta.split("-").map(Number);
        fin = new Date(y, m - 1, d, 23, 59, 59, 999);
      }
      return { fechaInicioFiltro: inicio, fechaFinFiltro: fin };
    }
    return { fechaInicioFiltro: null, fechaFinFiltro: null };
  }, [filtroFecha, fechaDesde, fechaHasta, rangoFechasInvalido]);

  // Filtrado reactivo en memoria
  const comprobantesFiltrados = useMemo(() => {
    return comprobantes.filter((c) => {
      // 1. Búsqueda de texto libre
      if (busqueda.trim() !== "") {
        const q = busqueda.toLowerCase().trim();
        const numComp = c.numero_completo.toLowerCase();
        const numOrd = (c.ordenes?.numero_orden || "").toLowerCase();
        const clienteNom = c.cliente_nombre.toLowerCase();
        const docNum = (c.cliente_numero_doc || "").toLowerCase();
        const itemsText =
          c.ordenes?.orden_items?.map((i) => i.descripcion.toLowerCase()).join(" ") ?? "";

        const coincide =
          numComp.includes(q) ||
          numOrd.includes(q) ||
          clienteNom.includes(q) ||
          docNum.includes(q) ||
          itemsText.includes(q);

        if (!coincide) return false;
      }

      // 2. Filtro por tipo de documento (Píldoras fila 1)
      if (filtroTipoDoc !== "todos") {
        if (c.tipo_documento !== filtroTipoDoc) return false;
      }

      // 3. Filtro por rango de fechas (Píldoras fila 2)
      if (fechaInicioFiltro || fechaFinFiltro) {
        const fechaComp = new Date(c.emitido_en);
        if (fechaInicioFiltro && fechaComp < fechaInicioFiltro) return false;
        if (fechaFinFiltro && fechaComp > fechaFinFiltro) return false;
      }

      return true;
    });
  }, [comprobantes, busqueda, filtroTipoDoc, fechaInicioFiltro, fechaFinFiltro]);

  const hayFiltrosActivos =
    busqueda.trim() !== "" ||
    filtroTipoDoc !== "todos" ||
    filtroFecha !== "todas" ||
    fechaDesde !== "" ||
    fechaHasta !== "";

  const handleLimpiarFiltros = () => {
    setBusqueda("");
    setFiltroTipoDoc("todos");
    setFiltroFecha("todas");
    setFechaDesde("");
    setFechaHasta("");
  };

  const handleVerDetalle = (c: ComprobanteItem) => {
    setComprobanteSeleccionado(c);
    setModalAbierto(true);
  };

  const handleCopiarNumero = (num: string, id: string) => {
    void navigator.clipboard.writeText(num);
    setCopiadoId(id);
    toast.success("N° de comprobante copiado al portapapeles");
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const formatearFechaCorta = (fechaIso: string) => {
    try {
      return new Date(fechaIso).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return fechaIso;
    }
  };

  const formatearHora = (fechaIso: string) => {
    try {
      return new Date(fechaIso).toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const formatearFechaLarga = (fechaIso: string) => {
    try {
      return new Date(fechaIso).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return fechaIso;
    }
  };

  return (
    <div className="flex w-full flex-col gap-6 p-6 sm:p-8">
      {/* 1. Banner Principal Unificado */}
      <ModuloBanner
        titulo="Comprobantes de Pago"
        descripcion="Emisión y control contable de boletas internas (Serie B001) para cursos y talleres."
        icono={Receipt}
      />

      {/* 2. Barra de Filtros y Búsqueda — Estilo Oficial Unificado (Idéntico a Certificados) */}
      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-5 px-5 py-5 sm:px-6">
          {/* Fila 1: Buscador + Píldoras de Tipo de Documento con Conteos */}
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
                placeholder="Buscar por N° comprobante, orden, DNI o cliente…"
                aria-label="Buscar comprobantes"
                className="h-10 rounded-xl border-border bg-card pr-3 pl-9 text-sm"
              />
            </div>

            <div
              role="group"
              aria-label="Filtrar por tipo de comprobante"
              className="flex flex-wrap items-center gap-2"
            >
              {(
                [
                  { id: "todos", label: "Todos", conteo: conteos.todos },
                  { id: "boleta", label: "Boletas", conteo: conteos.boletas },
                  { id: "factura", label: "Facturas", conteo: conteos.facturas },
                ] as const
              ).map((filtro) => {
                const activo = filtroTipoDoc === filtro.id;
                return (
                  <button
                    key={filtro.id}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => setFiltroTipoDoc(filtro.id)}
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

          {/* Fila 2: Píldoras de Período de Fecha + Rango Personalizado + Limpiar */}
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
                      className={cn(
                        rangoFechasInvalido && "border-destructive focus-visible:ring-destructive/30"
                      )}
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
                      className={cn(
                        rangoFechasInvalido && "border-destructive focus-visible:ring-destructive/30"
                      )}
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
                className="h-10 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <RotateCcw className="mr-1.5 size-3.5" />
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 3. Tabla y Tarjetas de Comprobantes (Zero scroll horizontal en Laptop y Móvil) */}
      <Card className="gap-0 py-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-heading">Comprobantes de Pago</h2>
            <span
              aria-live="polite"
              className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium tabular-nums"
            >
              Mostrando {comprobantesFiltrados.length} de {comprobantes.length}
            </span>
          </div>

          <BotonExportarTablaExcel
            nombreArchivo="comprobantes-amorelo"
            titulo="AMORELO — REGISTRO DE COMPROBANTES DE VENTA (SERIE B001)"
            subtitulo={`Reporte Contable de Ventas • Exportado el ${new Date().toLocaleDateString("es-PE")}`}
            nombreHoja="Comprobantes B001"
            totalFiltrados={comprobantesFiltrados.length}
            columnas={[
              { header: "N° Comprobante", key: "numero_completo", width: 16, align: "center" },
              { header: "Fecha Emisión", key: "fecha", width: 18, align: "center" },
              { header: "N° Orden", key: "orden", width: 14, align: "center" },
              { header: "Canal", key: "canal", width: 14, align: "center" },
              { header: "Tipo Doc", key: "tipo_doc", width: 11, align: "center" },
              { header: "N° Documento", key: "num_doc", width: 15, align: "center" },
              { header: "Cliente", key: "cliente", width: 28, align: "left" },
              { header: "Concepto / Detalle", key: "concepto", width: 34, align: "left" },
              { header: "Moneda", key: "moneda", width: 10, align: "center" },
              { header: "Subtotal", key: "subtotal", width: 14, isCurrency: true },
              { header: "I.G.V.", key: "igv", width: 12, isCurrency: true },
              { header: "Total", key: "total", width: 14, isCurrency: true },
              { header: "Estado", key: "estado", width: 18, align: "center" },
            ]}
            obtenerFilas={() =>
              comprobantesFiltrados.map((c) => ({
                numero_completo: c.numero_completo,
                fecha: formatearFechaCorta(c.emitido_en),
                orden: c.ordenes?.numero_orden ? `#${c.ordenes.numero_orden}` : "-",
                canal: c.ordenes?.canal === "whatsapp" ? "WhatsApp" : "Web / MP",
                tipo_doc: c.cliente_tipo_doc || "DNI",
                num_doc: c.cliente_numero_doc || "-",
                cliente: c.cliente_nombre,
                concepto: c.ordenes?.orden_items?.map((i) => i.descripcion).join(", ") || "Curso / Taller",
                moneda: c.moneda,
                subtotal: c.subtotal || c.total,
                igv: 0,
                total: c.total,
                estado: "Control Interno (B001)",
              }))
            }
            obtenerTotal={(filas) => {
              const suma = filas.reduce((acc, f) => acc + Number(f.total || 0), 0);
              return {
                label: "TOTALES",
                labelColSpan: 9,
                valores: {
                  subtotal: suma,
                  igv: 0,
                  total: suma,
                },
              };
            }}
          />
        </div>

        {comprobantesFiltrados.length === 0 ? (
          <div className="flex h-36 flex-col items-center justify-center gap-1.5 p-6 text-center text-muted-foreground">
            <Receipt className="size-8 opacity-40" />
            <p className="text-sm font-medium">No se encontraron comprobantes con los filtros seleccionados.</p>
          </div>
        ) : (
          <>
            {/* VISTA 1: ESCRITORIO Y LAPTOPS (Tabla inteligente sin scroll horizontal) */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-5">N° Comprobante</TableHead>
                    <TableHead className="px-4">Fecha Emisión</TableHead>
                    {/* N° Orden: Columna dedicada en monitores grandes (2xl), integrada en N° Comprobante en laptops */}
                    <TableHead className="px-4 hidden 2xl:table-cell">N° Orden</TableHead>
                    <TableHead className="px-4">Cliente</TableHead>
                    {/* Concepto: Oculto en laptops (< xl) para no generar scroll horizontal */}
                    <TableHead className="px-4 hidden xl:table-cell">Concepto</TableHead>
                    <TableHead className="px-4">Total</TableHead>
                    {/* Estado: Oculto en laptops (< 2xl) */}
                    <TableHead className="px-4 hidden 2xl:table-cell">Estado</TableHead>
                    {/* Acciones: Siempre visible en PC, Laptop y Móvil */}
                    <TableHead className="px-5 text-right w-[140px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comprobantesFiltrados.map((c) => {
                    const primerItem = c.ordenes?.orden_items?.[0];
                    const totalItems = c.ordenes?.orden_items?.length || 0;
                    const simboloMoneda = c.moneda === "USD" ? "$" : "S/";

                    return (
                      <TableRow key={c.id}>
                        {/* N° Comprobante + Tipo + N° Orden en Laptops */}
                        <TableCell className="px-5">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-heading text-sm">
                                {c.numero_completo}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopiarNumero(c.numero_completo, c.id)}
                                className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                                title="Copiar número de comprobante"
                              >
                                {copiadoId === c.id ? (
                                  <Check className="size-3 text-emerald-600" />
                                ) : (
                                  <Copy className="size-3" />
                                )}
                              </button>
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className="text-[10px] py-0 px-1.5 font-bold uppercase border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                              >
                                {c.tipo_documento}
                              </Badge>

                              {/* En Laptop (< 2xl), el N° de orden se muestra aquí debajo para ahorrar columna */}
                              {c.ordenes?.numero_orden ? (
                                <span className="2xl:hidden font-mono text-[11px] text-muted-foreground font-semibold">
                                  #{c.ordenes.numero_orden}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>

                        {/* Fecha Emisión */}
                        <TableCell className="px-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-semibold text-heading text-xs sm:text-sm">
                              {formatearFechaCorta(c.emitido_en)}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {formatearHora(c.emitido_en)}
                            </span>
                          </div>
                        </TableCell>

                        {/* N° Orden (Visible solo en Monitores Grandes 2xl+) */}
                        <TableCell className="px-4 hidden 2xl:table-cell font-mono text-xs font-semibold text-heading">
                          #{c.ordenes?.numero_orden || "-"}
                        </TableCell>

                        {/* Cliente / Documento */}
                        <TableCell className="px-4">
                          <div className="flex flex-col max-w-[210px]">
                            <span
                              className="font-bold text-heading text-xs sm:text-sm truncate"
                              title={c.cliente_nombre}
                            >
                              {c.cliente_nombre}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {c.cliente_tipo_doc || "DOC"}: {c.cliente_numero_doc || "Sin doc"}
                            </span>
                          </div>
                        </TableCell>

                        {/* Concepto / Ítems (Visible en pantallas xl+) */}
                        <TableCell className="px-4 hidden xl:table-cell max-w-[240px]">
                          <div className="flex flex-col">
                            <span
                              className="font-medium text-heading text-xs truncate"
                              title={primerItem?.descripcion || "Servicio Educativo"}
                            >
                              {primerItem?.descripcion || "Servicio Educativo"}
                            </span>
                            {totalItems > 1 && (
                              <span className="text-[10px] text-muted-foreground font-semibold">
                                +{totalItems - 1} ítem(s) más
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Total */}
                        <TableCell className="px-4 whitespace-nowrap font-bold text-heading text-sm">
                          {simboloMoneda} {Number(c.total || 0).toFixed(2)}
                        </TableCell>

                        {/* Estado (Visible en pantallas 2xl+) */}
                        <TableCell className="px-4 hidden 2xl:table-cell whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold text-[11px]"
                          >
                            Control Interno
                          </Badge>
                        </TableCell>

                        {/* Acciones: Exactamente las 3 requeridas, siempre visibles */}
                        <TableCell className="px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* 1. Ver Boleta A4 en PDF */}
                            <Button
                              variant="outline"
                              size="icon"
                              nativeButton={false}
                              render={
                                <a
                                  href={`/api/comprobantes/${c.id}/pdf`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="size-8 sm:size-9 rounded-full border border-slate-300 bg-slate-100 text-slate-700 shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 transition-colors inline-flex items-center justify-center cursor-pointer"
                                  title="Ver Boleta Oficial en A4 (PDF)"
                                >
                                  <FileText className="size-4" />
                                </a>
                              }
                            />

                            {/* 2. Ver Formato Ticket 80mm */}
                            <Button
                              variant="outline"
                              size="icon"
                              nativeButton={false}
                              render={
                                <a
                                  href={`/api/comprobantes/${c.id}/pdf?formato=ticket`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="size-8 sm:size-9 rounded-full border border-slate-300 bg-slate-100 text-slate-700 shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 transition-colors inline-flex items-center justify-center cursor-pointer"
                                  title="Ver Formato Ticket Térmico (80mm)"
                                >
                                  <Receipt className="size-4" />
                                </a>
                              }
                            />

                            {/* 3. Ver Información Detallada (Modal Ancho) */}
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleVerDetalle(c)}
                              className="size-8 sm:size-9 rounded-full border border-slate-300 bg-slate-100 text-slate-700 shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                              title="Ver información detallada"
                            >
                              <Eye className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* VISTA 2: CELULAR (Tarjetas responsivas verticales sin scroll horizontal) */}
            <div className="flex flex-col gap-3 p-4 md:hidden border-t">
              {comprobantesFiltrados.map((c) => {
                const primerItem = c.ordenes?.orden_items?.[0];
                const totalItems = c.ordenes?.orden_items?.length || 0;
                const simboloMoneda = c.moneda === "USD" ? "$" : "S/";

                return (
                  <div
                    key={c.id}
                    className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs"
                  >
                    {/* Fila 1: N° Comprobante + Tipo + Total */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-sm font-bold text-heading">
                            {c.numero_completo}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 px-1.5 font-bold uppercase border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                          >
                            {c.tipo_documento}
                          </Badge>
                        </div>
                        {c.ordenes?.numero_orden ? (
                          <span className="font-mono text-[11px] text-muted-foreground mt-0.5">
                            Orden #{c.ordenes.numero_orden}
                          </span>
                        ) : null}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-heading tabular-nums">
                          {simboloMoneda} {Number(c.total || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Fila 2: Cliente + Concepto */}
                    <div className="flex flex-col gap-1 border-y border-border/60 py-2.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-bold text-heading truncate">
                          {c.cliente_nombre}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                          {c.cliente_tipo_doc || "DOC"}: {c.cliente_numero_doc || "-"}
                        </span>
                      </div>

                      {primerItem?.descripcion && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs text-muted-foreground line-clamp-1 truncate">
                            {primerItem.descripcion}
                            {totalItems > 1 && ` (+${totalItems - 1} más)`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Fila 3: Fecha + Las 3 Acciones Visibles */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {formatearFechaCorta(c.emitido_en)} • {formatearHora(c.emitido_en)}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* 1. Ver Boleta A4 */}
                        <a
                          href={`/api/comprobantes/${c.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="size-8 rounded-full border border-slate-300 bg-slate-100 text-slate-700 shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 transition-colors inline-flex items-center justify-center cursor-pointer"
                          title="Ver Boleta Oficial en A4"
                        >
                          <FileText className="size-3.5" />
                        </a>

                        {/* 2. Ver Formato Ticket */}
                        <a
                          href={`/api/comprobantes/${c.id}/pdf?formato=ticket`}
                          target="_blank"
                          rel="noreferrer"
                          className="size-8 rounded-full border border-slate-300 bg-slate-100 text-slate-700 shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 transition-colors inline-flex items-center justify-center cursor-pointer"
                          title="Ver Ticket (80mm)"
                        >
                          <Receipt className="size-3.5" />
                        </a>

                        {/* 3. Ver Información Detallada */}
                        <button
                          type="button"
                          onClick={() => handleVerDetalle(c)}
                          className="size-8 rounded-full border border-slate-300 bg-slate-100 text-slate-700 shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 transition-colors inline-flex items-center justify-center cursor-pointer"
                          title="Ver Detalle"
                        >
                          <Eye className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {/* 4. Modal Detalle de Comprobante: Horizontal Ancho en Desktop, Adaptativo en Celular */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="w-[96vw] max-w-4xl xl:max-w-5xl rounded-3xl p-0 gap-0 overflow-hidden flex flex-col h-[90vh] lg:h-auto lg:max-h-[88vh] bg-card border-border shadow-2xl">
          {/* Cabecera Fija */}
          <DialogHeader className="shrink-0 border-b border-border px-6 py-4 sm:py-5 bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 pr-10">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary dark:text-blue-400 mb-1">
                  <Receipt className="size-4" />
                  <span>Detalle de Comprobante de Venta</span>
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-black text-heading tracking-tight flex items-center gap-2">
                  <span>{comprobanteSeleccionado?.numero_completo}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Constancia administrativa interna vinculada a la orden #{comprobanteSeleccionado?.ordenes?.numero_orden || "-"}
                </DialogDescription>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 font-bold uppercase text-xs px-3 py-1"
                >
                  {comprobanteSeleccionado?.tipo_documento}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold text-xs px-3 py-1"
                >
                  Control Interno
                </Badge>
              </div>
            </div>
          </DialogHeader>

          {/* Cuerpo en 2 Columnas: Scrolleable en Mobile (< lg), CERO scroll en Desktop (lg) */}
          <div className="flex-1 overflow-y-auto lg:overflow-visible grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 sm:p-6 bg-card">
            {/* Columna Izquierda (6 columnas): Datos del Cliente + Datos de Emisión */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              {/* Bloque Cliente */}
              <div className="rounded-2xl border border-border/80 bg-muted/20 dark:bg-slate-900/40 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary dark:text-blue-400 flex items-center gap-1.5">
                    <User className="size-3.5" />
                    <span>Datos del Cliente</span>
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {comprobanteSeleccionado?.cliente_tipo_doc || "DOC"}: <strong>{comprobanteSeleccionado?.cliente_numero_doc || "-"}</strong>
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Nombre o Razón Social:</span>
                    <strong className="text-foreground text-sm font-bold">{comprobanteSeleccionado?.cliente_nombre}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Documento de Identidad:</span>
                    <span className="font-mono text-foreground">
                      {comprobanteSeleccionado?.cliente_tipo_doc || "DOC"}: {comprobanteSeleccionado?.cliente_numero_doc || "Sin número registrado"}
                    </span>
                  </div>
                  {comprobanteSeleccionado?.cliente_direccion ? (
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Dirección Fiscal:</span>
                      <span className="text-foreground">{comprobanteSeleccionado.cliente_direccion}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Bloque Datos de la Transacción / Orden */}
              <div className="rounded-2xl border border-border/80 bg-muted/20 dark:bg-slate-900/40 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary dark:text-blue-400 flex items-center gap-1.5">
                    <FileText className="size-3.5" />
                    <span>Datos de la Transacción</span>
                  </span>
                  <span className="text-[11px] font-mono font-bold text-foreground">
                    Orden #{comprobanteSeleccionado?.ordenes?.numero_orden || "-"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Fecha de Emisión:</span>
                    <strong className="text-foreground font-semibold">
                      {comprobanteSeleccionado ? formatearFechaLarga(comprobanteSeleccionado.emitido_en) : "-"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Canal de Venta:</span>
                    <span className="capitalize font-semibold text-foreground">
                      {comprobanteSeleccionado?.ordenes?.canal === "whatsapp" ? "WhatsApp / Yape" : "Web / Mercado Pago"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Serie / Régimen:</span>
                    <span className="font-mono font-bold text-foreground">Serie B001</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Moneda:</span>
                    <span className="font-bold text-foreground">{comprobanteSeleccionado?.moneda || "PEN"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha (6 columnas): Conceptos Facturados + Liquidación */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="rounded-2xl border border-border/80 bg-muted/20 dark:bg-slate-900/40 p-4 flex flex-col flex-1">
                <span className="text-xs font-bold uppercase tracking-wider text-primary dark:text-blue-400 border-b border-border/60 pb-2 mb-3">
                  Conceptos / Ítems Facturados
                </span>

                <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                  {comprobanteSeleccionado?.ordenes?.orden_items?.length ? (
                    comprobanteSeleccionado.ordenes.orden_items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1.5 border-b border-border/40 last:border-none"
                      >
                        <div className="flex flex-col max-w-[240px]">
                          <span className="font-semibold text-heading truncate">{item.descripcion}</span>
                          <span className="text-[10px] text-muted-foreground">
                            Cant: {item.cantidad} × S/ {Number(item.precio_unitario || 0).toFixed(2)}
                          </span>
                        </div>
                        <span className="font-bold text-heading font-mono">
                          S/ {Number(item.subtotal || 0).toFixed(2)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground italic py-3 text-center">
                      Servicio Educativo de Pastelería y Repostería
                    </div>
                  )}
                </div>

                {/* Liquidación Contable */}
                <div className="mt-auto pt-4 border-t border-border/60 space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Operaciones Gravadas / Exoneradas:</span>
                    <span className="font-mono">
                      {comprobanteSeleccionado?.moneda === "USD" ? "$" : "S/"}{" "}
                      {Number(comprobanteSeleccionado?.subtotal || comprobanteSeleccionado?.total || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>I.G.V. (18% - Ley de Fomento):</span>
                    <span className="font-mono">S/ 0.00</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-border/60 text-sm font-bold text-heading">
                    <span>Importe Total:</span>
                    <span className="text-base text-primary dark:text-blue-400 font-mono">
                      {comprobanteSeleccionado?.moneda === "USD" ? "$" : "S/"}{" "}
                      {Number(comprobanteSeleccionado?.total || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pie Fijo con Botones Directos */}
          <DialogFooter className="shrink-0 border-t border-border px-6 py-3.5 bg-card flex-row items-center justify-between sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalAbierto(false)}
              className="rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cerrar
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                nativeButton={false}
                render={
                  <a
                    href={`/api/comprobantes/${comprobanteSeleccionado?.id}/pdf?formato=ticket`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <Receipt className="size-3.5" />
                    <span>Ticket (80mm)</span>
                  </a>
                }
              />

              <Button
                type="button"
                nativeButton={false}
                render={
                  <a
                    href={`/api/comprobantes/${comprobanteSeleccionado?.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
                  >
                    <FileText className="size-3.5" />
                    <span>Boleta A4 (PDF)</span>
                  </a>
                }
              />
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
