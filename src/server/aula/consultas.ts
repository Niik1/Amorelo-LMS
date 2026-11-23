// Consultas del aula virtual: cursos matriculados, progreso, módulos, talleres y compras.

import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emitirComprobanteParaOrden } from "@/server/comprobantes/emision";

/** Curso con datos de matrícula y progreso del alumno. */
export type CursoMatriculado = {
  matriculaId: string;
  cursoId: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  imagenUrl: string | null;
  otorgadaEn: string;
  venceEn: string;
  estado: string;
  totalLecciones: number;
  leccionesCompletadas: number;
};

/**
 * Obtiene los cursos matriculados del alumno con su progreso.
 * Solo muestra matrículas activas (no revocadas ni vencidas).
 */
export async function obtenerCursosMatriculados(
  perfilId: string,
): Promise<CursoMatriculado[]> {
  const supabase = await createClient();

  // 1. Traer matrículas activas con datos del curso
  const { data: matriculas, error } = await supabase
    .from("matriculas")
    .select(`
      id,
      curso_id,
      otorgada_en,
      vence_en,
      estado,
      cursos (
        nombre,
        slug,
        descripcion,
        imagen_url
      )
    `)
    .eq("perfil_id", perfilId)
    .eq("estado", "activa")
    .order("otorgada_en", { ascending: false });

  if (error || !matriculas) return [];

  // 2. Para cada curso, contar total de lecciones y completadas
  const resultado: CursoMatriculado[] = [];

  for (const mat of matriculas) {
    const curso = mat.cursos as unknown as {
      nombre: string;
      slug: string;
      descripcion: string | null;
      imagen_url: string | null;
    } | null;
    if (!curso) continue;

    // Total de lecciones del curso (a través de módulos)
    const { count: totalLecciones } = await supabase
      .from("lecciones")
      .select("id, modulos!inner(curso_id)", { count: "exact", head: true })
      .eq("modulos.curso_id", mat.curso_id);

    // Lecciones completadas por este alumno en este curso
    const { count: leccionesCompletadas } = await supabase
      .from("progreso_lecciones")
      .select("leccion_id, lecciones!inner(modulo_id, modulos!inner(curso_id))", {
        count: "exact",
        head: true,
      })
      .eq("perfil_id", perfilId)
      .eq("lecciones.modulos.curso_id", mat.curso_id);

    resultado.push({
      matriculaId: mat.id,
      cursoId: mat.curso_id,
      nombre: curso.nombre,
      slug: curso.slug,
      descripcion: curso.descripcion,
      imagenUrl: curso.imagen_url,
      otorgadaEn: mat.otorgada_en,
      venceEn: mat.vence_en,
      estado: mat.estado,
      totalLecciones: totalLecciones ?? 0,
      leccionesCompletadas: leccionesCompletadas ?? 0,
    });
  }

  return resultado;
}

/** Módulo con sus lecciones y estado de completado. */
export type ModuloConLecciones = {
  id: string;
  titulo: string;
  descripcion: string | null;
  orden: number;
  lecciones: {
    id: string;
    titulo: string;
    descripcion: string | null;
    orden: number;
    videoUrl: string | null;
    tipoContenido?: "video" | "documento" | "imagen" | "pdf" | "proyecto" | "quiz";
    completada: boolean;
  }[];
};

/**
 * Obtiene los módulos y lecciones de un curso con el progreso del alumno.
 * No incluye video_url en la lista (seguridad Vector A); se entrega solo
 * para la lección activa en la página del visor.
 */
