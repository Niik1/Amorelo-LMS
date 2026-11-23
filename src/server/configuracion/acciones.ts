// Server Actions para el módulo de configuración administrativa.

"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerAdminVerificado } from "@/server/auth/admin";
import {
  esquemaTipoCambio,
  type EntradaTipoCambio,
  esquemaConfiguracionComprobante,
  type EntradaConfiguracionComprobante,
  CONFIGURACION_COMPROBANTE_DEFECTO,
  esquemaMensajeBanner,
  type EntradaMensajeBanner,
  MENSAJE_BANNER_DEFECTO,
} from "@/lib/validators/configuracion";

const RUTA = "/panel-admin/configuracion";

type Resultado = { ok: true } | { ok: false; error: string };

/** Extrae la ruta interna en el bucket 'marca' para archivos de la subcarpeta 'comprobantes/' */
function extraerRutaComprobanteStorage(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const marcador = "/marca/";
  const idx = url.indexOf(marcador);
  if (idx === -1) return null;
  const ruta = decodeURIComponent(url.slice(idx + marcador.length).split("?")[0]);
  // Blindaje de seguridad: solo permitimos remover archivos dentro de comprobantes/
  if (ruta.startsWith("comprobantes/")) {
    return ruta;
  }
  return null;
}

/** Obtiene la configuración de comprobantes desde la base de datos o valores por defecto. */
export async function obtenerConfiguracionComprobanteAction(): Promise<EntradaConfiguracionComprobante> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("configuraciones")
      .select("valor")
      .eq("clave", "configuracion_comprobante")
      .maybeSingle();

    if (!data?.valor || typeof data.valor !== "object") {
      return CONFIGURACION_COMPROBANTE_DEFECTO;
    }

    const parseado = esquemaConfiguracionComprobante.safeParse(data.valor);
    if (!parseado.success) {
      return {
        ...CONFIGURACION_COMPROBANTE_DEFECTO,
        ...(data.valor as Partial<EntradaConfiguracionComprobante>),
      };
    }

    return parseado.data;
  } catch (err) {
    console.error("[obtenerConfiguracionComprobanteAction] Error:", err);
    return CONFIGURACION_COMPROBANTE_DEFECTO;
  }
}

/** Guarda la configuración integral de comprobantes y cabeceras. */
export async function guardarConfiguracionComprobanteAction(
  entrada: EntradaConfiguracionComprobante
): Promise<Resultado> {
  try {
    const parsed = esquemaConfiguracionComprobante.safeParse(entrada);
    if (!parsed.success) {
      const primerError = parsed.error.issues[0]?.message || "Datos de configuración inválidos.";
      return { ok: false, error: primerError };
    }

    const supabase = await createClient();
    const adminId = await obtenerAdminVerificado(supabase);
    if (!adminId) {
      return { ok: false, error: "Sin permisos de administrador." };
    }

    const adminClient = createAdminClient();

    // Si el logo fue modificado o retirado (null), limpiar el archivo anterior en Storage
    const { data: configPrevia } = await adminClient
      .from("configuraciones")
      .select("valor")
      .eq("clave", "configuracion_comprobante")
      .maybeSingle();

    const logoPrevioUrl = (configPrevia?.valor as { logo_url?: string } | null)?.logo_url;
    if (logoPrevioUrl && logoPrevioUrl !== parsed.data.logo_url) {
      const rutaPrevia = extraerRutaComprobanteStorage(logoPrevioUrl);
      if (rutaPrevia) {
        try {
          await adminClient.storage.from("marca").remove([rutaPrevia]);
        } catch (errRem) {
          console.warn("[guardarConfiguracionComprobanteAction] No se pudo eliminar logo viejo:", errRem);
        }
      }
    }

    const { error } = await adminClient.from("configuraciones").upsert(
      {
        clave: "configuracion_comprobante",
        valor: parsed.data,
        es_publica: false,
        actualizado_por: adminId,
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: "clave" }
    );

    if (error) {
      console.error("[guardarConfiguracionComprobanteAction] Error upsert:", error);
      return { ok: false, error: "No se pudo guardar la configuración. Intenta nuevamente." };
    }

    revalidatePath(RUTA);
    revalidatePath("/panel-admin/comprobantes");
    return { ok: true };
  } catch (err) {
    console.error("[guardarConfiguracionComprobanteAction] Error inesperado:", err);
    return { ok: false, error: "Ocurrió un error inesperado al guardar la configuración." };
  }
}

