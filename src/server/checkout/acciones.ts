// Server Actions para el flujo de Checkout de Amorelo.
// Modelo A: Captura de contacto sin fricción (no bloquea correos existentes),
// validación de cupones, creación de orden pendiente y pasarelas de pago.

"use server";

import { headers } from "next/headers";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  checkCheckoutRateLimit,
  checkCuponRateLimit,
  recordFailedCupon,
} from "@/lib/security/ratelimit";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { obtenerOCrearClienteSeguro } from "@/server/clientes/gestion-cliente";

export type ValidarCuponResultado =
  | { ok: true; cuponId: string; codigo: string; porcentaje: number }
  | { ok: false; error: string };

/** Valida un cupón de descuento contra public.cupones con protección de Rate Limit */
export async function validarCuponAction(
  codigo: string,
  cursoId?: string
): Promise<ValidarCuponResultado> {
  const normalizado = codigo.trim().toUpperCase();
  if (!normalizado) {
    return { ok: false, error: "Ingresa un código de cupón válido." };
  }

  // 1. Verificación de Rate Limit por IP (Evita ataques de diccionario de cupones)
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

  const rateCheck = await checkCuponRateLimit(ip);
  if (!rateCheck.ok) {
    return {
      ok: false,
      error: "Código no aplicable o límite de intentos excedido. Por favor intenta más tarde.",
    };
  }

  const admin = createAdminClient();

  const { data: cupon, error } = await admin
    .from("cupones")
    .select("id, codigo, porcentaje, activo, valido_desde, valido_hasta, usos_maximos, usos_actuales, curso_id")
    .eq("codigo", normalizado)
    .maybeSingle();

  if (error || !cupon) {
    await recordFailedCupon(ip);
    return { ok: false, error: "Código no aplicable o no válido." };
  }

  if (!cupon.activo) {
    await recordFailedCupon(ip);
    return { ok: false, error: "Código no aplicable o no válido." };
  }

  const ahora = new Date();
  if (cupon.valido_desde && new Date(cupon.valido_desde) > ahora) {
    await recordFailedCupon(ip);
    return { ok: false, error: "Código no aplicable o no válido." };
  }

  if (cupon.valido_hasta && new Date(cupon.valido_hasta) < ahora) {
    await recordFailedCupon(ip);
    return { ok: false, error: "Código no aplicable o no válido." };
  }

  if (cupon.usos_maximos && cupon.usos_actuales >= cupon.usos_maximos) {
    await recordFailedCupon(ip);
    return { ok: false, error: "Código no aplicable o no válido." };
  }

  if (cupon.curso_id && cursoId && cupon.curso_id !== cursoId) {
    await recordFailedCupon(ip);
    return { ok: false, error: "Código no aplicable o no válido." };
  }

  return {
    ok: true,
    cuponId: cupon.id,
    codigo: cupon.codigo,
    porcentaje: Number(cupon.porcentaje),
  };
}

export type DatosCheckout = {
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  pais: string;
  tipoDocumento: "DNI" | "CE" | "PASAPORTE" | "RUC";
  numeroDocumento: string;
  cursoId: string;
  codigoCupon?: string;
  metodoPago: "mercadopago" | "yape" | "paypal" | "simulacion_dev";
  aceptaTerminos: boolean;
  turnstileToken?: string;
};

export type IniciarCheckoutResultado =
  | {
      ok: true;
      ordenId: string;
      numeroOrden: string;
      total: number;
      initPoint?: string;
      simulado?: boolean;
    }
  | { ok: false; error: string };

/**
 * Procesa la orden en checkout siguiendo el Modelo A:
 * 1. Registra o actualiza el contacto en public.clientes (sin bloquear por correo existente).
 * 2. Valida Rate Limit (Upstash Redis) y Anti-bots (Cloudflare Turnstile).
 * 3. Crea la orden pendiente y su item.
 * 4. Prepara la pasarela de pago seleccionada.
 */