export async function obtenerModulosCurso(
  cursoId: string,
  perfilId: string,
): Promise<ModuloConLecciones[]> {
  const supabase = await createClient();

  const { data: modulos } = await supabase
    .from("modulos")
    .select(`
      id,
      titulo,
      descripcion,
      orden,
      lecciones (
        id,
        titulo,
        descripcion,
        orden,
        tipo_contenido
      )
    `)
    .eq("curso_id", cursoId)
    .order("orden", { ascending: true });

  if (!modulos) return [];

  // Traer todas las lecciones completadas del alumno para este curso
  const leccionIds = modulos.flatMap((m) =>
    ((m.lecciones as { id: string }[]) ?? []).map((l) => l.id),
  );

  const { data: progreso } = await supabase
    .from("progreso_lecciones")
    .select("leccion_id")
    .eq("perfil_id", perfilId)
    .in("leccion_id", leccionIds.length > 0 ? leccionIds : ["__none__"]);

  const completadas = new Set((progreso ?? []).map((p) => p.leccion_id));

  return modulos.map((m) => ({
    id: m.id,
    titulo: m.titulo,
    descripcion: m.descripcion,
    orden: m.orden,
    lecciones: ((m.lecciones as {
      id: string;
      titulo: string;
      descripcion: string | null;
      orden: number;
      tipo_contenido?: string;
    }[]) ?? [])
      .sort((a, b) => a.orden - b.orden)
      .map((l) => ({
        id: l.id,
        titulo: l.titulo,
        descripcion: l.descripcion,
        orden: l.orden,
        videoUrl: null, // No se expone aquí (Vector A)
        tipoContenido: (l.tipo_contenido as "video" | "documento" | "imagen" | "pdf" | "proyecto" | "quiz") || "video",
        completada: completadas.has(l.id),
      })),
  }));
}

/**
 * Obtiene los datos de una lección específica incluyendo el video_url.
 * Solo se usa en la página del visor de lecciones (Server Component).
 * Verifica que el alumno tenga matrícula activa para el curso.
 */
export async function obtenerLeccion(
  leccionId: string,
  perfilId: string,
): Promise<{
  leccion: {
    id: string;
    titulo: string;
    descripcion: string | null;
    orden: number;
    videoUrl: string | null;
    tipoContenido: "video" | "documento" | "imagen" | "pdf" | "proyecto" | "quiz";
    recursoUrl: string | null;
    moduloId: string;
    moduloTitulo: string;
    cursoId: string;
    cursoNombre: string;
    cursoSlug: string;
    matriculaId: string;
  };
  completada: boolean;
} | null> {
  const supabase = await createClient();

  const { data: leccion } = await supabase
    .from("lecciones")
    .select(`
      id,
      titulo,
      descripcion,
      orden,
      video_url,
      tipo_contenido,
      recurso_url,
      modulos (
        id,
        titulo,
        curso_id,
        cursos (
          nombre,
          slug
        )
      )
    `)
    .eq("id", leccionId)
    .maybeSingle();

  if (!leccion) return null;

  const modulo = leccion.modulos as unknown as {
    id: string;
    titulo: string;
    curso_id: string;
    cursos: { nombre: string; slug: string } | null;
  } | null;

  if (!modulo || !modulo.cursos) return null;

  // Verificar matrícula activa
  const { data: matricula } = await supabase
    .from("matriculas")
    .select("id")
    .eq("perfil_id", perfilId)
    .eq("curso_id", modulo.curso_id)
    .eq("estado", "activa")
    .maybeSingle();

  if (!matricula) return null;

  // Verificar si está completada
  const { data: progreso } = await supabase
    .from("progreso_lecciones")
    .select("leccion_id")
    .eq("perfil_id", perfilId)
    .eq("leccion_id", leccionId)
    .maybeSingle();

  // Resolver URL del recurso (si es una ruta interna de Supabase Storage)
  let recursoUrlResuelto: string | null = leccion.recurso_url || null;
  if (leccion.recurso_url) {
    const esUrlExterna =
      leccion.recurso_url.startsWith("http://") ||
      leccion.recurso_url.startsWith("https://");

    if (!esUrlExterna) {
      if (leccion.tipo_contenido === "imagen") {
        const { data } = supabase.storage
          .from("marca")
          .getPublicUrl(leccion.recurso_url);
        recursoUrlResuelto = data.publicUrl;
      } else {
        // Para PDFs o documentos privados en bucket 'materiales'
        const { data } = await supabase.storage
          .from("materiales")
          .createSignedUrl(leccion.recurso_url, 3600); // 1 hora de vigencia
        recursoUrlResuelto = data?.signedUrl || null;
      }
    }
  }

  return {
    leccion: {
      id: leccion.id,
      titulo: leccion.titulo,
      descripcion: leccion.descripcion,
      orden: leccion.orden,
      videoUrl: leccion.video_url,
      tipoContenido:
        (leccion.tipo_contenido as "video" | "documento" | "imagen" | "pdf" | "proyecto" | "quiz") ||
        "video",
      recursoUrl: recursoUrlResuelto,
      moduloId: modulo.id,
      moduloTitulo: modulo.titulo,
      cursoId: modulo.curso_id,
      cursoNombre: modulo.cursos.nombre,
      cursoSlug: modulo.cursos.slug,
      matriculaId: matricula.id,
    },
    completada: !!progreso,
  };
}

