// Server Actions para la gestión administrativa de Certificados Oficiales en el Panel Admin.

"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerAdminVerificado } from "@/server/auth/admin";
import {
  anularYReemitirCertificado,
  emitirCertificadoTallerIndividual,
} from "./emision";

export type ItemCertificadoAdmin = {
  id: string;
  codigoVerificacion: string;
  tipo: "finalizacion" | "participacion" | string;
  nombreAlumno: string;
  nombresAlumno?: string | null;
  apellidosAlumno?: string | null;
  documentoAlumno?: string | null;
  correoAlumno?: string | null;
  tituloPrograma: string;
  horasAcademicas: number | null;
  fechaReferencia: string;
  estado: "emitido" | "anulado" | string;
  motivoAnulacion: string | null;
  anuladoEn: string | null;
  emitidoEn: string;
  rutaPdf: string | null;
  reemplazaCertificadoId: string | null;
  codigoReemplazante?: string | null;
  matriculaId: string | null;
  reservaId: string | null;
};

export type MetricasCertificados = {
  totalVigentes: number;
  cursosVirtuales: number;
  talleresPresenciales: number;
  anuladosRectificados: number;
};

export type AsistentePendienteTaller = {
  reservaId: string;
  tallerId: string;
  tallerNombre: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  asistio: boolean;
  yaTieneCertificado: boolean;
  codigoCertificado?: string;
};

export type TallerConAsistentes = {
  id: string;
  nombre: string;
  fechaInicio: string;
  asistentesTotales: number;
  asistieronPuerta: number;
  certificadosEmitidos: number;
  pendientesEmision: number;
  asistentes: AsistentePendienteTaller[];
};

/**
 * Obtiene la lista completa de certificados con sus relaciones y métricas.
 */
export async function obtenerCertificadosAdminAction(): Promise<{
  ok: boolean;
  certificados: ItemCertificadoAdmin[];
  metricas: MetricasCertificados;
  error?: string;
}> {
  const supabase = await createClient();
  const adminId = await obtenerAdminVerificado(supabase);

  if (!adminId) {
    return {
      ok: false,
      certificados: [],
      metricas: { totalVigentes: 0, cursosVirtuales: 0, talleresPresenciales: 0, anuladosRectificados: 0 },
      error: "No tienes permisos de administrador para consultar este módulo.",
    };
  }

  const admin = createAdminClient();

  try {
    const { data: certs, error: errCerts } = await admin
      .from("certificados")
      .select(`
        *,
        reservas_taller (
          id,
          cliente_id,
          clientes (
            nombres,
            apellidos,
            correo,
            tipo_documento,
            numero_documento
          )
        ),
        matriculas (
          id,
          perfil_id,
          profiles (
            id,
            nombre_completo,
            correo,
            clientes (
              nombres,
              apellidos,
              correo,
              tipo_documento,
              numero_documento
            )
          )
        )
      `)
      .order("emitido_en", { ascending: false });

    if (errCerts) {
      return {
        ok: false,
        certificados: [],
        metricas: { totalVigentes: 0, cursosVirtuales: 0, talleresPresenciales: 0, anuladosRectificados: 0 },
        error: errCerts.message,
      };
    }

    const mapaReemplazantes = new Map<string, string>();
    (certs || []).forEach((c) => {
      if (c.reemplaza_certificado_id) {
        mapaReemplazantes.set(c.reemplaza_certificado_id, c.codigo_verificacion);
      }
    });

    let totalVigentes = 0;
    let cursosVirtuales = 0;
    let talleresPresenciales = 0;
    let anuladosRectificados = 0;

    const lista: ItemCertificadoAdmin[] = (certs || []).map((c: any) => {
      if (c.estado === "vigente" || c.estado === "emitido") {
        totalVigentes++;
        if (c.tipo === "finalizacion") cursosVirtuales++;
        if (c.tipo === "participacion") talleresPresenciales++;
      } else if (c.estado === "anulado") {
        anuladosRectificados++;
      }

      // Obtener datos del alumno / cliente vinculado
      const clienteTaller = c.reservas_taller?.clientes;
      const clienteCurso = c.matriculas?.profiles?.clientes;
      const perfilCurso = c.matriculas?.profiles;

      const tipoDoc = clienteTaller?.tipo_documento || clienteCurso?.tipo_documento || null;
      const numDoc = clienteTaller?.numero_documento || clienteCurso?.numero_documento || null;
      const documentoAlumno = numDoc ? (tipoDoc ? `${tipoDoc}: ${numDoc}` : numDoc) : null;
      const correoAlumno = clienteTaller?.correo || perfilCurso?.correo || clienteCurso?.correo || null;
      const nombresAlumno = clienteTaller?.nombres || clienteCurso?.nombres || null;
      const apellidosAlumno = clienteTaller?.apellidos || clienteCurso?.apellidos || null;

      return {
        id: c.id,
        codigoVerificacion: c.codigo_verificacion,
        tipo: c.tipo,
        nombreAlumno: c.nombre_certificado,
        nombresAlumno,
        apellidosAlumno,
        documentoAlumno,
        correoAlumno,
        tituloPrograma: c.titulo,
        horasAcademicas: c.horas_academicas ? Number(c.horas_academicas) : null,
        fechaReferencia: c.fecha_referencia,
        estado: c.estado,
        motivoAnulacion: c.motivo_anulacion,
        anuladoEn: c.anulado_en,
        emitidoEn: c.emitido_en,
        rutaPdf: c.ruta_pdf || `/api/certificados/${c.codigo_verificacion}/pdf`,
        reemplazaCertificadoId: c.reemplaza_certificado_id,
        codigoReemplazante: mapaReemplazantes.get(c.id) || null,
        matriculaId: c.matricula_id,
        reservaId: c.reserva_id,
      };
    });

    return {
      ok: true,
      certificados: lista,
      metricas: {
        totalVigentes,
        cursosVirtuales,
        talleresPresenciales,
        anuladosRectificados,
      },
    };
  } catch (err: any) {
    return {
      ok: false,
      certificados: [],
      metricas: { totalVigentes: 0, cursosVirtuales: 0, talleresPresenciales: 0, anuladosRectificados: 0 },
      error: err.message || "Error al obtener los certificados.",
    };
  }
}

