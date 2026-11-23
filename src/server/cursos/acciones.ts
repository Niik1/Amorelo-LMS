// Server Actions de cursos (requieren admin: la verificación vive en el
// layout + proxy, y RLS solo deja operar a admins). El slug no se edita:
// es la clave con la que la web pública busca el curso.

"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerAdminVerificado } from "@/server/auth/admin";
import {
  esquemaCurso,
  esquemaNuevoCurso,
  type EntradaCurso,
  type EntradaNuevoCurso,
} from "@/lib/validators/curso";

const RUTA = "/panel-admin/cursos";

type Resultado = { ok: true; id?: string } | { ok: false; error: string };

/** Crea un nuevo curso. */
export async function crearCurso(
  entrada: EntradaNuevoCurso,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const parsed = esquemaNuevoCurso.safeParse(entrada);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisá los datos del curso." };
  }

  const supabase = await createClient();
  if (!(await obtenerAdminVerificado(supabase))) {
    return { ok: false, error: "Sin acceso." };
  }

  const v = parsed.data;
  const { data, error } = await supabase
    .from("cursos")
    .insert({
      nombre: v.nombre,
      slug: v.slug,
      descripcion: v.descripcion ?? null,
      imagen_url: v.imagen_url ?? null,
      precio_pen: v.precio_pen,
      precio_usd: v.precio_usd ?? null,
      activo: v.activo,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Ya existe un curso con ese identificador (slug)." };
    }
    return { ok: false, error: "No se pudo crear el curso. Intentá de nuevo." };
  }

  revalidatePath(RUTA);
  revalidatePath("/");
  return { ok: true, id: data.id };
}

/** Crea un nuevo módulo para un curso. */
export async function crearModulo(datos: {
  curso_id: string;
  titulo: string;
  descripcion?: string;
  orden?: number;
}): Promise<Resultado> {
  if (!datos.titulo.trim()) {
    return { ok: false, error: "El título del módulo es obligatorio." };
  }

  const supabase = await createClient();
  if (!(await obtenerAdminVerificado(supabase))) {
    return { ok: false, error: "Sin acceso." };
  }

  let orden = datos.orden;
  if (orden === undefined) {
    const { count } = await supabase
      .from("modulos")
      .select("*", { count: "exact", head: true })
      .eq("curso_id", datos.curso_id);
    orden = (count ?? 0) + 1;
  }

  const { error } = await supabase.from("modulos").insert({
    curso_id: datos.curso_id,
    titulo: datos.titulo.trim(),
    descripcion: datos.descripcion?.trim() || null,
    orden,
  });

  if (error) {
    return { ok: false, error: "No se pudo crear el módulo." };
  }

  revalidatePath(RUTA);
  revalidatePath(`/panel-admin/cursos/${datos.curso_id}`);
  return { ok: true };
}

/** Actualiza un módulo existente. */
export async function actualizarModulo(
  id: string,
  curso_id: string,
  datos: { titulo: string; descripcion?: string },
): Promise<Resultado> {
  if (!datos.titulo.trim()) {
    return { ok: false, error: "El título es obligatorio." };
  }

  const supabase = await createClient();
  if (!(await obtenerAdminVerificado(supabase))) {
    return { ok: false, error: "Sin acceso." };
  }

  const { error } = await supabase
    .from("modulos")
    .update({
      titulo: datos.titulo.trim(),
      descripcion: datos.descripcion?.trim() || null,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: "No se pudo actualizar el módulo." };
  }

  revalidatePath(RUTA);
  revalidatePath(`/panel-admin/cursos/${curso_id}`);
  return { ok: true };
}

