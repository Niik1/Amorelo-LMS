// Tabla de cupones: filtros, alta y edición en diálogo, y activar/inhabilitar
// por fila. En desktop es una tabla; debajo de lg, la misma información se
// apila en filas-card para no arrastrar 7 columnas con scroll horizontal.

"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Pencil, Plus, Ticket } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CuponForm } from "@/components/admin/cupon-form";
import { CuponesFiltros } from "@/components/admin/cupones-filtros";
import { alternarCupon } from "@/server/cupones/acciones";
import { BotonExportarTablaExcel } from "@/components/admin/shared/boton-exportar-tabla-excel";
import type { FilaCupon } from "@/lib/cupones/tipos";
import {
  contarPorEstado,
  estadoUsos,
  FILTROS_VACIOS,
  filtrarCupones,
  formatoDescuento,
  textoVigencia,
  type Filtros,
} from "@/lib/cupones/vista";
import { cn } from "@/lib/utils";

export type { FilaCupon };

function Codigo({ codigo }: { codigo: string }) {
  return (
    <span className="bg-muted text-foreground inline-flex items-center rounded-lg px-2 py-1 font-mono text-[13px] font-semibold tracking-wide">
      {codigo}
    </span>
  );
}

function EstadoCupon({ activo }: { activo: boolean }) {
  return (
    <Badge
      variant={activo ? "default" : "secondary"}
      className={
        activo
          ? "bg-emerald-600 text-white font-bold"
          : "font-bold text-muted-foreground"
      }
    >
      {activo ? "Activo" : "Inactivo"}
    </Badge>
  );
}

function Vigencia({ fila }: { fila: FilaCupon }) {
  const vista = textoVigencia(fila);
  if (!vista.conFecha) {
    return (
      <span className="text-muted-foreground text-[13px]">{vista.texto}</span>
    );
  }
  return (
    <span
      title={vista.titulo ?? undefined}
      className="bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60 inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold"
    >
      <CalendarDays aria-hidden="true" className="size-3.5" />
      {vista.texto}
    </span>
  );
}

