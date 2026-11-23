// Visor de lección: reproductor de video, progreso, asesoría y temario lateral en 2 columnas (RF-EST-31, 32, 34, 36).
// Diseño desktop 70% / 30% estilo Hotmart / Udemy, con navegación lateral sin scroll excesivo.

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { obtenerLeccion, obtenerModulosCurso } from "@/server/aula/consultas";
import { Button } from "@/components/ui/button";
import { BotonCompletar } from "@/components/aula/boton-completar";
import { BotonWhatsAppMentor } from "@/components/aula/boton-whatsapp-mentor";
import { ReproductorVideo } from "@/components/aula/reproductor-video";
import { VisorDocumento } from "@/components/aula/visor-documento";
import { VisorImagen } from "@/components/aula/visor-imagen";
import { VisorPdf } from "@/components/aula/visor-pdf";
import { VisorProyecto } from "@/components/aula/visor-proyecto";
import { VisorQuiz } from "@/components/aula/visor-quiz";
import { TemarioLateral } from "@/components/aula/temario-lateral";
import { obtenerProyectoLeccion } from "@/server/aula/proyectos";
import { obtenerQuizEstudiante } from "@/server/aula/quizzes";

export default async function LeccionPage({
  params,
}: {
  params: Promise<{ slug: string; moduloId: string; leccionId: string }>;
}) {
  const { slug, leccionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect_to=/aula");

  const { data: perfil } = await supabase
    .from("profiles")
    .select("nombre_completo")
    .eq("id", user.id)
    .maybeSingle();

  const nombreAlumno = perfil?.nombre_completo ?? "Alumno";

  const resultado = await obtenerLeccion(leccionId, user.id);
  if (!resultado) notFound();

  const { leccion, completada } = resultado;

  // Si la lección es de tipo proyecto, obtener la definición y entrega del proyecto
  let detalleProyecto = null;
  if (leccion.tipoContenido === "proyecto") {
    const resProy = await obtenerProyectoLeccion({
      leccionId,
      matriculaId: leccion.matriculaId,
    });

    detalleProyecto = resProy.ok && resProy.proyecto
      ? resProy.proyecto
      : {
          id: leccion.id,
          leccion_id: leccion.id,
          titulo_proyecto: leccion.titulo,
          instrucciones: leccion.descripcion,
          foto_referencia_url: leccion.recursoUrl,
          es_obligatorio: true,
          entrega: null,
        };
  }

  // Si la lección es de tipo quiz, obtener la definición del cuestionario
  let detalleQuiz = null;
  if (leccion.tipoContenido === "quiz") {
    const resQuiz = await obtenerQuizEstudiante({
      leccionId,
      matriculaId: leccion.matriculaId,
    });
    if (resQuiz.ok && resQuiz.quiz) {
      detalleQuiz = resQuiz.quiz;
    }
  }

  // Obtener todos los módulos y lecciones para la columna lateral y navegación
  const modulos = await obtenerModulosCurso(leccion.cursoId, user.id);
  const todasLecciones = modulos.flatMap((m) =>
    m.lecciones.map((l) => ({ ...l, moduloId: m.id })),
  );

  const totalLecciones = todasLecciones.length;
  const leccionesCompletadas = todasLecciones.filter((l) => l.completada).length;
  const porcentajeAvance =
    totalLecciones > 0
      ? Math.round((leccionesCompletadas / totalLecciones) * 100)
      : 0;

  const indiceActual = todasLecciones.findIndex((l) => l.id === leccionId);
  const leccionAnterior = indiceActual > 0 ? todasLecciones[indiceActual - 1] : null;
  const leccionSiguiente =
    indiceActual < todasLecciones.length - 1
      ? todasLecciones[indiceActual + 1]
      : null;

  return (
    <main className="flex w-full flex-1 flex-col min-w-0 gap-4 p-4 sm:p-6 max-w-full">
      {/* Navegación superior */}
      <div className="flex flex-col gap-7 border-b pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pb-3">
        <Link
          href={`/aula/cursos/${slug}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al temario
        </Link>
        <div className="flex items-center justify-center gap-2 sm:justify-end">
          <BookOpen className="h-4 w-4 shrink-0 text-[#1e3a8a] dark:text-blue-400" />
          <span className="text-center text-xs font-bold text-foreground sm:text-right">
            {leccion.cursoNombre}
          </span>
        </div>
      </div>

      {/* Distribución 2 Columnas en Desktop: 70% Izquierda (Video) / 30% Derecha (Temario) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* COLUMNA IZQUIERDA (~70% en Desktop: 8 de 12 columnas) */}
        <div className="flex flex-col gap-4 lg:col-span-8">
          {/* 1. Encabezado Informativo de la Lección (ARRIBA DEL REPRODUCTOR) */}
          {leccion.tipoContenido !== "documento" &&
            leccion.tipoContenido !== "proyecto" &&
            leccion.tipoContenido !== "quiz" && (
            <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1e3a8a] dark:text-blue-400">
                  {leccion.moduloTitulo} • Lección {leccion.orden}
                </span>
                <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                  {leccion.titulo}
                </h1>
                {leccion.descripcion && (
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {leccion.descripcion}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 2. Escenario Dinámico de Contenido (Proyecto, Quiz, Video, Canva, PDF o Documento) */}
          {leccion.tipoContenido === "proyecto" && detalleProyecto ? (
            <VisorProyecto
              proyecto={detalleProyecto}
              matriculaId={leccion.matriculaId}
              nombreAlumno={nombreAlumno}
              cursoNombre={leccion.cursoNombre}
              moduloTitulo={leccion.moduloTitulo}
              leccionTitulo={leccion.titulo}
            />
          ) : leccion.tipoContenido === "quiz" && detalleQuiz ? (
            <VisorQuiz
              quiz={detalleQuiz}
              matriculaId={leccion.matriculaId}
              leccionId={leccionId}
              moduloTitulo={leccion.moduloTitulo}
              leccionTitulo={leccion.titulo}
            />
          ) : leccion.tipoContenido === "documento" ? (
            <VisorDocumento
              titulo={leccion.titulo}
              contenido={leccion.descripcion}
              moduloTitulo={leccion.moduloTitulo}
              orden={leccion.orden}
            />
          ) : leccion.tipoContenido === "imagen" ? (
            <VisorImagen
              url={leccion.recursoUrl}
              titulo={leccion.titulo}
            />
          ) : leccion.tipoContenido === "pdf" ? (
            <VisorPdf
              url={leccion.recursoUrl}
              titulo={leccion.titulo}
            />
          ) : (
            <ReproductorVideo
              url={leccion.videoUrl}
              titulo={`${leccion.moduloTitulo} - ${leccion.titulo}`}
            />
          )}

          {/* 3. Barra de Acciones y Navegación (DEBAJO DEL REPRODUCTOR) */}
          <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center gap-3">
              <BotonCompletar
                leccionId={leccionId}
                completadaInicial={completada}
                tipoContenido={leccion.tipoContenido}
              />
              <BotonWhatsAppMentor
                nombreAlumno={nombreAlumno}
                cursoNombre={leccion.cursoNombre}
                moduloTitulo={leccion.moduloTitulo}
                leccionTitulo={leccion.titulo}
              />
            </div>

            {/* Navegación rápida Anterior / Siguiente */}
            <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4">
              {leccionAnterior ? (
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={
                    <Link
                      href={`/aula/cursos/${slug}/${leccionAnterior.moduloId}/${leccionAnterior.id}`}
                    />
                  }
                >
                  <ArrowLeft />
                  <span>Anterior</span>
                </Button>
              ) : (
                <div />
              )}
              {leccionSiguiente ? (
                <Button
                  variant="default"
                  size="sm"
                  nativeButton={false}
                  className="bg-[#1e3a8a] font-bold text-white shadow-sm hover:bg-[#16294f] dark:bg-blue-600"
                  render={
                    <Link
                      href={`/aula/cursos/${slug}/${leccionSiguiente.moduloId}/${leccionSiguiente.id}`}
                    />
                  }
                >
                  <span>Siguiente clase</span>
                  <ArrowRight />
                </Button>
              ) : (
                <div />
              )}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (~30% en Desktop: 4 de 12 columnas) — Temario con Acordeón */}
        <div className="lg:col-span-4">
          <TemarioLateral
            modulos={modulos}
            leccionActivaId={leccionId}
            slug={slug}
            totalLecciones={totalLecciones}
            leccionesCompletadas={leccionesCompletadas}
            porcentajeAvance={porcentajeAvance}
          />
        </div>
      </div>
    </main>
  );
}
