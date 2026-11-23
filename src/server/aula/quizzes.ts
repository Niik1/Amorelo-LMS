// Server Actions para la visualización y evaluación de Quizzes Teóricos (Aula Virtual)
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type OpcionEstudiante = {
  id: string;
  texto: string;
};

export type PreguntaEstudiante = {
  id: string;
  enunciado: string;
  orden: number;
  opciones: OpcionEstudiante[];
};

export type DetalleQuizEstudiante = {
  id: string;
  leccion_id: string;
  titulo: string;
  descripcion: string | null;
  porcentaje_minimo: number;
  intentos_permitidos: number | null;
  preguntas: PreguntaEstudiante[];
  ultimoIntento?: {
    puntaje: number;
    aprobado: boolean;
    creado_en: string;
  } | null;
  intentosRealizados: number;
  haAprobado: boolean;
};

/**
 * Obtiene las preguntas y alternativas de un quiz para el estudiante (sin exponer las respuestas correctas).
 */
export async function obtenerQuizEstudiante({
  leccionId,
  matriculaId,
}: {
  leccionId: string;
  matriculaId: string;
}): Promise<{ ok: boolean; quiz?: DetalleQuizEstudiante | null; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "No autenticado" };
  }

  // 1. Obtener la definición del quiz
  const { data: quiz, error: errQuiz } = await supabase
    .from("quizzes")
    .select("id, leccion_id, titulo, descripcion, porcentaje_minimo, intentos_permitidos")
    .eq("leccion_id", leccionId)
    .maybeSingle();

  if (errQuiz) {
    return { ok: false, error: errQuiz.message };
  }

  if (!quiz) {
    return { ok: true, quiz: null };
  }

  // 2. Obtener preguntas ordenadas
  const { data: preguntas } = await supabase
    .from("preguntas_quiz")
    .select("id, enunciado, orden")
    .eq("quiz_id", quiz.id)
    .order("orden", { ascending: true });

  const listaPreguntas = preguntas ?? [];
  const preguntaIds = listaPreguntas.map((p) => p.id);

  // 3. Obtener opciones (solo id, texto_opcion y pregunta_id; es_correcta NUNCA se expone al cliente)
  let opcionesPorPregunta = new Map<string, OpcionEstudiante[]>();
  if (preguntaIds.length > 0) {
    const admin = createAdminClient();
    const { data: opciones } = await admin
      .from("opciones_quiz")
      .select("id, pregunta_id, texto_opcion")
      .in("pregunta_id", preguntaIds);

    (opciones ?? []).forEach((op) => {
      const arr = opcionesPorPregunta.get(op.pregunta_id) || [];
      arr.push({ id: op.id, texto: op.texto_opcion });
      opcionesPorPregunta.set(op.pregunta_id, arr);
    });
  }

  // 4. Obtener intentos previos de la alumna
  const { data: intentos } = await supabase
    .from("intentos_quiz")
    .select("id, puntaje, aprobado, creado_en")
    .eq("quiz_id", quiz.id)
    .eq("matricula_id", matriculaId)
    .order("creado_en", { ascending: false });

  const totalIntentos = intentos?.length ?? 0;
  const haAprobado = (intentos ?? []).some((i) => i.aprobado);
  const ultimoIntento = intentos && intentos.length > 0 ? intentos[0] : null;

  return {
    ok: true,
    quiz: {
      id: quiz.id,
      leccion_id: quiz.leccion_id,
      titulo: quiz.titulo,
      descripcion: quiz.descripcion,
      porcentaje_minimo: quiz.porcentaje_minimo,
      intentos_permitidos: quiz.intentos_permitidos,
      preguntas: listaPreguntas.map((p) => ({
        id: p.id,
        enunciado: p.enunciado,
        orden: p.orden,
        opciones: opcionesPorPregunta.get(p.id) || [],
      })),
      intentosRealizados: totalIntentos,
      haAprobado,
      ultimoIntento: ultimoIntento
        ? {
            puntaje: ultimoIntento.puntaje,
            aprobado: ultimoIntento.aprobado,
            creado_en: ultimoIntento.creado_en,
          }
        : null,
    },
  };
}

/**
 * Evalúa las respuestas enviadas por la alumna de forma segura en el servidor.
 */
export async function calificarIntentoQuiz({
  quizId,
  matriculaId,
  leccionId,
  respuestas,
}: {
  quizId: string;
  matriculaId: string;
  leccionId: string;
  respuestas: Record<string, string>; // { [preguntaId]: opcionIdSeleccionada }
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "No autenticado" };
  }

  const adminClient = createAdminClient();

  // 1. Obtener el quiz y sus preguntas
  const { data: quiz } = await adminClient
    .from("quizzes")
    .select("id, porcentaje_minimo, intentos_permitidos")
    .eq("id", quizId)
    .single();

  if (!quiz) {
    return { ok: false, error: "Cuestionario no encontrado" };
  }

  // 2. Verificar intentos permitidos
  if (quiz.intentos_permitidos !== null) {
    const { count } = await adminClient
      .from("intentos_quiz")
      .select("id", { count: "exact", head: true })
      .eq("quiz_id", quizId)
      .eq("matricula_id", matriculaId);

    if ((count ?? 0) >= quiz.intentos_permitidos) {
      return { ok: false, error: "Has alcanzado el límite máximo de intentos permitidos para esta evaluación." };
    }
  }

  // 3. Obtener las preguntas y sus opciones correctas
  const { data: preguntas } = await adminClient
    .from("preguntas_quiz")
    .select("id, enunciado, explicacion, opciones_quiz(id, texto_opcion, es_correcta)")
    .eq("quiz_id", quizId);

  const listaPreguntas = preguntas ?? [];
  if (listaPreguntas.length === 0) {
    return { ok: false, error: "Este cuestionario no tiene preguntas configuradas" };
  }

  let aciertos = 0;
  const retroalimentacion: Array<{
    preguntaId: string;
    esCorrecta: boolean;
    explicacion: string | null;
  }> = [];

  listaPreguntas.forEach((preg) => {
    const seleccionId = respuestas[preg.id];
    const opciones = (preg.opciones_quiz as unknown as Array<{ id: string; texto_opcion: string; es_correcta: boolean }>) || [];
    const opcionCorrecta = opciones.find((op) => op.es_correcta);

    const esAcierto = Boolean(seleccionId && opcionCorrecta && seleccionId === opcionCorrecta.id);
    if (esAcierto) {
      aciertos++;
    }

    retroalimentacion.push({
      preguntaId: preg.id,
      esCorrecta: esAcierto,
      explicacion: preg.explicacion,
    });
  });

  const puntaje = Math.round((aciertos / listaPreguntas.length) * 100);
  const aprobado = puntaje >= quiz.porcentaje_minimo;

  // 4. Guardar el intento
  const { error: errIntento } = await adminClient.from("intentos_quiz").insert({
    quiz_id: quizId,
    matricula_id: matriculaId,
    perfil_id: user.id,
    puntaje,
    aprobado,
    respuestas_detalle: respuestas,
  });

  if (errIntento) {
    return { ok: false, error: errIntento.message };
  }

  // 5. Si aprobó, marcar la lección como completada en progreso_lecciones si aún no lo estaba
  if (aprobado) {
    await adminClient
      .from("progreso_lecciones")
      .upsert({ perfil_id: user.id, leccion_id: leccionId });
  }

  revalidatePath("/aula", "layout");

  return {
    ok: true,
    puntaje,
    aprobado,
    porcentajeMinimo: quiz.porcentaje_minimo,
    aciertos,
    totalPreguntas: listaPreguntas.length,
    retroalimentacion,
  };
}
