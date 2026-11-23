"use client";

import { useState, useTransition } from "react";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageCircle,
  FileDown,
  Award,
  Search,
  Check,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { WhatsappIcon } from "@/components/icons/whatsapp-icon";
import {
  cambiarEstadoProyectoAdmin,
  emitirConstanciaManualAdmin,
  type EstadoProyecto,
} from "@/server/admin/proyectos";
import { toast } from "sonner";

export type AlumnoProyectoItem = {
  matriculaId: string;
  perfilId: string;
  nombre: string;
  telefono: string | null;
  correo: string | null;
  estadosProyectos: Array<{
    proyectoId: string;
    titulo: string;
    esObligatorio: boolean;
    estado: EstadoProyecto;
    fechaEnvio: string | null;
    fechaAprobacion: string | null;
  }>;
  aprobadosCount: number;
  totalObligatorios: number;
  todosObligatoriosAprobados: boolean;
  constancia: {
    id: string;
    codigo: string;
    rutaPdf: string | null;
    emitidoEn: string;
  } | null;
};

export type ProyectoDefinicion = {
  id: string;
  leccion_id: string;
  titulo_proyecto: string;
  es_obligatorio: boolean;
};

interface GestorProyectosCursoProps {
  cursoId: string;
  nombreCurso: string;
  proyectosIniciales: ProyectoDefinicion[];
  alumnosIniciales: AlumnoProyectoItem[];
}