/** Elimina un módulo y sus lecciones en cascada. */
export async function eliminarModulo(
  id: string,
  curso_id: string,
): Promise<Resultado> {
  const supabase = await createClient();
  if (!(await obtenerAdminVerificado(supabase))) {
    return { ok: false, error: "Sin acceso." };
  }

  const { error } = await supabase.from("modulos").delete().eq("id", id);
  if (error) {
    return { ok: false, error: "No se pudo eliminar el módulo." };
  }

  revalidatePath(RUTA);
  revalidatePath(`/panel-admin/cursos/${curso_id}`);
  return { ok: true };
}

/** Crea una nueva lección en un módulo. */
export async function crearLeccion(datos: {
  modulo_id: string;
  curso_id: string;
  titulo: string;
  descripcion?: string;
  video_url?: string;
  tipo_contenido?: "video" | "documento" | "imagen" | "pdf" | "proyecto" | "quiz";
  recurso_url?: string;
  orden?: number;
  proyecto?: {
    titulo_proyecto?: string;
    instrucciones?: string;
    foto_referencia_url?: string;
    es_obligatorio?: boolean;
  };
}): Promise<Resultado> {
  if (!datos.titulo.trim()) {
    return { ok: false, error: "El título de la clase es obligatorio." };
  }

  const supabase = await createClient();
  if (!(await obtenerAdminVerificado(supabase))) {
    return { ok: false, error: "Sin acceso." };
  }

  let orden = datos.orden;
  if (orden === undefined) {
    const { count } = await supabase
      .from("lecciones")
      .select("*", { count: "exact", head: true })
      .eq("modulo_id", datos.modulo_id);
    orden = (count ?? 0) + 1;
  }

  const tipo_contenido = datos.tipo_contenido ?? (datos.video_url?.trim() ? "video" : "documento");

  const { data: nuevaLeccion, error } = await supabase
    .from("lecciones")
    .insert({
      modulo_id: datos.modulo_id,
      titulo: datos.titulo.trim(),
      descripcion: datos.descripcion?.trim() || null,
      video_url: datos.video_url?.trim() || null,
      tipo_contenido,
      recurso_url: datos.recurso_url?.trim() || null,
      orden,
    })
    .select("id")
    .single();

  if (error || !nuevaLeccion) {
    return { ok: false, error: "No se pudo agregar la clase: " + (error?.message || "Error desconocido") };
  }

  // Si es un proyecto práctico, crear o sincronizar en la tabla proyectos con cliente admin
  if (tipo_contenido === "proyecto") {
    const adminClient = createAdminClient();
    const { error: errProy } = await adminClient.from("proyectos").upsert(
      {
        leccion_id: nuevaLeccion.id,
        titulo_proyecto: datos.proyecto?.titulo_proyecto?.trim() || datos.titulo.trim(),
        instrucciones: datos.proyecto?.instrucciones?.trim() || datos.descripcion?.trim() || null,
        foto_referencia_url: datos.proyecto?.foto_referencia_url?.trim() || datos.recurso_url?.trim() || null,
        es_obligatorio: datos.proyecto?.es_obligatorio ?? true,
      },
      { onConflict: "leccion_id" }
    );

    if (errProy) {
      console.error("[crearLeccion] Error al guardar proyecto:", errProy);
    }
  }

  revalidatePath(RUTA);
  revalidatePath(`/panel-admin/cursos/${datos.curso_id}`);
  return { ok: true, id: nuevaLeccion.id };
}

