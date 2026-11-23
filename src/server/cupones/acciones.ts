// Server Actions de cupones (requieren admin: la verificación vive en el
// layout + proxy, y RLS solo deja operar a admins). Plan §8.4.

"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { obtenerAdminVerificado } from "@/server/auth/admin";
import { esquemaCupon, type EntradaCupon } from "@/lib/validators/coupon";

const RUTA = "/panel-admin/cupones";

type Resultado = { ok: true } | { ok: false; error: string };

/** Crea un cupón activo. El código queda en mayúsculas. */
export async function crearCupon(entrada: EntradaCupon): Promise<Resultado> {
  const parsed = esquemaCupon.safeParse(entrada);
  if (!parsed.success) {
    return { ok: false, error: "Revisá los datos del cupón." };
  }
  const supabase = await createClient();
  const adminId = await obtenerAdminVerificado(supabase);
  if (!adminId) {
    return { ok: false, error: "Sin acceso." };
  }
  const v = parsed.data;
  const { error } = await supabase.from("cupones").insert({
    codigo: v.codigo,
    porcentaje: v.valor_descuento,
    valido_desde: v.valido_desde ?? null,
    valido_hasta: v.valido_hasta ?? null,
    usos_maximos: v.usos_maximos ?? null,
    activo: true,
    creado_por: adminId,
  });
  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: `El código ${v.codigo} ya existe.`,
      };
    }
    return { ok: false, error: "No se pudo crear. Intentá de nuevo." };
  }
  revalidatePath(RUTA);
  return { ok: true };
}

/** Activa o inhabilita un cupón (no se borra: hay historial contable). */
export async function alternarCupon(
  id: string,
  activo: boolean,
): Promise<Resultado> {
  const supabase = await createClient();
  if (!(await obtenerAdminVerificado(supabase))) {
    return { ok: false, error: "Sin acceso." };
  }
  const { error } = await supabase
    .from("cupones")
    .update({ activo })
    .eq("id", id);
  if (error) {
    return { ok: false, error: "No se pudo actualizar. Intentá de nuevo." };
  }
  revalidatePath(RUTA);
  return { ok: true };
}

/** Edita un cupón (la unicidad se evalúa excluyendo su propia fila). */
export async function actualizarCupon(
  id: string,
  entrada: EntradaCupon,
): Promise<Resultado> {
  const parsed = esquemaCupon.safeParse(entrada);
  if (!parsed.success) {
    return { ok: false, error: "Revisá los datos del cupón." };
  }
  const supabase = await createClient();
  if (!(await obtenerAdminVerificado(supabase))) {
    return { ok: false, error: "Sin acceso." };
  }
  const v = parsed.data;
  const { error } = await supabase
    .from("cupones")
    .update({
      codigo: v.codigo,
      porcentaje: v.valor_descuento,
      valido_desde: v.valido_desde ?? null,
      valido_hasta: v.valido_hasta ?? null,
      usos_maximos: v.usos_maximos ?? null,
    })
    .eq("id", id);
  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: `El código ${v.codigo} ya existe en otro cupón.`,
      };
    }
    return { ok: false, error: "No se pudo guardar. Intentá de nuevo." };
  }
  revalidatePath(RUTA);
  return { ok: true };
}
