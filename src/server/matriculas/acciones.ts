// Server Actions para Gestión y Matriculación Manual de Alumnos (Panel Admin).
// Item 5.5 del Checklist: Registro manual por WhatsApp, transferencias o pagos directos.

"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerAdminVerificado } from "@/server/auth/admin";
import { obtenerOCrearClienteSeguro } from "@/server/clientes/gestion-cliente";
import { emitirComprobanteParaOrden } from "@/server/comprobantes/emision";
import { normalizarNombrePais } from "@/lib/paises/paises";
import { obtenerBaseUrl } from "@/lib/urls";

export type DatosMatriculaManual = {
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  pais?: string;
  tipoDocumento: "DNI" | "CE" | "PASAPORTE" | "RUC";
  numeroDocumento: string;
  cursoId: string;
  tipoVigencia: "12_meses" | "personalizada";
  fechaVencimientoPersonalizada?: string; // ISO date string or YYYY-MM-DD
  canalPago: "whatsapp" | "yape" | "transferencia" | "efectivo" | "cortesia";
  monto: number;
  referenciaPago?: string;
  notas?: string;
  enviarCorreo?: boolean;
};

export type MatriculaManualResultado =
  | {
      ok: true;
      matriculaId: string;
      ordenId: string;
      alumno: {
        nombreCompleto: string;
        correo: string;
        telefono: string;
        claveTemporal?: string;
        esUsuarioNuevo: boolean;
        cursoNombre: string;
        venceEn: string;
      };
      mensajeWhatsApp: string;
    }
  | { ok: false; error: string };

/**
 * Matricula manualmente a un alumno desde el panel de administración.
 * Crea o vincula el cliente, crea usuario auth con clave temporal si es nuevo,
 * crea la orden manual pagada, otorga la matrícula a través de la función de BD
 * y genera el mensaje formateado para enviar por WhatsApp.
 */
