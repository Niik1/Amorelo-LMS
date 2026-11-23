// Módulo de emisión y revocación/reemisión de Certificados Oficiales.
// Respeta idempotencia y genera códigos alfanuméricos 100% aleatorios.
// Los PDFs se generan dinámicamente en demanda (0 KB en Supabase Storage).

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import { generarCodigoVerificacionAleatorio } from "./codigo";

/**
 * Emite automáticamente el certificado de finalización al completar el 100% de un curso virtual.
 * Es IDEMPOTENTE: si ya existe un certificado emitido para esta matrícula, lo devuelve sin duplicar.
 */
export async function emitirCertificadoCursoAutomatico({
  matriculaId,
  perfilId,
  cursoId,
}: {
  matriculaId: string;
  perfilId: string;
  cursoId: string;
}) {
  const admin = createAdminClient();

  try {
    // 1. Verificar si ya tiene un certificado emitido activo
    const { data: certExistente } = await admin
      .from("certificados")
      .select("id, codigo_verificacion, estado, ruta_pdf, titulo, nombre_certificado")
      .eq("matricula_id", matriculaId)
      .in("estado", ["vigente", "emitido"])
      .maybeSingle();

    if (certExistente) {
      return {
        ok: true,
        yaExistia: true,
        certificado: certExistente,
      };
    }

    // 2. Obtener datos del alumno (nombre y documento)
    const { data: profile } = await admin
      .from("profiles")
      .select("id, nombre_completo, cliente_id")
      .eq("id", perfilId)
      .single();

    let nombreAlumno = profile?.nombre_completo?.trim() || "";
    let docFormateado: string | null = null;

    if (profile?.cliente_id) {
      const { data: cliente } = await admin
        .from("clientes")
        .select("nombres, apellidos, tipo_documento, numero_documento")
        .eq("id", profile.cliente_id)
        .maybeSingle();

      if (cliente) {
        if (!nombreAlumno) {
          nombreAlumno = `${cliente.nombres} ${cliente.apellidos}`.trim();
        }
        if (cliente.numero_documento) {
          docFormateado = `${cliente.tipo_documento || "Doc"}: ${cliente.numero_documento}`;
        }
      }
    }

    if (!nombreAlumno) {
      nombreAlumno = "Estudiante Amorelo";
    }

    // 3. Obtener datos del curso
    const { data: curso } = await admin
      .from("cursos")
      .select("id, nombre, horas_academicas")
      .eq("id", cursoId)
      .single();

    if (!curso) {
      return { ok: false, error: "Curso no encontrado para emitir certificado." };
    }

    const horasAcademicas = curso.horas_academicas || 20;
    const ahora = new Date();
    const fechaRef = ahora.toISOString().split("T")[0];

    // 4. Generar código único 100% aleatorio (números y letras)
    const codigoVerificacion = generarCodigoVerificacionAleatorio(12, true);

    // Ruta de descarga y visualización en demanda mediante el endpoint de la app
    const rutaPdf = `/api/certificados/${codigoVerificacion}/pdf`;

    // 5. Insertar en la tabla certificados (emisión instantánea ~20ms, PDF en demanda)
    const { data: nuevoCertificado, error: insertErr } = await admin
      .from("certificados")
      .insert({
        codigo_verificacion: codigoVerificacion,
        tipo: "finalizacion",
        plantilla: "oficial_amorelo",
        matricula_id: matriculaId,
        nombre_certificado: nombreAlumno,
        titulo: curso.nombre,
        fecha_referencia: fechaRef,
        horas_academicas: horasAcademicas,
        estado: "vigente",
        emitido_en: ahora.toISOString(),
        ruta_pdf: rutaPdf,
      })
      .select("id, codigo_verificacion, tipo, titulo, nombre_certificado, emitido_en, ruta_pdf")
      .single();

    if (insertErr || !nuevoCertificado) {
      return {
        ok: false,
        error: "Error al guardar el certificado: " + (insertErr?.message || ""),
      };
    }

    return {
      ok: true,
      yaExistia: false,
      certificado: nuevoCertificado,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err.message || "Error inesperado al emitir el certificado.",
    };
  }
}

/**
 * Emite un certificado para una reserva de taller presencial (solo para quien asistió).
 */
