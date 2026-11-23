// Admin: Vista de Asistentes y Puerta para un Taller Presencial específico.
// Fase 4: Item 4.3 y 4.4 del Checklist.

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  ArrowLeft,
  MapPin,
  Clock,
  PackageCheck,
  Camera,
  UserPlus,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  obtenerTallerDetalle,
  obtenerReservasTallerAdmin,
} from "@/server/talleres/consultas";
import { TablaAsistentes } from "@/components/admin/talleres/tabla-asistentes";
import { EscanerPuertaDialog } from "@/components/admin/talleres/escaner-puerta-dialog";
import { ModalReservaManual } from "@/components/admin/talleres/modal-reserva-manual";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Gestión de Asistentes | Taller Amorelo",
  robots: { index: false, follow: false },
};

export default async function DetalleTallerPage({ params }: Props) {
  const { id } = await params;
  const taller = await obtenerTallerDetalle(id);

  if (!taller) {
    notFound();
  }

  const asistentes = await obtenerReservasTallerAdmin(id);

  const formatearFecha = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("es-PE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <main className="flex w-full flex-1 flex-col gap-6 p-6 sm:p-8">
      {/* Botón Volver */}
      <div>
        <Link
          href="/panel-admin/talleres"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <span>Volver al catálogo de talleres</span>
        </Link>
      </div>

      {/* Ficha de Información del Taller */}
      <Card className="gap-0 p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-icon-accent font-bold text-xs border border-primary/20">
                Taller Presencial
              </Badge>
              <Badge
                variant={taller.estado === "publicado" ? "default" : "secondary"}
                className={
                  taller.estado === "publicado"
                    ? "bg-emerald-600 text-white font-bold text-xs"
                    : "font-bold text-muted-foreground text-xs"
                }
              >
                {taller.estado.toUpperCase()}
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-heading tracking-tight">
              {taller.nombre}
            </h1>
          </div>

          {/* Botones de Acción en Puerta y Reserva */}
          <div className="flex flex-wrap items-center gap-2.5">
            <EscanerPuertaDialog
              tallerId={taller.id}
              tallerNombre={taller.nombre}
              trigger={
                <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold gap-1.5 shadow-xs cursor-pointer">
                  <Camera className="size-4" />
                  <span>Escanear en Puerta</span>
                </Button>
              }
            />

            <ModalReservaManual
              tallerId={taller.id}
              tallerNombre={taller.nombre}
              precioTotal={taller.precio_pen}
              tallerFechaInicio={taller.fecha_inicio}
              trigger={
                <Button
                  variant="outline"
                  className="rounded-full border-border bg-card text-foreground hover:bg-muted text-xs font-bold gap-1.5 cursor-pointer"
                >
                  <UserPlus className="size-4" />
                  <span>Nueva Reserva</span>
                </Button>
              }
            />
          </div>
        </div>

        {/* Detalles Rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border text-xs">
          <div className="flex items-start gap-2.5">
            <Clock className="size-4 text-icon-accent shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-heading block">Horario</span>
              <span className="text-muted-foreground capitalize mt-0.5 block">
                {formatearFecha(taller.fecha_inicio)}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <MapPin className="size-4 text-icon-accent shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-heading block">Ubicación</span>
              <span className="text-muted-foreground mt-0.5 block">
                {taller.lugar || taller.direccion || "Por definir"}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <PackageCheck className="size-4 text-icon-accent shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-heading block">Aforo / Ocupación</span>
              <span className="font-bold text-sm text-heading tabular-nums mt-0.5 block">
                {taller.ocupados} / {taller.cupos_totales} cupos
              </span>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                ({taller.disponibles} libres)
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-heading block">Asistencia en Puerta</span>
              <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5 block">
                {taller.asistieron} asistentes
              </span>
              <span className="text-[11px] text-muted-foreground">
                registrados en el evento
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabla de Asistentes Inscritos */}
      <TablaAsistentes
        asistentes={asistentes}
        tallerId={taller.id}
        tallerNombre={taller.nombre}
        tallerFechaInicio={taller.fecha_inicio}
      />
    </main>
  );
}
