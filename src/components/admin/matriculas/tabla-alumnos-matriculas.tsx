"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  KeyRound,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldAlert,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  ModalMatricularManual,
  type CursoOption,
} from "./modal-matricular-manual";
import { ModalEditarMatricula } from "./modal-editar-matricula";
import {
  extenderVigenciaMatriculaAction,
  revocarMatriculaAction,
  resetearClaveAlumnoAction,
  marcarMatriculasContactosExportadosAction,
  type AlumnoMatriculadoItem,
} from "@/server/matriculas/acciones";
import { toast } from "sonner";
import { ModuloBanner } from "@/components/ui/modulo-banner";
import { WhatsappIcon } from "@/components/icons/whatsapp-icon";
import { BotonExportarTablaExcel } from "@/components/admin/shared/boton-exportar-tabla-excel";
import { ModalExportarContactos } from "@/components/admin/shared/modal-exportar-contactos";
import { type DatosContactoExportar } from "@/lib/contactos/formato-contacto";

export function TablaAlumnosMatriculas({
  matriculasIniciales,
  cursos,
  busquedaInicial = "",
}: {
  matriculasIniciales: AlumnoMatriculadoItem[];
  cursos: CursoOption[];
  busquedaInicial?: string;
}) {
  const router = useRouter();
  const [matriculas, setMatriculas] = useState<AlumnoMatriculadoItem[]>(matriculasIniciales);

  useEffect(() => {
    setMatriculas(matriculasIniciales);
  }, [matriculasIniciales]);
  const [busqueda, setBusqueda] = useState(busquedaInicial);
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "activa" | "por_vencer" | "vencida" | "revocada">("todos");
  const [filtroCurso, setFiltroCurso] = useState<string>("todos");
  const [matriculaParaEditar, setMatriculaParaEditar] = useState<AlumnoMatriculadoItem | null>(null);
  const [matriculaParaRevocar, setMatriculaParaRevocar] = useState<AlumnoMatriculadoItem | null>(null);
  const [motivoRevocacion, setMotivoRevocacion] = useState("");
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  // Opciones para el selector de filtro por curso
  const opcionesFiltroCursos = useMemo(() => {
    return [
      { value: "todos", label: `Todos los cursos (${matriculas.length})` },
      ...cursos.map((c) => ({
        value: c.id,
        label: c.nombre,
      })),
    ];
  }, [cursos, matriculas.length]);

  // Estadísticas y conteos para las píldoras de filtro
  const conteos = useMemo(() => {
    return {
      todos: matriculas.length,
      activa: matriculas.filter((m) => m.estado === "activa" && m.diasRestantes > 0).length,
      por_vencer: matriculas.filter(
        (m) => m.estado === "activa" && m.diasRestantes > 0 && m.diasRestantes <= 30
      ).length,
      vencida: matriculas.filter(
        (m) => m.estado === "vencida" || (m.estado === "activa" && m.diasRestantes === 0)
      ).length,
      revocada: matriculas.filter((m) => m.estado === "revocada").length,
    };
  }, [matriculas]);

  // Filtrado reactivo optimizado
  const matriculasFiltradas = useMemo(() => {
    return matriculas.filter((m) => {
      // Filtro por curso
      if (filtroCurso !== "todos" && m.cursoId !== filtroCurso) return false;

      const q = busqueda.toLowerCase().trim();
      const cumpleBusqueda =
        q === "" ||
        m.nombreCompleto.toLowerCase().includes(q) ||
        m.correo.toLowerCase().includes(q) ||
        m.telefono.includes(q) ||
        m.documento.toLowerCase().includes(q) ||
        m.cursoNombre.toLowerCase().includes(q);

      if (!cumpleBusqueda) return false;

      if (filtroEstado === "todos") return true;
      if (filtroEstado === "activa") return m.estado === "activa" && m.diasRestantes > 0;
      if (filtroEstado === "por_vencer")
        return m.estado === "activa" && m.diasRestantes > 0 && m.diasRestantes <= 30;
      if (filtroEstado === "vencida")
        return m.estado === "vencida" || (m.estado === "activa" && m.diasRestantes === 0);
      if (filtroEstado === "revocada") return m.estado === "revocada";
      return true;
    });
  }, [matriculas, busqueda, filtroEstado, filtroCurso]);

  const contactosParaExportar = useMemo<
    (DatosContactoExportar & { contactoExportadoEn?: string | null })[]
  >(() => {
    return matriculas.map((m) => ({
      id: m.id,
      nombres: m.nombres || m.nombreCompleto.split(" ")[0] || "Alumno",
      apellidos: m.apellidos || m.nombreCompleto.split(" ").slice(1).join(" ") || "",
      nombreCompleto: m.nombreCompleto,
      telefono: m.telefono || "",
      pais: m.pais || "PE",
      correo: m.correo || "",
      documento: m.documento,
      cursoOTallerNombre: m.cursoNombre,
      tipo: "curso",
      fechaRegistroIso: m.otorgadaEn,
      estado: m.estado,
      contactoExportadoEn: m.contactoExportadoEn,
    }));
  }, [matriculas]);

  const contactosFiltradosParaExportar = useMemo(() => {
    const idsFiltrados = new Set(matriculasFiltradas.map((m) => m.id));
    return contactosParaExportar.filter((c) => idsFiltrados.has(c.id));
  }, [contactosParaExportar, matriculasFiltradas]);

  const hayFiltrosActivos =
    busqueda.trim() !== "" || filtroEstado !== "todos" || filtroCurso !== "todos";

  const handleExtender = async (matriculaId: string, dias: number, label: string) => {
    setProcesandoId(matriculaId);
    try {
      const res = await extenderVigenciaMatriculaAction(matriculaId, dias);
      if (res.ok && res.nuevoVencimiento) {
        toast.success(`¡Vigencia extendida por ${label}!`);
        router.refresh();
        // Actualizar estado local
        setMatriculas((prev) =>
          prev.map((m) => {
            if (m.id === matriculaId) {
              const venceTime = new Date(res.nuevoVencimiento!).getTime();
              const diasRestantes = Math.max(0, Math.ceil((venceTime - Date.now()) / (1000 * 60 * 60 * 24)));
              return {
                ...m,
                venceEn: res.nuevoVencimiento!,
                estado: "activa",
                diasRestantes,
              };
            }
            return m;
          })
        );
      } else {
        toast.error(res.error || "No se pudo extender la vigencia.");
      }
    } catch {
      toast.error("Error de comunicación.");
    } finally {
      setProcesandoId(null);
    }
  };

  const handleConfirmarRevocar = async () => {
    if (!matriculaParaRevocar) return;

    setProcesandoId(matriculaParaRevocar.id);
    try {
      const motivoFinal = motivoRevocacion.trim() || "Revocada manualmente por el admin";
      const res = await revocarMatriculaAction(matriculaParaRevocar.id, motivoFinal);
      if (res.ok) {
        toast.success(`Acceso al curso revocado para ${matriculaParaRevocar.nombreCompleto}.`);
        router.refresh();
        setMatriculas((prev) =>
          prev.map((m) => (m.id === matriculaParaRevocar.id ? { ...m, estado: "revocada" } : m))
        );
        setMatriculaParaRevocar(null);
        setMotivoRevocacion("");
      } else {
        toast.error(res.error || "No se pudo revocar la matrícula.");
      }
    } catch {
      toast.error("Error al revocar la matrícula.");
    } finally {
      setProcesandoId(null);
    }
  };

  const handleResetearClave = async (perfilId: string, nombreAlumno: string) => {
    setProcesandoId(perfilId);
    try {
      const res = await resetearClaveAlumnoAction(perfilId);
      if (res.ok && res.nuevaClave) {
        navigator.clipboard.writeText(res.nuevaClave);
        toast.success(
          `¡Nueva clave para ${nombreAlumno}: ${res.nuevaClave}! Copiada al portapapeles.`,
          { duration: 8000 }
        );
      } else {
        toast.error(res.error || "No se pudo generar la nueva contraseña.");
      }
    } catch {
      toast.error("Error al resetear contraseña.");
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 sm:p-8">
      {/* Banner Principal Unificado */}
      <ModuloBanner
        titulo="Alumnos y Matrículas"
        descripcion="Administra los accesos a cursos, vigencias y matricula alumnos manuales por WhatsApp o pagos directos."
        icono={Users}
        acciones={
          <ModalMatricularManual
            cursos={cursos}
            triggerVariant="white"
            onMatriculaExitosa={() => {
              router.refresh();
            }}
          />
        }
      />

      {/* Barra de Filtros y Búsqueda — Estilo idéntico a Cupones */}
      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-5 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Buscador acotado */}
            <div className="relative w-full lg:max-w-xs">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por alumno, correo, teléfono o DNI…"
                aria-label="Buscar por alumno, correo, teléfono o DNI"
                className="h-10 rounded-xl border-border bg-card pr-3 pl-9 text-sm"
              />
            </div>

            {/* Selector para Filtrar por Curso */}
            <div className="w-full lg:w-64">
              <Select
                value={filtroCurso}
                items={opcionesFiltroCursos}
                onValueChange={(val) => val && setFiltroCurso(val)}
              >
                <SelectTrigger
                  aria-label="Filtrar por curso"
                  className="h-10 w-full rounded-xl border-border bg-card text-xs font-semibold"
                >
                  <SelectValue placeholder="Todos los cursos" />
                </SelectTrigger>
                <SelectContent>
                  {opcionesFiltroCursos.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Píldoras de Estado agrupadas con conteos */}
            <div
              role="group"
              aria-label="Filtrar por estado de matrícula"
              className="flex flex-wrap items-center gap-2"
            >
              {(
                [
                  { id: "todos", label: "Todos", conteo: conteos.todos },
                  { id: "activa", label: "Activas", conteo: conteos.activa },
                  { id: "por_vencer", label: "Por Vencer", conteo: conteos.por_vencer },
                  { id: "vencida", label: "Vencidas", conteo: conteos.vencida },
                  { id: "revocada", label: "Revocadas", conteo: conteos.revocada },
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

              {/* Botón para resetear filtros si hay búsqueda o filtro activo */}
              {hayFiltrosActivos && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setBusqueda("");
                    setFiltroEstado("todos");
                    setFiltroCurso("todos");
                  }}
                  className="h-10 px-3 text-muted-foreground hover:text-foreground"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabla de Matrículas usando Card y Table de shadcn */}
      <Card className="gap-0 py-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-heading">Matrículas</h2>
            <span
              aria-live="polite"
              className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium tabular-nums"
            >
              Mostrando {matriculasFiltradas.length} de {matriculas.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ModalExportarContactos
              tituloModulo="Alumnos y Matrículas"
              tipo="curso"
              contactos={contactosParaExportar}
              contactosFiltradosTabla={contactosFiltradosParaExportar}
              onMarcarExportados={async (ids) => {
                const res = await marcarMatriculasContactosExportadosAction(ids);
                if (res.ok) {
                  const ahoraIso = new Date().toISOString();
                  setMatriculas((prev) =>
                    prev.map((m) =>
                      ids.includes(m.id)
                        ? { ...m, contactoExportadoEn: ahoraIso }
                        : m
                    )
                  );
                }
                return res;
              }}
            />

            <BotonExportarTablaExcel
              nombreArchivo="alumnos-matriculas-amorelo"
              titulo="AMORELO — REGISTRO DE ALUMNOS Y ACCESOS A CURSOS"
              subtitulo={`Padrón Académico de Alumnos • Exportado el ${new Date().toLocaleDateString("es-PE")}`}
              nombreHoja="Matrículas"
              totalFiltrados={matriculasFiltradas.length}
              columnas={[
                { header: "Alumno / Estudiante", key: "nombreCompleto", width: 28, align: "left" },
                { header: "Correo Electrónico", key: "correo", width: 28, align: "left" },
                { header: "Teléfono", key: "telefono", width: 16, align: "center" },
                { header: "Documento", key: "documento", width: 16, align: "center" },
                { header: "Curso Matriculado", key: "cursoNombre", width: 34, align: "left" },
                { header: "Canal", key: "canal", width: 14, align: "center" },
                { header: "N° Orden", key: "numeroOrden", width: 14, align: "center" },
                { header: "Fecha Alta", key: "otorgadaEn", width: 16, align: "center" },
                { header: "Vence En", key: "venceEn", width: 16, align: "center" },
                { header: "Días Restantes", key: "diasRestantes", width: 14, align: "center" },
                { header: "Monto", key: "monto", width: 14, isCurrency: true },
                { header: "Estado", key: "estado", width: 16, align: "center" },
              ]}
              obtenerFilas={() =>
                matriculasFiltradas.map((m) => ({
                  nombreCompleto: m.nombreCompleto,
                  correo: m.correo,
                  telefono: m.telefono || "-",
                  documento: m.numeroDocumento ? `${m.tipoDocumento}: ${m.numeroDocumento}` : "-",
                  cursoNombre: m.cursoNombre,
                  canal: m.canal === "whatsapp" ? "WhatsApp" : "Web / MP",
                  numeroOrden: m.numeroOrden ? `#${m.numeroOrden}` : "MANUAL",
                  otorgadaEn: m.otorgadaEn ? new Date(m.otorgadaEn).toLocaleDateString("es-PE") : "-",
                  venceEn: m.venceEn ? new Date(m.venceEn).toLocaleDateString("es-PE") : "-",
                  diasRestantes: m.diasRestantes,
                  monto: Number(m.monto || 0),
                  estado:
                    m.estado === "activa" && m.diasRestantes > 0
                      ? "Activa"
                      : m.estado === "revocada"
                      ? "Revocada"
                      : "Vencida",
                }))
              }
              obtenerTotal={(filas) => {
                const sumaMonto = filas.reduce((acc, f) => acc + Number(f.monto || 0), 0);
                return {
                  label: "TOTAL RECAUDADO",
                  columnaLabel: "nombreCompleto",
                  valores: {
                    monto: sumaMonto,
                  },
                };
              }}
            />
          </div>
        </div>

        {matriculasFiltradas.length === 0 ? (
          <div className="flex h-36 flex-col items-center justify-center gap-1.5 p-6 text-center text-muted-foreground">
            <Users className="size-8 opacity-40" />
            <p className="text-sm font-medium">No se encontraron alumnos con los filtros seleccionados.</p>
          </div>
        ) : (
          <>
            {/* VISTA 1: ESCRITORIO Y LAPTOPS (Tabla inteligente sin scroll horizontal) */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-5">Alumno</TableHead>
                    <TableHead className="px-4">Curso</TableHead>
                    {/* Canal: Columna dedicada en 2xl, anidado en laptops */}
                    <TableHead className="px-4 hidden 2xl:table-cell">Canal</TableHead>
                    <TableHead className="px-4">Vigencia / Vence</TableHead>
                    <TableHead className="px-4">Estado</TableHead>
                    <TableHead className="px-5 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matriculasFiltradas.map((m) => {
                    const cleanPhone = m.telefono.replace(/[^0-9]/g, "");

                    return (
                      <TableRow key={m.id}>
                        {/* Alumno (+ Badge Canal en Laptops) */}
                        <TableCell className="px-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-heading text-sm">
                              {m.nombreCompleto}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {m.correo}
                            </span>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              {m.telefono && (
                                <>
                                  <a
                                    href={`https://wa.me/${cleanPhone}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                  >
                                    <WhatsappIcon className="size-3 text-emerald-600 dark:text-emerald-400" />
                                    <span>{m.telefono}</span>
                                  </a>
                                  {m.contactoExportadoEn ? (
                                    <span
                                      className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 px-1.5 py-0.5 text-[9px] font-bold"
                                      title={`Agendado en celular el ${new Date(m.contactoExportadoEn).toLocaleDateString("es-PE")}`}
                                    >
                                      <CheckCircle2 className="size-2.5 text-emerald-600 dark:text-emerald-400" />
                                      <span>Agendado</span>
                                    </span>
                                  ) : (
                                    <span
                                      className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 px-1.5 py-0.5 text-[9px] font-bold"
                                      title="Pendiente de agendar en tu celular"
                                    >
                                      <Clock className="size-2.5 text-amber-600 dark:text-amber-400" />
                                      <span>Sin agendar</span>
                                    </span>
                                  )}
                                </>
                              )}
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {m.documento}
                              </span>
                              {/* En laptops (< 2xl), mostramos el badge de canal aquí */}
                              <div className="2xl:hidden">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[10px] py-0 px-1.5 font-bold",
                                    m.canal === "whatsapp"
                                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                      : "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
                                  )}
                                >
                                  {m.canal === "whatsapp" ? "WhatsApp" : "Web"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Curso */}
                        <TableCell className="px-4 font-semibold text-heading">
                          {m.cursoNombre}
                        </TableCell>

                        {/* Canal (Dedicado en 2xl+) */}
                        <TableCell className="px-4 hidden 2xl:table-cell whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={
                              m.canal === "whatsapp" || m.canal === "manual" || m.canal === "presencial"
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold"
                                : "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 font-bold"
                            }
                          >
                            {m.canal === "whatsapp" || m.canal === "manual" || m.canal === "presencial"
                              ? "WhatsApp / Yape"
                              : m.canal === "web"
                              ? "Web / MP"
                              : m.canal}
                          </Badge>
                        </TableCell>

                        {/* Vigencia */}
                        <TableCell className="px-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-heading">
                              {new Date(m.venceEn).toLocaleDateString("es-PE", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            {m.estado === "activa" ? (
                              <span
                                className={`text-[10px] font-bold ${
                                  m.diasRestantes <= 15
                                    ? "text-rose-600 dark:text-rose-400"
                                    : m.diasRestantes <= 30
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-emerald-600 dark:text-emerald-400"
                                }`}
                              >
                                {m.diasRestantes === 0
                                  ? "Vence hoy"
                                  : `${m.diasRestantes} días restantes`}
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground font-semibold">
                                {m.estado === "vencida" ? "Caducado" : "Revocado"}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Estado */}
                        <TableCell className="px-4">
                          <Badge
                            variant="outline"
                            className={
                              m.estado === "activa" && m.diasRestantes > 0
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold"
                                : m.estado === "revocada"
                                ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 font-bold"
                                : "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30 font-bold"
                            }
                          >
                            {m.estado === "activa" && m.diasRestantes > 0
                              ? "Activa"
                              : m.estado === "revocada"
                              ? "Revocada"
                              : "Vencida"}
                          </Badge>
                        </TableCell>

                        {/* Acciones */}
                        <TableCell className="px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Botón rápido exterior para abrir WhatsApp */}
                            {cleanPhone ? (
                              <Button
                                variant="outline"
                                size="icon"
                                nativeButton={false}
                                render={
                                  <a
                                    href={`https://wa.me/${cleanPhone}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="size-8 sm:size-9 rounded-full border border-slate-300 bg-slate-100 text-emerald-600 shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400 dark:hover:bg-slate-700 transition-colors inline-flex items-center justify-center cursor-pointer"
                                    title={`Abrir WhatsApp con ${m.nombreCompleto}`}
                                  >
                                    <WhatsappIcon className="size-4" />
                                  </a>
                                }
                              />
                            ) : null}

                            {/* Botón exterior de Edición (Lápiz) coherente con Cursos y Cupones */}
                            <Button
                              size="icon"
                              variant="outline"
                              title={`Editar matrícula de ${m.nombreCompleto}`}
                              onClick={() => setMatriculaParaEditar(m)}
                              className="size-8 sm:size-9 rounded-full border border-slate-300 bg-slate-100 text-icon-accent shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                              <Pencil className="size-4" />
                              <span className="sr-only">Editar matrícula</span>
                            </Button>

                            {/* Botón de Opciones estilo Cursos (Settings2) */}
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                disabled={procesandoId === m.id || procesandoId === m.perfilId}
                                className="size-8 sm:size-9 rounded-full border border-slate-300 bg-slate-100 text-icon-accent shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 transition-colors cursor-pointer inline-flex items-center justify-center"
                                title="Gestionar matrícula"
                              >
                                <Settings2 className="size-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel className="text-xs">
                                  Gestionar Matrícula
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                {/* Editar Matrícula */}
                                <DropdownMenuItem
                                  onClick={() => setMatriculaParaEditar(m)}
                                  className="text-xs font-semibold cursor-pointer"
                                >
                                  <Pencil className="size-3.5 mr-2 text-icon-accent dark:text-white" />
                                  <span>Editar matrícula</span>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                {/* Extender Vigencia */}
                                <DropdownMenuItem
                                  onClick={() => handleExtender(m.id, 30, "1 mes (+30 días)")}
                                  className="text-xs font-semibold cursor-pointer"
                                >
                                  <Clock className="size-3.5 mr-2 text-blue-600 dark:text-blue-400" />
                                  <span>Extender 1 Mes (+30d)</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => handleExtender(m.id, 180, "6 meses")}
                                  className="text-xs font-semibold cursor-pointer"
                                >
                                  <Calendar className="size-3.5 mr-2 text-indigo-600 dark:text-indigo-400" />
                                  <span>Extender 6 Meses</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => handleExtender(m.id, 365, "1 año (+365 días)")}
                                  className="text-xs font-semibold cursor-pointer"
                                >
                                  <Sparkles className="size-3.5 mr-2 text-amber-500 dark:text-amber-400" />
                                  <span>Extender 1 Año</span>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                {/* Resetear clave */}
                                <DropdownMenuItem
                                  onClick={() => handleResetearClave(m.perfilId, m.nombreCompleto)}
                                  className="text-xs font-semibold cursor-pointer"
                                >
                                  <KeyRound className="size-3.5 mr-2 text-emerald-600 dark:text-emerald-400" />
                                  <span>Nueva clave para WhatsApp</span>
                                </DropdownMenuItem>

                                {/* Revocar o Reactivar */}
                                {m.estado === "activa" ? (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setMotivoRevocacion("");
                                      setMatriculaParaRevocar(m);
                                    }}
                                    className="text-xs font-semibold text-rose-600 focus:text-rose-600 cursor-pointer"
                                  >
                                    <XCircle className="size-3.5 mr-2 text-rose-600" />
                                    <span>Revocar acceso</span>
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => handleExtender(m.id, 365, "1 año (Reactivar)")}
                                    className="text-xs font-semibold text-emerald-600 focus:text-emerald-600 cursor-pointer"
                                  >
                                    <RefreshCw className="size-3.5 mr-2 text-emerald-600" />
                                    <span>Reactivar Matrícula</span>
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* VISTA 2: MÓVIL (Tarjetas individuales sin scroll horizontal) */}
            <div className="flex flex-col gap-3 p-4 md:hidden border-t">
              {matriculasFiltradas.map((m) => {
                const cleanPhone = m.telefono.replace(/[^0-9]/g, "");

                return (
                  <div
                    key={m.id}
                    className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs"
                  >
                    {/* Fila Superior: Nombre del Alumno + Estado */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-heading text-sm truncate">
                          {m.nombreCompleto}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono truncate">
                          {m.correo}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          m.estado === "activa" && m.diasRestantes > 0
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold text-xs shrink-0"
                            : m.estado === "revocada"
                            ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 font-bold text-xs shrink-0"
                            : "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30 font-bold text-xs shrink-0"
                        }
                      >
                        {m.estado === "activa" && m.diasRestantes > 0
                          ? "Activa"
                          : m.estado === "revocada"
                          ? "Revocada"
                          : "Vencida"}
                      </Badge>
                    </div>

                    {/* Fila Central: Curso + Teléfono con WhatsApp */}
                    <div className="flex flex-col gap-1.5 border-y border-border/60 py-2.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-heading truncate">
                          📚 {m.cursoNombre}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            m.canal === "whatsapp" || m.canal === "manual" || m.canal === "presencial"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold text-[10px]"
                              : "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 font-bold text-[10px]"
                          }
                        >
                          {m.canal === "whatsapp" || m.canal === "manual" || m.canal === "presencial"
                            ? "WhatsApp / Yape"
                            : m.canal === "web"
                            ? "Web / MP"
                            : m.canal}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                        {m.telefono ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                            >
                              <WhatsappIcon className="size-3 text-emerald-600 dark:text-emerald-400" />
                              <span>{m.telefono}</span>
                            </a>
                            {m.contactoExportadoEn ? (
                              <span
                                className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 px-1.5 py-0.5 text-[9px] font-bold"
                                title={`Agendado el ${new Date(m.contactoExportadoEn).toLocaleDateString("es-PE")}`}
                              >
                                <CheckCircle2 className="size-2.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Agendado</span>
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 px-1.5 py-0.5 text-[9px] font-bold"
                                title="Pendiente de agendar en tu celular"
                              >
                                <Clock className="size-2.5 text-amber-600 dark:text-amber-400" />
                                <span>Sin agendar</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Sin teléfono</span>
                        )}
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {m.documento}
                        </span>
                      </div>
                    </div>

                    {/* Fila Inferior: Vigencia en líneas completas + Fila de Botones abajo */}
                    <div className="flex flex-col gap-2.5 pt-2 border-t border-border/60 text-xs">
                      {/* Línea 1: Fecha de Vencimiento */}
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        Vence: {new Date(m.venceEn).toLocaleDateString("es-PE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>

                      {/* Línea 2: Días Restantes */}
                      {m.estado === "activa" ? (
                        <span
                          className={`text-xs font-bold whitespace-nowrap ${
                            m.diasRestantes <= 15
                              ? "text-rose-600 dark:text-rose-400"
                              : m.diasRestantes <= 30
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {m.diasRestantes === 0
                            ? "Vence hoy"
                            : `${m.diasRestantes} días restantes`}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground font-semibold whitespace-nowrap">
                          {m.estado === "vencida" ? "Caducado" : "Revocado"}
                        </span>
                      )}

                      {/* Línea 3: Fila con los 3 botones en una sola línea */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                        {cleanPhone ? (
                          <a
                            href={`https://wa.me/${cleanPhone}`}
                            target="_blank"
                            rel="noreferrer"
                            className="size-8 rounded-full border border-slate-300 bg-slate-100 text-emerald-600 shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400 dark:hover:bg-slate-700 transition-colors inline-flex items-center justify-center cursor-pointer"
                            title={`Abrir WhatsApp con ${m.nombreCompleto}`}
                          >
                            <WhatsappIcon className="size-4" />
                          </a>
                        ) : null}

                        {/* Botón exterior de Edición (Lápiz) para móvil */}
                        <Button
                          size="icon"
                          variant="outline"
                          title={`Editar matrícula de ${m.nombreCompleto}`}
                          onClick={() => setMatriculaParaEditar(m)}
                          className="size-8 rounded-full border border-slate-300 bg-slate-100 text-icon-accent shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <Pencil className="size-4" />
                          <span className="sr-only">Editar matrícula</span>
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger
                            disabled={procesandoId === m.id || procesandoId === m.perfilId}
                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 text-icon-accent shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <span>Gestionar</span>
                            <Settings2 className="size-3.5 text-icon-accent dark:text-white" />
                          </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuLabel className="text-xs">
                            Gestionar Matrícula
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          {/* Editar Matrícula */}
                          <DropdownMenuItem
                            onClick={() => setMatriculaParaEditar(m)}
                            className="text-xs font-semibold cursor-pointer"
                          >
                            <Pencil className="size-3.5 mr-2 text-icon-accent dark:text-white" />
                            <span>Editar matrícula</span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => handleExtender(m.id, 30, "1 mes (+30 días)")}
                            className="text-xs font-semibold cursor-pointer"
                          >
                            <Clock className="size-3.5 mr-2 text-blue-600 dark:text-blue-400" />
                            <span>Extender 1 Mes (+30d)</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleExtender(m.id, 180, "6 meses")}
                            className="text-xs font-semibold cursor-pointer"
                          >
                            <Calendar className="size-3.5 mr-2 text-indigo-600 dark:text-indigo-400" />
                            <span>Extender 6 Meses</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleExtender(m.id, 365, "1 año (+365 días)")}
                            className="text-xs font-semibold cursor-pointer"
                          >
                            <Sparkles className="size-3.5 mr-2 text-amber-500 dark:text-amber-400" />
                            <span>Extender 1 Año</span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => handleResetearClave(m.perfilId, m.nombreCompleto)}
                            className="text-xs font-semibold cursor-pointer"
                          >
                            <KeyRound className="size-3.5 mr-2 text-emerald-600 dark:text-emerald-400" />
                            <span>Nueva clave WhatsApp</span>
                          </DropdownMenuItem>

                          {m.estado === "activa" ? (
                            <DropdownMenuItem
                              onClick={() => {
                                setMotivoRevocacion("");
                                setMatriculaParaRevocar(m);
                              }}
                              className="text-xs font-semibold text-rose-600 focus:text-rose-600 cursor-pointer"
                            >
                              <XCircle className="size-3.5 mr-2 text-rose-600" />
                              <span>Revocar acceso</span>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleExtender(m.id, 365, "1 año (Reactivar)")}
                              className="text-xs font-semibold text-emerald-600 focus:text-emerald-600 cursor-pointer"
                            >
                              <RefreshCw className="size-3.5 mr-2 text-emerald-600" />
                              <span>Reactivar Matrícula</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {/* Modal para Editar Alumno y Matrícula */}
      <ModalEditarMatricula
        matricula={matriculaParaEditar}
        cursos={cursos}
        open={matriculaParaEditar !== null}
        onOpenChange={(open) => {
          if (!open) setMatriculaParaEditar(null);
        }}
        onMatriculaActualizada={(actualizada) => {
          setMatriculas((prev) =>
            prev.map((m) => (m.id === actualizada.id ? actualizada : m))
          );
          router.refresh();
        }}
      />

      {/* Modal AlertDialog para Revocar Acceso */}
      <AlertDialog
        open={Boolean(matriculaParaRevocar)}
        onOpenChange={(open) => {
          if (!open && !procesandoId) {
            setMatriculaParaRevocar(null);
          }
        }}
      >
        <AlertDialogContent className="z-[70] w-[92vw] max-w-md rounded-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-black text-heading flex items-center gap-2">
              <XCircle className="size-5 text-rose-600 dark:text-rose-400" />
              <span>¿Revocar acceso al curso?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Esta acción suspenderá de inmediato el acceso de{" "}
              <strong className="text-foreground">
                {matriculaParaRevocar?.nombreCompleto}
              </strong>{" "}
              al curso{" "}
              <strong className="text-foreground">
                {matriculaParaRevocar?.cursoNombre}
              </strong>
              . El alumno ya no podrá ingresar a las clases en el aula virtual. Podrás reactivarlo en cualquier momento.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-2">
            <Label className="text-xs font-bold text-heading mb-1.5 block">
              Motivo o Detalle de la Revocación (Opcional)
            </Label>
            <Input
              value={motivoRevocacion}
              onChange={(e) => setMotivoRevocacion(e.target.value)}
              placeholder="Ej: Solicitud de baja, falta de pago o reembolso..."
              className="h-9 text-xs"
            />
          </div>

          <AlertDialogFooter className="flex sm:justify-end gap-2">
            <AlertDialogCancel
              disabled={Boolean(procesandoId)}
              onClick={() => setMatriculaParaRevocar(null)}
              className="rounded-full cursor-pointer font-bold"
            >
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={Boolean(procesandoId)}
              onClick={handleConfirmarRevocar}
              className="rounded-full font-bold cursor-pointer"
            >
              <XCircle className="mr-1.5 size-4" />
              <span>{procesandoId ? "Revocando..." : "Sí, revocar acceso"}</span>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