export async function emitirCertificadoTallerIndividual({
  reservaId,
  adminId,
}: {
  reservaId: string;
  adminId: string;
}) {
  const admin = createAdminClient();

  try {
    // 1. Obtener la reserva y verificar asistencia
    const { data: reserva } = await admin
      .from("reservas_taller")
      .select("id, asistio, taller_id, cliente_id, estado")
      .eq("id", reservaId)
      .single();

    if (!reserva) {
      return { ok: false, error: "La reserva de taller no existe." };
    }

    if (!reserva.asistio) {
      return {
        ok: false,
        error: "No se puede emitir el certificado: el asistente no tiene registrada la asistencia en puerta.",
      };
    }

    // 2. Verificar si ya existe certificado
    const { data: certExistente } = await admin
      .from("certificados")
      .select("id, codigo_verificacion, estado")
      .eq("reserva_id", reservaId)
      .in("estado", ["vigente", "emitido"])
      .maybeSingle();

    if (certExistente) {
      return { ok: true, yaExistia: true, certificado: certExistente };
    }

    // 3. Obtener datos de cliente y taller
    const { data: cliente } = await admin
      .from("clientes")
      .select("nombres, apellidos, tipo_documento, numero_documento")
      .eq("id", reserva.cliente_id)
      .single();

    const { data: taller } = await admin
      .from("talleres")
      .select("nombre, horas_academicas, fecha_inicio")
      .eq("id", reserva.taller_id)
      .single();

    if (!cliente || !taller) {
      return { ok: false, error: "Datos del cliente o del taller incompletos." };
    }

    const nombreAlumno = `${cliente.nombres} ${cliente.apellidos}`.trim();
    const docFormateado = cliente.numero_documento
      ? `${cliente.tipo_documento || "Doc"}: ${cliente.numero_documento}`
      : null;

    const horasAcademicas = taller.horas_academicas || 6;
    const ahora = new Date();
    const fechaRef = taller.fecha_inicio ? taller.fecha_inicio.split("T")[0] : ahora.toISOString().split("T")[0];

    // 4. Código aleatorio
    const codigoVerificacion = generarCodigoVerificacionAleatorio(12, true);

    // Ruta de descarga y visualización en demanda mediante el endpoint de la app
    const rutaPdf = `/api/certificados/${codigoVerificacion}/pdf`;

    // 5. Guardar en BD (emisión instantánea en memoria)
    const { data: nuevoCertificado, error: insertErr } = await admin
      .from("certificados")
      .insert({
        codigo_verificacion: codigoVerificacion,
        tipo: "participacion",
        plantilla: "oficial_amorelo",
        reserva_id: reservaId,
        nombre_certificado: nombreAlumno,
        titulo: taller.nombre,
        fecha_referencia: fechaRef,
        horas_academicas: horasAcademicas,
        estado: "vigente",
        emitido_por: adminId,
        emitido_en: ahora.toISOString(),
        ruta_pdf: rutaPdf,
      })
      .select("id, codigo_verificacion, tipo, titulo, nombre_certificado, emitido_en, ruta_pdf")
      .single();

    if (insertErr || !nuevoCertificado) {
      return { ok: false, error: insertErr?.message || "Error al registrar el certificado." };
    }

    return { ok: true, certificado: nuevoCertificado };
  } catch (err: any) {
    return { ok: false, error: err.message || "Error al emitir el certificado del taller." };
  }
}

/**
 * Anula un certificado existente por error y reemite uno nuevo con los datos corregidos.
 */
