"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Video,
  FileText,
  Pencil,
  Trash2,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  BookOpen,
  Image as ImageIcon,
  UploadCloud,
  Loader2,
  Eye,
  Play,
  AlertCircle,
  CheckCircle2,
  Info,
  Send,
  HelpCircle,
  X,
} from "lucide-react";
import { EditorQuiz, ErrorCampo, type EditorQuizData } from "./editor-quiz";
import {
  obtenerQuizAdmin,
  guardarQuizAdmin,
  type QuizAdmin,
} from "@/server/admin/quizzes";
import { parsearVideoUrl } from "@/components/aula/reproductor-video";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  crearModulo,
  actualizarModulo,
  eliminarModulo,
  crearLeccion,
  actualizarLeccion,
  eliminarLeccion,
  subirArchivoStorage,
} from "@/server/cursos/acciones";
import { optimizarImagenAWebP } from "@/lib/imagen/optimizar";
import { CargaMultimediaOverlay } from "@/components/admin/shared/carga-multimedia-overlay";
import { toast } from "sonner";

export type LeccionItem = {
  id: string;
  titulo: string;
  descripcion: string | null;
  video_url: string | null;
  tipo_contenido?: "video" | "documento" | "imagen" | "pdf" | "proyecto" | "quiz";
  recurso_url?: string | null;
  orden: number;
  proyectos?: {
    id: string;
    titulo_proyecto: string;
    instrucciones: string | null;
    foto_referencia_url: string | null;
    es_obligatorio: boolean;
  } | null;
};

export type ModuloItem = {
  id: string;
  titulo: string;
  descripcion: string | null;
  orden: number;
  lecciones?: LeccionItem[];
};