/** Actualiza una lección existente. */
export async function actualizarLeccion(
  id: string,
  curso_id: string,
  datos: {
    titulo: string;
    descripcion?: string;
    video_url?: string;
    tipo_contenido?: "video" | "documento" | "imagen" | "pdf" | "proyecto" | "quiz";
    recurso_url?: string;
    proyecto?: {
      titulo_proyecto?: string;
      instrucciones?: string;
      foto_referencia_url?: string;
      es_obligatorio?: boolean;
    };
  },
): Promise<Resultado> {
  if (!datos.titulo.trim()) {
    return { ok: false, error: "El título es obligatorio." };
  }

  const supabase = await createClient();
  if (!(await obtenerAdminVerificado(supabase))) {
    return { ok: false, error: "Sin acceso." };
  }

  const tipo_contenido = datos.tipo_contenido ?? (datos.video_url?.trim() ? "video" : "documento");

  const { error } = await supabase
    .from("lecciones")
    .update({
      titulo: datos.titulo.trim(),
      descripcion: datos.descripcion?.trim() || null,
      video_url: datos.video_url?.trim() || null,
      tipo_contenido,
      recurso_url: datos.recurso_url?.trim() || null,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: "No se pudo actualizar la clase: " + error.message };
  }

  // Si es un proyecto práctico, actualizar o crear en tabla proyectos con cliente admin
  if (tipo_contenido === "proyecto") {
    const adminClient = createAdminClient();
    await adminClient.from("proyectos").upsert(
      {
        leccion_id: id,
        titulo_proyecto: datos.proyecto?.titulo_proyecto?.trim() || datos.titulo.trim(),
        instrucciones: datos.proyecto?.instrucciones?.trim() || datos.descripcion?.trim() || null,
        foto_referencia_url: datos.proyecto?.foto_referencia_url?.trim() || datos.recurso_url?.trim() || null,
        es_obligatorio: datos.proyecto?.es_obligatorio ?? true,
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: "leccion_id" }
    );
  }

  revalidatePath(RUTA);
  revalidatePath(`/panel-admin/cursos/${curso_id}`);
  return { ok: true };
}

/** Extrae la ruta interna en el bucket 'marca' para archivos de la subcarpeta 'cursos/' */
function extraerRutaCursoStorage(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const marcador = "/marca/";
  const idx = url.indexOf(marcador);
  let ruta = idx !== -1 ? url.slice(idx + marcador.length) : url;
  ruta = decodeURIComponent(ruta.split("?")[0]);
  if (ruta.startsWith("cursos/")) {
    return ruta;
  }
  return null;
}

/**
 * Sube un archivo a Supabase Storage (marca para imágenes, materiales para PDFs).
 * Si se envía `archivoAnteriorUrl`, elimina el archivo anterior en Storage para evitar huérfanos.
 * Solo administradores autorizados.
 */
export async function subirArchivoStorage(formData: FormData): Promise<{
  ok: boolean;
  error?: string;
  url?: string;
  rutaStorage?: string;
}> {
  const archivo = formData.get("archivo") as File | null;
  const bucketDestino = (formData.get("bucket") as string) || "materiales";

  if (!archivo || archivo.size === 0) {
    return { ok: false, error: "No se seleccionó ningún archivo." };
  }

  const supabase = await createClient();
  if (!(await obtenerAdminVerificado(supabase))) {
    return { ok: false, error: "Sin acceso." };
  }

  // Las imágenes (fotos de proyectos, flyers, carátulas) siempre van al bucket público 'marca'
  const esImagen = archivo.type.startsWith("image/") || bucketDestino === "marca";
  const bucketReal = esImagen ? "marca" : bucketDestino;

  const extension = archivo.name.split(".").pop()?.toLowerCase() || (esImagen ? "webp" : "bin");
  const nombreLimpio = archivo.name
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "_")
    .replace(/\.[^/.]+$/, "");
  const rutaStorage = `cursos/${Date.now()}-${nombreLimpio}.${extension}`;

  const arrayBuffer = await archivo.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Usamos el cliente administrativo para la subida de recursos del curso
  const adminClient = createAdminClient();

  // Si se envió la URL del archivo anterior para reemplazarlo, capturamos su ruta
  const archivoAnteriorUrl = (formData.get("archivoAnteriorUrl") as string | null) || null;
  const rutaAnterior = extraerRutaCursoStorage(archivoAnteriorUrl);

  const { error: uploadError } = await adminClient.storage
    .from(bucketReal)
    .upload(rutaStorage, buffer, {
      contentType: archivo.type,
      upsert: true,
    });

  if (uploadError) {
    return { ok: false, error: `Error al subir a ${bucketReal}: ${uploadError.message}` };
  }

  // Si la subida fue exitosa y se reemplazaba un archivo previo del bucket marca, eliminarlo
  if (rutaAnterior && rutaAnterior !== rutaStorage && bucketReal === "marca") {
    try {
      await adminClient.storage.from("marca").remove([rutaAnterior]);
    } catch (errRem) {
      console.warn("[subirArchivoStorage] Error al remover archivo viejo:", errRem);
    }
  }

  if (bucketReal === "marca") {
    const { data } = adminClient.storage.from("marca").getPublicUrl(rutaStorage);
    return { ok: true, url: data.publicUrl, rutaStorage };
  }

  return { ok: true, rutaStorage };
}