export async function matricularAlumnoManualAction(
  datos: DatosMatriculaManual
): Promise<MatriculaManualResultado> {
  try {
    // 1. Verificar sesión de administrador activa
    const supabase = await createClient();
    const adminId = await obtenerAdminVerificado(supabase);
    if (!adminId) {
      return { ok: false, error: "No tienes permisos de administrador para realizar esta acción." };
    }

    const admin = createAdminClient();

    // 2. Normalizar datos
    const correoNorm = datos.correo.trim().toLowerCase();
    const nombresNorm = datos.nombres.trim();
    const apellidosNorm = datos.apellidos.trim();
    const telefonoNorm = datos.telefono.trim();
    const numDocNorm = datos.numeroDocumento.trim();
    const nombreCompleto = `${nombresNorm} ${apellidosNorm}`;

    if (!correoNorm || !nombresNorm || !apellidosNorm || !telefonoNorm) {
      return { ok: false, error: "Por favor completa todos los campos obligatorios." };
    }

    // 3. Obtener datos del curso
    const { data: curso, error: cursoErr } = await admin
      .from("cursos")
      .select("id, nombre, precio_pen, vigencia_meses")
      .eq("id", datos.cursoId)
      .single();

    if (cursoErr || !curso) {
      return { ok: false, error: "El curso seleccionado no existe o no está disponible." };
    }

    // 4. Crear o asociar cliente de forma segura (sin sobreescritura ciega)
    const resultadoCliente = await obtenerOCrearClienteSeguro({
      nombres: nombresNorm,
      apellidos: apellidosNorm,
      correo: correoNorm,
      telefono: telefonoNorm,
      pais: normalizarNombrePais(datos.pais),
      tipoDocumento: datos.tipoDocumento,
      numeroDocumento: numDocNorm,
      origen: "whatsapp",
    });

    if (!resultadoCliente.ok) {
      return { ok: false, error: resultadoCliente.error };
    }

    const clienteId = resultadoCliente.clienteId;

    // 5. Crear o buscar usuario en auth.users y public.profiles
    let perfilId: string | null = null;
    let claveTemporalGenerada: string | undefined = undefined;
    let esUsuarioNuevo = false;

    const { data: perfilExistente } = await admin
      .from("profiles")
      .select("id, rol")
      .eq("correo", correoNorm)
      .maybeSingle();

    if (perfilExistente) {
      perfilId = perfilExistente.id;

      // Verificar si el alumno ya tiene una matrícula activa en este curso
      const { data: matriculaExistente } = await admin
        .from("matriculas")
        .select("id")
        .eq("perfil_id", perfilId)
        .eq("curso_id", curso.id)
        .eq("estado", "activa")
        .maybeSingle();

      if (matriculaExistente) {
        return {
          ok: false,
          error: `El alumno ya cuenta con una matrícula activa en el curso "${curso.nombre}".`,
        };
      }
    } else {
      // Generar contraseña temporal segura: "Alumno" + 6 dígitos + "!"
      const randomDigits = Math.floor(100000 + Math.random() * 900000);
      claveTemporalGenerada = `Alumno${randomDigits}!`;
      esUsuarioNuevo = true;

      const { data: nuevoAuthUser, error: authErr } =
        await admin.auth.admin.createUser({
          email: correoNorm,
          password: claveTemporalGenerada,
          email_confirm: true,
          user_metadata: {
            nombre: nombreCompleto,
            rol: "student",
          },
        });

      if (authErr || !nuevoAuthUser?.user) {
        return {
          ok: false,
          error: `Error creando la cuenta de acceso: ${authErr?.message || "Desconocido"}`,
        };
      }

      perfilId = nuevoAuthUser.user.id;

      await admin.from("profiles").insert({
        id: perfilId,
        cliente_id: clienteId,
        nombre_completo: nombreCompleto,
        correo: correoNorm,
        rol: "student",
        debe_cambiar_clave: true,
      });
    }

    // 6. Determinar fecha de vencimiento
    let fechaVenceIso: string | undefined = undefined;
    const ahora = new Date();

    if (datos.tipoVigencia === "personalizada" && datos.fechaVencimientoPersonalizada) {
      const fechaParseada = new Date(
        datos.fechaVencimientoPersonalizada.includes("T")
          ? datos.fechaVencimientoPersonalizada
          : `${datos.fechaVencimientoPersonalizada}T23:59:59.999-05:00`
      );
      if (!isNaN(fechaParseada.getTime())) {
        fechaVenceIso = fechaParseada.toISOString();
      }
    }

    if (!fechaVenceIso) {
      const fechaCalc = new Date(ahora);
      fechaCalc.setMonth(fechaCalc.getMonth() + (curso.vigencia_meses || 12));
      fechaVenceIso = fechaCalc.toISOString();
    }

    // 7. Crear la orden manual pagada
    const montoFinal = Number(datos.monto);
    const { data: orden, error: ordenErr } = await admin
      .from("ordenes")
      .insert({
        cliente_id: clienteId,
        clave_idempotencia: `manual_${clienteId}_${Date.now()}`,
        tipo_orden: "curso",
        canal: "manual",
        moneda: "PEN",
        subtotal: montoFinal,
        total: montoFinal,
        monto_pagado: montoFinal,
        estado: "pagada",
        estado_acceso: "otorgado",
        comprobante_solicitado: "boleta",
        facturacion_tipo_doc: datos.tipoDocumento,
        facturacion_numero_doc: numDocNorm,
        facturacion_nombre: nombreCompleto,
        pagada_en: ahora.toISOString(),
      })
      .select("id, numero_orden")
      .single();

    if (ordenErr || !orden) {
      return { ok: false, error: "No se pudo registrar la orden de matrícula." };
    }

    // 8. Crear el item de la orden
    await admin.from("orden_items").insert({
      orden_id: orden.id,
      tipo_item: "curso",
      curso_id: curso.id,
      descripcion: curso.nombre,
      cantidad: 1,
      precio_unitario: montoFinal,
      subtotal: montoFinal,
    });

    // 9. Registrar el pago en public.pagos
    const refPago = datos.referenciaPago?.trim() || `MANUAL-${Date.now()}`;
    const { data: pagoRegistrado } = await admin
      .from("pagos")
      .insert({
        orden_id: orden.id,
        proveedor: "mercadopago",
        tipo: "total",
        metodo_pago: datos.canalPago,
        referencia: refPago,
        notas: datos.notas || "Matriculación manual desde panel admin",
        registrado_por: adminId,
        estado: "aprobado",
        monto: montoFinal,
        moneda: "PEN",
        pagado_en: ahora.toISOString(),
      })
      .select("id")
      .single();

    // 10. Otorgar matrícula en la base de datos
    let matriculaId: string;
    try {
      const { data: matRpcId } = await (admin.rpc as any)("otorgar_matricula", {
        p_orden_id: orden.id,
        p_perfil_id: perfilId,
        p_vence_en: fechaVenceIso,
      });

      matriculaId = matRpcId || orden.id;
    } catch (rpcErr) {
      console.warn("[matricularAlumnoManualAction] Fallback directo a matriculas:", rpcErr);
      const { data: fallbackMat } = await (admin.from("matriculas") as any)
        .insert({
          perfil_id: perfilId,
          curso_id: curso.id,
          orden_id: orden.id,
          otorgada_en: ahora.toISOString(),
          vence_en: fechaVenceIso,
          estado: "activa",
        })
        .select("id")
        .single();

      matriculaId = fallbackMat?.id || orden.id;
    }

    // 11. Emisión automática de comprobante interno (Serie B001)
    try {
      await emitirComprobanteParaOrden(orden.id);
    } catch (compErr) {
      console.warn("[matricularAlumnoManualAction] Advertencia emitiendo comprobante:", compErr);
    }

    // 12. Generar mensaje de bienvenida listo para WhatsApp
    const fechaVenceFormateada = new Date(fechaVenceIso).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const siteUrl = obtenerBaseUrl();
    const loginUrl = `${siteUrl}/login`;

    let mensajeWhatsApp = `¡Hola *${nombresNorm}*! ✨ Bienvenida(o) a la academia *Amorelo*.\n\n`;
    mensajeWhatsApp += `Ya se encuentra habilitado tu acceso a la *${curso.nombre}* 🎈.\n\n`;
    mensajeWhatsApp += `📌 *Tus datos de acceso:*\n`;
    mensajeWhatsApp += `• *Aula Virtual:* ${loginUrl}\n`;
    mensajeWhatsApp += `• *Usuario:* ${correoNorm}\n`;

    if (claveTemporalGenerada) {
      mensajeWhatsApp += `• *Contraseña temporal:* ${claveTemporalGenerada}\n`;
      mensajeWhatsApp += `_(Al ingresar por primera vez podrás cambiar tu contraseña)_\n\n`;
    } else {
      mensajeWhatsApp += `• *Contraseña:* La contraseña que ya tienes configurada en tu cuenta.\n\n`;
    }

    mensajeWhatsApp += `📅 *Vigencia de acceso:* Hasta el ${fechaVenceFormateada}\n`;
    mensajeWhatsApp += `🎓 Incluye todas las lecciones en video HD, materiales descargables, certificado oficial y soporte directo por WhatsApp.\n\n`;
    mensajeWhatsApp += `¡Muchos éxitos en tu formación!`;

    return {
      ok: true,
      matriculaId,
      ordenId: orden.id,
      alumno: {
        nombreCompleto,
        correo: correoNorm,
        telefono: telefonoNorm,
        claveTemporal: claveTemporalGenerada,
        esUsuarioNuevo,
        cursoNombre: curso.nombre,
        venceEn: fechaVenceIso,
      },
      mensajeWhatsApp,
    };
  } catch (error: any) {
    console.error("[matricularAlumnoManualAction] Excepción:", error);
    return {
      ok: false,
      error: error?.message || "Ocurrió un error inesperado al procesar la matrícula.",
    };
  }
}