export function GestorProyectosCurso({
  cursoId,
  nombreCurso,
  proyectosIniciales,
  alumnosIniciales,
}: GestorProyectosCursoProps) {
  const [alumnos, setAlumnos] = useState<AlumnoProyectoItem[]>(alumnosIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [isPending, startTransition] = useTransition();
  const [emitidas, setEmitidas] = useState<Record<string, boolean>>({});

  // Filtrado de alumnos por nombre, teléfono o correo
  const alumnosFiltrados = alumnos.filter((a) => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return (
      a.nombre.toLowerCase().includes(q) ||
      (a.telefono && a.telefono.includes(q)) ||
      (a.correo && a.correo.toLowerCase().includes(q))
    );
  });

  // Conmutar estado de aprobación de un proyecto con un clic
  const handleToggleAprobacion = (
    alumno: AlumnoProyectoItem,
    proyectoId: string,
    estadoActual: EstadoProyecto
  ) => {
    const nuevoEstado: EstadoProyecto =
      estadoActual === "aprobado" ? "pendiente" : "aprobado";

    // Actualización optimista en la UI
    setAlumnos((prev) =>
      prev.map((al) => {
        if (al.matriculaId !== alumno.matriculaId) return al;

        const nuevosEstados = al.estadosProyectos.map((ep) =>
          ep.proyectoId === proyectoId
            ? {
                ...ep,
                estado: nuevoEstado,
                fechaAprobacion: nuevoEstado === "aprobado" ? new Date().toISOString() : null,
              }
            : ep
        );

        const aprobadosCount = nuevosEstados.filter(
          (ep) => ep.esObligatorio && ep.estado === "aprobado"
        ).length;

        const todosObligatoriosAprobados =
          al.totalObligatorios === 0 || aprobadosCount >= al.totalObligatorios;

        return {
          ...al,
          estadosProyectos: nuevosEstados,
          aprobadosCount,
          todosObligatoriosAprobados,
        };
      })
    );

    startTransition(async () => {
      const res = await cambiarEstadoProyectoAdmin({
        proyectoId,
        matriculaId: alumno.matriculaId,
        perfilId: alumno.perfilId,
        nuevoEstado,
      });

      if (!res.ok) {
        toast.error(res.error || "Error al actualizar el estado del proyecto.");
      } else {
        toast.success(
          nuevoEstado === "aprobado"
            ? `Proyecto aprobado para ${alumno.nombre}`
            : `Proyecto marcado como pendiente para ${alumno.nombre}`
        );
      }
    });
  };

  // Emitir constancia oficial manual
  const handleEmitirConstancia = (alumno: AlumnoProyectoItem) => {
    startTransition(async () => {
      const res = await emitirConstanciaManualAdmin({
        matriculaId: alumno.matriculaId,
        cursoId,
        perfilId: alumno.perfilId,
      });

      if (!res.ok) {
        toast.error(res.error || "No se pudo emitir la constancia.");
        return;
      }

      setEmitidas((prev) => ({ ...prev, [alumno.matriculaId]: true }));
      toast.success(`¡Constancia oficial emitida para ${alumno.nombre}!`);

      // Actualizar estado del alumno
      setAlumnos((prev) =>
        prev.map((al) => {
          if (al.matriculaId !== alumno.matriculaId) return al;
          return {
            ...al,
            constancia: res.constancia
              ? {
                  id: res.constancia.id,
                  codigo: res.constancia.codigo_verificacion,
                  rutaPdf: res.constancia.ruta_pdf,
                  emitidoEn: new Date().toISOString(),
                }
              : al.constancia,
          };
        })
      );
    });
  };

  // Generar link de WhatsApp para avisar a la alumna
  const getWhatsAppFelicitacionLink = (alumno: AlumnoProyectoItem) => {
    if (!alumno.telefono) return null;
    const cleanPhone = alumno.telefono.replace(/\D/g, "");
    const phoneWithCountry = cleanPhone.startsWith("51") ? cleanPhone : `51${cleanPhone}`;
    const mensaje = encodeURIComponent(
      `¡Hola ${alumno.nombre.split(" ")[0]}! 🎉 Te saluda Brayan de Amorelo. He revisado todos los proyectos prácticos de tu curso "${nombreCurso}" y ¡te quedaron hermosos! ✨ Tu Constancia de Finalización oficial ya está disponible para descargar en tu Aula Virtual. ¡Muchísimas felicitaciones por tu dedicación! 🎈🎓`
    );
    return `https://wa.me/${phoneWithCountry}?text=${mensaje}`;
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y buscador */}
      <Card className="rounded-2xl border-border bg-card shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-bold text-heading flex items-center gap-2">
                <Award className="size-5 text-muted-foreground" />
                <span>Revisión de Proyectos Prácticos y Emisión de Constancias</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Valida las fotos enviadas por WhatsApp por tus alumnas. Al aprobar los proyectos obligatorios, se habilita la Constancia de Finalización.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar alumna por nombre o teléfono..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Ficha Resumen de Proyectos Configurados en el Curso */}
          {proyectosIniciales.length > 0 && (
            <div className="mb-6 rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-heading flex items-center gap-1.5">
                  <Sparkles className="size-4 text-muted-foreground" />
                  <span>Proyectos Prácticos del Curso ({proyectosIniciales.length})</span>
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {proyectosIniciales.filter((p) => p.es_obligatorio).length} obligatorios para constancia
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {proyectosIniciales.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs"
                  >
                    <span className="font-bold text-heading">Proy {idx + 1}:</span>
                    <span className="text-foreground/90">{p.titulo_proyecto}</span>
                    {p.es_obligatorio ? (
                      <Badge variant="default" className="text-[9px] px-1.5 py-0 font-bold">
                        Obligatorio
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-semibold">
                        Opcional
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {proyectosIniciales.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground bg-muted/20">
              <Award className="size-8 mx-auto text-muted-foreground/60 mb-2" />
              <p className="text-xs font-bold text-heading">Este curso aún no tiene proyectos prácticos configurados.</p>
              <p className="text-[11px] mt-1 text-muted-foreground">
                Ve a la pestaña de &quot;Temario y Clases&quot; y añade una lección de formato <strong>Proyecto Práctico</strong>.
              </p>
            </div>
          ) : alumnosFiltrados.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground bg-muted/20">
              <Award className="size-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-xs font-bold text-heading">
                {busqueda
                  ? "No se encontraron alumnas que coincidan con la búsqueda."
                  : "Aún no hay alumnas matriculadas en este curso."}
              </p>
              <p className="text-[11px] mt-1 text-muted-foreground">
                {busqueda
                  ? "Prueba buscando con otro término o limpia el buscador."
                  : "Cuando las alumnas se matriculen y envíen sus proyectos por WhatsApp, aquí podrás validarlas con un clic y emitir sus constancias."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {alumnosFiltrados.map((alumno) => {
                const constanciaLista = alumno.constancia || emitidas[alumno.matriculaId];
                const wsLink = getWhatsAppFelicitacionLink(alumno);

                return (
                  <div
                    key={alumno.matriculaId}
                    className="flex flex-col gap-4 rounded-xl border border-border p-4 bg-card hover:border-primary/30 transition-all shadow-xs"
                  >
                    {/* Fila Superior: Info Alumna + Botón de Emisión */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-muted border border-border text-foreground flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {alumno.nombre
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-heading">{alumno.nombre}</span>
                            {alumno.telefono && (
                              <a
                                href={`https://wa.me/${alumno.telefono.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                              >
                                <WhatsappIcon className="size-3.5 fill-current shrink-0" />
                                <span>{alumno.telefono}</span>
                              </a>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground block">
                            Progreso: {alumno.aprobadosCount} de {alumno.totalObligatorios} proyectos aprobados
                          </span>
                        </div>
                      </div>

                      {/* Estado de Constancia y Acciones */}
                      <div className="flex items-center gap-2">
                        {constanciaLista ? (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white border-transparent text-xs font-bold gap-1 py-1 shadow-xs">
                              <Award className="size-3.5" />
                              <span>Constancia Emitida</span>
                            </Badge>

                            {alumno.constancia?.codigo && (
                              <a
                                href={`/api/certificados/${alumno.constancia.codigo}/pdf`}
                                target="_blank"
                                rel="noreferrer"
                                className={buttonVariants({
                                  variant: "outline",
                                  size: "sm",
                                  className: "h-8 text-xs font-bold cursor-pointer",
                                })}
                              >
                                <FileDown className="size-3.5 mr-1" />
                                <span>Ver PDF</span>
                              </a>
                            )}

                            {wsLink && (
                              <a
                                href={wsLink}
                                target="_blank"
                                rel="noreferrer"
                                className={buttonVariants({
                                  size: "sm",
                                  className:
                                    "h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 cursor-pointer shadow-xs",
                                })}
                              >
                                <WhatsappIcon className="size-3.5 fill-current shrink-0" />
                                <span>Avisar por WhatsApp</span>
                              </a>
                            )}
                          </div>
                        ) : alumno.todosObligatoriosAprobados ? (
                          <Button
                            type="button"
                            onClick={() => handleEmitirConstancia(alumno)}
                            disabled={isPending}
                            className="h-8 font-bold text-xs gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Award className="size-3.5" />
                            <span>Emitir Constancia de Finalización</span>
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-[11px] text-muted-foreground font-medium">
                            Requiere completar {alumno.totalObligatorios - alumno.aprobadosCount} {alumno.totalObligatorios - alumno.aprobadosCount === 1 ? "proyecto" : "proyectos"}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Fila Inferior: Botonera de Checks de Proyectos */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mr-1">
                        Proyectos:
                      </span>
                      {alumno.estadosProyectos.map((ep, idx) => {
                        const esAprobado = ep.estado === "aprobado";
                        const esEnviado = ep.estado === "enviado_whatsapp";

                        return (
                          <button
                            key={ep.proyectoId}
                            type="button"
                            onClick={() => handleToggleAprobacion(alumno, ep.proyectoId, ep.estado)}
                            title={`Proyecto ${idx + 1}: ${ep.titulo} (Clic para cambiar estado)`}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border",
                              esAprobado
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 shadow-xs"
                                : esEnviado
                                ? "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                                : "bg-muted/40 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            {esAprobado ? (
                              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : esEnviado ? (
                              <Clock className="size-3.5 text-amber-600 dark:text-amber-400" />
                            ) : (
                              <span className="size-3.5 rounded-full border border-muted-foreground/40 flex items-center justify-center text-[9px] font-bold">
                                {idx + 1}
                              </span>
                            )}
                            <span>Proy {idx + 1}</span>
                            {esEnviado && (
                              <span className="text-[10px] font-normal opacity-90">(Enviado)</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