export async function iniciarCheckoutAction(
  datos: DatosCheckout
): Promise<IniciarCheckoutResultado> {
  try {
    const headerList = await headers();
    const ip =
      headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    // 1. Rate Limiting con Upstash Redis (10 intentos / 10 min por IP)
    const rateCheck = await checkCheckoutRateLimit(ip);
    if (!rateCheck.ok) {
      return {
        ok: false,
        error: rateCheck.sinRedis
          ? "Servicio temporalmente saturado. Por favor intenta en unos minutos."
          : "Demasiados intentos de checkout. Por favor espera 10 minutos.",
      };
    }

    // 2. Verificación Cloudflare Turnstile anti-bots
    const turnstileOk = await verifyTurnstileToken(datos.turnstileToken || "", ip);
    if (!turnstileOk) {
      return {
        ok: false,
        error:
          "Verificación de seguridad anti-bots fallida. Por favor recarga e intenta de nuevo.",
      };
    }

    const correoNorm = datos.correo.trim().toLowerCase();
    const nombresNorm = datos.nombres.trim();
    const apellidosNorm = datos.apellidos.trim();
    const telefonoNorm = datos.telefono.trim();
    const numDocNorm = datos.numeroDocumento.trim();

    if (!correoNorm || !nombresNorm || !apellidosNorm || !telefonoNorm) {
      return { ok: false, error: "Por favor completa todos los campos obligatorios." };
    }

    if (!datos.aceptaTerminos) {
      return {
        ok: false,
        error: "Debes aceptar los Términos, Política de Privacidad y Reembolsos para continuar.",
      };
    }

    const admin = createAdminClient();

    // 1. Obtener datos del curso
    const { data: curso, error: cursoErr } = await admin
      .from("cursos")
      .select("id, nombre, precio_pen, precio_usd")
      .eq("id", datos.cursoId)
      .single();

    if (cursoErr || !curso) {
      return { ok: false, error: "No se encontró el curso seleccionado." };
    }

    // 2. Modelo A Protegido: Obtener o crear cliente de forma segura (sin sobreescritura ciega)
    const resultadoCliente = await obtenerOCrearClienteSeguro({
      nombres: nombresNorm,
      apellidos: apellidosNorm,
      correo: correoNorm,
      telefono: telefonoNorm,
      pais: datos.pais || "PE",
      tipoDocumento: datos.tipoDocumento,
      numeroDocumento: numDocNorm,
      origen: "web",
    });

    if (!resultadoCliente.ok) {
      return { ok: false, error: resultadoCliente.error };
    }

    const clienteId = resultadoCliente.clienteId;

    // 3. Validar cupón si fue ingresado
    let cuponId: string | null = null;
    let porcentajeDescuento = 0;

    if (datos.codigoCupon) {
      const resCupon = await validarCuponAction(datos.codigoCupon, curso.id);
      if (resCupon.ok) {
        cuponId = resCupon.cuponId;
        porcentajeDescuento = resCupon.porcentaje;
      }
    }

    const subtotal = Number(curso.precio_pen);
    const montoDescuento = Number(
      ((subtotal * porcentajeDescuento) / 100).toFixed(2)
    );
    const total = Number((subtotal - montoDescuento).toFixed(2));

    // 4. Crear la orden en public.ordenes
    const claveIdempotencia = `chk_${clienteId}_${Date.now()}`;
    const { data: orden, error: ordenErr } = await admin
      .from("ordenes")
      .insert({
        cliente_id: clienteId,
        clave_idempotencia: claveIdempotencia,
        tipo_orden: "curso",
        canal: "web",
        cupon_id: cuponId,
        moneda: "PEN",
        subtotal,
        monto_descuento: montoDescuento,
        total,
        estado: "pendiente",
        comprobante_solicitado: "boleta",
        facturacion_tipo_doc: datos.tipoDocumento,
        facturacion_numero_doc: numDocNorm,
        facturacion_nombre: `${nombresNorm} ${apellidosNorm}`,
      })
      .select("id, numero_orden")
      .single();

    if (ordenErr || !orden) {
      console.error("[iniciarCheckoutAction] Error creando orden:", ordenErr);
      return { ok: false, error: "No se pudo procesar la orden de compra." };
    }

    // 4b. Registrar aceptaciones legales obligatorias (RF-EST / Punto 3.1)
    try {
      const reqHeaders = await headers();
      const ip =
        reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        reqHeaders.get("x-real-ip") ||
        "127.0.0.1";
      const userAgent = reqHeaders.get("user-agent") || "";

      const { data: docsLegales } = await admin
        .from("documentos_legales")
        .select("id")
        .eq("vigente", true);

      if (docsLegales && docsLegales.length > 0) {
        const filasAceptacion = docsLegales.map((doc) => ({
          orden_id: orden.id,
          documento_id: doc.id,
          ip,
          user_agent: userAgent,
        }));
        await admin.from("aceptaciones_legales").insert(filasAceptacion);
      }
    } catch (legalErr) {
      console.error("[iniciarCheckoutAction] Error registrando aceptaciones legales:", legalErr);
    }

    // 5. Crear el item de la orden
    const { error: itemErr } = await admin.from("orden_items").insert({
      orden_id: orden.id,
      tipo_item: "curso",
      curso_id: curso.id,
      descripcion: curso.nombre,
      cantidad: 1,
      precio_unitario: subtotal,
      subtotal,
    });

    if (itemErr) {
      console.error("[iniciarCheckoutAction] Error creando item:", itemErr);
    }

    // 6. Si se aplicó un cupón, registrar en canjes_cupon
    if (cuponId) {
      await admin.from("canjes_cupon").insert({
        cupon_id: cuponId,
        orden_id: orden.id,
        cliente_id: clienteId,
        descuento_aplicado: montoDescuento,
      });

      // Incrementar usos actuales
      const { data: cActual } = await admin.from("cupones").select("usos_actuales").eq("id", cuponId).single();
      if (cActual) {
        await admin.from("cupones").update({ usos_actuales: (cActual.usos_actuales || 0) + 1 }).eq("id", cuponId);
      }
    }

    // 7. Flujo según método de pago
    if (datos.metodoPago === "simulacion_dev") {
      // Activar compra simulada para pruebas locales
      await activarCompraAprobada(orden.id, clienteId, curso.id, total, "simulacion_dev");
      return {
        ok: true,
        ordenId: orden.id,
        numeroOrden: orden.numero_orden,
        total,
        simulado: true,
      };
    }

    // 8. Integración oficial de Mercado Pago (Checkout Pro)
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (mpToken && (datos.metodoPago === "mercadopago" || datos.metodoPago === "yape")) {
      try {
        const client = new MercadoPagoConfig({ accessToken: mpToken });
        const preference = new Preference(client);
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const isHttps = siteUrl.startsWith("https://");

        const prefRes = await preference.create({
          body: {
            items: [
              {
                id: curso.id,
                title: curso.nombre,
                quantity: 1,
                unit_price: total,
                currency_id: "PEN",
              },
            ],
            payer: {
              name: nombresNorm,
              surname: apellidosNorm,
              email: correoNorm,
            },
            back_urls: {
              success: `${siteUrl}/checkout/gracias?orden=${orden.id}&num=${orden.numero_orden}&nombre=${encodeURIComponent(
                nombresNorm
              )}&correo=${encodeURIComponent(correoNorm)}`,
              failure: `${siteUrl}/checkout?error=fallido`,
              pending: `${siteUrl}/checkout/gracias?orden=${orden.id}&num=${orden.numero_orden}&estado=pendiente`,
            },
            ...(isHttps ? { auto_return: "approved" as const } : {}),
            external_reference: orden.id,
          },
        });

        const initPoint = mpToken.startsWith("TEST-")
          ? prefRes.sandbox_init_point || prefRes.init_point
          : prefRes.init_point;

        if (initPoint) {
          return {
            ok: true,
            ordenId: orden.id,
            numeroOrden: orden.numero_orden,
            total,
            initPoint,
          };
        }
      } catch (mpErr) {
        console.error(
          "[iniciarCheckoutAction] Error creando preferencia en Mercado Pago:",
          mpErr
        );
        return {
          ok: false,
          error: "Error conectando con Mercado Pago. Verifica tus credenciales o intenta de nuevo.",
        };
      }
    }

    // Retorno fallback
    return {
      ok: true,
      ordenId: orden.id,
      numeroOrden: orden.numero_orden,
      total,
    };
  } catch (err) {
    console.error("[iniciarCheckoutAction] Excepción:", err);
    return { ok: false, error: "Ocurrió un error inesperado al procesar el pago." };
  }
}