function Usos({ fila }: { fila: FilaCupon }) {
  const vista = estadoUsos(fila);
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          "text-[13px] font-semibold tabular-nums",
          vista.agotado && "text-destructive",
        )}
      >
        {vista.texto}
      </span>
      {vista.porcentaje !== null ? (
        <span
          role="progressbar"
          aria-label={`Usos de ${fila.codigo}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={vista.porcentaje}
          className="bg-muted h-1.5 w-16 overflow-hidden rounded-full"
        >
          <span
            className={cn(
              "block h-full rounded-full",
              vista.agotado ? "bg-destructive" : "bg-primary/60",
            )}
            style={{ width: `${vista.porcentaje}%` }}
          />
        </span>
      ) : (
        <span className="text-muted-foreground text-xs">{vista.detalle}</span>
      )}
    </div>
  );
}

function Acciones({
  fila,
  pendiente,
  onEditar,
  onAlternar,
}: {
  fila: FilaCupon;
  pendiente: boolean;
  onEditar: (fila: FilaCupon) => void;
  onAlternar: (fila: FilaCupon) => void;
}) {
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="rounded-full"
        title={`Editar ${fila.codigo}`}
        aria-label={`Editar ${fila.codigo}`}
        onClick={() => onEditar(fila)}
      >
        <Pencil aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pendiente}
        onClick={() => onAlternar(fila)}
        className={cn(
          "h-9 rounded-full px-4",
          !fila.activo && !pendiente && "text-primary",
        )}
      >
        {pendiente ? "Guardando…" : fila.activo ? "Inhabilitar" : "Activar"}
      </Button>
    </>
  );
}

function EstadoVacio({
  total,
  onCrear,
  onLimpiar,
}: {
  total: number;
  onCrear: () => void;
  onLimpiar: () => void;
}) {
  const sinCupones = total === 0;
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-2xl">
        <Ticket aria-hidden="true" className="size-6" />
      </span>
      <div>
        <p className="font-semibold">
          {sinCupones ? "Todavía no hay cupones" : "Ningún cupón coincide"}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {sinCupones
            ? "Crea el primero para compartirlo en el live o en la web."
            : "Prueba con otro código o limpia los filtros."}
        </p>
      </div>
      {sinCupones ? (
        <Button type="button" onClick={onCrear} className="mt-1 rounded-full">
          <Plus aria-hidden="true" />
          Agregar cupón
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={onLimpiar}
          className="mt-1 rounded-full"
        >
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}

export function CuponesTabla({ filas }: { filas: FilaCupon[] }) {
  const router = useRouter();
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS);
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<FilaCupon | null>(null);
  const [pendiente, setPendiente] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  // "Ahora" se fija al cambiar un filtro, no en render: la regla de pureza de
  // React prohíbe Date.now() ahí, y así el filtro de vigencia es estable.
  const [ahora, setAhora] = useState(0);

  const ordenadas = useMemo(
    () =>
      [...filas].sort(
        (a, b) =>
          Number(b.activo) - Number(a.activo) ||
          b.creado_en.localeCompare(a.creado_en),
      ),
    [filas],
  );

  const visibles = useMemo(
    () => filtrarCupones(ordenadas, filtros, ahora),
    [ordenadas, filtros, ahora],
  );

  const conteos = useMemo(() => contarPorEstado(ordenadas), [ordenadas]);

  const cambiar = <K extends keyof Filtros>(campo: K, nuevo: Filtros[K]) => {
    setFiltros((f) => ({ ...f, [campo]: nuevo }) as Filtros);
    setAhora(Date.now());
  };

  const limpiar = () => {
    setFiltros(FILTROS_VACIOS);
    setAhora(Date.now());
  };

  const alternar = (fila: FilaCupon) => {
    setPendiente(fila.id);
    startTransition(async () => {
      const r = await alternarCupon(fila.id, !fila.activo);
      setPendiente(null);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(
        fila.activo
          ? `${fila.codigo} quedó inhabilitado.`
          : `${fila.codigo} quedó activo.`,
      );
      router.refresh();
    });
  };

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Banner Principal con Botón Blanco */}
      <ModuloBanner
        titulo="Cupones de Descuento"
        descripcion="Códigos promocionales para cursos virtuales, lives y campañas de marketing."
        icono={Ticket}
        acciones={
          <Button
            type="button"
            onClick={() => setCreando(true)}
            className="rounded-full bg-white font-bold text-[#1e3a8a] shadow-sm hover:bg-slate-100 cursor-pointer"
          >
            <Plus className="mr-1.5 size-4" />
            <span>Agregar cupón</span>
          </Button>
        }
      />

      <CuponesFiltros
        valor={filtros}
        conteos={conteos}
        onCambio={cambiar}
        onLimpiar={limpiar}
      />

      <Card className="gap-0 py-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-heading">Cupones Disponibles</h2>
            <span
              aria-live="polite"
              className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium tabular-nums"
            >
              Mostrando {visibles.length} de {filas.length}
            </span>
          </div>

          <BotonExportarTablaExcel
            nombreArchivo="cupones-amorelo"
            titulo="AMORELO — REGISTRO DE CUPONES DE DESCUENTO"
            subtitulo={`Campañas y Promociones • Exportado el ${new Date().toLocaleDateString("es-PE")}`}
            nombreHoja="Cupones"
            totalFiltrados={visibles.length}
            columnas={[
              { header: "Código Cupón", key: "codigo", width: 20, align: "center" },
              { header: "Tipo Descuento", key: "tipo_descuento", width: 18, align: "center" },
              { header: "Descuento", key: "descuento", width: 16, align: "center" },
              { header: "Vigencia", key: "vigencia", width: 28, align: "center" },
              { header: "Usos Actuales", key: "usos_actuales", width: 15, align: "center" },
              { header: "Límite de Usos", key: "usos_maximos", width: 15, align: "center" },
              { header: "Estado", key: "estado", width: 16, align: "center" },
              { header: "Fecha Creación", key: "creado_en", width: 16, align: "center" },
            ]}
            obtenerFilas={() =>
              visibles.map((f) => ({
                codigo: f.codigo,
                tipo_descuento: f.tipo_descuento === "porcentaje" ? "Porcentaje" : "Monto Fijo",
                descuento: formatoDescuento(f),
                vigencia: textoVigencia(f),
                usos_actuales: f.usos_actuales,
                usos_maximos: f.usos_maximos ?? "Ilimitado",
                estado: f.activo ? "Activo" : "Inhabilitado",
                creado_en: f.creado_en ? new Date(f.creado_en).toLocaleDateString("es-PE") : "-",
              }))
            }
            obtenerTotal={(filasExport) => {
              const sumaUsos = filasExport.reduce((acc, f) => acc + Number(f.usos_actuales || 0), 0);
              return {
                label: "TOTAL USOS ACUMULADOS",
                columnaLabel: "codigo",
                valores: {
                  usos_actuales: sumaUsos,
                },
              };
            }}
          />
        </div>

        {visibles.length === 0 ? (
          <EstadoVacio
            total={filas.length}
            onCrear={() => setCreando(true)}
            onLimpiar={limpiar}
          />
        ) : (
          <>
            {/* VISTA 1: ESCRITORIO Y LAPTOPS (Tabla inteligente sin scroll horizontal) */}
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-5">Código</TableHead>
                    <TableHead className="px-4">Descuento</TableHead>
                    <TableHead className="px-4">Vigencia</TableHead>
                    <TableHead className="px-4">Usos</TableHead>
                    <TableHead className="px-4">Estado</TableHead>
                    <TableHead className="px-5 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibles.map((fila) => (
                    <TableRow
                      key={fila.id}
                      className={cn(!fila.activo && "opacity-60")}
                    >
                      <TableCell className="px-5 py-4">
                        <Codigo codigo={fila.codigo} />
                      </TableCell>
                      <TableCell className="px-4 py-4 font-bold tabular-nums">
                        {formatoDescuento(fila)}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Vigencia fila={fila} />
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Usos fila={fila} />
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <EstadoCupon activo={fila.activo} />
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Acciones
                            fila={fila}
                            pendiente={pendiente === fila.id}
                            onEditar={setEditando}
                            onAlternar={alternar}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* VISTA 2: MOBILE (Tarjetas apiladas) */}
            <div className="flex flex-col gap-3 p-4 lg:hidden border-t">
              {visibles.map((fila) => (
                <div
                  key={fila.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Codigo codigo={fila.codigo} />
                      <span className="text-[15px] font-bold tabular-nums">
                        {formatoDescuento(fila)}
                      </span>
                    </div>
                    <EstadoCupon activo={fila.activo} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 border-y border-border/60 py-2.5">
                    <Vigencia fila={fila} />
                    <Usos fila={fila} />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Acciones
                      fila={fila}
                      pendiente={pendiente === fila.id}
                      onEditar={setEditando}
                      onAlternar={alternar}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Modal Crear Cupón */}
      <Dialog open={creando} onOpenChange={setCreando}>
        <DialogContent className="flex max-h-[92svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl lg:max-w-5xl">
          <DialogHeader className="shrink-0 border-b px-6 py-4 sm:py-5 bg-card">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-icon-accent mb-1">
              <Ticket className="size-4" />
              <span>CUPÓN DE DESCUENTO</span>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-black text-heading tracking-tight">
              Agregar Nuevo Cupón
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Completa los datos del código promocional, porcentaje y vigencia.
            </DialogDescription>
          </DialogHeader>
          <CuponForm
            onExito={() => {
              setCreando(false);
              router.refresh();
            }}
            onCancelar={() => setCreando(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal Editar Cupón */}
      {editando && (
        <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
          <DialogContent className="flex max-h-[92svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl lg:max-w-5xl">
            <DialogHeader className="shrink-0 border-b px-6 py-4 sm:py-5 bg-card">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-icon-accent mb-1">
                <Ticket className="size-4" />
                <span>EDICIÓN DE CUPÓN</span>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-black text-heading tracking-tight">
                Editar Cupón: {editando.codigo}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Actualiza los valores de descuento, límites de uso y fechas de validez.
              </DialogDescription>
            </DialogHeader>
            <CuponForm
              key={editando.id}
              cupon={editando}
              onExito={() => {
                setEditando(null);
                router.refresh();
              }}
              onCancelar={() => setEditando(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