/* ==========================================================================
   TALLERES PRESENCIALES DEL ALUMNO (AULA VIRTUAL)
   ========================================================================== */

export type TallerAlumnoItem = {
  id: string;
  estado: string; // 'confirmada' | 'pendiente_pago' | 'cancelada'
  ticketCodigo: string | null;
  tokenAcceso: string;
  asistio: boolean;
  asistenciaMarcadaEn: string | null;
  fechaLimiteSaldo: string | null;
  taller: {
    id: string;
    nombre: string;
    slug: string;
    descripcion: string | null;
    lugar: string | null;
    direccion: string | null;
    referencia: string | null;
    fechaInicio: string;
    fechaFin: string | null;
    materialIncluido: string | null;
    imagenUrl: string | null;
    precioPen: number;
    fechaTexto: string;
    horarioTexto: string;
  } | null;
  orden: {
    id: string;
    numeroOrden: string;
    total: number;
    montoPagado: number;
    saldoPendiente: number;
    estado: string;
    tieneDeuda: boolean;
  } | null;
};

function capitalizarPrimeraLetra(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatearFechaTaller(fechaIso: string): string {
  try {
    const d = new Date(fechaIso);
    const formato = d.toLocaleDateString("es-PE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "America/Lima",
    });
    return capitalizarPrimeraLetra(formato);
  } catch {
    return fechaIso;
  }
}

function formatearHorarioTaller(inicioIso: string, finIso?: string | null): string {
  try {
    const ini = new Date(inicioIso);
    const iniStr = ini.toLocaleTimeString("es-PE", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Lima",
    });
    if (!finIso) return iniStr;
    const fin = new Date(finIso);
    const finStr = fin.toLocaleTimeString("es-PE", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Lima",
    });
    return `${iniStr} a ${finStr}`;
  } catch {
    return "";
  }
}

/**
 * Obtiene los talleres presenciales inscritos para un alumno del aula virtual.
 * Vincula el ticket de ingreso, datos del evento y estado del saldo/adelanto.
 */