/** Activa el acceso del estudiante tras pago aprobado */
export async function activarCompraAprobada(
  ordenId: string,
  clienteId: string,
  cursoId: string,
  total: number,
  metodo: string
) {
  const admin = createAdminClient();

  // 1. Obtener cliente
  const { data: cliente } = await admin
    .from("clientes")
    .select("nombres, apellidos, correo, telefono")
    .eq("id", clienteId)
    .single();

  if (!cliente) return;

  // 2. Marcar orden como pagada
  await admin
    .from("ordenes")
    .update({
      estado: "pagada",
      monto_pagado: total,
      pagada_en: new Date().toISOString(),
      estado_acceso: "otorgado",
    })
    .eq("id", ordenId);

  // 3. Registrar pago en public.pagos
  await admin.from("pagos").insert({
    orden_id: ordenId,
    proveedor: "mercadopago",
    tipo: "total",
    metodo_pago: metodo,
    referencia: `MP-${Date.now()}`,
    estado: "aprobado",
    monto: total,
    moneda: "PEN",
    pagado_en: new Date().toISOString(),
  });

  // 4. Crear o buscar usuario en auth.users y public.profiles
  let perfilId: string | null = null;
  const { data: perfilExistente } = await admin
    .from("profiles")
    .select("id")
    .eq("correo", cliente.correo)
    .maybeSingle();

  if (perfilExistente) {
    perfilId = perfilExistente.id;
  } else {
    // Crear auth user con contraseña temporal
    const claveTemp = "Alumno" + Math.floor(100000 + Math.random() * 900000) + "!";
    const { data: nuevoUser, error: authErr } = await admin.auth.admin.createUser({
      email: cliente.correo,
      password: claveTemp,
      email_confirm: true,
      user_metadata: {
        nombre: `${cliente.nombres} ${cliente.apellidos}`,
        rol: "student",
      },
    });

    if (!authErr && nuevoUser.user) {
      perfilId = nuevoUser.user.id;
      // Perfil
      await admin.from("profiles").insert({
        id: perfilId,
        cliente_id: clienteId,
        nombre_completo: `${cliente.nombres} ${cliente.apellidos}`,
        correo: cliente.correo,
        rol: "student",
        debe_cambiar_clave: true,
      });
    }
  }

  // 5. Otorgar matrícula a 12 meses
  if (perfilId) {
    try {
      await (admin.rpc as any)("otorgar_matricula", {
        p_orden_id: ordenId,
        p_perfil_id: perfilId,
      });
    } catch (rpcErr) {
      console.error("[activarCompraAprobada] Error en rpc otorgar_matricula:", rpcErr);
      // Fallback: insertar en matriculas
      const ahora = new Date();
      const vence = new Date();
      vence.setFullYear(vence.getFullYear() + 1);

      await (admin.from("matriculas") as any).insert({
        orden_id: ordenId,
        perfil_id: perfilId,
        curso_id: cursoId,
        otorgada_en: ahora.toISOString(),
        vence_en: vence.toISOString(),
        estado: "activa",
      });
    }
  }
}

/** Confirma y activa la orden si regresa aprobada desde Mercado Pago */
export async function confirmarPagoRetornoMP(
  ordenId: string,
  paymentId?: string
) {
  const admin = createAdminClient();

  const { data: orden } = await admin
    .from("ordenes")
    .select("id, numero_orden, total, estado, cliente_id")
    .eq("id", ordenId)
    .single();

  if (!orden) return null;

  if (orden.estado === "pendiente") {
    // Obtener item del curso
    const { data: item } = await admin
      .from("orden_items")
      .select("curso_id")
      .eq("orden_id", orden.id)
      .limit(1)
      .maybeSingle();

    const cursoId = item?.curso_id;
    if (cursoId) {
      await activarCompraAprobada(
        orden.id,
        orden.cliente_id,
        cursoId,
        Number(orden.total),
        "mercadopago"
      );
    }
  }

  // Obtener datos del cliente para la pantalla de gracias
  const { data: cliente } = await admin
    .from("clientes")
    .select("nombres, correo")
    .eq("id", orden.cliente_id)
    .single();

  return {
    ordenId: orden.id,
    numeroOrden: orden.numero_orden,
    nombre: cliente?.nombres || "Alumna",
    correo: cliente?.correo || "",
  };
}