/** Sube el archivo de logo al bucket público 'marca' en Supabase Storage. */
export async function subirLogoComprobanteAction(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const supabase = await createClient();
    const adminId = await obtenerAdminVerificado(supabase);
    if (!adminId) {
      return { ok: false, error: "Sin permisos de administrador." };
    }

    const archivo = formData.get("logo") as File | null;
    if (!archivo || !(archivo instanceof File)) {
      return { ok: false, error: "No se proporcionó ningún archivo de imagen." };
    }

    // Validar tipo MIME
    const tiposPermitidos = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!tiposPermitidos.includes(archivo.type)) {
      return {
        ok: false,
        error: "Formato no permitido. Por favor sube una imagen PNG, JPG, WEBP o SVG.",
      };
    }

    // Validar peso máximo (5 MB)
    if (archivo.size > 5 * 1024 * 1024) {
      return { ok: false, error: "El archivo es demasiado pesado. El límite es de 5 MB." };
    }

    const adminClient = createAdminClient();

    // Identificar logo anterior para eliminarlo de storage tras subir el nuevo
    const logoAnteriorUrl = (formData.get("logoAnteriorUrl") as string | null) || null;
    let rutaLogoAnterior = extraerRutaComprobanteStorage(logoAnteriorUrl);

    if (!rutaLogoAnterior) {
      const { data: configActual } = await adminClient
        .from("configuraciones")
        .select("valor")
        .eq("clave", "configuracion_comprobante")
        .maybeSingle();

      const logoActualUrl = (configActual?.valor as { logo_url?: string } | null)?.logo_url;
      rutaLogoAnterior = extraerRutaComprobanteStorage(logoActualUrl);
    }

    const ext = archivo.name.split(".").pop()?.toLowerCase() || "png";
    const nombreArchivo = `comprobantes/logo-comprobante-${Date.now()}.${ext}`;

    const arrayBuffer = await archivo.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await adminClient.storage
      .from("marca")
      .upload(nombreArchivo, buffer, {
        contentType: archivo.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[subirLogoComprobanteAction] Error subiendo a storage:", uploadError);
      return { ok: false, error: `Error subiendo logo: ${uploadError.message}` };
    }

    const {
      data: { publicUrl },
    } = adminClient.storage.from("marca").getPublicUrl(nombreArchivo);

    // Si la subida fue exitosa y existía un logo previo diferente, eliminar el anterior de Storage
    if (rutaLogoAnterior && rutaLogoAnterior !== nombreArchivo) {
      try {
        await adminClient.storage.from("marca").remove([rutaLogoAnterior]);
      } catch (errRemove) {
        console.warn("[subirLogoComprobanteAction] Advertencia al eliminar logo previo:", errRemove);
      }
    }

    return { ok: true, url: publicUrl };
  } catch (err) {
    console.error("[subirLogoComprobanteAction] Error no controlado:", err);
    return { ok: false, error: "Error al procesar la subida del logo." };
  }
}

/** Guarda el tipo de cambio (soles por dólar) como referencia del panel. */
export async function actualizarTipoCambio(
  entrada: EntradaTipoCambio
): Promise<Resultado> {
  const parsed = esquemaTipoCambio.safeParse(entrada);
  if (!parsed.success) {
    return { ok: false, error: "Tipo de cambio inválido." };
  }

  const supabase = await createClient();
  const adminId = await obtenerAdminVerificado(supabase);
  if (!adminId) {
    return { ok: false, error: "Sin acceso." };
  }

  const { error } = await supabase.from("configuraciones").upsert(
    {
      clave: "tipo_cambio",
      valor: parsed.data.tipo_cambio,
      es_publica: false,
      actualizado_por: adminId,
    },
    { onConflict: "clave" }
  );

  if (error) {
    return { ok: false, error: "No se pudo guardar. Intenta de nuevo." };
  }

  revalidatePath(RUTA);
  return { ok: true };
}

/** Obtiene el mensaje motivacional / anuncio del banner comunitario */
export async function obtenerMensajeBannerAction(): Promise<EntradaMensajeBanner> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("configuraciones")
      .select("valor")
      .eq("clave", "mensaje_banner_comunidad")
      .maybeSingle();

    if (!data?.valor || typeof data.valor !== "object") {
      return MENSAJE_BANNER_DEFECTO;
    }

    const parseado = esquemaMensajeBanner.safeParse(data.valor);
    if (!parseado.success) {
      return MENSAJE_BANNER_DEFECTO;
    }

    return parseado.data;
  } catch (err) {
    console.error("[obtenerMensajeBannerAction] Error:", err);
    return MENSAJE_BANNER_DEFECTO;
  }
}

/** Guarda el mensaje del banner (persiste indefinidamente hasta que el admin vuelva a editar) */
export async function guardarMensajeBannerAction(
  entrada: EntradaMensajeBanner
): Promise<Resultado> {
  try {
    const parsed = esquemaMensajeBanner.safeParse(entrada);
    if (!parsed.success) {
      const primerError = parsed.error.issues[0]?.message || "Mensaje inválido.";
      return { ok: false, error: primerError };
    }

    const supabase = await createClient();
    const adminId = await obtenerAdminVerificado(supabase);
    if (!adminId) {
      return { ok: false, error: "Sin permisos de administrador." };
    }

    const { error } = await supabase.from("configuraciones").upsert(
      {
        clave: "mensaje_banner_comunidad",
        valor: parsed.data,
        es_publica: true,
        actualizado_por: adminId,
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: "clave" }
    );

    if (error) {
      console.error("[guardarMensajeBannerAction] Error upsert:", error);
      return { ok: false, error: "Error al guardar el mensaje del banner." };
    }

    revalidatePath("/aula");
    revalidatePath("/panel-admin/dashboard");
    return { ok: true };
  } catch (err) {
    console.error("[guardarMensajeBannerAction] Error inesperado:", err);
    return { ok: false, error: "Ocurrió un error inesperado al guardar." };
  }
}

