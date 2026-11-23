"use server";

import "server-only";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  obtenerSesionActivaAlumno,
  registrarSesionAlumno,
  liberarSesionAlumno,
  type SesionActivaInfo,
} from "@/server/auth/sesion";
import {
  checkLoginRateLimitDual,
  recordFailedLogin,
  resetLoginSuccess,
  checkRecuperarRateLimitDual,
  recordRecuperarAttempt,
  obtenerIpServidor,
} from "@/lib/security/ratelimit";

export type ResultadoLogin =
  | {
      ok: true;
      rol: "admin";
      requiereMfa: boolean;
      destino: string;
    }
  | {
      ok: true;
      rol: "student";
      requiereConfirmacionSesion?: false;
      debeCambiarClave?: boolean;
      destino: string;
    }
  | {
      ok: true;
      rol: "student";
      requiereConfirmacionSesion: true;
      sesionPrevia: {
        dispositivo: string;
        navegador: string;
        iniciadaEn: string;
      };
    }
  | {
      ok: false;
      error: string;
    };

/**
 * Analiza el User-Agent para mostrar información amigable del dispositivo.
 */
function parsearUserAgent(ua: string | null) {
  if (!ua) return { dispositivo: "Dispositivo desconocido", navegador: "Navegador web" };

  let dispositivo = "Computadora";
  if (/mobile|android|iphone|ipad|ipod/i.test(ua)) {
    if (/iphone/i.test(ua)) dispositivo = "iPhone";
    else if (/ipad/i.test(ua)) dispositivo = "iPad";
    else if (/android/i.test(ua)) dispositivo = "Dispositivo Android";
    else dispositivo = "Teléfono Móvil";
  } else if (/windows/i.test(ua)) {
    dispositivo = "PC con Windows";
  } else if (/macintosh|mac os x/i.test(ua)) {
    dispositivo = "Mac";
  } else if (/linux/i.test(ua)) {
    dispositivo = "Computadora Linux";
  }

  let navegador = "Navegador web";
  if (/chrome|crios/i.test(ua) && !/edge|edg|opr|opera/i.test(ua)) navegador = "Google Chrome";
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) navegador = "Safari";
  else if (/firefox|fxios/i.test(ua)) navegador = "Mozilla Firefox";
  else if (/edg/i.test(ua)) navegador = "Microsoft Edge";
  else if (/opera|opr/i.test(ua)) navegador = "Opera";

  return { dispositivo, navegador };
}

/**
 * Acción unificada de login para Administrador y Estudiantes.
 */
