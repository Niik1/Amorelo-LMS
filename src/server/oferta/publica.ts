// Oferta pública vigente (plan-mvp §16): resuelve qué cupón corresponde
// según el modo live y arma el link de WhatsApp con su mensaje.
//
// - Live prendido  → cupón activo con oferta = 'live'
// - Live apagado   → cupón activo con oferta = 'normal'
// - Sin cupón válido → link genérico (la web nunca se queda sin CTA)
//
// La sección de precio consume el mismo descuento resuelto
// (`descuentoPorcentaje`), así que los importes y el mensaje siempre
// reflejan el mismo cupón.
//
// Usa el cliente con SUPABASE_SECRET_KEY porque `cupones` no tiene lectura
// pública en RLS. Solo se seleccionan las columnas del mensaje: nunca se
// expone la tabla al navegador. Dos capas de deduplicación:
// - `resolverOfertaPublica` (React `cache`): evita repetir la consulta cuando
//   la llaman varios componentes EN EL MISMO render.
// - `obtenerOfertaPublica` (`unstable_cache`): persiste el resultado ENTRE
//   requests (TTL 10s, tag "oferta") para que la portada estática no pegue
//   contra Supabase en cada visita. La ruta /api/ir/whatsapp usa el RESOLVER
//   CRUDO porque su contrato resuelve la oferta EN EL MOMENTO DEL CLIC.

import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import {
  INSCRIPCION_WHATSAPP_URL,
  MENSAJE_INSCRIPCION,
  whatsappUrl,
} from "@/lib/config/site";

export type OfertaPublica = {
  esLive: boolean;
  /** Live vigente al que se atribuye el clic (null fuera de live). */
  liveId: string | null;
  tipoOferta: "live" | "normal";
  codigo: string | null;
  /** Porcentaje resuelto del cupón vigente (null sin cupón válido). La
      sección de precio lo usa para calcular los importes. */
  descuentoPorcentaje: number | null;
  descuentoTexto: string | null;
  mensaje: string;
  href: string;
};

type LiveVigente = { id: string; fin_programado: string };

type CuponOferta = {
  codigo: string;
  tipo_descuento: "porcentaje" | "monto_fijo";
  valor_descuento: number | string;
  mensaje_whatsapp: string | null;
  valido_desde: string | null;
  valido_hasta: string | null;
  usos_maximos: number | null;
  usos_actuales: number;
};

const SIN_OFERTA: Omit<OfertaPublica, "esLive" | "liveId" | "tipoOferta"> = {
  codigo: null,
  descuentoPorcentaje: null,
  descuentoTexto: null,
  mensaje: MENSAJE_INSCRIPCION,
  href: INSCRIPCION_WHATSAPP_URL,
};

function estaVigente(cupon: CuponOferta, ahora: number) {
  if (cupon.valido_desde && new Date(cupon.valido_desde).getTime() > ahora) {
    return false;
  }
  if (cupon.valido_hasta && new Date(cupon.valido_hasta).getTime() < ahora) {
    return false;
  }
  if (
    cupon.usos_maximos !== null &&
    cupon.usos_actuales >= cupon.usos_maximos
  ) {
    return false;
  }
  return true;
}

/** "60%" para porcentaje, "S/ 30" para monto fijo. */
function formatearDescuento(cupon: CuponOferta) {
  const valor = Number(cupon.valor_descuento);
  if (cupon.tipo_descuento === "porcentaje") {
    const numero = new Intl.NumberFormat("es-PE", {
      maximumFractionDigits: 2,
    }).format(valor);
    return `${numero}%`;
  }
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 2,
  }).format(valor);
}

// Cliente mínimo (solo URL + secreto). No se usa `createAdminClient()`
// porque `getServerEnv()` exige también las claves de pagos y facturación,
// que en Fase 1 todavía no existen y harían fallar la home.
function clienteServidor() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Faltan las variables de Supabase.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const resolverOfertaPublica = cache(
  async (): Promise<OfertaPublica> => {
    return { ...SIN_OFERTA, esLive: false, liveId: null, tipoOferta: "normal" };
  },
);

export type OfertaNormalPublica = {
  descuentoPorcentaje: number;
  descuentoTexto: string;
};

export const resolverOfertaNormalPublica = cache(
  async (): Promise<OfertaNormalPublica | null> => {
    return null;
  },
);

// Capa entre requests ( TTL 10s, tag "oferta" para invalidación a demanda
// futura desde el panel). Empaquetan a los resolvers CRUDOS, que quedan
// exportados para el uso sin caché de /api/ir/whatsapp.
export const obtenerOfertaPublica = unstable_cache(
  resolverOfertaPublica,
  ["oferta-publica"],
  { revalidate: 10, tags: ["oferta"] },
);

export const obtenerOfertaNormalPublica = unstable_cache(
  resolverOfertaNormalPublica,
  ["oferta-normal-publica"],
  { revalidate: 10, tags: ["oferta"] },
);