export function GestorTemario({
  cursoId,
  modulosIniciales,
}: {
  cursoId: string;
  modulosIniciales: ModuloItem[];
}) {
  const router = useRouter();
  const [modulos, setModulos] = useState<ModuloItem[]>(modulosIniciales);
  const [guardando, setGuardando] = useState(false);

  // Sincronizar estado cuando los módulos cambien tras router.refresh()
  useEffect(() => {
    setModulos(modulosIniciales);
  }, [modulosIniciales]);

  // Estados para Modal de Módulo (Crear o Editar)
  const [modalModuloAbierto, setModalModuloAbierto] = useState(false);
  const [moduloEditando, setModuloEditando] = useState<ModuloItem | null>(null);
  const [moduloTitulo, setModuloTitulo] = useState("");
  const [moduloDescripcion, setModuloDescripcion] = useState("");

  // Estados para Modal de Lección (Crear o Editar)
  const [modalLeccionAbierto, setModalLeccionAbierto] = useState(false);
  const [leccionEditando, setLeccionEditando] = useState<{
    leccion: LeccionItem | null;
    moduloId: string;
  } | null>(null);
  const [tipoContenido, setTipoContenido] = useState<
    "video" | "documento" | "imagen" | "pdf" | "proyecto" | "quiz"
  >("video");
  const [leccionTitulo, setLeccionTitulo] = useState("");
  const [leccionVideoUrl, setLeccionVideoUrl] = useState("");
  const [leccionRecursoUrl, setLeccionRecursoUrl] = useState("");
  const [leccionDescripcion, setLeccionDescripcion] = useState("");
  const [proyectoObligatorio, setProyectoObligatorio] = useState(true);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [progresoSubidaArchivo, setProgresoSubidaArchivo] = useState<number | undefined>(undefined);
  const [mensajeSubidaArchivo, setMensajeSubidaArchivo] = useState<string>("");
  const [cargandoPreviewRecurso, setCargandoPreviewRecurso] = useState(false);
  const [quizData, setQuizData] = useState<EditorQuizData | null>(null);
  const [quizInicial, setQuizInicial] = useState<QuizAdmin | null>(null);
  const [cargandoQuiz, setCargandoQuiz] = useState<boolean>(false);

  // Estados de errores para validación moderna con Sonner e inline
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [erroresModulo, setErroresModulo] = useState<Record<string, string>>({});

  const limpiarError = (campo: string) => {
    setErrores((prev) => {
      if (!prev[campo]) return prev;
      const copia = { ...prev };
      delete copia[campo];
      return copia;
    });
  };

  // Estados para Modal de Confirmación de Eliminación (shadcn AlertDialog)
  const [confirmacionEliminar, setConfirmacionEliminar] = useState<{
    tipo: "modulo" | "leccion";
    id: string;
    moduloId?: string;
    titulo: string;
  } | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const handleConfirmarEliminacion = async () => {
    if (!confirmacionEliminar) return;
    setEliminando(true);
    try {
      if (confirmacionEliminar.tipo === "modulo") {
        const res = await eliminarModulo(confirmacionEliminar.id, cursoId);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        setModulos((prev) => prev.filter((m) => m.id !== confirmacionEliminar.id));
        toast.success("Módulo eliminado con éxito.");
      } else if (confirmacionEliminar.tipo === "leccion" && confirmacionEliminar.moduloId) {
        const res = await eliminarLeccion(confirmacionEliminar.id, cursoId);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        setModulos((prev) =>
          prev.map((mod) => {
            if (mod.id !== confirmacionEliminar.moduloId) return mod;
            return {
              ...mod,
              lecciones: mod.lecciones?.filter((lec) => lec.id !== confirmacionEliminar.id),
            };
          }),
        );
        toast.success("Clase eliminada con éxito.");
      }
      setConfirmacionEliminar(null);
    } catch {
      toast.error("Ocurrió un error al procesar la eliminación.");
    } finally {
      setEliminando(false);
    }
  };

  // Funciones para Módulos
  const abrirCrearModulo = () => {
    setModuloEditando(null);
    setModuloTitulo("");
    setModuloDescripcion("");
    setErroresModulo({});
    setModalModuloAbierto(true);
  };

  const abrirEditarModulo = (m: ModuloItem) => {
    setModuloEditando(m);
    setModuloTitulo(m.titulo);
    setModuloDescripcion(m.descripcion || "");
    setErroresModulo({});
    setModalModuloAbierto(true);
  };

  const handleGuardarModulo = async (e: React.FormEvent) => {
    e.preventDefault();
    const errMod: Record<string, string> = {};
    if (!moduloTitulo.trim()) {
      errMod.titulo = "Ingresa el título del módulo.";
    } else if (moduloTitulo.trim().length < 3) {
      errMod.titulo = "El título debe tener al menos 3 caracteres.";
    }

    setErroresModulo(errMod);
    if (Object.keys(errMod).length > 0) {
      toast.error("Por favor completa los campos marcados en rojo.");
      return;
    }

    setGuardando(true);
    try {
      if (moduloEditando) {
        const res = await actualizarModulo(moduloEditando.id, cursoId, {
          titulo: moduloTitulo.trim(),
          descripcion: moduloDescripcion.trim() || undefined,
        });
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        setModulos((prev) =>
          prev.map((m) =>
            m.id === moduloEditando.id
              ? {
                  ...m,
                  titulo: moduloTitulo.trim(),
                  descripcion: moduloDescripcion.trim() || null,
                }
              : m,
          ),
        );
        toast.success("Módulo actualizado con éxito.");
      } else {
        const res = await crearModulo({
          curso_id: cursoId,
          titulo: moduloTitulo.trim(),
          descripcion: moduloDescripcion.trim() || undefined,
          orden: modulos.length + 1,
        });
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.success("Módulo creado con éxito.");
        router.refresh();
      }
      setModalModuloAbierto(false);
    } catch {
      toast.error("Error al procesar el módulo.");
    } finally {
      setGuardando(false);
    }
  };

  // Funciones para Lecciones
  const abrirCrearLeccion = (moduloId: string) => {
    setLeccionEditando({ leccion: null, moduloId });
    setTipoContenido("video");
    setLeccionTitulo("");
    setLeccionVideoUrl("");
    setLeccionRecursoUrl("");
    setLeccionDescripcion("");
    setProyectoObligatorio(true);
    setQuizInicial(null);
    setQuizData(null);
    setErrores({});
    setModalLeccionAbierto(true);
  };

  const abrirEditarLeccion = async (leccion: LeccionItem, moduloId: string) => {
    setLeccionEditando({ leccion, moduloId });
    const tipo =
      leccion.tipo_contenido || (leccion.video_url ? "video" : "documento");
    setTipoContenido(tipo);
    setLeccionTitulo(leccion.titulo);
    setLeccionVideoUrl(leccion.video_url || "");
    setLeccionRecursoUrl(leccion.recurso_url || "");
    setLeccionDescripcion(leccion.descripcion || "");
    setProyectoObligatorio(leccion.proyectos?.es_obligatorio ?? true);
    setQuizInicial(null);
    setQuizData(null);
    setErrores({});
    setModalLeccionAbierto(true);

    if (tipo === "quiz") {
      setCargandoQuiz(true);
      try {
        const res = await obtenerQuizAdmin(leccion.id);
        if (res.ok && res.quiz) {
          setQuizInicial(res.quiz);
        }
      } catch (err) {
        console.error("Error al cargar datos del quiz:", err);
      } finally {
        setCargandoQuiz(false);
      }
    }
  };

  const handleSubirArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendoArchivo(true);
    const esImagen =
      file.type.startsWith("image/") ||
      tipoContenido === "imagen" ||
      tipoContenido === "proyecto";

    setProgresoSubidaArchivo(20);
    setMensajeSubidaArchivo(
      esImagen ? "Optimizando y convirtiendo imagen a WebP..." : "Preparando archivo PDF..."
    );
    let progresoTimer: NodeJS.Timeout | null = null;

    try {
      let archivoFinal = file;
      let toastMsg = "Archivo subido correctamente.";

      if (esImagen) {
        // Optimizar y convertir a WebP automáticamente
        const { archivoOptimizado, pesoOptimizadoKb } =
          await optimizarImagenAWebP(file, 1920, 0.85);
        archivoFinal = archivoOptimizado;
        toastMsg = `Imagen optimizada a WebP (${pesoOptimizadoKb} KB) y guardada.`;
      } else {
        toastMsg = "Documento PDF subido a materiales.";
      }

      setProgresoSubidaArchivo(45);
      setMensajeSubidaArchivo(
        esImagen ? "Subiendo imagen a la nube..." : "Subiendo PDF a almacenamiento seguro..."
      );

      progresoTimer = setInterval(() => {
        setProgresoSubidaArchivo((prev) => {
          if (prev === undefined || prev >= 88) return prev;
          return prev + 8;
        });
      }, 250);

      const formData = new FormData();
      formData.append("archivo", archivoFinal);
      // Las imágenes van al bucket público 'marca', los PDFs a 'materiales'
      formData.append("bucket", esImagen ? "marca" : "materiales");

      const res = await subirArchivoStorage(formData);
      if (progresoTimer) clearInterval(progresoTimer);

      if (!res.ok) {
        toast.error(res.error || "Error al subir el archivo.");
        return;
      }

      setProgresoSubidaArchivo(100);
      setMensajeSubidaArchivo("¡Archivo subido con éxito!");

      // Guardamos la URL o ruta del storage
      const rutaOUrl = res.url || res.rutaStorage || "";
      setLeccionRecursoUrl(rutaOUrl);
      limpiarError("recursoUrl");
      toast.success(toastMsg);
    } catch {
      toast.error("Error al procesar la subida del archivo.");
    } finally {
      if (progresoTimer) clearInterval(progresoTimer);
      setTimeout(() => {
        setSubiendoArchivo(false);
        setProgresoSubidaArchivo(undefined);
        setMensajeSubidaArchivo("");
      }, 450);
      // Limpiar el input para permitir volver a subir el mismo archivo si se desea
      e.target.value = "";
    }
  };

  const validarFormularioLeccion = (): boolean => {
    const nuevos: Record<string, string> = {};

    // 1. Título de la clase (común a todos los formatos)
    if (!leccionTitulo.trim()) {
      nuevos.titulo = "Ingresa el título de la clase.";
    } else if (leccionTitulo.trim().length < 3) {
      nuevos.titulo = "El título debe tener al menos 3 caracteres.";
    }

    // 2. Validación específica por formato
    if (tipoContenido === "video") {
      if (!leccionVideoUrl.trim()) {
        nuevos.videoUrl = "Ingresa el enlace del video para la clase.";
      } else {
        try {
          new URL(leccionVideoUrl.trim());
        } catch {
          nuevos.videoUrl = "Ingresa una URL válida (Google Drive, YouTube, Vimeo, Loom o MP4).";
        }
      }
    } else if (tipoContenido === "proyecto") {
      if (!leccionDescripcion.trim()) {
        nuevos.descripcion = "Escribe las instrucciones del proyecto que debe realizar la alumna.";
      } else if (leccionDescripcion.trim().length < 10) {
        nuevos.descripcion = "Las instrucciones deben tener al menos 10 caracteres explicativos.";
      }
    } else if (tipoContenido === "quiz") {
      if (!quizData || quizData.preguntas.length === 0) {
        nuevos.quiz = "Debes configurar al menos una pregunta en la evaluación.";
      } else {
        quizData.preguntas.forEach((p, i) => {
          if (!p.enunciado.trim()) {
            nuevos[`quiz_p_${i}_enunciado`] = `Ingresa el enunciado de la pregunta #${i + 1}.`;
          }
          if (p.opciones.length < 2) {
            nuevos[`quiz_p_${i}`] = `La pregunta #${i + 1} debe tener al menos 2 alternativas.`;
          }
          p.opciones.forEach((op, j) => {
            if (!op.texto_opcion.trim()) {
              nuevos[`quiz_p_${i}_op_${j}`] = "Escribe el texto de esta alternativa.";
            }
          });
          if (!p.opciones.some((op) => op.es_correcta)) {
            nuevos[`quiz_p_${i}_correcta`] = `Debes marcar una alternativa correcta en la pregunta #${i + 1}.`;
          }
        });
      }
    } else if (tipoContenido === "documento") {
      if (!leccionDescripcion.trim()) {
        nuevos.descripcion = "Escribe el contenido o apunte teórico para esta lectura.";
      } else if (leccionDescripcion.trim().length < 10) {
        nuevos.descripcion = "El contenido debe tener al menos 10 caracteres.";
      }
    } else if (tipoContenido === "imagen") {
      if (!leccionRecursoUrl.trim()) {
        nuevos.recursoUrl = "Sube una imagen o ingresa el enlace de Canva / imagen.";
      }
    } else if (tipoContenido === "pdf") {
      if (!leccionRecursoUrl.trim()) {
        nuevos.recursoUrl = "Sube un archivo PDF o ingresa el enlace web / Google Drive.";
      }
    }

    setErrores(nuevos);

    if (Object.keys(nuevos).length > 0) {
      toast.error("Por favor completa los campos marcados en rojo.");
      return false;
    }

    return true;
  };

  const handleGuardarLeccion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormularioLeccion()) return;
    if (!leccionEditando) return;

    setGuardando(true);
    try {
      const datosProyecto =
        tipoContenido === "proyecto"
          ? {
              titulo_proyecto: leccionTitulo.trim(),
              instrucciones: leccionDescripcion.trim() || undefined,
              foto_referencia_url: leccionRecursoUrl.trim() || undefined,
              es_obligatorio: proyectoObligatorio,
            }
          : undefined;

      let leccionIdFinal = leccionEditando.leccion?.id;

      if (leccionEditando.leccion) {
        const res = await actualizarLeccion(leccionEditando.leccion.id, cursoId, {
          titulo: leccionTitulo.trim(),
          descripcion: leccionDescripcion.trim() || undefined,
          video_url:
            tipoContenido === "video" ? leccionVideoUrl.trim() || undefined : undefined,
          tipo_contenido: tipoContenido,
          recurso_url:
            tipoContenido !== "video" && tipoContenido !== "documento"
              ? leccionRecursoUrl.trim() || undefined
              : undefined,
          proyecto: datosProyecto,
        });
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
      } else {
        const res = await crearLeccion({
          modulo_id: leccionEditando.moduloId,
          curso_id: cursoId,
          titulo: leccionTitulo.trim(),
          descripcion: leccionDescripcion.trim() || undefined,
          video_url:
            tipoContenido === "video" ? leccionVideoUrl.trim() || undefined : undefined,
          tipo_contenido: tipoContenido,
          recurso_url:
            tipoContenido !== "video" && tipoContenido !== "documento"
              ? leccionRecursoUrl.trim() || undefined
              : undefined,
          proyecto: datosProyecto,
        });
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        leccionIdFinal = res.id;
      }

      // Si es un cuestionario, guardar las preguntas y alternativas
      if (tipoContenido === "quiz" && leccionIdFinal && quizData) {
        const resQuiz = await guardarQuizAdmin({
          leccionId: leccionIdFinal,
          titulo: leccionTitulo.trim(),
          descripcion: leccionDescripcion.trim() || undefined,
          porcentajeMinimo: quizData.porcentajeMinimo,
          intentosPermitidos: quizData.intentosPermitidos,
          preguntas: quizData.preguntas,
        });
        if (!resQuiz.ok) {
          toast.error(resQuiz.error || "Error al guardar el cuestionario.");
          return;
        }
      }

      toast.success(
        leccionEditando.leccion
          ? "Clase actualizada con éxito."
          : "Clase creada con éxito."
      );
      setModalLeccionAbierto(false);
      router.refresh();
    } catch {
      toast.error("Error al procesar la clase.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Barra de Encabezado del Temario */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-heading">
            Estructura Académica (Módulos y Clases)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Organiza los capítulos y lecciones en video que los estudiantes verán en el aula virtual.
          </p>
        </div>
        <Button
          type="button"
          onClick={abrirCrearModulo}
          className="rounded-full font-bold shadow-xs sm:self-start"
        >
          <Plus className="mr-1.5 size-4" />
          <span>Agregar Nuevo Módulo</span>
        </Button>
      </div>

      {/* Lista de Módulos */}
      {modulos.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
            <Layers className="size-6" />
          </div>
          <h4 className="font-bold text-heading text-base">Este curso aún no tiene módulos</h4>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            Comienza creando el primer módulo didáctico para añadirle clases en video HD.
          </p>
          <Button
            type="button"
            onClick={abrirCrearModulo}
            className="mt-4 rounded-full font-bold"
          >
            <Plus className="mr-1.5 size-4" />
            <span>Crear Primer Módulo</span>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {modulos.map((modulo, idx) => {
            const lecciones = modulo.lecciones ?? [];

            return (
              <Card key={modulo.id} className="gap-0 py-0 overflow-hidden">
                {/* Cabecera del Módulo Responsiva */}
                <div className="flex flex-col gap-3 border-b bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-icon-accent-soft text-icon-accent text-xs font-black">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-bold text-heading text-sm truncate">
                        Módulo {idx + 1}: {modulo.titulo}
                      </h4>
                      {modulo.descripcion && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {modulo.descripcion}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2.5 sm:border-t-0 sm:pt-0 sm:justify-end">
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <Badge variant="outline" className="text-[11px] font-semibold">
                        {lecciones.length} {lecciones.length === 1 ? "clase" : "clases"}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => abrirEditarModulo(modulo)}
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="size-3.5 mr-1" />
                        <span>Editar</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setConfirmacionEliminar({
                            tipo: "modulo",
                            id: modulo.id,
                            titulo: modulo.titulo,
                          })
                        }
                        className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-3.5 mr-1" />
                        <span>Eliminar</span>
                      </Button>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => abrirCrearLeccion(modulo.id)}
                      className="h-8 rounded-full px-3 text-xs font-bold shrink-0"
                    >
                      <Plus className="size-3.5 mr-1" />
                      <span>Agregar Clase</span>
                    </Button>
                  </div>
                </div>

                {/* Lista de Lecciones dentro del Módulo */}
                <div className="p-3">
                  {lecciones.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      No hay clases en este módulo todavía. Haz clic en <strong>Agregar Clase</strong> para subir la primera.
                    </div>
                  ) : (
                    <ul className="divide-y divide-border/60">
                      {lecciones.map((leccion, lIdx) => (
                        <li
                          key={leccion.id}
                          className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/30 rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex size-6 items-center justify-center rounded-md bg-muted text-muted-foreground text-[11px] font-bold">
                              {lIdx + 1}
                            </span>
                            <div className="flex flex-col">
                              <span className="font-semibold text-heading text-xs sm:text-sm">
                                {leccion.titulo}
                              </span>
                              {leccion.descripcion && (
                                <p className="text-[11px] text-muted-foreground line-clamp-1">
                                  {leccion.descripcion}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 sm:shrink-0">
                            {leccion.tipo_contenido === "proyecto" ? (
                              <Badge
                                variant="outline"
                                className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 text-[11px] font-bold"
                              >
                                <Sparkles className="size-3 mr-1 text-blue-600 dark:text-blue-400" />
                                <span>Proyecto Práctico</span>
                              </Badge>
                            ) : leccion.tipo_contenido === "quiz" ? (
                              <Badge
                                variant="outline"
                                className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 text-[11px] font-bold"
                              >
                                <Info className="size-3 mr-1" />
                                <span>Cuestionario / Quiz</span>
                              </Badge>
                            ) : leccion.tipo_contenido === "documento" ? (
                              <Badge
                                variant="outline"
                                className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[11px] font-bold"
                              >
                                <BookOpen className="size-3 mr-1" />
                                <span>Lectura</span>
                              </Badge>
                            ) : leccion.tipo_contenido === "imagen" ? (
                              <Badge
                                variant="outline"
                                className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-[11px] font-bold"
                              >
                                <ImageIcon className="size-3 mr-1" />
                                <span>Canva / Imagen</span>
                              </Badge>
                            ) : leccion.tipo_contenido === "pdf" ? (
                              <Badge
                                variant="outline"
                                className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[11px] font-bold"
                              >
                                <FileText className="size-3 mr-1" />
                                <span>PDF</span>
                              </Badge>
                            ) : leccion.video_url ? (
                              <Badge
                                variant="outline"
                                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px] font-bold"
                              >
                                <Video className="size-3 mr-1" />
                                <span>Video</span>
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[11px] font-bold"
                              >
                                <span>Sin Video</span>
                              </Badge>
                            )}

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => abrirEditarLeccion(leccion, modulo.id)}
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <Pencil className="size-3 mr-1" />
                              <span>Editar</span>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setConfirmacionEliminar({
                                  tipo: "leccion",
                                  id: leccion.id,
                                  moduloId: modulo.id,
                                  titulo: leccion.titulo,
                                })
                              }
                              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal para Crear/Editar Módulo */}
      <Dialog open={modalModuloAbierto} onOpenChange={setModalModuloAbierto}>
        <DialogContent className="max-w-md p-0 gap-0">
          <form noValidate onSubmit={handleGuardarModulo}>
            <DialogHeader className="border-b px-6 py-5">
              <DialogTitle className="text-lg font-bold text-heading">
                {moduloEditando ? "Editar Módulo" : "Nuevo Módulo"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Define el nombre y tema del capítulo didáctico.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 p-6">
              <div>
                <Label htmlFor="tituloModulo" className="mb-2 block">
                  Título del Módulo *
                </Label>
                <Input
                  id="tituloModulo"
                  placeholder="Ej: Módulo 1: Preparación y Materiales"
                  value={moduloTitulo}
                  onChange={(e) => {
                    setModuloTitulo(e.target.value);
                    if (erroresModulo.titulo) setErroresModulo({});
                  }}
                  aria-invalid={Boolean(erroresModulo.titulo)}
                  className={cn(erroresModulo.titulo && "border-destructive focus-visible:ring-destructive/30")}
                />
                <ErrorCampo mensaje={erroresModulo.titulo} />
              </div>

              <div>
                <Label htmlFor="descModulo" className="mb-2 block">
                  Descripción (Opcional)
                </Label>
                <Textarea
                  id="descModulo"
                  rows={2}
                  placeholder="Breve explicación de los temas cubiertos en este módulo..."
                  value={moduloDescripcion}
                  onChange={(e) => setModuloDescripcion(e.target.value)}
                />
              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-2 border-t bg-muted/30 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalModuloAbierto(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? "Guardando…" : moduloEditando ? "Guardar Cambios" : "Crear Módulo"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para Crear/Editar Lección (2 Columnas con Preview Inteligente) */}
      <Dialog open={modalLeccionAbierto} onOpenChange={setModalLeccionAbierto}>
        <DialogContent
          className={cn(
            "w-full max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden transition-all duration-150",
            "sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl"
          )}
        >
          <form noValidate onSubmit={handleGuardarLeccion} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <DialogHeader className="border-b px-6 py-4 shrink-0">
              <DialogTitle className="text-xl sm:text-2xl font-black text-heading tracking-tight">
                {leccionEditando?.leccion ? "Editar Clase" : "Nueva Clase / Lección"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Elige el formato de la clase, personaliza su contenido y previsualízalo antes de guardar.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 p-6 lg:p-8 overflow-y-auto flex-1 min-h-0">
              {/* Columna 1 (7 cols): Formato, Título y Contenido */}
              <div className="lg:col-span-7 space-y-4">
                {/* Selector de Formato Principal (Tarjetas Visuales) */}
                <div>
                  <Label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Formato de la Lección *
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {(
                      [
                        {
                          id: "video",
                          label: "Video",
                          desc: "Drive, YT, Loom",
                          icon: Video,
                        },
                        {
                          id: "proyecto",
                          label: "Proyecto",
                          desc: "WhatsApp mentor",
                          icon: Sparkles,
                        },
                        {
                          id: "quiz",
                          label: "Quiz",
                          desc: "Evaluación",
                          icon: HelpCircle,
                        },
                        {
                          id: "documento",
                          label: "Lectura",
                          desc: "Texto editorial",
                          icon: BookOpen,
                        },
                        {
                          id: "imagen",
                          label: "Canva / Img",
                          desc: "Flyers y guías",
                          icon: ImageIcon,
                        },
                        {
                          id: "pdf",
                          label: "PDF",
                          desc: "Visor protegido",
                          icon: FileText,
                        },
                      ] as const
                    ).map((f) => {
                      const Icon = f.icon;
                      const activo = tipoContenido === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            setTipoContenido(f.id);
                            setErrores({});
                          }}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer gap-1",
                            activo
                              ? "border-[#1e3a8a] bg-[#1e3a8a]/10 text-[#1e3a8a] ring-2 ring-[#1e3a8a]/20 dark:border-blue-400 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/30 shadow-xs"
                              : "border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                          )}
                        >
                          <Icon className={cn("size-5 shrink-0", activo ? "text-icon-accent" : "text-muted-foreground")} />
                          <span className="text-xs font-bold leading-tight mt-0.5">{f.label}</span>
                          <span className="text-[10px] text-muted-foreground leading-none">{f.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Título de la clase */}
                <div>
                  <Label htmlFor="tituloLeccion" className="mb-1.5 block text-xs font-bold text-heading">
                    Título de la Clase *
                  </Label>
                  <Input
                    id="tituloLeccion"
                    placeholder={
                      tipoContenido === "documento"
                        ? "Ej: ¡Bienvenida a la Masterclass! Lee esto antes de empezar"
                        : tipoContenido === "pdf"
                        ? "Ej: Guía de Proveedores y Lista de Materiales"
                        : tipoContenido === "imagen"
                        ? "Ej: Infografía: Tabla de Medidas y Calibración"
                        : "Ej: 1.1 Inflado correcto de globos burbuja"
                    }
                    value={leccionTitulo}
                    onChange={(e) => {
                      setLeccionTitulo(e.target.value);
                      limpiarError("titulo");
                    }}
                    aria-invalid={Boolean(errores.titulo)}
                    className={cn(
                      "h-10 text-sm font-medium",
                      errores.titulo && "border-destructive focus-visible:ring-destructive/30"
                    )}
                  />
                  <ErrorCampo mensaje={errores.titulo} />
                </div>

                {/* Campos dinámicos según el tipo de contenido */}
                {tipoContenido === "video" && (
                  <div>
                    <Label htmlFor="videoUrl" className="mb-1.5 block text-xs font-bold text-heading">
                      URL del Video (Google Drive, YouTube, Vimeo, Loom o MP4) *
                    </Label>
                    <Input
                      id="videoUrl"
                      placeholder="https://drive.google.com/file/d/... o https://youtube.com/..."
                      value={leccionVideoUrl}
                      onChange={(e) => {
                        setLeccionVideoUrl(e.target.value);
                        limpiarError("videoUrl");
                      }}
                      aria-invalid={Boolean(errores.videoUrl)}
                      className={cn(
                        "h-10 text-xs font-mono",
                        errores.videoUrl && "border-destructive focus-visible:ring-destructive/30"
                      )}
                    />
                    <ErrorCampo mensaje={errores.videoUrl} />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      El reproductor inteligente detectará el origen y lo adaptará para el aula.
                    </p>
                  </div>
                )}

                {tipoContenido === "documento" && (
                  <div>
                    <Label htmlFor="descLeccion" className="mb-1.5 block text-xs font-bold text-heading">
                      Contenido de la Lectura / Bienvenida *
                    </Label>
                    <Textarea
                      id="descLeccion"
                      rows={7}
                      placeholder={
                        "Escribe aquí las instrucciones de bienvenida o apunte teórico.\n\n" +
                        "Tips:\n" +
                        "- Usa guiones (-) o puntos (•) para crear listas con viñetas.\n" +
                        "- Usa números (1., 2.) para pasos correlativos.\n" +
                        "- Pega enlaces a grupos de WhatsApp para que los alumnos se unan."
                      }
                      value={leccionDescripcion}
                      onChange={(e) => {
                        setLeccionDescripcion(e.target.value);
                        limpiarError("descripcion");
                      }}
                      aria-invalid={Boolean(errores.descripcion)}
                      className={cn(
                        "text-xs resize-none",
                        errores.descripcion && "border-destructive focus-visible:ring-destructive/30"
                      )}
                    />
                    <ErrorCampo mensaje={errores.descripcion} />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Se mostrará como un documento editorial a pantalla completa en el aula.
                    </p>
                  </div>
                )}

                {tipoContenido === "imagen" && (
                  <div className="space-y-3">
                    <Label className="block text-xs font-bold text-heading">
                      Imagen o Flyer de Canva *
                    </Label>

                    {/* Previsualización si ya existe imagen */}
                    {leccionRecursoUrl && (
                      <div className="relative aspect-video max-h-52 w-full rounded-xl border border-border overflow-hidden bg-muted/40 flex items-center justify-center">
                        <img
                          src={leccionRecursoUrl}
                          alt="Vista previa recurso imagen"
                          className="h-full w-full object-contain"
                          onLoad={() => setCargandoPreviewRecurso(false)}
                          onError={() => setCargandoPreviewRecurso(false)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setLeccionRecursoUrl("");
                            setCargandoPreviewRecurso(false);
                          }}
                          className="absolute top-2 right-2 size-7 rounded-full bg-black/75 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer z-30"
                          title="Quitar imagen"
                        >
                          <X className="size-4" />
                        </button>
                        <CargaMultimediaOverlay
                          cargando={cargandoPreviewRecurso}
                          mensaje="Cargando vista previa de la imagen..."
                          tipo="imagen"
                        />
                      </div>
                    )}

                    {/* Subida directa a Supabase Storage (bucket 'marca') */}
                    <div className="relative overflow-hidden rounded-xl border border-dashed border-border p-4 text-center bg-muted/20">
                      <input
                        type="file"
                        id="archivoImagen"
                        accept="image/*"
                        onChange={handleSubirArchivo}
                        className="hidden"
                      />
                      <label
                        htmlFor="archivoImagen"
                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-card px-4 py-2 text-xs font-bold border border-border shadow-xs hover:bg-muted transition-colors"
                      >
                        <UploadCloud className="size-4 text-icon-accent" />
                        <span>Subir imagen desde tu PC (Auto WebP / CDN)</span>
                      </label>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        PNG, JPG o WebP en alta resolución (almacenamiento público en bucket &quot;marca&quot;).
                      </p>

                      <CargaMultimediaOverlay
                        cargando={subiendoArchivo}
                        progreso={progresoSubidaArchivo}
                        mensaje={mensajeSubidaArchivo}
                        tipo="imagen"
                      />
                    </div>

                    <div>
                      <Label htmlFor="recursoUrl" className="mb-1 block text-xs font-medium text-muted-foreground">
                        O pega la URL directa de la imagen / Canva:
                      </Label>
                      <Input
                        id="recursoUrl"
                        placeholder="https://... o ruta en storage"
                        value={leccionRecursoUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLeccionRecursoUrl(val);
                          limpiarError("recursoUrl");
                          if (val.trim().startsWith("http")) {
                            setCargandoPreviewRecurso(true);
                          } else {
                            setCargandoPreviewRecurso(false);
                          }
                        }}
                        aria-invalid={Boolean(errores.recursoUrl)}
                        className={cn(
                          "h-9 text-xs",
                          errores.recursoUrl && "border-destructive focus-visible:ring-destructive/30"
                        )}
                      />
                      <ErrorCampo mensaje={errores.recursoUrl} />
                    </div>
                  </div>
                )}

                {tipoContenido === "pdf" && (
                  <div className="space-y-3">
                    <Label className="block text-xs font-bold text-heading">
                      Archivo PDF para el Visor Embebido *
                    </Label>

                    {leccionRecursoUrl && (
                      <div className="flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-primary/5 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="size-4 text-primary shrink-0" />
                          <span className="font-medium truncate text-foreground">
                            {leccionRecursoUrl}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setLeccionRecursoUrl("")}
                          className="size-6 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                          title="Quitar PDF"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Subida directa a Supabase Storage (bucket 'materiales') */}
                    <div className="relative overflow-hidden rounded-xl border border-dashed border-border p-4 text-center bg-muted/20">
                      <input
                        type="file"
                        id="archivoPdf"
                        accept="application/pdf"
                        onChange={handleSubirArchivo}
                        className="hidden"
                      />
                      <label
                        htmlFor="archivoPdf"
                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-card px-4 py-2 text-xs font-bold border border-border shadow-xs hover:bg-muted transition-colors"
                      >
                        <UploadCloud className="size-4 text-icon-accent" />
                        <span>Subir PDF a Supabase Storage</span>
                      </label>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        Protegido en bucket &quot;materiales&quot;; solo alumnos matriculados podrán acceder.
                      </p>

                      <CargaMultimediaOverlay
                        cargando={subiendoArchivo}
                        progreso={progresoSubidaArchivo}
                        mensaje={mensajeSubidaArchivo}
                        tipo="pdf"
                      />
                    </div>

                    <div>
                      <Label htmlFor="recursoUrlPdf" className="mb-1 block text-xs font-medium text-muted-foreground">
                        O pega el enlace al PDF (Google Drive o web):
                      </Label>
                      <Input
                        id="recursoUrlPdf"
                        placeholder="https://drive.google.com/file/d/.../preview o ruta"
                        value={leccionRecursoUrl}
                        onChange={(e) => {
                          setLeccionRecursoUrl(e.target.value);
                          limpiarError("recursoUrl");
                        }}
                        aria-invalid={Boolean(errores.recursoUrl)}
                        className={cn(
                          "h-9 text-xs",
                          errores.recursoUrl && "border-destructive focus-visible:ring-destructive/30"
                        )}
                      />
                      <ErrorCampo mensaje={errores.recursoUrl} />
                    </div>
                  </div>
                )}

                {tipoContenido === "proyecto" && (
                  <div className="space-y-4 rounded-xl border border-border bg-muted/40 p-4 sm:p-5">
                    <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                      <Sparkles className="size-4 text-primary" />
                      <span>Configuración del Proyecto Práctico</span>
                    </div>

                    <div>
                      <Label htmlFor="descProyecto" className="mb-1.5 block text-xs font-bold text-heading">
                        Instrucciones del Proyecto para la Alumna *
                      </Label>
                      <Textarea
                        id="descProyecto"
                        rows={4}
                        placeholder={
                          "Describe el trabajo que debe realizar la alumna. Ej:\n" +
                          "1. Infla y sella un globo burbuja de 24 pulgadas con plumas o confeti.\n" +
                          "2. Coloca el vinil personalizado centrado y sin burbujas de aire.\n" +
                          "3. Toma una foto clara de frente con buena luz natural y pulsa el botón para enviarla a Brayan por WhatsApp."
                        }
                        value={leccionDescripcion}
                        onChange={(e) => {
                          setLeccionDescripcion(e.target.value);
                          limpiarError("descripcion");
                        }}
                        aria-invalid={Boolean(errores.descripcion)}
                        className={cn(
                          "text-xs resize-none bg-background text-foreground",
                          errores.descripcion && "border-destructive focus-visible:ring-destructive/30"
                        )}
                      />
                      <ErrorCampo mensaje={errores.descripcion} />
                    </div>

                    <div className="space-y-2">
                      <Label className="block text-xs font-bold text-heading">
                        Foto de Muestra / Referencia (Opcional)
                      </Label>

                      {leccionRecursoUrl && (
                        <div className="relative aspect-video max-h-40 w-full rounded-xl border border-border overflow-hidden bg-muted/40 flex items-center justify-center">
                          <img
                            src={leccionRecursoUrl}
                            alt="Vista previa modelo"
                            className="h-full w-full object-contain"
                            onLoad={() => setCargandoPreviewRecurso(false)}
                            onError={() => setCargandoPreviewRecurso(false)}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setLeccionRecursoUrl("");
                              setCargandoPreviewRecurso(false);
                            }}
                            className="absolute top-2 right-2 size-6 rounded-full bg-black/75 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer z-30"
                            title="Quitar imagen"
                          >
                            <X className="size-3.5" />
                          </button>
                          <CargaMultimediaOverlay
                            cargando={cargandoPreviewRecurso}
                            mensaje="Cargando imagen de referencia..."
                            tipo="imagen"
                          />
                        </div>
                      )}

                      <div className="relative overflow-hidden rounded-xl border border-dashed border-border p-3 text-center bg-background">
                        <input
                          type="file"
                          id="archivoFotoProyecto"
                          accept="image/*"
                          onChange={handleSubirArchivo}
                          className="hidden"
                        />
                        <label
                          htmlFor="archivoFotoProyecto"
                          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-muted/70 px-3.5 py-2 text-xs font-bold border border-border shadow-xs hover:bg-muted transition-colors text-foreground"
                        >
                          <UploadCloud className="size-3.5 text-primary" />
                          <span>Subir foto modelo de ejemplo</span>
                        </label>

                        <CargaMultimediaOverlay
                          cargando={subiendoArchivo}
                          progreso={progresoSubidaArchivo}
                          mensaje={mensajeSubidaArchivo}
                          tipo="imagen"
                        />
                      </div>
                      <Input
                        placeholder="O pega la URL de la imagen del trabajo modelo..."
                        value={leccionRecursoUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLeccionRecursoUrl(val);
                          if (val.trim().startsWith("http")) {
                            setCargandoPreviewRecurso(true);
                          } else {
                            setCargandoPreviewRecurso(false);
                          }
                        }}
                        className="h-9 text-xs bg-background"
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-card p-3 border border-border">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-heading block">
                          ¿Obligatorio para la Constancia?
                        </span>
                        <span className="text-[11px] text-muted-foreground block">
                          Si está marcado, la constancia no se emitirá hasta que Brayan apruebe este proyecto.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        id="checkObligatorio"
                        checked={proyectoObligatorio}
                        onChange={(e) => setProyectoObligatorio(e.target.checked)}
                        className="size-4 rounded accent-primary cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* Formulario y Constructor de Preguntas para Quizzes */}
                {tipoContenido === "quiz" && (
                  <div className="space-y-4">
                    {cargandoQuiz ? (
                      <div className="flex flex-col items-center justify-center p-8 gap-2 rounded-xl border border-dashed bg-muted/20">
                        <Loader2 className="h-6 w-6 animate-spin text-[#1e3a8a]" />
                        <span className="text-xs text-muted-foreground font-medium">
                          Cargando preguntas del cuestionario...
                        </span>
                      </div>
                    ) : (
                      <EditorQuiz
                        quizInicial={quizInicial}
                        onChange={setQuizData}
                        errores={errores}
                        onClearError={limpiarError}
                      />
                    )}
                  </div>
                )}

                {/* Descripción o notas para Video, Imagen y PDF */}
                {tipoContenido !== "documento" &&
                  tipoContenido !== "proyecto" &&
                  tipoContenido !== "quiz" && (
                  <div>
                    <Label htmlFor="descLeccionExtra" className="mb-1.5 block text-xs font-bold text-heading">
                      Notas o Instrucciones Complementarias (Opcional)
                    </Label>
                    <Textarea
                      id="descLeccionExtra"
                      rows={3}
                      placeholder="Instrucciones breves, notas de la clase o puntos clave..."
                      value={leccionDescripcion}
                      onChange={(e) => setLeccionDescripcion(e.target.value)}
                      className="text-xs resize-none"
                    />
                  </div>
                )}
              </div>

              {/* Columna 2 (5 cols): Previsualizador Inteligente en Vivo */}
              <div className="lg:col-span-5 flex flex-col gap-3 border-t lg:border-t-0 lg:border-l lg:pl-8 border-border pt-4 lg:pt-0">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-1.5">
                    <div className="size-6 rounded-md bg-icon-accent-soft text-icon-accent flex items-center justify-center">
                      <Eye className="size-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-heading block leading-none">
                        Vista Previa en Vivo
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Simulación en tiempo real del aula
                      </span>
                    </div>
                  </div>
                </div>

                {/* Previsualizador según el tipo */}
                <div className="flex-1 overflow-y-auto space-y-3">
                  {tipoContenido === "video" && (() => {
                    const parsed = parsearVideoUrl(leccionVideoUrl);

                    if (!leccionVideoUrl.trim() || !parsed) {
                      return (
                        <div className="flex flex-col items-center justify-center text-center aspect-video w-full rounded-2xl border-2 border-dashed border-border bg-muted/20 p-4 text-muted-foreground">
                          <div className="size-10 rounded-full bg-muted flex items-center justify-center text-icon-accent mb-2">
                            <Video className="size-5" />
                          </div>
                          <span className="text-xs font-bold text-heading">Sin video seleccionado</span>
                          <span className="text-[11px] mt-1 max-w-[220px]">
                            Pega un enlace de Google Drive, YouTube, Vimeo o Loom a la izquierda.
                          </span>
                        </div>
                      );
                    }

                    const nombreProveedor =
                      parsed.tipo === "drive"
                        ? "Google Drive"
                        : parsed.tipo === "youtube"
                        ? "YouTube"
                        : parsed.tipo === "vimeo"
                        ? "Vimeo"
                        : parsed.tipo === "loom"
                        ? "Loom"
                        : parsed.tipo === "directo"
                        ? "Video Directo MP4"
                        : "Enlace Externo";

                    return (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-muted-foreground uppercase">
                            Origen detectado:
                          </span>
                          <Badge
                            variant="secondary"
                            className="font-bold text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent"
                          >
                            <Play className="size-3 mr-1 fill-current" />
                            <span>{nombreProveedor}</span>
                          </Badge>
                        </div>

                        {/* Embed Player */}
                        <div
                          className={cn(
                            "relative w-full rounded-2xl overflow-hidden border border-border bg-black shadow-xs",
                            parsed.tipo === "drive"
                              ? "h-[290px] sm:h-[315px]"
                              : "aspect-video"
                          )}
                        >
                          {parsed.tipo === "directo" ? (
                            <video
                              src={parsed.embedUrl}
                              controls
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <iframe
                              src={parsed.embedUrl}
                              title={leccionTitulo || "Vista previa de video"}
                              className="h-full w-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          )}
                        </div>

                        {/* Alerta de ayuda si es Google Drive */}
                        {parsed.tipo === "drive" && (
                          <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 p-2.5 text-[11px] text-amber-800 dark:text-amber-300 border border-amber-500/20">
                            <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                            <p className="leading-tight">
                              <span className="font-bold">Aviso importante de Drive:</span> El video debe estar configurado como <span className="underline font-semibold">&quot;Cualquier persona con el enlace puede ver&quot;</span> para que cargue a tus alumnos.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {tipoContenido === "documento" && (
                    <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-2.5 max-h-[420px] overflow-y-auto">
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <Badge variant="outline" className="text-[10px] font-bold">
                          Vista Editorial
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {leccionDescripcion.length} caracteres
                        </span>
                      </div>
                      <h4 className="font-bold text-heading text-sm">
                        {leccionTitulo || "Título de la clase..."}
                      </h4>
                      <p className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed">
                        {leccionDescripcion || "El texto e instrucciones redactadas a la izquierda aparecerán aquí tal como las verá el alumno en el aula virtual..."}
                      </p>
                    </div>
                  )}

                  {tipoContenido === "imagen" && (
                    <div className="space-y-2.5">
                      {leccionRecursoUrl ? (
                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-border bg-black/5 dark:bg-white/5 flex items-center justify-center p-2">
                          <img
                            src={leccionRecursoUrl}
                            alt="Vista previa de recurso"
                            className="max-h-full max-w-full object-contain rounded-lg"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center aspect-video w-full rounded-2xl border-2 border-dashed border-border bg-muted/20 p-4 text-muted-foreground">
                          <ImageIcon className="size-8 text-icon-accent mb-2" />
                          <span className="text-xs font-bold text-heading">Sin imagen seleccionada</span>
                          <span className="text-[11px] mt-1">Sube una imagen o pega una URL para ver la vista previa.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {tipoContenido === "pdf" && (
                    <Card className="rounded-xl border-border bg-card p-4 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-heading flex items-center gap-1.5">
                          <FileText className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Vista Alumna: Documento PDF</span>
                        </span>
                        <Badge
                          variant="outline"
                          className="border-emerald-500/20 bg-emerald-500/10 text-[10px] font-bold text-emerald-600 dark:text-emerald-400"
                        >
                          Visor Protegido
                        </Badge>
                      </div>

                      {leccionRecursoUrl ? (
                        <div className="rounded-xl bg-slate-900 text-white p-4 space-y-2.5 text-center">
                          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 mx-auto">
                            <FileText className="size-5" />
                          </div>
                          <div>
                            <span className="font-bold text-xs block text-slate-100">
                              {leccionTitulo || "Documento PDF"}
                            </span>
                            <span className="text-[11px] text-slate-400 block truncate max-w-xs mx-auto mt-0.5">
                              {leccionRecursoUrl}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Se embeberá en el visor seguro del aula virtual con descarga protegida.
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center aspect-video w-full rounded-2xl border-2 border-dashed border-border bg-muted/20 p-4 text-muted-foreground">
                          <FileText className="size-8 text-emerald-600 dark:text-emerald-400 mb-2 opacity-60" />
                          <span className="text-xs font-bold text-heading">Sin documento PDF vinculado</span>
                          <span className="text-[11px] mt-1">
                            Pega el enlace de Google Drive o sube un PDF para visualizarlo.
                          </span>
                        </div>
                      )}

                      {leccionDescripcion && (
                        <div className="rounded-xl bg-muted/30 dark:bg-muted/20 p-3 border border-border text-xs space-y-1">
                          <span className="font-bold text-heading text-[11px] block">Notas de la lección:</span>
                          <p className="text-[11px] text-muted-foreground line-clamp-3">
                            {leccionDescripcion}
                          </p>
                        </div>
                      )}
                    </Card>
                  )}

                  {tipoContenido === "proyecto" && (
                    <Card className="rounded-xl border-border bg-card p-4 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-heading flex items-center gap-1.5">
                          <Sparkles className="size-3.5 text-primary" />
                          <span>Vista Alumna: Envío a WhatsApp</span>
                        </span>
                        <Badge
                          variant={proyectoObligatorio ? "default" : "secondary"}
                          className="text-[10px] font-bold"
                        >
                          {proyectoObligatorio ? "Obligatorio" : "Opcional"}
                        </Badge>
                      </div>

                      {leccionRecursoUrl ? (
                        <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-border bg-muted/40">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={leccionRecursoUrl}
                            alt="Trabajo modelo"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center aspect-video w-full rounded-xl border border-dashed border-border bg-muted/20 p-3 text-center text-muted-foreground">
                          <Sparkles className="size-5 text-primary mb-1" />
                          <span className="text-xs font-semibold text-foreground">Foto del modelo de Brayan</span>
                          <span className="text-[10px] text-muted-foreground">
                            Ayuda a la alumna a visualizar el acabado esperado
                          </span>
                        </div>
                      )}

                      <div className="rounded-xl bg-muted/30 dark:bg-muted/20 p-3 border border-border text-xs space-y-1.5">
                        <span className="font-bold text-heading block">
                          {leccionTitulo || "Nombre del Proyecto Práctico"}
                        </span>
                        <p className="text-[11px] text-muted-foreground line-clamp-3">
                          {leccionDescripcion || "Aquí aparecerán las instrucciones del trabajo para la alumna..."}
                        </p>
                      </div>

                      <div className="rounded-xl bg-emerald-600 dark:bg-emerald-600 text-white p-2.5 flex items-center justify-center gap-2 font-bold text-xs shadow-xs">
                        <Send className="size-3.5" />
                        <span>Enviar Proyecto a Brayan por WhatsApp</span>
                      </div>
                    </Card>
                  )}

                  {tipoContenido === "quiz" && (
                    <Card className="rounded-xl border-border bg-card p-4 space-y-3 shadow-xs dark:bg-slate-900/60 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-heading flex items-center gap-1.5">
                          <HelpCircle className="size-3.5 text-[#1e3a8a] dark:text-blue-400" />
                          <span>Vista Alumna: Cuestionario</span>
                        </span>
                        <Badge className="bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-400/40 text-[10px] font-bold">
                          Mín. {quizData?.porcentajeMinimo ?? 80}%
                        </Badge>
                      </div>

                      <div className="rounded-xl bg-muted/30 dark:bg-muted/20 p-3.5 border border-border dark:border-slate-800 text-xs space-y-2">
                        <span className="font-bold text-heading block">
                          {leccionTitulo || "Título de la Evaluación Teórica"}
                        </span>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">
                          {leccionDescripcion || "Evaluación con retroalimentación didáctica y calificación automática..."}
                        </p>
                        <div className="pt-2 border-t border-border dark:border-slate-800 flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">Preguntas configuradas:</span>
                          <span className="font-bold text-foreground">{quizData?.preguntas?.length ?? 1}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">Intentos permitidos:</span>
                          <span className="font-bold text-foreground">
                            {quizData?.intentosPermitidos ? `${quizData.intentosPermitidos} intentos` : "Ilimitados"}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-xl bg-[#1e3a8a] hover:bg-[#16294f] dark:bg-blue-600 dark:hover:bg-blue-700 text-white p-2.5 flex items-center justify-center gap-2 font-bold text-xs shadow-xs transition-colors">
                        <HelpCircle className="size-3.5" />
                        <span>Comenzar Evaluación en el Aula</span>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-2 border-t bg-muted/30 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalLeccionAbierto(false)}
                className="rounded-full px-5 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={guardando || subiendoArchivo}
                className="rounded-full px-5 text-xs font-bold cursor-pointer"
              >
                <Sparkles className="mr-1.5 size-4" />
                <span>
                  {guardando
                    ? "Guardando…"
                    : leccionEditando?.leccion
                    ? "Guardar Cambios"
                    : "Agregar Clase"}
                </span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Moderno de Confirmación de Eliminación (shadcn/ui) */}
      <AlertDialog
        open={Boolean(confirmacionEliminar)}
        onOpenChange={(abierto) => {
          if (!abierto && !eliminando) setConfirmacionEliminar(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              {confirmacionEliminar?.tipo === "modulo"
                ? "¿Eliminar este módulo?"
                : "¿Eliminar esta clase?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
              {confirmacionEliminar?.tipo === "modulo" ? (
                <>
                  Estás a punto de eliminar el módulo{" "}
                  <strong className="text-foreground">
                    &quot;{confirmacionEliminar?.titulo}&quot;
                  </strong>{" "}
                  y todas las clases que contiene. Esta acción no se puede deshacer.
                </>
              ) : (
                <>
                  Estás a punto de eliminar la clase{" "}
                  <strong className="text-foreground">
                    &quot;{confirmacionEliminar?.titulo}&quot;
                  </strong>
                  . Esta acción no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <AlertDialogCancel
              disabled={eliminando}
              onClick={() => setConfirmacionEliminar(null)}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={eliminando}
              onClick={handleConfirmarEliminacion}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {eliminando ? "Eliminando..." : "Sí, eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