export async function obtenerTalleresAlumno(
  perfilId: string
): Promise<TallerAlumnoItem[]> {
  const admin = createAdminClient();

  // 1. Obtener cliente_id vinculado al perfil
  const { data: perfil } = await admin
    .from("profiles")
    .select("cliente_id")
    .eq("id", perfilId)
    .maybeSingle();

  if (!perfil?.cliente_id) return [];

  // 2. Consultar reservas con joins correctos a talleres y ordenes
  const { data: reservas, error } = await admin
    .from("reservas_taller")
    .select(`
      id,
      estado,
      ticket_codigo,
      token_acceso,
      asistio,
      asistencia_marcada_en,
      fecha_limite_saldo,
      talleres (
        id,
        nombre,
        slug,
        descripcion,
        lugar,
        direccion,
        referencia,
        fecha_inicio,
        fecha_fin,
        material_incluido,
        imagen_url,
        precio_pen
      ),
      ordenes (
        id,
        numero_orden,
        total,
        monto_pagado,
        saldo_pendiente,
        estado
      )
    `)
    .eq("cliente_id", perfil.cliente_id)
    .order("creado_en", { ascending: false });

  if (error || !reservas) {
    console.error("[obtenerTalleresAlumno] Error:", error);
    return [];
  }

  return reservas.map((r: any) => {
    const t = r.talleres;
    const o = r.ordenes;

    const total = Number(o?.total ?? t?.precio_pen ?? 0);
    const montoPagado = Number(o?.monto_pagado ?? 0);
    const saldoPendiente = Number(o?.saldo_pendiente ?? Math.max(0, total - montoPagado));
    const tieneDeuda = saldoPendiente > 0;

    return {
      id: r.id,
      estado: r.estado,
      ticketCodigo: r.ticket_codigo,
      tokenAcceso: r.token_acceso,
      asistio: Boolean(r.asistio),
      asistenciaMarcadaEn: r.asistencia_marcada_en,
      fechaLimiteSaldo: r.fecha_limite_saldo,
      taller: t
        ? {
            id: t.id,
            nombre: t.nombre,
            slug: t.slug,
            descripcion: t.descripcion,
            lugar: t.lugar,
            direccion: t.direccion,
            referencia: t.referencia,
            fechaInicio: t.fecha_inicio,
            fechaFin: t.fecha_fin,
            materialIncluido: t.material_incluido,
            imagenUrl: t.imagen_url,
            precioPen: Number(t.precio_pen || 0),
            fechaTexto: formatearFechaTaller(t.fecha_inicio),
            horarioTexto: formatearHorarioTaller(t.fecha_inicio, t.fecha_fin),
          }
        : null,
      orden: o
        ? {
            id: o.id,
            numeroOrden: o.numero_orden,
            total,
            montoPagado,
            saldoPendiente,
            estado: o.estado,
            tieneDeuda,
          }
        : null,
    };
  });
}

/* ==========================================================================
   HISTORIAL DE COMPRAS Y BOLETAS ELECTRÓNICAS (AULA VIRTUAL)
   ========================================================================== */