/**
 * Genera una URL firmada de descarga para un recurso en el bucket privado materiales.
 */
export async function obtenerUrlDescargaMaterial(rutaStorage: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("materiales")
    .createSignedUrl(rutaStorage, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}

/** Elimina una lección. */
export async function eliminarLeccion(
  id: string,
  curso_id: string,
): Promise<Resultado> {
  const supabase = await createClient();
  if (!(await obtenerAdminVerificado(supabase))) {
    return { ok: false, error: "Sin acceso." };
  }

  const { error } = await supabase.from("lecciones").delete().eq("id", id);
  if (error) {
    return { ok: false, error: "No se pudo eliminar la clase." };
  }

  revalidatePath(RUTA);
  revalidatePath(`/panel-admin/cursos/${curso_id}`);
  return { ok: true };
}

/** Actualiza los datos editables del curso. */
export async function actualizarCurso(
  id: string,
  entrada: EntradaCurso,
): Promise<Resultado> {
  const parsed = esquemaCurso.safeParse(entrada);
  if (!parsed.success) {
    return { ok: false, error: "Revisá los datos del curso." };
  }

  const supabase = await createClient();
  if (!(await obtenerAdminVerificado(supabase))) {
    return { ok: false, error: "Sin acceso." };
  }

  const v = parsed.data;
  const adminClient = createAdminClient();

  // Si la portada fue cambiada o retirada, eliminar la imagen anterior de Supabase Storage
  const { data: cursoPrevio } = await adminClient
    .from("cursos")
    .select("imagen_url")
    .eq("id", id)
    .maybeSingle();

  const imagenPreviaUrl = cursoPrevio?.imagen_url;
  if (imagenPreviaUrl && imagenPreviaUrl !== v.imagen_url) {
    const rutaPrevia = extraerRutaCursoStorage(imagenPreviaUrl);
    if (rutaPrevia) {
      try {
        await adminClient.storage.from("marca").remove([rutaPrevia]);
      } catch (errRem) {
        console.warn("[actualizarCurso] Error al remover portada vieja:", errRem);
      }
    }
  }

  const { error } = await supabase
    .from("cursos")
    .update({
      nombre: v.nombre,
      descripcion: v.descripcion ?? null,
      imagen_url: v.imagen_url ?? null,
      precio_pen: v.precio_pen,
      precio_usd: v.precio_usd ?? null,
      activo: v.activo,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: "No se pudo guardar. Intentá de nuevo." };
  }

  revalidatePath(RUTA);
  revalidatePath("/");
  return { ok: true };
}

/** Alterna el estado activo (publicado / borrador) de un curso en 1 clic. */
export async function alternarEstadoCurso(
  id: string,
  activo: boolean,
): Promise<Resultado> {
  const supabase = await createClient();
  if (!(await obtenerAdminVerificado(supabase))) {
    return { ok: false, error: "Sin acceso de administrador." };
  }

  const { error } = await supabase
    .from("cursos")
    .update({ activo })
    .eq("id", id);

  if (error) {
    return { ok: false, error: "No se pudo actualizar el estado del curso." };
  }

  revalidatePath(RUTA);
  revalidatePath("/");
  return { ok: true };
}
