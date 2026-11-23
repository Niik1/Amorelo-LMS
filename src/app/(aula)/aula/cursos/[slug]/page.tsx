// Temario del curso: módulos y lecciones con estado de avance (RF-EST-31).

import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  Play,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { obtenerCursosMatriculados, obtenerModulosCurso } from "@/server/aula/consultas";
import { Button } from "@/components/ui/button";

function diasRestantes(venceEn: string): number {
  const hoy = new Date();
  const vence = new Date(venceEn);
  const diff = vence.getTime() - hoy.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default async function CursoTemarioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect_to=/aula");

  // Buscar el curso por slug en las matrículas del alumno
  const cursos = await obtenerCursosMatriculados(user.id);
  const curso = cursos.find((c) => c.slug === slug);

  if (!curso) notFound();

  const modulos = await obtenerModulosCurso(curso.cursoId, user.id);

  const totalLecciones = modulos.reduce((acc, m) => acc + m.lecciones.length, 0);
  const leccionesCompletadas = modulos.reduce(
    (acc, m) => acc + m.lecciones.filter((l) => l.completada).length,
    0,
  );
  const porcentaje =
    totalLecciones > 0
      ? Math.round((leccionesCompletadas / totalLecciones) * 100)
      : 0;
  const dias = diasRestantes(curso.venceEn);

  // Encontrar la primera lección no completada para el botón "Continuar"
  let primeraNoCompletada: { moduloId: string; leccionId: string } | null = null;
  for (const modulo of modulos) {
    for (const leccion of modulo.lecciones) {
      if (!leccion.completada) {
        primeraNoCompletada = {
          moduloId: modulo.id,
          leccionId: leccion.id,
        };
        break;
      }
    }
    if (primeraNoCompletada) break;
  }

  return (
    <main className="flex w-full flex-1 flex-col min-w-0 gap-6 p-4 sm:p-6 max-w-full">
      {/* Navegación de regreso */}
      <Link
        href="/aula"
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Mis Cursos
      </Link>

      {/* Header del curso */}
      <div className="overflow-hidden rounded-2xl bg-[#1e3a8a] p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          {/* Imagen del curso */}
          {curso.imagenUrl && (
            <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl sm:w-48">
              <Image
                src={curso.imagenUrl}
                alt={curso.nombre}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 192px"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl text-white">
              {curso.nombre}
            </h1>
            {curso.descripcion && (
              <p className="mt-2 text-sm text-white/70 line-clamp-2">
                {curso.descripcion}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-white/70" />
                {totalLecciones} lecciones
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                {leccionesCompletadas} completadas
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-white/70" />
                {dias} días restantes
              </span>
            </div>
            {/* Barra de progreso */}
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-white/60">Progreso del curso</span>
                <span className="font-bold">{porcentaje}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all"
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
            </div>
            {primeraNoCompletada && (
              <Link
                href={`/aula/cursos/${slug}/${primeraNoCompletada.moduloId}/${primeraNoCompletada.leccionId}`}
              >
                <Button
                  size="lg"
                  className="mt-4 rounded-full bg-white font-bold text-[#1e3a8a] shadow-md hover:bg-slate-100"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Continuar donde lo dejé
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Lista de módulos y lecciones */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#1e3a8a] dark:text-blue-400" />
          <h2 className="text-lg font-bold tracking-tight">Temario</h2>
        </div>
        {modulos.map((modulo) => {
          const completadasMod = modulo.lecciones.filter((l) => l.completada).length;
          const totalMod = modulo.lecciones.length;
          const pctMod =
            totalMod > 0 ? Math.round((completadasMod / totalMod) * 100) : 0;

          return (
            <div
              key={modulo.id}
              className="overflow-hidden rounded-xl border bg-card shadow-sm"
            >
              {/* Header del módulo */}
              <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3 dark:bg-muted/10">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold">
                    Módulo {modulo.orden}: {modulo.titulo}
                  </h3>
                  {modulo.descripcion && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {modulo.descripcion}
                    </p>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-[#1e3a8a]/10 px-2.5 py-0.5 text-xs font-bold text-[#1e3a8a] dark:bg-blue-500/20 dark:text-blue-400">
                  {completadasMod}/{totalMod}
                </span>
              </div>

              {/* Lecciones */}
              <ul className="divide-y">
                {modulo.lecciones.map((leccion) => (
                  <li key={leccion.id}>
                    <Link
                      href={`/aula/cursos/${slug}/${modulo.id}/${leccion.id}`}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                    >
                      {leccion.completada ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                      ) : leccion.tipoContenido === "proyecto" ? (
                        <Sparkles className="h-5 w-5 shrink-0 text-amber-500" />
                      ) : leccion.tipoContenido === "quiz" ? (
                        <HelpCircle className="h-5 w-5 shrink-0 text-[#1e3a8a] dark:text-blue-400" />
                      ) : (
                        <Circle className="h-5 w-5 shrink-0 text-muted-foreground/40" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium leading-snug">
                            {leccion.orden}. {leccion.titulo}
                          </p>
                          {leccion.tipoContenido === "proyecto" && (
                            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700/60">
                              Proyecto
                            </span>
                          )}
                          {leccion.tipoContenido === "quiz" && (
                            <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-900 border border-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-700/60">
                              Quiz
                            </span>
                          )}
                        </div>
                        {leccion.descripcion && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {leccion.descripcion}
                          </p>
                        )}
                      </div>
                      <Play className="h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>
    </main>
  );
}