export async function iniciarSesionUnificado(
  correo: string,
  clave: string,
  confirmarExpulsionPrevia = false,
  captchaToken?: string
): Promise<ResultadoLogin> {
  try {
    const emailLimpio = correo.trim().toLowerCase();
    if (!emailLimpio || !clave) {
      return { ok: false, error: "Por favor ingresa tu correo y contraseña." };
    }

    // 1. Verificación de Rate Limit con Backoff Exponencial Progresivo (Dual: IP + Email)
    const ip = await obtenerIpServidor();
    const rateCheck = await checkLoginRateLimitDual(ip, emailLimpio);
    if (!rateCheck.ok) {
      return {
        ok: false,
        error: "Demasiados intentos fallidos. Tu acceso ha sido restringido temporalmente por seguridad. Por favor, inténtalo más tarde.",
      };
    }

    // 2. Supabase Auth valida directamente el token de Turnstile si Captcha Protection está activo
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailLimpio,
      password: clave,
      options: captchaToken ? { captchaToken } : undefined,
    });

    if (error || !data.user || !data.session) {
      console.warn("[iniciarSesionUnificado] Error en signInWithPassword:", error?.message);

      // Si el error es por captcha (token expirado o inválido), no penalizar con rate limit de contraseña
      if (error?.message?.toLowerCase().includes("captcha")) {
        return {
          ok: false,
          error: "Error en la verificación de seguridad anti-bots. Por favor recarga e intenta de nuevo.",
        };
      }

      // Registrar intento fallido en IP y cuenta de correo
      await recordFailedLogin(ip, emailLimpio);
      return { ok: false, error: "Correo o contraseña incorrectos." };
    }

    // Login exitoso: limpiar intentos acumulados para la cuenta
    await resetLoginSuccess(emailLimpio);

    const adminClient = createAdminClient();
    const { data: perfil, error: errPerfil } = await adminClient
      .from("profiles")
      .select("id, rol, activo, nombre_completo, debe_cambiar_clave")
      .eq("id", data.user.id)
      .maybeSingle();

    if (errPerfil) {
      console.error("[iniciarSesionUnificado] Error consultando perfil:", errPerfil);
    }

    if (!perfil || !perfil.activo) {
      await supabase.auth.signOut();
      return {
        ok: false,
        error: "Tu cuenta se encuentra inactiva o no tiene acceso a la plataforma.",
      };
    }

    // --- Caso 1: Administrador (Dueño) ---
    if (perfil.rol === "admin") {
      let tieneTotp = false;
      let aalLevel = "aal1";

      try {
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        const factores = await supabase.auth.mfa.listFactors();
        tieneTotp = Boolean(factores.data?.totp && factores.data.totp.length > 0);
        aalLevel = aal?.currentLevel ?? "aal1";
      } catch (e) {
        console.warn("[iniciarSesionUnificado] MFA check warning:", e);
      }

      if (tieneTotp && aalLevel !== "aal2") {
        return {
          ok: true,
          rol: "admin",
          requiereMfa: true,
          destino: "/panel-admin/dashboard",
        };
      }

      return {
        ok: true,
        rol: "admin",
        requiereMfa: false,
        destino: "/panel-admin/dashboard",
      };
    }

  // --- Caso 2: Estudiante (Regla de Sesión Única) ---
  const headerList = await headers();
  const userAgentStr = headerList.get("user-agent") ?? "";
  const { dispositivo, navegador } = parsearUserAgent(userAgentStr);

  // Extraer el session_id del JWT
  let sessionId = "";
  try {
    const jwtParts = data.session.access_token.split(".");
    if (jwtParts.length >= 2) {
      const payload = JSON.parse(Buffer.from(jwtParts[1], "base64").toString());
      if (payload.session_id) sessionId = payload.session_id;
    }
  } catch {
    // Si falla la decodificación
  }

  const sesionActiva = await obtenerSesionActivaAlumno(perfil.id);

  // Si ya tiene una sesión en otro dispositivo y el alumno aún no ha confirmado expulsarla:
  if (sesionActiva && sesionActiva.session_id !== sessionId && !confirmarExpulsionPrevia) {
    return {
      ok: true,
      rol: "student",
      requiereConfirmacionSesion: true,
      sesionPrevia: {
        dispositivo: sesionActiva.dispositivo ?? "Otro dispositivo",
        navegador: sesionActiva.navegador ?? "Navegador web",
        iniciadaEn: sesionActiva.iniciada_en,
      },
    };
  }

  // Registrar la sesión nueva (expulsa la anterior atómicamente)
  await registrarSesionAlumno({
    perfilId: perfil.id,
    sessionId,
    dispositivo,
    navegador,
    ip,
  });

  return {
    ok: true,
    rol: "student",
    debeCambiarClave: Boolean(perfil.debe_cambiar_clave),
    destino: "/aula",
  };
} catch (error) {
  console.error("[iniciarSesionUnificado] Error no controlado:", error);
  const msg = error instanceof Error ? error.message : "Error del servidor al procesar el inicio de sesión";
  return {
    ok: false,
    error: msg,
  };
}
}

/**
 * Confirma la expulsión de una sesión anterior de un alumno ya autenticado
 * y registra la sesión actual como activa de forma atómica.
 */
export async function confirmarExpulsionYSesionAlumno(): Promise<
  | {
      ok: true;
      debeCambiarClave: boolean;
      destino: string;
    }
  | {
      ok: false;
      error: string;
    }
> {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return {
        ok: false,
        error: "Tu sesión ha expirado o no es válida. Por favor, inicia sesión nuevamente.",
      };
    }

    const adminClient = createAdminClient();
    const { data: perfil, error: errPerfil } = await adminClient
      .from("profiles")
      .select("id, rol, activo, debe_cambiar_clave")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (errPerfil || !perfil || !perfil.activo || perfil.rol !== "student") {
      await supabase.auth.signOut();
      return {
        ok: false,
        error: "Acceso no autorizado o cuenta inactiva.",
      };
    }

    const { data: sessionData } = await supabase.auth.getSession();
    let sessionId = "";
    if (sessionData.session) {
      try {
        const jwtParts = sessionData.session.access_token.split(".");
        if (jwtParts.length >= 2) {
          const payload = JSON.parse(Buffer.from(jwtParts[1], "base64").toString());
          if (payload.session_id) sessionId = payload.session_id;
        }
      } catch {}
    }

    const headerList = await headers();
    const userAgentStr = headerList.get("user-agent") ?? "";
    const { dispositivo, navegador } = parsearUserAgent(userAgentStr);
    const ip = await obtenerIpServidor();

    // Expulsa la sesión anterior atómicamente y registra la nueva
    await registrarSesionAlumno({
      perfilId: perfil.id,
      sessionId,
      dispositivo,
      navegador,
      ip,
    });

    return {
      ok: true,
      debeCambiarClave: Boolean(perfil.debe_cambiar_clave),
      destino: "/aula",
    };
  } catch (error) {
    console.error("[confirmarExpulsionYSesionAlumno] Error:", error);
    return {
      ok: false,
      error: "Error del servidor al confirmar la sesión. Por favor, reintenta.",
    };
  }
}