/**
 * Obtiene los talleres presenciales y calcula cuántos asistentes ingresaron
 * por puerta y están pendientes de emitir su certificado oficial.
 */
export async function obtenerTalleresParaEmisionAction(): Promise<{
  ok: boolean;
  talleres: TallerConAsistentes[];
  error?: string;
}> {
  const supabase = await createClient();
  const adminId = await obtenerAdminVerificado(supabase);

  if (!adminId) {
    return { ok: false, talleres: [], error: "No autorizado" };
  }

  const admin = createAdminClient();

  try {
    const { data: talleres, error: errTalleres } = await admin
      .from("talleres")
      .select("id, nombre, fecha_inicio")
      .order("fecha_inicio", { ascending: false });

    if (errTalleres || !talleres) {
      return { ok: false, talleres: [], error: errTalleres?.message || "Error al cargar talleres" };
    }

    const { data: reservas } = await admin
      .from("reservas_taller")
      .select("id, taller_id, asistio, estado, cliente_id, clientes(nombres, apellidos, correo, telefono, tipo_documento, numero_documento)")
      .neq("estado", "vencida");

    const { data: certsTalleres } = await admin
      .from("certificados")
      .select("id, reserva_id, codigo_verificacion, estado")
      .not("reserva_id", "is", null);

    const mapaCerts = new Map<string, { id: string; codigo: string; estado: string }>();
    (certsTalleres || []).forEach((ct) => {
      if (ct.reserva_id && (ct.estado === "vigente" || ct.estado === "emitido")) {
        mapaCerts.set(ct.reserva_id, { id: ct.id, codigo: ct.codigo_verificacion, estado: ct.estado });
      }
    });

    const resultado: TallerConAsistentes[] = talleres.map((t) => {
      const reservasDelTaller = (reservas || []).filter((r) => r.taller_id === t.id);
      const asistentes: AsistentePendienteTaller[] = [];

      let asistieronPuerta = 0;
      let certificadosEmitidos = 0;

      reservasDelTaller.forEach((r) => {
        const c = r.clientes as any;
        const cert = mapaCerts.get(r.id);
        const yaTiene = !!cert;

        if (r.asistio) asistieronPuerta++;
        if (yaTiene) certificadosEmitidos++;

        asistentes.push({
          reservaId: r.id,
          tallerId: t.id,
          tallerNombre: t.nombre,
          nombres: c?.nombres || "Asistente",
          apellidos: c?.apellidos || "",
          correo: c?.correo || "",
          telefono: c?.telefono || "",
          tipoDocumento: c?.tipo_documento || null,
          numeroDocumento: c?.numero_documento || null,
          asistio: !!r.asistio,
          yaTieneCertificado: yaTiene,
          codigoCertificado: cert?.codigo,
        });
      });

      const pendientesEmision = Math.max(0, asistieronPuerta - certificadosEmitidos);

      return {
        id: t.id,
        nombre: t.nombre,
        fechaInicio: t.fecha_inicio,
        asistentesTotales: reservasDelTaller.length,
        asistieronPuerta,
        certificadosEmitidos,
        pendientesEmision,
        asistentes,
      };
    });

    return { ok: true, talleres: resultado };
  } catch (err: any) {
    return { ok: false, talleres: [], error: err.message || "Error al obtener talleres" };
  }
}

