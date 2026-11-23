// Dashboard del alumno: cursos matriculados, progreso y accesos rápidos.

import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  CalendarDays,
  Clock,
  GraduationCap,
  Play,
  Trophy,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { obtenerCursosMatriculados } from "@/server/aula/consultas";
import { obtenerMensajeBannerAction } from "@/server/configuracion/acciones";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/ui/kpi-card";
import { MensajeMotivacionalBanner } from "@/components/aula/mensaje-motivacional-banner";

function diasRestantes(venceEn: string): number {
  const hoy = new Date();
  const vence = new Date(venceEn);
  const diff = vence.getTime() - hoy.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function porcentaje(completadas: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completadas / total) * 100);
}

export default async function AulaDashboardPage() {
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

  const nombre = perfil?.nombre_completo?.split(" ")[0] ?? "Alumno";

  const [cursos, mensajeBanner] = await Promise.all([
    obtenerCursosMatriculados(user.id),
    obtenerMensajeBannerAction(),
  ]);

  const totalCursos = cursos.length;
  const cursosCompletados = cursos.filter(
    (c) => c.totalLecciones > 0 && c.leccionesCompletadas >= c.totalLecciones,
  ).length;
  const leccionesTotales = cursos.reduce((acc, c) => acc + c.totalLecciones, 0);
  const leccionesCompletadas = cursos.reduce(
    (acc, c) => acc + c.leccionesCompletadas,
    0,
  );

  return (
    <main className="flex w-full flex-1 flex-col min-w-0 gap-6 p-4 sm:p-6 max-w-full">
      {/* Tarjeta Hero de Bienvenida — fondo azul marca */}
      <div className="relative overflow-hidden rounded-2xl bg-[#1e3a8a] p-6 text-white shadow-lg sm:p-8">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-white/70">
              👋 ¡Bienvenida de vuelta!
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl text-white">
              ¡Hola, {nombre}!
            </h1>
            <p className="mt-2 max-w-lg text-sm text-white/80">
              {totalCursos === 0
                ? "Aún no tienes cursos matriculados. ¡Explora nuestro catálogo y empieza a crear magia con globos! 🎈"
                : `Tienes ${totalCursos} curso${totalCursos > 1 ? "s" : ""} activo${totalCursos > 1 ? "s" : ""}. ¡Sigue aprendiendo y creando!`}
            </p>
            {cursos.length > 0 && (
              <Link href={`/aula/cursos/${cursos[0].slug}`}>
                <Button
                  className="mt-4 rounded-full bg-white font-bold text-[#1e3a8a] shadow-md hover:bg-slate-100"
                  size="lg"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Continuar aprendiendo
                </Button>
              </Link>
            )}
          </div>

          {/* Lado derecho: Mensaje Motivacional del Mentor */}
          <MensajeMotivacionalBanner mensajeBanner={mensajeBanner} />
        </div>
        {/* Decoración sutil */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 rounded-full bg-white/5" />
      </div>

      {/* KPIs de resumen unificados */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          titulo="Cursos Activos"
          valor={totalCursos}
          subtitulo="En tu catálogo personal"
          icono={BookOpen}
          tono="blue"
        />
        <KpiCard
          titulo="Completados"
          valor={cursosCompletados}
          subtitulo="Cursos finalizados al 100%"
          icono={Trophy}
          tono="amber"
          valorClassName={cursosCompletados > 0 ? "text-amber-600 dark:text-amber-400" : undefined}
        />
        <KpiCard
          titulo="Lecciones Vistas"
          valor={`${leccionesCompletadas}/${leccionesTotales}`}
          subtitulo="Progreso total de lecciones"
          icono={GraduationCap}
          tono="indigo"
        />
        <KpiCard
          titulo="Avance General"
          valor={`${porcentaje(leccionesCompletadas, leccionesTotales)}%`}
          subtitulo="Promedio de avance global"
          icono={Clock}
          tono="emerald"
          valorClassName="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* Cursos matriculados */}
      {cursos.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold tracking-tight">
            📚 Mis Cursos
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cursos.map((curso) => {
              const pct = porcentaje(
                curso.leccionesCompletadas,
                curso.totalLecciones,
              );
              const dias = diasRestantes(curso.venceEn);
              const estaCompleto = pct >= 100;

              return (
                <Link
                  key={curso.matriculaId}
                  href={`/aula/cursos/${curso.slug}`}
                  className="group"
                >
                  <div className="overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
                    {/* Imagen del curso */}
                    <div className="relative aspect-video w-full overflow-hidden bg-muted">
                      {curso.imagenUrl ? (
                        <Image
                          src={curso.imagenUrl}
                          alt={curso.nombre}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-[#1e3a8a]/10">
                          <BookOpen className="h-10 w-10 text-[#1e3a8a]/40" />
                        </div>
                      )}
                      {/* Badge de estado */}
                      {estaCompleto && (
                        <span className="absolute right-2 top-2 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-bold text-white">
                          ✓ Completado
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold leading-snug">{curso.nombre}</h3>

                      {/* Barra de progreso */}
                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {curso.leccionesCompletadas}/{curso.totalLecciones}{" "}
                            lecciones
                          </span>
                          <span className="font-bold text-[#1e3a8a] dark:text-blue-400">
                            {pct}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-[#1e3a8a] transition-all dark:bg-blue-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Vigencia */}
                      <div className="mt-3 flex items-center gap-1.5 text-xs">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {dias > 0
                            ? `${dias} días de acceso restantes`
                            : "Acceso vencido"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Estado vacío */}
      {cursos.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card p-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/50" />
          <h2 className="mt-4 text-lg font-bold">
            Aún no tienes cursos matriculados
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Las cuentas de alumno se crean automáticamente al comprar un curso
            en nuestra plataforma. ¡Explora el catálogo y empieza a crear!
          </p>
          <Link href="/">
            <Button className="mt-6 bg-[#1e3a8a] font-bold hover:bg-[#1e3a8a]/90">
              Explorar cursos
            </Button>
          </Link>
        </div>
      )}
    </main>
  );
}