/**
 * Cancela el inicio de sesión del alumno cuando decide no expulsar la sesión previa.
 */
export async function cancelarInicioSesionAlumno(): Promise<{ ok: true }> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.warn("[cancelarInicioSesionAlumno] Error al cerrar sesión:", error);
  }
  return { ok: true };
}

/**
 * Cierre de sesión. Si es alumno, limpia también la fila en sesiones_activas.
 */
export async function cerrarSesionApp(): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data?.user) {
    const { data: perfil } = await createAdminClient()
      .from("profiles")
      .select("id, rol")
      .eq("id", data.user.id)
      .maybeSingle();

    if (perfil && perfil.rol === "student") {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        let sessionId = "";
        try {
          const parts = sessionData.session.access_token.split(".");
          if (parts.length >= 2) {
            const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
            if (payload.session_id) sessionId = payload.session_id;
          }
        } catch {}
        if (sessionId) {
          await liberarSesionAlumno(perfil.id, sessionId);
        }
      }
    }
  }

  await supabase.auth.signOut();
}

/**
 * Permite al alumno establecer su contraseña definitiva en su primer ingreso,
 * actualizándola en Supabase Auth y desactivando el indicador 'debe_cambiar_clave' en profiles.
 */
export async function actualizarClaveInicialAction(
  nuevaClave: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const claveTrim = (nuevaClave || "").trim();
    if (claveTrim.length < 8) {
      return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return { ok: false, error: "Tu sesión ha expirado o no es válida. Inicia sesión nuevamente." };
    }

    // 1. Actualizar contraseña del usuario en Supabase Auth
    const { error: authErr } = await supabase.auth.updateUser({
      password: claveTrim,
    });

    if (authErr) {
      return { ok: false, error: authErr.message || "No se pudo actualizar la contraseña." };
    }

    // 2. Apagar la bandera 'debe_cambiar_clave' en profiles
    const admin = createAdminClient();
    const { error: perfilErr } = await admin
      .from("profiles")
      .update({
        debe_cambiar_clave: false,
      })
      .eq("id", user.id);

    if (perfilErr) {
      console.error("[actualizarClaveInicialAction] Error actualizando perfil:", perfilErr);
    }

    return { ok: true };
  } catch (err: any) {
    console.error("[actualizarClaveInicialAction] Excepción:", err);
    return { ok: false, error: "Ocurrió un error inesperado al guardar la contraseña." };
  }
}

export type ResultadoRecuperar = {
  ok: boolean;
  mensaje: string;
};

/**
 * Solicita el restablecimiento de contraseña aplicando Rate Limiting Dual (IP + Email)
 * con backoff exponencial progresivo y respuesta ciega para evitar la enumeración de usuarios.
 */
export async function solicitarRecuperacionClave(
  correo: string,
  origenUrl?: string,
  captchaToken?: string
): Promise<ResultadoRecuperar> {
  const emailLimpio = (correo || "").trim().toLowerCase();
  if (!emailLimpio) {
    return {
      ok: false,
      mensaje: "Por favor ingresa tu correo electrónico.",
    };
  }

  // 1. Verificación de Rate Limit con Backoff Exponencial Progresivo
  const ip = await obtenerIpServidor();
  const rateCheck = await checkRecuperarRateLimitDual(ip, emailLimpio);

  if (!rateCheck.ok) {
    return {
      ok: false,
      mensaje: "Has alcanzado el límite de solicitudes permitidas. Por favor, inténtalo más tarde.",
    };
  }

  // 2. Registrar el intento
  await recordRecuperarAttempt(ip, emailLimpio);

  // 3. Enviar correo a través de Supabase Auth (Supabase valida el captchaToken directamente si está activo)
  try {
    const supabase = await createClient();
    const redirectTo = origenUrl
      ? `${origenUrl}/nueva-clave`
      : "https://amorelo.pe/nueva-clave";

    await supabase.auth.resetPasswordForEmail(emailLimpio, {
      redirectTo,
      captchaToken: captchaToken || undefined,
    });
  } catch (err) {
    console.warn("[solicitarRecuperacionClave] Supabase auth warning:", err);
  }

  // 4. Respuesta ciega y neutra para evitar enumeración de cuentas
  return {
    ok: true,
    mensaje: "Si la información coincide con nuestros registros, recibirás las instrucciones correspondientes en tu bandeja de entrada.",
  };
}