export type CompraAlumnoItem = {
  id: string;
  numeroOrden: string;
  creadoEn: string;
  estado: string;
  tipoOrden: string;
  moneda: string;
  subtotal: number;
  montoDescuento: number;
  total: number;
  montoPagado: number;
  saldoPendiente: number;
  items: Array<{
    id: string;
    tipoItem: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>;
  comprobante: {
    id: string;
    numeroCompleto: string;
    tipoDocumento: string;
    total: number;
    disponible: boolean;
    motivoBloqueo?: string;
  } | null;
};

/**
 * Obtiene el historial de compras y comprobantes de pago de un alumno.
 * Aplica la regla de negocio:
 * - Cursos pagados: Comprobante disponible de inmediato.
 * - Talleres con saldo pendiente (adelanto): Comprobante bloqueado hasta liquidar el 100%.
 * - Talleres con pago total (saldo 0): Comprobante disponible.
 * - Órdenes 100% pagadas sin comprobante previo: Se emite automáticamente en demanda.
 */
export async function obtenerComprasAlumno(
  perfilId: string
): Promise<CompraAlumnoItem[]> {
  const admin = createAdminClient();

  // 1. Obtener cliente_id vinculado al perfil
  const { data: perfil } = await admin
    .from("profiles")
    .select("cliente_id")
    .eq("id", perfilId)
    .maybeSingle();

  if (!perfil?.cliente_id) return [];

  // 2. Traer órdenes del cliente con items y comprobantes
  const { data: ordenes, error } = await admin
    .from("ordenes")
    .select(`
      id,
      numero_orden,
      creado_en,
      pagada_en,
      estado,
      tipo_orden,
      moneda,
      subtotal,
      monto_descuento,
      total,
      monto_pagado,
      saldo_pendiente,
      orden_items (
        id,
        tipo_item,
        descripcion,
        cantidad,
        precio_unitario,
        subtotal
      ),
      comprobantes (
        id,
        tipo_documento,
        serie,
        numero,
        numero_completo,
        total,
        estado_registro,
        emitido_en
      )
    `)
    .eq("cliente_id", perfil.cliente_id)
    .order("creado_en", { ascending: false });

  if (error || !ordenes) {
    console.error("[obtenerComprasAlumno] Error:", error);
    return [];
  }

  const compras: CompraAlumnoItem[] = [];

  for (const o of ordenes) {
    const total = Number(o.total || 0);
    const montoPagado = Number(o.monto_pagado || 0);
    const saldoPendiente = Number(o.saldo_pendiente || 0);
    const tipoOrden = o.tipo_orden || "curso";

    // Revisar si ya tiene comprobante registrado
    let compRaw = Array.isArray(o.comprobantes) ? o.comprobantes[0] : o.comprobantes;

    // Si la orden está 100% pagada pero aún no se había emitido comprobante, emitirlo retroactivamente en demanda
    if (!compRaw && o.estado === "pagada" && saldoPendiente <= 0) {
      try {
        const emisionRes = await emitirComprobanteParaOrden(o.id);
        if (emisionRes.ok && emisionRes.comprobanteId) {
          const { data: nuevoComp } = await (admin.from("comprobantes") as any)
            .select("id, tipo_documento, serie, numero, numero_completo, total, estado_registro, emitido_en")
            .eq("id", emisionRes.comprobanteId)
            .single();
          if (nuevoComp) {
            compRaw = nuevoComp;
          }
        }
      } catch (emisionErr) {
        console.error(`[obtenerComprasAlumno] Error al auto-emitir comprobante para orden ${o.numero_orden}:`, emisionErr);
      }
    }

    let comprobanteInfo: CompraAlumnoItem["comprobante"] = null;

    if (compRaw) {
      const padNum = String(compRaw.numero || 1).padStart(6, "0");
      const numCompleto = compRaw.numero_completo || `${compRaw.serie || "B001"}-${padNum}`;

      // Regla de Negocio:
      // Si es un taller y tiene saldo pendiente, el comprobante se mantiene bloqueado
      if (tipoOrden === "taller" && saldoPendiente > 0) {
        comprobanteInfo = {
          id: compRaw.id,
          numeroCompleto: numCompleto,
          tipoDocumento: compRaw.tipo_documento || "boleta",
          total: Number(compRaw.total || total),
          disponible: false,
          motivoBloqueo: `Disponible al liquidar el saldo total de S/ ${saldoPendiente.toFixed(2)}`,
        };
      } else {
        comprobanteInfo = {
          id: compRaw.id,
          numeroCompleto: numCompleto,
          tipoDocumento: compRaw.tipo_documento || "boleta",
          total: Number(compRaw.total || total),
          disponible: true,
        };
      }
    } else if (tipoOrden === "taller" && saldoPendiente > 0) {
      // Taller con adelanto donde no hay comprobante emitido
      comprobanteInfo = {
        id: "",
        numeroCompleto: "Por emitir",
        tipoDocumento: "boleta",
        total,
        disponible: false,
        motivoBloqueo: `Disponible al liquidar el saldo total de S/ ${saldoPendiente.toFixed(2)}`,
      };
    }

    const items = (o.orden_items || []).map((it: any) => ({
      id: it.id,
      tipoItem: it.tipo_item || "curso",
      descripcion: it.descripcion || "Item Amorelo",
      cantidad: Number(it.cantidad || 1),
      precioUnitario: Number(it.precio_unitario || 0),
      subtotal: Number(it.subtotal || 0),
    }));

    compras.push({
      id: o.id,
      numeroOrden: o.numero_orden,
      creadoEn: o.creado_en,
      estado: o.estado,
      tipoOrden,
      moneda: o.moneda || "PEN",
      subtotal: Number(o.subtotal || total),
      montoDescuento: Number(o.monto_descuento || 0),
      total,
      montoPagado,
      saldoPendiente,
      items,
      comprobante: comprobanteInfo,
    });
  }

  return compras;
}