export type AlumnoMatriculadoItem = {
  id: string;
  perfilId: string;
  cursoId: string;
  cursoNombre: string;
  nombreCompleto: string;
  nombres?: string;
  apellidos?: string;
  correo: string;
  telefono: string;
  documento: string;
  tipoDocumento?: "DNI" | "CE" | "PASAPORTE" | "RUC";
  numeroDocumento?: string;
  pais: string;
  estado: "activa" | "vencida" | "revocada";
  otorgadaEn: string;
  venceEn: string;
  diasRestantes: number;
  numeroOrden: string;
  canal: string;
  monto: number;
  contactoExportadoEn?: string | null;
};

/**
 * Obtiene el listado completo de alumnos con matrícula para el panel de administración.
 */
export async function obtenerAlumnosMatriculadosAction(): Promise<{
  ok: boolean;
  matriculas: AlumnoMatriculadoItem[];
  cursos: { id: string; nombre: string; precio_pen: number }[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const adminId = await obtenerAdminVerificado(supabase);
    if (!adminId) {
      return { ok: false, matriculas: [], cursos: [], error: "No autorizado" };
    }

    const admin = createAdminClient();

    // 1. Obtener cursos activos
    const { data: cursos } = await admin
      .from("cursos")
      .select("id, nombre, precio_pen")
      .eq("activo", true)
      .order("nombre", { ascending: true });

    // 2. Obtener matrículas con profiles, cursos y ordenes
    const { data: matriculas, error } = await (admin.from("matriculas") as any)
      .select(`
        id,
        perfil_id,
        curso_id,
        orden_id,
        estado,
        otorgada_en,
        vence_en,
        contacto_exportado_en,
        profiles (
          id,
          nombre_completo,
          correo,
          cliente_id
        ),
        cursos (
          id,
          nombre
        ),
        ordenes (
          id,
          numero_orden,
          canal,
          total,
          clientes (
            nombres,
            apellidos,
            telefono,
            pais,
            tipo_documento,
            numero_documento
          )
        )
      `)
      .order("otorgada_en", { ascending: false });

    if (error) {
      console.error("[obtenerAlumnosMatriculadosAction] Error:", error);
      return { ok: false, matriculas: [], cursos: cursos || [], error: error.message };
    }

    const ahora = new Date().getTime();

    const formateadas: AlumnoMatriculadoItem[] = (matriculas || []).map((m: any) => {
      const venceTime = new Date(m.vence_en).getTime();
      const diasRestantes = Math.max(0, Math.ceil((venceTime - ahora) / (1000 * 60 * 60 * 24)));

      const cliente = m.ordenes?.clientes;
      const docTipo = (cliente?.tipo_documento as any) || "DNI";
      const docNum = cliente?.numero_documento || "";
      const nombresRaw = cliente?.nombres || m.profiles?.nombre_completo?.split(" ")[0] || "";
      const apellidosRaw =
        cliente?.apellidos ||
        m.profiles?.nombre_completo?.split(" ").slice(1).join(" ") ||
        "";

      return {
        id: m.id,
        perfilId: m.perfil_id,
        cursoId: m.curso_id,
        cursoNombre: m.cursos?.nombre || "Curso",
        nombreCompleto:
          m.profiles?.nombre_completo ||
          `${cliente?.nombres || ""} ${cliente?.apellidos || ""}`.trim() ||
          "Alumno",
        nombres: nombresRaw,
        apellidos: apellidosRaw,
        correo: m.profiles?.correo || "",
        telefono: cliente?.telefono || "",
        documento: docNum ? `${docTipo}: ${docNum}` : "No registrado",
        tipoDocumento: docTipo,
        numeroDocumento: docNum,
        pais: normalizarNombrePais(cliente?.pais),
        estado: m.estado,
        otorgadaEn: m.otorgada_en,
        venceEn: m.vence_en,
        diasRestantes,
        numeroOrden: m.ordenes?.numero_orden || "MANUAL",
        canal: m.ordenes?.canal || "whatsapp",
        monto: Number(m.ordenes?.total || 0),
        contactoExportadoEn: m.contacto_exportado_en || null,
      };
    });

    return {
      ok: true,
      matriculas: formateadas,
      cursos: (cursos || []).map((c) => ({
        id: c.id,
        nombre: c.nombre,
        precio_pen: Number(c.precio_pen),
      })),
    };
  } catch (err: any) {
    console.error("[obtenerAlumnosMatriculadosAction] Excepción:", err);
    return { ok: false, matriculas: [], cursos: [], error: err.message };
  }
}

