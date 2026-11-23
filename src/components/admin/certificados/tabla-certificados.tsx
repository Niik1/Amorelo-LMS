// Tabla interactiva de gestión de Certificados Oficiales en Panel Admin.
// Respeta el sistema de diseño oficial de Amorelo (Cards, Badges, Tables, Dialogs).

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Award,
  Check,
  Copy,
  Download,
  ExternalLink,
  GraduationCap,
  Pencil,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-time-picker";
import { ModuloBanner } from "@/components/ui/modulo-banner";
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
import {
  type ItemCertificadoAdmin,
  type MetricasCertificados,
  type TallerConAsistentes,
} from "@/server/certificados/acciones-admin";
import { ModalRectificarCertificado } from "./modal-rectificar-certificado";
import { ModalEmitirTaller } from "./modal-emitir-taller";
import { BotonExportarTablaExcel } from "@/components/admin/shared/boton-exportar-tabla-excel";

export interface ItemOpcion {
  id: string;
  nombre: string;
}

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

interface TablaCertificadosProps {
  certificadosIniciales: ItemCertificadoAdmin[];
  metricasIniciales?: MetricasCertificados;
  talleres: TallerConAsistentes[];
  cursosDisponibles?: ItemOpcion[];
  busquedaInicial?: string;
}

