"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BookOpen,
  Search,
  ArrowRight,
  Layers,
  Video,
  Settings2,
  Eye,
  EyeOff,
  Users,
  Pencil,
} from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { alternarEstadoCurso } from "@/server/cursos/acciones";
import { ModalEditarCurso } from "./modal-editar-curso";
import type { CuponSimple } from "./simulador-ganancia-precios";
import { BotonExportarTablaExcel } from "@/components/admin/shared/boton-exportar-tabla-excel";

export type CursoItem = {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  precio_pen: number;
  precio_usd: number | null;
  imagen_url: string | null;
  activo: boolean;
  creado_en: string;
  modulos?: {
    id: string;
    lecciones?: { id: string }[];
  }[];
};

export function TablaCursos({
  cursos,
  cupones = [],
}: {
  cursos: CursoItem[];
  cupones?: CuponSimple[];
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "publicados" | "inhabilitados">("todos");
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);
  const [cursoParaEditar, setCursoParaEditar] = useState<CursoItem | null>(null);

  const handleAlternarEstado = async (curso: CursoItem) => {
    setActualizandoId(curso.id);
    const nuevoEstado = !curso.activo;
    try {
      const res = await alternarEstadoCurso(curso.id, nuevoEstado);
      if (!res.ok) {
        toast.error(res.error || "No se pudo cambiar el estado del curso.");
      } else {
        toast.success(
          nuevoEstado
            ? `El curso "${curso.nombre}" ahora está publicado.`
            : `El curso "${curso.nombre}" se inhabilitó.`
        );
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar curso.");
    } finally {
      setActualizandoId(null);
    }
  };

  const conteos = useMemo(() => {
    return {
      todos: cursos.length,
      publicados: cursos.filter((c) => c.activo).length,
      inhabilitados: cursos.filter((c) => !c.activo).length,
    };
  }, [cursos]);

  const cursosFiltrados = useMemo(() => {
    return cursos.filter((c) => {
      const matchBusqueda =
        c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.slug.toLowerCase().includes(busqueda.toLowerCase());

      if (!matchBusqueda) return false;

      if (filtroEstado === "publicados") return c.activo;
      if (filtroEstado === "inhabilitados") return !c.activo;
      return true;
    });
  }, [cursos, busqueda, filtroEstado]);

  const hayFiltrosActivos = busqueda.trim() !== "" || filtroEstado !== "todos";

  return (
    <div className="flex flex-col gap-6">
      {/* Barra de Filtros y Búsqueda — Estilo idéntico a Cupones */}
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
                placeholder="Buscar curso por nombre o slug…"
                aria-label="Buscar curso por nombre o slug"
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

      {/* Tabla de Cursos usando shadcn */}
      <Card className="gap-0 py-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-heading">Cursos Disponibles</h2>
            <span
              aria-live="polite"
              className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium tabular-nums"
            >
              Mostrando {cursosFiltrados.length} de {cursos.length}
            </span>
          </div>

          <BotonExportarTablaExcel
            nombreArchivo="cursos-amorelo"
            titulo="AMORELO — CATÁLOGO DE CURSOS Y CLASES VIRTUALES"
            subtitulo={`Catálogo Académico • Exportado el ${new Date().toLocaleDateString("es-PE")}`}
            nombreHoja="Cursos"
            totalFiltrados={cursosFiltrados.length}
            columnas={[
              { header: "Nombre del Curso", key: "nombre", width: 36, align: "left" },
              { header: "Slug / URL", key: "slug", width: 28, align: "left" },
              { header: "Precio (PEN)", key: "precio_pen", width: 16, isCurrency: true },
              { header: "Precio (USD)", key: "precio_usd", width: 16, align: "right" },
              { header: "Módulos", key: "modulos", width: 12, align: "center" },
              { header: "Lecciones", key: "lecciones", width: 12, align: "center" },
              { header: "Estado", key: "estado", width: 16, align: "center" },
              { header: "Fecha Creación", key: "creado_en", width: 16, align: "center" },
            ]}
            obtenerFilas={() =>
              cursosFiltrados.map((c) => ({
                nombre: c.nombre,
                slug: c.slug,
                precio_pen: Number(c.precio_pen || 0),
                precio_usd: c.precio_usd ? `$ ${Number(c.precio_usd).toFixed(2)}` : "-",
                modulos: c.modulos?.length ?? 0,
                lecciones:
                  c.modulos?.reduce((acc, m) => acc + (m.lecciones?.length ?? 0), 0) ?? 0,
                estado: c.activo ? "Publicado" : "Inhabilitado",
                creado_en: c.creado_en ? new Date(c.creado_en).toLocaleDateString("es-PE") : "-",
              }))
            }
            obtenerTotal={(filas) => {
              const sumaPEN = filas.reduce((acc, f) => acc + Number(f.precio_pen || 0), 0);
              return {
                label: "TOTAL PRECIOS PEN",
                columnaLabel: "nombre",
                valores: {
                  precio_pen: sumaPEN,
                },
              };
            }}
          />
        </div>

        {cursosFiltrados.length === 0 ? (
          <div className="flex h-36 flex-col items-center justify-center gap-1.5 p-6 text-center text-muted-foreground">
            <BookOpen className="size-8 opacity-40 text-icon-accent" />
            <p className="text-sm font-medium">No se encontraron cursos con los filtros actuales.</p>
          </div>
        ) : (
          <>
            {/* VISTA 1: ESCRITORIO Y LAPTOPS (Degradación progresiva sin scroll horizontal) */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-5">Curso</TableHead>
                    {/* Precio: Agrupado en xl, oculto por completo en laptops (< xl) */}
                    <TableHead className="px-4 hidden xl:table-cell">Precio (PEN)</TableHead>
                    {/* Precio USD: Columna dedicada en 2xl (pantallas 23"+) */}
                    <TableHead className="px-4 hidden 2xl:table-cell">Precio (USD)</TableHead>
                    {/* Estructura: Columna dedicada en 2xl (pantallas 23"+) */}
                    <TableHead className="px-4 hidden 2xl:table-cell">Estructura</TableHead>
                    <TableHead className="px-4">Estado</TableHead>
                    <TableHead className="px-5 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cursosFiltrados.map((c) => {
                    const totalModulos = c.modulos?.length ?? 0;
                    const totalLecciones =
                      c.modulos?.reduce(
                        (acc, m) => acc + (m.lecciones?.length ?? 0),
                        0,
                      ) ?? 0;

                    return (
                      <TableRow key={c.id}>
                        {/* Curso Info */}
                        <TableCell className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border bg-muted">
                              {c.imagen_url ? (
                                <Image
                                  src={c.imagen_url}
                                  alt={c.nombre}
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-icon-accent-soft text-icon-accent">
                                  <BookOpen className="size-5" />
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-heading text-sm truncate max-w-[200px] sm:max-w-xs xl:max-w-sm">
                                {c.nombre}
                              </span>
                              <span className="text-[11px] font-mono text-muted-foreground">
                                /{c.slug}
                              </span>
                              {c.descripcion && (
                                <p className="mt-0.5 line-clamp-1 max-w-xs xl:max-w-sm hidden xl:block text-xs text-muted-foreground">
                                  {c.descripcion}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Precio PEN (+ USD anidado en xl, oculto en < xl) */}
                        <TableCell className="px-4 font-bold text-heading text-sm tabular-nums whitespace-nowrap hidden xl:table-cell">
                          <div>S/ {Number(c.precio_pen).toFixed(2)}</div>
                          {c.precio_usd !== null && c.precio_usd !== undefined ? (
                            <div className="2xl:hidden text-[11px] text-muted-foreground font-mono mt-0.5">
                              ${Number(c.precio_usd).toFixed(2)} USD
                            </div>
                          ) : null}
                        </TableCell>

                        {/* Precio USD (Dedicado en pantallas 2xl+) */}
                        <TableCell className="px-4 text-sm font-medium tabular-nums hidden 2xl:table-cell whitespace-nowrap">
                          {c.precio_usd !== null && c.precio_usd !== undefined ? (
                            <span className="text-muted-foreground">${Number(c.precio_usd).toFixed(2)}</span>
                          ) : (
                            <span className="text-muted-foreground/40 font-mono">—</span>
                          )}
                        </TableCell>

                        {/* Estructura (Módulos / Lecciones) - Dedicado en pantallas 2xl+ */}
                        <TableCell className="px-4 hidden 2xl:table-cell">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 font-semibold text-foreground">
                              <Layers className="size-3.5 text-icon-accent" />
                              <span>{totalModulos} {totalModulos === 1 ? "módulo" : "módulos"}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 font-semibold text-foreground">
                              <Video className="size-3.5 text-icon-accent" />
                              <span>{totalLecciones} {totalLecciones === 1 ? "clase" : "clases"}</span>
                            </span>
                          </div>
                        </TableCell>

                        {/* Estado */}
                        <TableCell className="px-4 whitespace-nowrap">
                          <Badge
                            variant={c.activo ? "default" : "secondary"}
                            className={
                              c.activo
                                ? "bg-emerald-600 text-white font-bold"
                                : "font-bold text-muted-foreground"
                            }
                          >
                            {c.activo ? "Publicado" : "Inhabilitado"}
                          </Badge>
                        </TableCell>

                        {/* Acciones */}
                        <TableCell className="px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {/* 1. Gestionar Temario */}
                            <Button
                              size="sm"
                              nativeButton={false}
                              render={
                                <Link href={`/panel-admin/cursos/${c.id}`}>
                                  <span>
                                    <span className="hidden xl:inline">Gestionar </span>Temario
                                  </span>
                                </Link>
                              }
                              className="rounded-full px-3 sm:px-4 text-xs font-bold"
                            />

                            {/* 2. Lápiz de edición */}
                            <Button
                              size="icon"
                              variant="outline"
                              title="Editar datos y precios del curso"
                              onClick={() => setCursoParaEditar(c)}
                              className="size-8 rounded-full border border-slate-300 bg-slate-100 text-icon-accent shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 cursor-pointer"
                            >
                              <Pencil className="size-4" />
                              <span className="sr-only">Editar datos y precios</span>
                            </Button>

                            {/* 3. Menú de otras opciones */}
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="size-8 rounded-full border border-slate-300 bg-slate-100 text-icon-accent shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 cursor-pointer"
                                    title="Configuración y opciones del curso"
                                  >
                                    <Settings2 className="size-4" />
                                  </Button>
                                }
                              />
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem
                                  onClick={() => setCursoParaEditar(c)}
                                  className="cursor-pointer text-xs font-medium"
                                >
                                  <Pencil className="size-3.5 mr-2 text-icon-accent" />
                                  <span>Editar datos y precios</span>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() => handleAlternarEstado(c)}
                                  disabled={actualizandoId === c.id}
                                  className="cursor-pointer text-xs font-medium"
                                >
                                  {c.activo ? (
                                    <>
                                      <EyeOff className="size-3.5 mr-2 text-amber-600 dark:text-amber-400" />
                                      <span>Inhabilitar curso</span>
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="size-3.5 mr-2 text-emerald-600 dark:text-emerald-400" />
                                      <span>Publicar curso (Visible)</span>
                                    </>
                                  )}
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(`/panel-admin/clientes?buscar=${encodeURIComponent(c.nombre)}`)
                                  }
                                  className="cursor-pointer text-xs font-medium"
                                >
                                  <Users className="size-3.5 mr-2 text-icon-accent" />
                                  <span>Ver alumnos inscritos</span>
                                </DropdownMenuItem>
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

            {/* VISTA 2: CELULAR (Tarjetas por fila únicamente en pantallas móviles < md) */}
            <div className="flex flex-col gap-3 p-4 md:hidden border-t">
              {cursosFiltrados.map((c) => {
                const totalModulos = c.modulos?.length ?? 0;
                const totalLecciones =
                  c.modulos?.reduce(
                    (acc, m) => acc + (m.lecciones?.length ?? 0),
                    0,
                  ) ?? 0;

                return (
                  <div
                    key={c.id}
                    className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs"
                  >
                    {/* Fila Superior: Imagen + Título + Estado */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border bg-muted">
                          {c.imagen_url ? (
                            <Image
                              src={c.imagen_url}
                              alt={c.nombre}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-icon-accent-soft text-icon-accent">
                              <BookOpen className="size-5" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-heading text-sm truncate">
                            {c.nombre}
                          </span>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            /{c.slug}
                          </span>
                        </div>
                      </div>

                      <Badge
                        variant={c.activo ? "default" : "secondary"}
                        className={
                          c.activo
                            ? "bg-emerald-600 text-white font-bold text-xs shrink-0"
                            : "font-bold text-muted-foreground text-xs shrink-0"
                        }
                      >
                        {c.activo ? "Publicado" : "Inhabilitado"}
                      </Badge>
                    </div>

                    {/* Fila Central: Precios + Estructura */}
                    <div className="flex items-center justify-between gap-2 border-y border-border/60 py-2.5 text-xs">
                      <div className="flex flex-col">
                        <span className="font-bold text-heading text-sm tabular-nums">
                          S/ {Number(c.precio_pen).toFixed(2)}
                        </span>
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {c.precio_usd !== null && c.precio_usd !== undefined
                            ? `$${Number(c.precio_usd).toFixed(2)} USD`
                            : "Sin USD"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 font-semibold">
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] text-foreground">
                          <Layers className="size-3 text-icon-accent" />
                          <span>{totalModulos} mod.</span>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] text-foreground">
                          <Video className="size-3 text-icon-accent" />
                          <span>{totalLecciones} clases</span>
                        </span>
                      </div>
                    </div>

                    {/* Fila Inferior: Botón Gestionar Temario + Botón Lápiz + Menú Opciones */}
                    <div className="flex items-center gap-2">
                      {/* 1. Gestionar Temario (sin flecha) */}
                      <Button
                        size="sm"
                        nativeButton={false}
                        render={
                          <Link href={`/panel-admin/cursos/${c.id}`}>
                            <span>Gestionar Temario</span>
                          </Link>
                        }
                        className="flex-1 rounded-full text-xs font-bold h-9"
                      />

                      {/* 2. Lápiz de edición */}
                      <Button
                        size="icon"
                        variant="outline"
                        title="Editar datos y precios del curso"
                        onClick={() => setCursoParaEditar(c)}
                        className="size-9 shrink-0 rounded-full border border-slate-300 bg-slate-100 text-icon-accent shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 cursor-pointer"
                      >
                        <Pencil className="size-4" />
                        <span className="sr-only">Editar datos y precios</span>
                      </Button>

                      {/* 3. Menú de opciones */}
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              size="icon"
                              variant="outline"
                              className="size-9 shrink-0 rounded-full border border-slate-300 bg-slate-100 text-icon-accent shadow-xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 cursor-pointer"
                              title="Configuración y opciones del curso"
                            >
                              <Settings2 className="size-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem
                            onClick={() => setCursoParaEditar(c)}
                            className="cursor-pointer text-xs font-medium"
                          >
                            <Pencil className="size-3.5 mr-2 text-icon-accent" />
                            <span>Editar datos y precios</span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => handleAlternarEstado(c)}
                            disabled={actualizandoId === c.id}
                            className="cursor-pointer text-xs font-medium"
                          >
                            {c.activo ? (
                              <>
                                <EyeOff className="size-3.5 mr-2 text-amber-600 dark:text-amber-400" />
                                <span>Inhabilitar curso</span>
                              </>
                            ) : (
                              <>
                                <Eye className="size-3.5 mr-2 text-emerald-600 dark:text-emerald-400" />
                                <span>Publicar curso (Visible)</span>
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/panel-admin/clientes?buscar=${encodeURIComponent(c.nombre)}`)
                            }
                            className="cursor-pointer text-xs font-medium"
                          >
                            <Users className="size-3.5 mr-2 text-icon-accent" />
                            <span>Ver alumnos inscritos</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {/* Modal de Edición de Curso (3 Columnas con Simulador Financiero) */}
      {cursoParaEditar && (
        <ModalEditarCurso
          curso={cursoParaEditar}
          cupones={cupones}
          open={!!cursoParaEditar}
          onOpenChange={(abierto) => {
            if (!abierto) setCursoParaEditar(null);
          }}
        />
      )}
    </div>
  );
}
