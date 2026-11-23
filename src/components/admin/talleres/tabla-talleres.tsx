// Tabla de Talleres Presenciales para el Panel Admin.
// Patrón híbrido responsive con búsqueda acotada, píldoras de estado idénticas a Cursos/Cupones y acceso al escáner de puerta.
// Fase 4: Item 4.3 y 4.4 del Checklist.

"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Search,
  Camera,
  ChevronRight,
  UserPlus,
  Settings2,
  Pencil,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TallerAdminItem } from "@/server/talleres/consultas";
import { EscanerPuertaDialog } from "./escaner-puerta-dialog";
import { ModalReservaManual } from "./modal-reserva-manual";
import { ModalEditarTaller } from "./modal-editar-taller";
import { BotonExportarTablaExcel } from "@/components/admin/shared/boton-exportar-tabla-excel";

interface TablaTalleresProps {
  talleres: TallerAdminItem[];
}

type FiltroEstado = "todos" | "publicados" | "inhabilitados" | "cancelados";

export function TablaTalleres({ talleres }: TablaTalleresProps) {
  const router = useRouter();
  const [listaTalleres, setListaTalleres] = useState<TallerAdminItem[]>(talleres);

  // Mantener sincronizado si cambian las props
  useEffect(() => {
    setListaTalleres(talleres);
  }, [talleres]);

  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<FiltroEstado>("todos");

  // Modales controlados para acciones de fila
  const [tallerParaEditar, setTallerParaEditar] = useState<TallerAdminItem | null>(null);

  const [tallerParaEscaner, setTallerParaEscaner] = useState<{
    id: string;
    nombre: string;
  } | null>(null);

  const [tallerParaReserva, setTallerParaReserva] = useState<{
    id: string;
    nombre: string;
    precio: number;
    fechaInicio?: string;
  } | null>(null);

  // Conteos reactivos
  const conteos = useMemo(() => {
    return {
      todos: listaTalleres.length,
      publicados: listaTalleres.filter((t) => t.estado === "publicado").length,
      inhabilitados: listaTalleres.filter(
        (t) => t.estado === "inhabilitado" || t.estado === "borrador"
      ).length,
      cancelados: listaTalleres.filter((t) => t.estado === "cancelado").length,
    };
  }, [listaTalleres]);

  // Filtrado reactivo
  const talleresFiltrados = useMemo(() => {
    return listaTalleres.filter((t) => {
      const matchBusqueda =
        !busqueda.trim() ||
        t.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (t.lugar && t.lugar.toLowerCase().includes(busqueda.toLowerCase())) ||
        (t.direccion && t.direccion.toLowerCase().includes(busqueda.toLowerCase()));

      if (!matchBusqueda) return false;

      if (filtro === "publicados") return t.estado === "publicado";
      if (filtro === "inhabilitados")
        return t.estado === "inhabilitado" || t.estado === "borrador";
      if (filtro === "cancelados") return t.estado === "cancelado";
      return true;
    });
  }, [listaTalleres, busqueda, filtro]);

  const hayFiltrosActivos = busqueda.trim() !== "" || filtro !== "todos";

  const formatearFecha = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("es-PE", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Barra de Filtros y Búsqueda — Estilo idéntico a Cursos y Cupones */}
      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-5 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Buscador acotado */}
            <div className="relative w-full lg:max-w-md">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar taller por nombre, hotel o lugar…"
                aria-label="Buscar taller por nombre, hotel o lugar"
                className="h-10 rounded-xl border-border bg-card pr-3 pl-9 text-sm"
              />
            </div>

            {/* Píldoras de Estado agrupadas con conteos */}
            <div
              role="group"
              aria-label="Filtrar por estado"
              className="flex flex-wrap items-center gap-2"
            >
              {(
                [
                  { id: "todos", label: "Todos", conteo: conteos.todos },
                  { id: "publicados", label: "Publicados", conteo: conteos.publicados },
                  { id: "inhabilitados", label: "Inhabilitados", conteo: conteos.inhabilitados },
                  { id: "cancelados", label: "Cancelados", conteo: conteos.cancelados },
                ] as const
              ).map((f) => {
                const activo = filtro === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => setFiltro(f.id)}
                    className={cn(
                      "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/30 cursor-pointer",
                      activo
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-muted"
                    )}
                  >
                    <span>{f.label}</span>
                    <span
                      className={cn(
                        "tabular-nums text-xs",
                        activo ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}
                    >
                      ({f.conteo})
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
                    setFiltro("todos");
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

      {/* Tabla de Talleres usando shadcn Card */}
      <Card className="gap-0 py-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-heading">Talleres Programados</h2>
            <span
              aria-live="polite"
              className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium tabular-nums"
            >
              Mostrando {talleresFiltrados.length} de {talleres.length}
            </span>
          </div>

          <BotonExportarTablaExcel
            nombreArchivo="talleres-amorelo"
            titulo="AMORELO — REGISTRO DE TALLERES PRESENCIALES"
            subtitulo={`Programación y Control de Cupos • Exportado el ${new Date().toLocaleDateString("es-PE")}`}
            nombreHoja="Talleres"
            totalFiltrados={talleresFiltrados.length}
            columnas={[
              { header: "Taller Presencial", key: "nombre", width: 36, align: "left" },
              { header: "Ubicación / Lugar", key: "lugar", width: 26, align: "left" },
              { header: "Fecha y Hora", key: "fecha", width: 22, align: "center" },
              { header: "Precio Regular", key: "precio_pen", width: 16, isCurrency: true },
              { header: "Precio Preventa", key: "precio_preventa_pen", width: 16, isCurrency: true },
              { header: "Aforo Total", key: "cupos_totales", width: 14, align: "center" },
              { header: "Inscritos", key: "ocupados", width: 12, align: "center" },
              { header: "Disponibles", key: "disponibles", width: 12, align: "center" },
              { header: "Asistieron", key: "asistieron", width: 12, align: "center" },
              { header: "Recaudación Validada", key: "ingresos_validados", width: 20, isCurrency: true },
              { header: "Estado", key: "estado", width: 16, align: "center" },
            ]}
            obtenerFilas={() =>
              talleresFiltrados.map((t) => ({
                nombre: t.nombre,
                lugar: t.lugar,
                fecha: t.fecha_inicio
                  ? new Date(t.fecha_inicio).toLocaleDateString("es-PE", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-",
                precio_pen: Number(t.precio_pen || 0),
                precio_preventa_pen: t.precio_preventa_pen ? Number(t.precio_preventa_pen) : 0,
                cupos_totales: t.cupos_totales,
                ocupados: t.ocupados,
                disponibles: t.disponibles,
                asistieron: t.asistieron,
                ingresos_validados: Number(t.ingresos_validados || 0),
                estado:
                  t.estado === "publicado"
                    ? "Publicado"
                    : t.estado === "cancelado"
                    ? "Cancelado"
                    : "Inhabilitado",
              }))
            }
            obtenerTotal={(filas) => {
              const sumaAforo = filas.reduce((acc, f) => acc + Number(f.cupos_totales || 0), 0);
              const sumaOcupados = filas.reduce((acc, f) => acc + Number(f.ocupados || 0), 0);
              const sumaDisponibles = filas.reduce((acc, f) => acc + Number(f.disponibles || 0), 0);
              const sumaAsistieron = filas.reduce((acc, f) => acc + Number(f.asistieron || 0), 0);
              const sumaIngresos = filas.reduce((acc, f) => acc + Number(f.ingresos_validados || 0), 0);
              return {
                label: "TOTALES",
                columnaLabel: "nombre",
                valores: {
                  cupos_totales: sumaAforo,
                  ocupados: sumaOcupados,
                  disponibles: sumaDisponibles,
                  asistieron: sumaAsistieron,
                  ingresos_validados: sumaIngresos,
                },
              };
            }}
          />
        </div>

        {talleresFiltrados.length === 0 ? (
          <div className="flex h-36 flex-col items-center justify-center gap-1.5 p-6 text-center text-muted-foreground">
            <Calendar className="size-8 opacity-40 text-icon-accent" />
            <p className="text-sm font-medium">No se encontraron talleres con los filtros actuales.</p>
          </div>
        ) : (
          <>
            {/* VISTA 1: ESCRITORIO Y LAPTOPS (Degradación progresiva sin scroll horizontal) */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-5">Taller y Ubicación</TableHead>
                    {/* Fecha y Hora: Oculto en laptops (< xl) */}
                    <TableHead className="px-4 hidden xl:table-cell">Fecha y Hora</TableHead>
                    {/* Precio: Agrupado en xl, oculto en laptops (< xl) */}
                    <TableHead className="px-4 hidden xl:table-cell">Precio Regular</TableHead>
                    {/* Precio Preventa: Dedicado en 2xl (pantallas 23"+) */}
                    <TableHead className="px-4 hidden 2xl:table-cell">Precio Preventa</TableHead>
                    {/* Aforo / Cupos: Dedicado en 2xl (pantallas 23"+) */}
                    <TableHead className="px-4 text-center hidden 2xl:table-cell">Aforo / Cupos</TableHead>
                    <TableHead className="px-4 text-center">Estado</TableHead>
                    {/* En Puerta: Dedicado en 2xl (pantallas 23"+) */}
                    <TableHead className="px-4 text-center hidden 2xl:table-cell">En Puerta</TableHead>
                    <TableHead className="px-5 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {talleresFiltrados.map((t) => (
                    <TableRow key={t.id}>
                      {/* Nombre y Lugar (+ Fecha anidada en laptops < xl) */}
                      <TableCell className="px-5 py-4">
                        <Link
                          href={`/panel-admin/talleres/${t.id}`}
                          className="font-bold text-heading hover:text-icon-accent transition-colors block text-sm max-w-[200px] sm:max-w-xs xl:max-w-md truncate"
                        >
                          {t.nombre}
                        </Link>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs mt-0.5">
                          <MapPin className="size-3.5 text-muted-foreground/70 shrink-0" />
                          <span className="truncate max-w-[200px] sm:max-w-[240px]">{t.lugar || t.direccion || "Por definir"}</span>
                        </div>
                        {/* En laptops (< xl), mostramos la fecha compacta aquí */}
                        <div className="xl:hidden flex items-center gap-2 text-[11px] text-muted-foreground font-medium mt-1">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="size-3 text-icon-accent shrink-0" />
                            <span>{formatearFecha(t.fecha_inicio)}</span>
                          </span>
                          <span className="font-bold text-heading">
                            • S/ {Number(t.precio_pen).toFixed(2)}
                          </span>
                        </div>
                      </TableCell>

                      {/* Fecha y Hora (Visible en pantallas xl+) */}
                      <TableCell className="px-4 whitespace-nowrap hidden xl:table-cell">
                        <div className="flex items-center gap-1.5 text-foreground text-xs font-medium">
                          <Calendar className="size-3.5 text-icon-accent shrink-0" />
                          <span>{formatearFecha(t.fecha_inicio)}</span>
                        </div>
                      </TableCell>

                      {/* Precio Regular (+ Preventa anidada en xl, oculto en < xl) */}
                      <TableCell className="px-4 font-bold text-heading text-sm tabular-nums whitespace-nowrap hidden xl:table-cell">
                        <div>S/ {Number(t.precio_pen).toFixed(2)}</div>
                        {t.precio_preventa_pen !== null && t.precio_preventa_pen !== undefined ? (
                          <div className="2xl:hidden text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                            Prev: S/ {Number(t.precio_preventa_pen).toFixed(2)}
                          </div>
                        ) : null}
                      </TableCell>

                      {/* Precio Preventa (Dedicado en 2xl+) */}
                      <TableCell className="px-4 text-sm font-medium tabular-nums hidden 2xl:table-cell whitespace-nowrap">
                        {t.precio_preventa_pen !== null && t.precio_preventa_pen !== undefined ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            S/ {Number(t.precio_preventa_pen).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40 font-mono">—</span>
                        )}
                      </TableCell>

                      {/* Aforo / Cupos (Dedicado en pantallas 2xl+) */}
                      <TableCell className="px-4 text-center whitespace-nowrap hidden 2xl:table-cell">
                        <div className="font-bold text-heading text-sm tabular-nums">
                          {t.ocupados} / {t.cupos_totales}
                        </div>
                        <div className="text-[11px] text-muted-foreground tabular-nums">
                          {t.disponibles} disponibles
                        </div>
                      </TableCell>

                      {/* Estado */}
                      <TableCell className="px-4 text-center whitespace-nowrap">
                        <Badge
                          variant={
                            t.estado === "publicado"
                              ? "default"
                              : t.estado === "cancelado"
                              ? "destructive"
                              : "secondary"
                          }
                          className={
                            t.estado === "publicado"
                              ? "bg-emerald-600 text-white font-bold text-xs"
                              : t.estado === "cancelado"
                              ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-xs border-transparent"
                              : "bg-slate-500/15 text-slate-600 dark:text-slate-400 font-bold text-xs border-transparent"
                          }
                        >
                          {t.estado === "publicado"
                            ? "Publicado"
                            : t.estado === "cancelado"
                            ? "Cancelado"
                            : "Inhabilitado"}
                        </Badge>
                      </TableCell>

                      {/* En Puerta (Asistencia) - Dedicado en pantallas 2xl+) */}
                      <TableCell className="px-4 text-center hidden 2xl:table-cell whitespace-nowrap">
                        <Badge
                          variant={t.asistieron > 0 ? "default" : "secondary"}
                          className={
                            t.asistieron > 0
                              ? "bg-emerald-600 text-white font-bold text-xs"
                              : "font-bold text-muted-foreground text-xs"
                          }
                        >
                          {t.asistieron} ingresaron
                        </Badge>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            nativeButton={false}
                            render={
                              <Link href={`/panel-admin/talleres/${t.id}`}>
                                <span><span className="hidden xl:inline">Ver </span>Asistentes</span>
                                <ChevronRight className="size-3.5 ml-1" />
                              </Link>
                            }
                            className="rounded-full px-3 sm:px-4 text-xs font-bold"
                          />

                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => setTallerParaEditar(t)}
                            className="size-8 rounded-full border border-slate-300 bg-slate-100 text-icon-accent shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 cursor-pointer"
                            title="Editar taller"
                          >
                            <Pencil className="size-4" />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="size-8 rounded-full border border-slate-300 bg-slate-100 text-icon-accent shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 cursor-pointer"
                                  title="Opciones y gestión del taller"
                                >
                                  <Settings2 className="size-4" />
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem
                                onClick={() => setTallerParaEditar(t)}
                                className="cursor-pointer text-xs font-medium"
                              >
                                <Pencil className="size-3.5 mr-2 text-icon-accent" />
                                <span>Editar taller</span>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => setTallerParaEscaner({ id: t.id, nombre: t.nombre })}
                                className="cursor-pointer text-xs font-medium"
                              >
                                <Camera className="size-3.5 mr-2 text-icon-accent" />
                                <span>Escanear QR en puerta</span>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() =>
                                  setTallerParaReserva({
                                    id: t.id,
                                    nombre: t.nombre,
                                    precio: t.precio_pen,
                                    fechaInicio: t.fecha_inicio,
                                  })
                                }
                                className="cursor-pointer text-xs font-medium"
                              >
                                <UserPlus className="size-3.5 mr-2 text-icon-accent" />
                                <span>Registrar reserva manual</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* VISTA 2: TARJETAS EN CELULAR (< md) */}
            <div className="flex flex-col gap-3 p-4 md:hidden border-t">
              {talleresFiltrados.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge
                          variant={
                            t.estado === "publicado"
                              ? "default"
                              : t.estado === "cancelado"
                              ? "destructive"
                              : "secondary"
                          }
                          className={
                            t.estado === "publicado"
                              ? "bg-emerald-600 text-white font-bold text-[10px]"
                              : t.estado === "cancelado"
                              ? "font-bold text-[10px]"
                              : "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-transparent font-bold text-[10px]"
                          }
                        >
                          {t.estado === "publicado"
                            ? "Publicado"
                            : t.estado === "cancelado"
                            ? "Cancelado"
                            : "Inhabilitado"}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-sm text-heading">
                        {t.nombre}
                      </h3>
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs mt-1">
                        <Calendar className="size-3.5 text-icon-accent shrink-0" />
                        <span>{formatearFecha(t.fecha_inicio)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs mt-0.5">
                        <MapPin className="size-3.5 text-muted-foreground/70 shrink-0" />
                        <span className="truncate">{t.lugar || t.direccion}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <Badge className="bg-emerald-600 text-white font-bold text-xs">
                        S/ {Number(t.precio_pen).toFixed(2)}
                      </Badge>
                      {t.precio_preventa_pen !== null && t.precio_preventa_pen !== undefined && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
                          Prev: S/ {Number(t.precio_preventa_pen).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Métricas de Ocupación */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-muted/50 rounded-xl text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Ocupación:</span>
                      <span className="font-bold text-heading">
                        {t.ocupados} / {t.cupos_totales} cupos
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Ingresaron en puerta:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {t.asistieron} asistentes
                      </span>
                    </div>
                  </div>

                  {/* Botones de Acción Móvil */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      nativeButton={false}
                      render={
                        <Link href={`/panel-admin/talleres/${t.id}`}>
                          <span>Ver Asistentes</span>
                          <ChevronRight className="size-3.5 ml-1" />
                        </Link>
                      }
                      className="flex-1 rounded-full text-xs font-bold h-9"
                    />

                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setTallerParaEditar(t)}
                      className="size-9 shrink-0 rounded-full border border-slate-300 bg-slate-100 text-icon-accent shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 cursor-pointer"
                      title="Editar taller"
                    >
                      <Pencil className="size-4" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            size="icon"
                            variant="outline"
                            className="size-9 shrink-0 rounded-full border border-slate-300 bg-slate-100 text-icon-accent shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 cursor-pointer"
                            title="Opciones y gestión del taller"
                          >
                            <Settings2 className="size-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem
                          onClick={() => setTallerParaEditar(t)}
                          className="cursor-pointer text-xs font-medium"
                        >
                          <Pencil className="size-3.5 mr-2 text-icon-accent" />
                          <span>Editar taller</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => setTallerParaEscaner({ id: t.id, nombre: t.nombre })}
                          className="cursor-pointer text-xs font-medium"
                        >
                          <Camera className="size-3.5 mr-2 text-icon-accent" />
                          <span>Escanear QR en puerta</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() =>
                            setTallerParaReserva({
                              id: t.id,
                              nombre: t.nombre,
                              precio: t.precio_pen,
                              fechaInicio: t.fecha_inicio,
                            })
                          }
                          className="cursor-pointer text-xs font-medium"
                        >
                          <UserPlus className="size-3.5 mr-2 text-icon-accent" />
                          <span>Registrar reserva manual</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Modales Controlados (uno solo montado cuando se requiera) */}
      {tallerParaEscaner && (
        <EscanerPuertaDialog
          tallerId={tallerParaEscaner.id}
          tallerNombre={tallerParaEscaner.nombre}
          open={true}
          onOpenChange={(abierto) => {
            if (!abierto) setTallerParaEscaner(null);
          }}
        />
      )}

      {tallerParaReserva && (
        <ModalReservaManual
          tallerId={tallerParaReserva.id}
          tallerNombre={tallerParaReserva.nombre}
          precioTotal={tallerParaReserva.precio}
          tallerFechaInicio={tallerParaReserva.fechaInicio}
          open={true}
          onOpenChange={(abierto) => {
            if (!abierto) setTallerParaReserva(null);
          }}
        />
      )}

      {tallerParaEditar && (
        <ModalEditarTaller
          taller={tallerParaEditar}
          open={true}
          onOpenChange={(abierto) => {
            if (!abierto) setTallerParaEditar(null);
          }}
          onTallerActualizado={(actualizado) => {
            setListaTalleres((prev) =>
              prev.map((item) =>
                item.id === actualizado.id
                  ? {
                      ...item,
                      nombre: actualizado.nombre,
                      descripcion: actualizado.descripcion ?? null,
                      fecha_inicio: actualizado.fecha_inicio,
                      fecha_fin: actualizado.fecha_fin,
                      lugar: actualizado.lugar,
                      direccion: actualizado.direccion ?? null,
                      referencia: actualizado.referencia ?? null,
                      cupos_totales: actualizado.cupos_totales,
                      precio_pen: actualizado.precio_pen,
                      precio_preventa_pen: actualizado.precio_preventa_pen ?? null,
                      preventa_hasta: actualizado.preventa_hasta ?? null,
                      material_incluido: actualizado.material_incluido ?? null,
                      horas_academicas: actualizado.horas_academicas ?? null,
                      estado: actualizado.estado,
                    }
                  : item
              )
            );
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