export function TablaCertificados({
  certificadosIniciales,
  talleres,
  cursosDisponibles = [],
  busquedaInicial = "",
}: TablaCertificadosProps) {
  const router = useRouter();

  // Estados de búsqueda y filtros
  const [busqueda, setBusqueda] = useState(busquedaInicial);
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "emitido" | "anulado">("todos");
  const [filtroCurso, setFiltroCurso] = useState<string>("todos");
  const [filtroTaller, setFiltroTaller] = useState<string>("todos");
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

  // Estado para copiar códigos al portapapeles
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Estados de los modales
  const [certParaRectificar, setCertParaRectificar] = useState<ItemCertificadoAdmin | null>(null);
  const [modalRectificarAbierto, setModalRectificarAbierto] = useState(false);
  const [modalEmitirTallerAbierto, setModalEmitirTallerAbierto] = useState(false);

  // Conteos para las píldoras de la Fila 1
  const conteos = useMemo(() => {
    let todos = certificadosIniciales.length;
    let emitidos = 0;
    let anulados = 0;

    for (const c of certificadosIniciales) {
      if (c.estado === "vigente" || c.estado === "emitido") emitidos++;
      else if (c.estado === "anulado") anulados++;
    }

    return { todos, emitidos, anulados };
  }, [certificadosIniciales]);

  // Lista unificada de Cursos Online para el dropdown
  const opcionesCursos = useMemo(() => {
    const mapa = new Map<string, string>();
    cursosDisponibles.forEach((cur) => {
      mapa.set(cur.nombre.trim(), cur.nombre.trim());
    });
    certificadosIniciales.forEach((cert) => {
      if (cert.tipo === "finalizacion" && cert.tituloPrograma?.trim()) {
        mapa.set(cert.tituloPrograma.trim(), cert.tituloPrograma.trim());
      }
    });

    const lista = Array.from(mapa.values())
      .sort((a, b) => a.localeCompare(b))
      .map((nombre) => ({
        valor: nombre,
        etiqueta: nombre,
      }));

    return [{ valor: "todos", etiqueta: "Todos los cursos" }, ...lista];
  }, [cursosDisponibles, certificadosIniciales]);

  // Lista unificada de Talleres Presenciales para el dropdown
  const opcionesTalleres = useMemo(() => {
    const mapa = new Map<string, string>();
    talleres.forEach((t) => {
      mapa.set(t.nombre.trim(), t.nombre.trim());
    });
    certificadosIniciales.forEach((cert) => {
      if (cert.tipo === "participacion" && cert.tituloPrograma?.trim()) {
        mapa.set(cert.tituloPrograma.trim(), cert.tituloPrograma.trim());
      }
    });

    const lista = Array.from(mapa.values())
      .sort((a, b) => a.localeCompare(b))
      .map((nombre) => ({
        valor: nombre,
        etiqueta: nombre,
      }));

    return [{ valor: "todos", etiqueta: "Todos los talleres" }, ...lista];
  }, [talleres, certificadosIniciales]);

  const handleCambioCurso = (nuevo: string) => {
    setFiltroCurso(nuevo);
    if (nuevo !== "todos") {
      setFiltroTaller("todos");
    }
  };

  const handleCambioTaller = (nuevo: string) => {
    setFiltroTaller(nuevo);
    if (nuevo !== "todos") {
      setFiltroCurso("todos");
    }
  };

  const hayFiltrosActivos =
    busqueda.trim() !== "" ||
    filtroEstado !== "todos" ||
    filtroCurso !== "todos" ||
    filtroTaller !== "todos" ||
    filtroFecha !== "todas" ||
    fechaDesde !== "" ||
    fechaHasta !== "";

  const handleLimpiarFiltros = () => {
    setBusqueda("");
    setFiltroEstado("todos");
    setFiltroCurso("todos");
    setFiltroTaller("todos");
    setFiltroFecha("todas");
    setFechaDesde("");
    setFechaHasta("");
  };

  // Filtrado reactivo en cliente
  const certificadosFiltrados = useMemo(() => {
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

    return certificadosIniciales.filter((c) => {
      // Filtro texto: Alumno, Documento, Programa o Código
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase().trim();
        const coincideAlumno = c.nombreAlumno.toLowerCase().includes(query);
        const coincideDoc = c.documentoAlumno?.toLowerCase().includes(query);
        const coincidePrograma = c.tituloPrograma.toLowerCase().includes(query);
        const coincideCodigo = c.codigoVerificacion.toLowerCase().replace(/-/g, "").includes(query.replace(/-/g, ""));
        if (!coincideAlumno && !coincideDoc && !coincidePrograma && !coincideCodigo) {
          return false;
        }
      }

      // Filtro estado (Píldoras fila 1)
      if (filtroEstado === "emitido" && c.estado !== "vigente" && c.estado !== "emitido") {
        return false;
      }
      if (filtroEstado === "anulado" && c.estado !== "anulado") {
        return false;
      }

      // Filtro Cursos Online (Fila 2)
      if (filtroCurso !== "todos") {
        if (c.tipo !== "finalizacion") return false;
        if (c.tituloPrograma.trim().toLowerCase() !== filtroCurso.trim().toLowerCase()) {
          return false;
        }
      }

      // Filtro Talleres Presenciales (Fila 2)
      if (filtroTaller !== "todos") {
        if (c.tipo !== "participacion") return false;
        if (c.tituloPrograma.trim().toLowerCase() !== filtroTaller.trim().toLowerCase()) {
          return false;
        }
      }

      // Filtro Fecha (Fila 3)
      if (fechaInicioFiltro || fechaFinFiltro) {
        const fechaCert = new Date(c.emitidoEn || c.fechaReferencia);
        if (fechaInicioFiltro && fechaCert < fechaInicioFiltro) return false;
        if (fechaFinFiltro && fechaCert > fechaFinFiltro) return false;
      }

      return true;
    });
  }, [
    certificadosIniciales,
    busqueda,
    filtroEstado,
    filtroCurso,
    filtroTaller,
    filtroFecha,
    fechaDesde,
    fechaHasta,
    rangoFechasInvalido,
  ]);

  const handleCopiarCodigo = (codigo: string, id: string) => {
    void navigator.clipboard.writeText(codigo);
    setCopiadoId(id);
    toast.success("Código copiado al portapapeles");
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const handleAbrirRectificar = (c: ItemCertificadoAdmin) => {
    setCertParaRectificar(c);
    setModalRectificarAbierto(true);
  };

  const pendientesTalleresTotal = useMemo(() => {
    return talleres.reduce((acc, t) => acc + t.pendientesEmision, 0);
  }, [talleres]);

  return (
    <div className="flex w-full flex-col gap-6 p-6 sm:p-8">
      {/* Banner Principal Unificado */}
      <ModuloBanner
        titulo="Certificados Oficiales"
        descripcion="Gestión, emisión y rectificación de acreditaciones para Cursos Virtuales y Talleres Presenciales."
        icono={Award}
        acciones={
          <Button
            type="button"
            onClick={() => setModalEmitirTallerAbierto(true)}
            className="rounded-full bg-white font-bold text-[#1e3a8a] shadow-sm hover:bg-slate-100 cursor-pointer"
          >
            <Sparkles className="mr-1.5 size-4" />
            <span>Emitir Certificados de Taller</span>
            {pendientesTalleresTotal > 0 ? (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-amber-400 text-slate-900 rounded-full font-black">
                {pendientesTalleresTotal}
              </span>
            ) : null}
          </Button>
        }
      />

      {/* Barra de Filtros y Búsqueda — Estilo idéntico a Órdenes */}
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
                placeholder="Buscar por alumno, DNI, programa o código…"
                aria-label="Buscar certificados"
                className="h-10 rounded-xl border-border bg-card pr-3 pl-9 text-sm"
              />
            </div>

            <div
              role="group"
              aria-label="Filtrar por estado del certificado"
              className="flex flex-wrap items-center gap-2"
            >
              {(
                [
                  { id: "todos", label: "Todos", conteo: conteos.todos },
                  { id: "emitido", label: "Vigentes", conteo: conteos.emitidos },
                  { id: "anulado", label: "Rectificados / Anulados", conteo: conteos.anulados },
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

          {/* Fila 2: Cursos Online y Talleres Presenciales */}
          <div className="flex flex-wrap items-end gap-3 border-t pt-4">
            <CampoSelect
              id="filtro-curso"
              etiqueta="Cursos Online"
              valor={filtroCurso}
              opciones={opcionesCursos}
              className="w-full sm:w-72 lg:w-80"
              onCambio={handleCambioCurso}
            />

            <CampoSelect
              id="filtro-taller"
              etiqueta="Talleres Presenciales"
              valor={filtroTaller}
              opciones={opcionesTalleres}
              className="w-full sm:w-72 lg:w-80"
              onCambio={handleCambioTaller}
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
                className="h-10 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <RotateCcw className="mr-1.5 size-3.5" />
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Tabla Oficial de Certificados — Idéntica al módulo de Alumnos y Matrículas */}
      <Card className="gap-0 py-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-heading">Certificados</h2>
            <span
              aria-live="polite"
              className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium tabular-nums"
            >
              Mostrando {certificadosFiltrados.length} de {certificadosIniciales.length}
            </span>
          </div>

          <BotonExportarTablaExcel
            nombreArchivo="certificados-amorelo"
            titulo="AMORELO — REGISTRO OFICIAL DE CERTIFICADOS EMITIDOS"
            subtitulo={`Acreditaciones Académicas y Participaciones • Exportado el ${new Date().toLocaleDateString("es-PE")}`}
            nombreHoja="Certificados"
            totalFiltrados={certificadosFiltrados.length}
            columnas={[
              { header: "Código Verificación", key: "codigo", width: 20, align: "center" },
              { header: "Alumno / Estudiante", key: "alumno", width: 28, align: "left" },
              { header: "Documento", key: "documento", width: 16, align: "center" },
              { header: "Correo Electrónico", key: "correo", width: 28, align: "left" },
              { header: "Programa / Especialidad", key: "programa", width: 34, align: "left" },
              { header: "Modalidad", key: "tipo", width: 20, align: "center" },
              { header: "Horas Académicas", key: "horas", width: 16, align: "center" },
              { header: "Fecha Emisión", key: "fecha_emision", width: 16, align: "center" },
              { header: "Estado", key: "estado", width: 16, align: "center" },
            ]}
            obtenerFilas={() =>
              certificadosFiltrados.map((c) => ({
                codigo: c.codigoVerificacion,
                alumno: c.nombreAlumno,
                documento: c.documentoAlumno || "-",
                correo: c.correoAlumno || "-",
                programa: c.tituloPrograma,
                tipo: c.tipo === "finalizacion" ? "Curso Virtual" : "Taller Presencial",
                horas: c.horasAcademicas ? `${c.horasAcademicas} hrs` : "-",
                fecha_emision: c.emitidoEn ? new Date(c.emitidoEn).toLocaleDateString("es-PE") : "-",
                estado: c.estado === "emitido" ? "Vigente" : "Anulado / Rectificado",
              }))
            }
          />
        </div>

        {certificadosFiltrados.length === 0 ? (
          <div className="flex h-36 flex-col items-center justify-center gap-1.5 p-6 text-center text-muted-foreground">
            <Award className="size-8 opacity-40" />
            <p className="text-sm font-medium">No se encontraron certificados con los filtros seleccionados.</p>
          </div>
        ) : (
          <>
            {/* VISTA 1: ESCRITORIO Y LAPTOPS (Tabla inteligente sin scroll horizontal) */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-5">Alumno</TableHead>
                    <TableHead className="px-4">Programa</TableHead>
                    {/* Tipo: Columna dedicada en 2xl, anidado en laptops */}
                    <TableHead className="px-4 hidden 2xl:table-cell">Tipo</TableHead>
                    <TableHead className="px-4">Fecha de Emisión</TableHead>
                    {/* Estado: Oculto en laptops (< 2xl) */}
                    <TableHead className="px-4 hidden 2xl:table-cell">Estado</TableHead>
                    <TableHead className="px-5 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificadosFiltrados.map((c) => (
                    <TableRow key={c.id}>
                      {/* Alumno */}
                      <TableCell className="px-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-heading text-sm">
                            {c.nombreAlumno}
                          </span>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {c.documentoAlumno || "Sin documento"}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono font-bold text-foreground border border-slate-200 dark:border-slate-700">
                              <span>{c.codigoVerificacion}</span>
                              <button
                                type="button"
                                onClick={() => handleCopiarCodigo(c.codigoVerificacion, c.id)}
                                className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                                title="Copiar código"
                              >
                                {copiadoId === c.id ? (
                                  <Check className="size-3 text-emerald-600" />
                                ) : (
                                  <Copy className="size-3" />
                                )}
                              </button>
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Programa (+ Badge Tipo en Laptops) */}
                      <TableCell className="px-4 font-semibold text-heading">
                        <div>{c.tituloPrograma}</div>
                        <div className="2xl:hidden mt-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] py-0 px-1.5 font-bold",
                              c.tipo === "finalizacion"
                                ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
                                : "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30"
                            )}
                          >
                            {c.tipo === "finalizacion" ? "Curso Virtual" : "Taller Presencial"}
                          </Badge>
                        </div>
                      </TableCell>

                      {/* Tipo / Modalidad (Dedicado en 2xl+) */}
                      <TableCell className="px-4 hidden 2xl:table-cell whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={
                            c.tipo === "finalizacion"
                              ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 font-bold"
                              : "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 font-bold"
                          }
                        >
                          {c.tipo === "finalizacion" ? "Curso Virtual" : "Taller Presencial"}
                        </Badge>
                      </TableCell>

                      {/* Fecha de Emisión */}
                      <TableCell className="px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-heading text-xs sm:text-sm">
                            {new Date(c.emitidoEn || c.fechaReferencia).toLocaleDateString("es-PE", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          {c.horasAcademicas ? (
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              {c.horasAcademicas} hrs lectivas
                            </span>
                          ) : null}
                        </div>
                      </TableCell>

                      {/* Estado (Dedicado en 2xl+) */}
                      <TableCell className="px-4 hidden 2xl:table-cell whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <Badge
                            variant="outline"
                            className={
                              c.estado === "vigente" || c.estado === "emitido"
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold"
                                : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-bold"
                            }
                          >
                            {c.estado === "vigente" || c.estado === "emitido" ? "Vigente" : "Rectificado"}
                          </Badge>
                          {c.codigoReemplazante ? (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              Reemp: {c.codigoReemplazante}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* Descargar PDF */}
                          <Button
                            variant="outline"
                            size="icon"
                            nativeButton={false}
                            render={
                              <a
                                href={`/api/certificados/${c.codigoVerificacion}/pdf`}
                                target="_blank"
                                rel="noreferrer"
                                className="size-8 sm:size-9 rounded-full border border-slate-300 bg-slate-100 text-slate-700 shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 transition-colors inline-flex items-center justify-center cursor-pointer"
                                title="Descargar PDF oficial"
                              >
                                <Download className="size-4" />
                              </a>
                            }
                          />

                          {/* Ver en Validador Público */}
                          <Button
                            variant="outline"
                            size="icon"
                            nativeButton={false}
                            render={
                              <a
                                href={`/verificar?codigo=${c.codigoVerificacion}`}
                                target="_blank"
                                rel="noreferrer"
                                className="size-8 sm:size-9 rounded-full border border-slate-300 bg-slate-100 text-slate-700 shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 transition-colors inline-flex items-center justify-center cursor-pointer"
                                title="Ver en Validador Público"
                              >
                                <ExternalLink className="size-4" />
                              </a>
                            }
                          />

                          {/* Rectificar / Corregir (solo si está emitido o vigente) */}
                          {c.estado === "emitido" || c.estado === "vigente" ? (
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleAbrirRectificar(c)}
                              className="size-8 sm:size-9 rounded-full border border-slate-300 bg-slate-100 text-slate-700 shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                              title="Corregir datos y reemitir certificado"
                            >
                              <Pencil className="size-4" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* VISTA 2: CELULAR (Tarjetas responsivas sin scroll horizontal) */}
            <div className="flex flex-col gap-3 p-4 md:hidden border-t">
              {certificadosFiltrados.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs"
                >
                  {/* Fila 1: Alumno + Estado */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="font-bold text-heading text-sm">
                        {c.nombreAlumno}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        {c.documentoAlumno || "Sin doc"}
                      </span>
                    </div>

                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-bold",
                        c.estado === "vigente" || c.estado === "emitido"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                      )}
                    >
                      {c.estado === "vigente" || c.estado === "emitido" ? "Vigente" : "Rectificado"}
                    </Badge>
                  </div>

                  {/* Fila 2: Programa + Código */}
                  <div className="flex flex-col gap-1.5 border-y border-border/60 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] py-0 px-1.5 font-bold",
                          c.tipo === "finalizacion"
                            ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
                            : "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30"
                        )}
                      >
                        {c.tipo === "finalizacion" ? "Curso" : "Taller"}
                      </Badge>
                      <span className="text-xs font-semibold text-heading truncate">
                        {c.tituloPrograma}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                      <span>Código: {c.codigoVerificacion}</span>
                      {c.horasAcademicas ? <span>{c.horasAcademicas} hrs</span> : null}
                    </div>
                  </div>

                  {/* Fila 3: Fecha + Acciones */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {new Date(c.emitidoEn || c.fechaReferencia).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Descargar PDF */}
                      <a
                        href={`/api/certificados/${c.codigoVerificacion}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="size-8 rounded-full border border-slate-300 bg-slate-100 text-slate-700 shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 transition-colors inline-flex items-center justify-center cursor-pointer"
                        title="Descargar PDF"
                      >
                        <Download className="size-3.5" />
                      </a>

                      {/* Validador Público */}
                      <a
                        href={`/verificar?codigo=${c.codigoVerificacion}`}
                        target="_blank"
                        rel="noreferrer"
                        className="size-8 rounded-full border border-slate-300 bg-slate-100 text-slate-700 shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 transition-colors inline-flex items-center justify-center cursor-pointer"
                        title="Verificar"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>

                      {/* Rectificar */}
                      {(c.estado === "emitido" || c.estado === "vigente") && (
                        <button
                          type="button"
                          onClick={() => handleAbrirRectificar(c)}
                          className="size-8 rounded-full border border-slate-300 bg-slate-100 text-slate-700 shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 transition-colors inline-flex items-center justify-center cursor-pointer"
                          title="Rectificar"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Modales de Gestión */}
      <ModalRectificarCertificado
        certificado={certParaRectificar}
        abierto={modalRectificarAbierto}
        onOpenChange={setModalRectificarAbierto}
        onCompletado={() => router.refresh()}
      />

      <ModalEmitirTaller
        talleres={talleres}
        abierto={modalEmitirTallerAbierto}
        onOpenChange={setModalEmitirTallerAbierto}
        onCompletado={() => router.refresh()}
      />
    </div>
  );
}