export async function anularYReemitirCertificado({
  certificadoId,
  nuevoNombre,
  nuevosNombres,
  nuevosApellidos,
  nuevoDocumento,
  motivo,
  actualizarPerfil = true,
  adminId,
}: {
  certificadoId: string;
  nuevoNombre: string;
  nuevosNombres?: string;
  nuevosApellidos?: string;
  nuevoDocumento?: string | null;
  motivo: string;
  actualizarPerfil?: boolean;
  adminId: string;
}) {
  const admin = createAdminClient();

  try {
    // 1. Obtener certificado actual
    const { data: certActual } = await admin
      .from("certificados")
      .select("*")
      .eq("id", certificadoId)
      .single();

    if (!certActual) {
      return { ok: false, error: "El certificado a rectificar no existe." };
    }
    if (certActual.estado === "anulado") {
      return { ok: false, error: "Este certificado ya fue anulado previamente." };
    }

    const ahora = new Date();

    // 2. Anular el certificado anterior
    await admin
      .from("certificados")
      .update({
        estado: "anulado",
        motivo_anulacion: motivo,
        anulado_en: ahora.toISOString(),
        anulado_por: adminId,
      })
      .eq("id", certificadoId);

    // 3. Generar nuevo código aleatorio
    const nuevoCodigo = generarCodigoVerificacionAleatorio(12, true);

    // 3.5 Resolver documento de identidad para el nuevo registro
    let docParaPdf: string | null = nuevoDocumento ? nuevoDocumento.trim() : null;
    let clienteIdParaActualizar: string | null = null;
    let perfilIdParaActualizar: string | null = null;

    if (certActual.reserva_id) {
      const { data: reserva } = await admin
        .from("reservas_taller")
        .select("cliente_id, clientes(tipo_documento, numero_documento)")
        .eq("id", certActual.reserva_id)
        .single();

      clienteIdParaActualizar = reserva?.cliente_id || null;
      if (!docParaPdf) {
        const c = (reserva as any)?.clientes;
        if (c?.numero_documento) {
          docParaPdf = `${c.tipo_documento || "Doc"}: ${c.numero_documento}`;
        }
      }
    } else if (certActual.matricula_id) {
      const { data: matricula } = await admin
        .from("matriculas")
        .select("perfil_id, profiles(id, cliente_id, clientes(tipo_documento, numero_documento))")
        .eq("id", certActual.matricula_id)
        .single();

      perfilIdParaActualizar = matricula?.perfil_id || null;
      clienteIdParaActualizar = (matricula?.profiles as any)?.cliente_id || null;
      if (!docParaPdf) {
        const c = (matricula?.profiles as any)?.clientes;
        if (c?.numero_documento) {
          docParaPdf = `${c.tipo_documento || "Doc"}: ${c.numero_documento}`;
        }
      }
    }

    const nuevaRutaPdf = `/api/certificados/${nuevoCodigo}/pdf`;

    // 4. Crear nuevo registro con trazabilidad (emisión en demanda)
    const { data: nuevoCertificado, error: insertErr } = await admin
      .from("certificados")
      .insert({
        codigo_verificacion: nuevoCodigo,
        tipo: certActual.tipo,
        plantilla: certActual.plantilla,
        matricula_id: certActual.matricula_id,
        reserva_id: certActual.reserva_id,
        nombre_certificado: nuevoNombre.trim(),
        titulo: certActual.titulo,
        fecha_referencia: certActual.fecha_referencia,
        horas_academicas: certActual.horas_academicas,
        estado: "vigente",
        emitido_por: adminId,
        emitido_en: ahora.toISOString(),
        ruta_pdf: nuevaRutaPdf,
        reemplaza_certificado_id: certificadoId,
      })
      .select("id, codigo_verificacion, tipo, titulo, nombre_certificado, emitido_en, ruta_pdf")
      .single();

    if (insertErr || !nuevoCertificado) {
      return { ok: false, error: "Error al guardar el nuevo certificado: " + insertErr?.message };
    }

    // 7. Si se solicitó actualizar los datos del alumno en la base de datos:
    if (actualizarPerfil) {
      const partes = nuevoNombre.trim().split(" ");
      const nombresFinal = nuevosNombres?.trim() || partes.slice(0, Math.ceil(partes.length / 2)).join(" ");
      const apellidosFinal = nuevosApellidos?.trim() || partes.slice(Math.ceil(partes.length / 2)).join(" ") || nombresFinal;

      // Actualizar tabla clientes si tenemos el id
      if (clienteIdParaActualizar) {
        const updateCliente: Partial<Database["public"]["Tables"]["clientes"]["Update"]> = {
          nombres: nombresFinal,
          apellidos: apellidosFinal,
          actualizado_en: ahora.toISOString(),
        };
        if (nuevoDocumento) {
          updateCliente.numero_documento = nuevoDocumento.trim();
        }
        await admin.from("clientes").update(updateCliente).eq("id", clienteIdParaActualizar);

        // Actualizar perfiles que tengan este cliente_id
        await admin
          .from("profiles")
          .update({ nombre_completo: nuevoNombre.trim() })
          .eq("cliente_id", clienteIdParaActualizar);
      }

      // Si tenemos perfil_id directo (de matrícula de curso)
      if (perfilIdParaActualizar) {
        await admin
          .from("profiles")
          .update({ nombre_completo: nuevoNombre.trim() })
          .eq("id", perfilIdParaActualizar);
      }
    }

    return {
      ok: true,
      certificadoAnteriorId: certificadoId,
      nuevoCertificado,
    };
  } catch (err: any) {
    return { ok: false, error: err.message || "Error al rectificar el certificado." };
  }
}