/**
 * Rectifica datos de un certificado (anula el anterior y emite uno nuevo trazable).
 */
export async function rectificarCertificadoAction(datos: {
  certificadoId: string;
  nuevoNombre: string;
  nuevosNombres?: string | null;
  nuevosApellidos?: string | null;
  nuevoDocumento?: string | null;
  motivo: string;
  actualizarPerfil?: boolean;
}): Promise<{ ok: boolean; error?: string; nuevoCodigo?: string }> {
  const supabase = await createClient();
  const adminId = await obtenerAdminVerificado(supabase);

  if (!adminId) {
    return { ok: false, error: "No tienes permisos de administrador." };
  }

  if (!datos.nuevoNombre || datos.nuevoNombre.trim().length < 3) {
    return { ok: false, error: "Ingresa el nombre y apellidos completos del titular." };
  }
  if (!datos.motivo || datos.motivo.trim().length < 5) {
    return { ok: false, error: "Ingresa el motivo detallado de la rectificación (mínimo 5 caracteres)." };
  }

  const res = await anularYReemitirCertificado({
    certificadoId: datos.certificadoId,
    nuevoNombre: datos.nuevoNombre.trim(),
    nuevosNombres: datos.nuevosNombres?.trim() || undefined,
    nuevosApellidos: datos.nuevosApellidos?.trim() || undefined,
    nuevoDocumento: datos.nuevoDocumento?.trim() || null,
    motivo: datos.motivo.trim(),
    actualizarPerfil: datos.actualizarPerfil ?? true,
    adminId,
  });

  if (!res.ok) {
    return { ok: false, error: res.error };
  }

  revalidatePath("/panel-admin/certificados");
  revalidatePath("/aula/certificados");

  return {
    ok: true,
    nuevoCodigo: res.nuevoCertificado?.codigo_verificacion,
  };
}

/**
 * Emite en lote certificados para todos los asistentes con ingreso registrado en puerta de un taller.
 */
export async function emitirCertificadosTallerMasivoAction(tallerId: string): Promise<{
  ok: boolean;
  emitidos: number;
  omitidos: number;
  error?: string;
}> {
  const supabase = await createClient();
  const adminId = await obtenerAdminVerificado(supabase);

  if (!adminId) {
    return { ok: false, emitidos: 0, omitidos: 0, error: "No autorizado." };
  }

  const admin = createAdminClient();

  try {
    const { data: reservas } = await admin
      .from("reservas_taller")
      .select("id, asistio")
      .eq("taller_id", tallerId)
      .eq("asistio", true);

    if (!reservas || reservas.length === 0) {
      return {
        ok: false,
        emitidos: 0,
        omitidos: 0,
        error: "No se encontraron asistentes con ingreso registrado en puerta en este taller.",
      };
    }

    let emitidos = 0;
    let yaTenian = 0;
    const errores: string[] = [];

    for (const r of reservas) {
      const res = await emitirCertificadoTallerIndividual({
        reservaId: r.id,
        adminId,
      });

      if (res.ok) {
        if (res.yaExistia) {
          yaTenian++;
        } else {
          emitidos++;
        }
      } else {
        errores.push(res.error || "Error al emitir certificado.");
      }
    }

    revalidatePath("/panel-admin/certificados");
    revalidatePath(`/panel-admin/talleres/${tallerId}`);

    if (emitidos === 0 && yaTenian === 0 && errores.length > 0) {
      return {
        ok: false,
        emitidos: 0,
        omitidos: 0,
        error: errores[0],
      };
    }

    return {
      ok: true,
      emitidos,
      omitidos: yaTenian,
      error: errores.length > 0 ? `${errores.length} fallaron al emitirse.` : undefined,
    };
  } catch (err: any) {
    return { ok: false, emitidos: 0, omitidos: 0, error: err.message };
  }
}

/**
 * Emite un certificado individual para un asistente de taller.
 */
export async function emitirCertificadoTallerIndividualAction(reservaId: string): Promise<{
  ok: boolean;
  error?: string;
  codigo?: string;
}> {
  const supabase = await createClient();
  const adminId = await obtenerAdminVerificado(supabase);

  if (!adminId) {
    return { ok: false, error: "No autorizado." };
  }

  const res = await emitirCertificadoTallerIndividual({
    reservaId,
    adminId,
  });

  if (!res.ok) {
    return { ok: false, error: res.error };
  }

  revalidatePath("/panel-admin/certificados");

  return {
    ok: true,
    codigo: res.certificado?.codigo_verificacion,
  };
}