/**
 * Marca una lista de matrículas como exportadas a contactos con la fecha y hora actual.
 */
export async function marcarMatriculasContactosExportadosAction(
  matriculaIds: string[]
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const adminId = await obtenerAdminVerificado(supabase);
    if (!adminId) return { ok: false, error: "No autorizado" };

    if (!matriculaIds || matriculaIds.length === 0) {
      return { ok: true };
    }

    const admin = createAdminClient();
    const ahoraIso = new Date().toISOString();

    const { error } = await (admin.from("matriculas") as any)
      .update({ contacto_exportado_en: ahoraIso })
      .in("id", matriculaIds);

    if (error) {
      console.error("[marcarMatriculasContactosExportadosAction] Error:", error);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err: any) {
    console.error("[marcarMatriculasContactosExportadosAction] Excepción:", err);
    return { ok: false, error: err.message };
  }
}

/**
 * Extiende la vigencia de acceso de una matrícula existente.
 */
export async function extenderVigenciaMatriculaAction(
  matriculaId: string,
  diasAdicionales: number
): Promise<{ ok: boolean; error?: string; nuevoVencimiento?: string }> {
  try {
    const supabase = await createClient();
    const adminId = await obtenerAdminVerificado(supabase);
    if (!adminId) return { ok: false, error: "No autorizado" };

    const admin = createAdminClient();

    const { data: matricula, error: findErr } = await (admin.from("matriculas") as any)
      .select("id, vence_en, estado")
      .eq("id", matriculaId)
      .single();

    if (findErr || !matricula) return { ok: false, error: "Matrícula no encontrada" };

    const fechaActual = new Date(matricula.vence_en);
    const ahora = new Date();
    // Si ya está vencida, extender desde hoy; si sigue activa, extender desde la fecha actual de vencimiento
    const base = fechaActual < ahora ? ahora : fechaActual;
    base.setDate(base.getDate() + diasAdicionales);

    const nuevoVencimiento = base.toISOString();

    const { error: updateErr } = await (admin.from("matriculas") as any)
      .update({
        vence_en: nuevoVencimiento,
        estado: "activa",
        revocada_en: null,
        motivo_revocacion: null,
      })
      .eq("id", matriculaId);

    if (updateErr) return { ok: false, error: updateErr.message };

    return { ok: true, nuevoVencimiento };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

/**
 * Revoca el acceso de una matrícula (suspende acceso).
 */
export async function revocarMatriculaAction(
  matriculaId: string,
  motivo: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const adminId = await obtenerAdminVerificado(supabase);
    if (!adminId) return { ok: false, error: "No autorizado" };

    const admin = createAdminClient();

    const { error } = await (admin.from("matriculas") as any)
      .update({
        estado: "revocada",
        revocada_en: new Date().toISOString(),
        motivo_revocacion: motivo.trim() || "Revocada manualmente por el administrador",
      })
      .eq("id", matriculaId);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

/**
 * Genera una nueva contraseña temporal para un alumno si la olvidó,
 * permitiendo al administrador copiársela de inmediato por WhatsApp.
 */
export async function resetearClaveAlumnoAction(
  perfilId: string
): Promise<{ ok: boolean; nuevaClave?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const adminId = await obtenerAdminVerificado(supabase);
    if (!adminId) return { ok: false, error: "No autorizado" };

    const admin = createAdminClient();

    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const nuevaClave = `Amorelo${randomDigits}!`;

    const { error: authErr } = await admin.auth.admin.updateUserById(perfilId, {
      password: nuevaClave,
    });

    if (authErr) return { ok: false, error: authErr.message };

    await admin
      .from("profiles")
      .update({ debe_cambiar_clave: true })
      .eq("id", perfilId);

    return { ok: true, nuevaClave };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

export type DatosActualizarMatricula = {
  matriculaId: string;
  perfilId: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  pais?: string;
  tipoDocumento?: "DNI" | "CE" | "PASAPORTE" | "RUC";
  numeroDocumento?: string;
  cursoId: string;
  venceEn: string;
  estado: "activa" | "vencida" | "revocada";
  motivoRevocacion?: string;
};

/**
 * Actualiza los datos de una matrícula y la información personal del alumno asociado.
 */
export async function actualizarMatriculaAction(
  datos: DatosActualizarMatricula
): Promise<{
  ok: boolean;
  error?: string;
  matriculaActualizada?: Partial<AlumnoMatriculadoItem>;
}> {
  try {
    const supabase = await createClient();
    const adminId = await obtenerAdminVerificado(supabase);
    if (!adminId) return { ok: false, error: "No autorizado" };

    const admin = createAdminClient();

    // 1. Obtener matrícula actual
    const { data: matricula, error: findErr } = await (admin.from("matriculas") as any)
      .select("id, perfil_id, orden_id, estado")
      .eq("id", datos.matriculaId)
      .single();

    if (findErr || !matricula) {
      return { ok: false, error: "Matrícula no encontrada" };
    }

    // 2. Obtener datos del curso seleccionado
    const { data: curso, error: cursoErr } = await admin
      .from("cursos")
      .select("id, nombre")
      .eq("id", datos.cursoId)
      .single();

    if (cursoErr || !curso) {
      return { ok: false, error: "Curso seleccionado no encontrado" };
    }

    const nombresNorm = datos.nombres.trim();
    const apellidosNorm = datos.apellidos.trim();
    const nombreCompleto = `${nombresNorm} ${apellidosNorm}`.trim();
    const correoNorm = datos.correo.trim().toLowerCase();
    const telefonoNorm = datos.telefono.trim();
    const numDocNorm = (datos.numeroDocumento || "").trim();
    const tipoDoc = datos.tipoDocumento || "DNI";
    const paisNorm = normalizarNombrePais(datos.pais);

    if (!correoNorm || !correoNorm.includes("@")) {
      return { ok: false, error: "Por favor ingresa un correo electrónico válido." };
    }

    // 3. Actualizar matrícula en BD
    const updateMatriculaPayload: Record<string, any> = {
      curso_id: datos.cursoId,
      vence_en: datos.venceEn,
      estado: datos.estado,
    };

    if (datos.estado === "revocada") {
      updateMatriculaPayload.revocada_en = new Date().toISOString();
      updateMatriculaPayload.motivo_revocacion =
        datos.motivoRevocacion || "Revocada manualmente por el administrador";
    } else {
      updateMatriculaPayload.revocada_en = null;
      updateMatriculaPayload.motivo_revocacion = null;
    }

    const { error: matErr } = await (admin.from("matriculas") as any)
      .update(updateMatriculaPayload)
      .eq("id", datos.matriculaId);

    if (matErr) {
      return { ok: false, error: `Error al actualizar matrícula: ${matErr.message}` };
    }

    // 4. Actualizar Profile y Auth (detectando si cambió el correo)
    if (datos.perfilId) {
      const { data: perfilActual } = await admin
        .from("profiles")
        .select("correo")
        .eq("id", datos.perfilId)
        .maybeSingle();

      const correoCambio = perfilActual && perfilActual.correo?.toLowerCase() !== correoNorm;

      if (correoCambio) {
        // Actualizar en el sistema de autenticación de Supabase
        const { error: authUpdateErr } = await admin.auth.admin.updateUserById(datos.perfilId, {
          email: correoNorm,
          email_confirm: true,
          user_metadata: { nombre: nombreCompleto },
        });

        if (authUpdateErr) {
          const errMsg = authUpdateErr.message?.toLowerCase() || "";
          if (errMsg.includes("already") || errMsg.includes("unique")) {
            return { ok: false, error: "El correo ingresado ya pertenece a otro usuario registrado en la plataforma." };
          }
          return { ok: false, error: `Error al actualizar el correo en autenticación: ${authUpdateErr.message}` };
        }

        await admin
          .from("profiles")
          .update({
            nombre_completo: nombreCompleto,
            correo: correoNorm,
          })
          .eq("id", datos.perfilId);
      } else {
        await admin
          .from("profiles")
          .update({
            nombre_completo: nombreCompleto,
          })
          .eq("id", datos.perfilId);

        try {
          await admin.auth.admin.updateUserById(datos.perfilId, {
            user_metadata: { nombre: nombreCompleto },
          });
        } catch (authMetaErr) {
          console.warn("[actualizarMatriculaAction] No se pudo actualizar auth metadata:", authMetaErr);
        }
      }
    }

    // 5. Actualizar Cliente
    const { data: profile } = await admin
      .from("profiles")
      .select("cliente_id")
      .eq("id", datos.perfilId)
      .maybeSingle();

    let clienteId = profile?.cliente_id;

    if (!clienteId && matricula.orden_id) {
      const { data: orden } = await admin
        .from("ordenes")
        .select("cliente_id")
        .eq("id", matricula.orden_id)
        .maybeSingle();
      clienteId = orden?.cliente_id;
    }

    if (clienteId) {
      await admin
        .from("clientes")
        .update({
          nombres: nombresNorm,
          apellidos: apellidosNorm,
          correo: correoNorm,
          telefono: telefonoNorm,
          pais: paisNorm,
          tipo_documento: tipoDoc,
          numero_documento: numDocNorm,
          actualizado_en: new Date().toISOString(),
        })
        .eq("id", clienteId);
    }

    const venceTime = new Date(datos.venceEn).getTime();
    const diasRestantes = Math.max(0, Math.ceil((venceTime - Date.now()) / (1000 * 60 * 60 * 24)));

    return {
      ok: true,
      matriculaActualizada: {
        cursoId: datos.cursoId,
        cursoNombre: curso.nombre,
        nombreCompleto,
        nombres: nombresNorm,
        apellidos: apellidosNorm,
        correo: correoNorm,
        telefono: telefonoNorm,
        pais: paisNorm,
        documento: numDocNorm ? `${tipoDoc}: ${numDocNorm}` : "No registrado",
        tipoDocumento: tipoDoc,
        numeroDocumento: numDocNorm,
        estado: datos.estado,
        venceEn: datos.venceEn,
        diasRestantes,
      },
    };
  } catch (err: any) {
    console.error("[actualizarMatriculaAction] Error:", err);
    return { ok: false, error: err.message || "Error al actualizar matrícula" };
  }
}
