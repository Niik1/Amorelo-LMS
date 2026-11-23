// Admin: Listado de Órdenes y Ventas en tiempo real.
// Armonizado con el diseño visual del Aula Virtual y módulo de Cupones.

import { Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ModuloBanner } from "@/components/ui/modulo-banner";
import { TablaOrdenes, type OrdenItem } from "@/components/admin/ordenes/tabla-ordenes";
import { autoExpirarOrdenesAction } from "@/server/ordenes/acciones";

export const metadata = {
  title: "Órdenes y Ventas | Panel Admin Amorelo",
  robots: { index: false, follow: false },
};

export default async function AdminOrdenesPage() {
  // 1. Expirar automáticamente órdenes en 'pendiente' con más de 24 horas
  await autoExpirarOrdenesAction();

  const supabase = await createClient();

  // 2. Cargar órdenes, cursos y talleres concurrentemente
  const [{ data: ordenes }, { data: cursos }, { data: talleres }] =
    await Promise.all([
      supabase
        .from("ordenes")
        .select(`
          id,
          numero_orden,
          tipo_orden,
          canal,
          moneda,
          total,
          monto_pagado,
          saldo_pendiente,
          estado,
          estado_acceso,
          pagada_en,
          creado_en,
          clientes (
            nombres,
            apellidos,
            correo,
            telefono
          ),
          orden_items (
            id,
            curso_id,
            taller_id,
            descripcion,
            cantidad,
            precio_unitario,
            subtotal
          ),
          comprobantes (
            id,
            serie,
            numero,
            tipo_documento
          )
        `)
        .order("creado_en", { ascending: false }),
      supabase
        .from("cursos")
        .select("id, nombre")
        .order("nombre", { ascending: true }),
      supabase
        .from("talleres")
        .select("id, nombre")
        .order("nombre", { ascending: true }),
    ]);

  return (
    <main className="flex w-full flex-1 flex-col gap-6 p-6 sm:p-8">
      {/* Encabezado Banner */}
      <ModuloBanner
        titulo="Órdenes y Ventas"
        descripcion="Registro completo de compras online vía Mercado Pago y ventas manuales por WhatsApp."
        icono={Receipt}
      />

      {/* Tabla y Filtros Reactivos de Órdenes */}
      <TablaOrdenes
        ordenesIniciales={(ordenes ?? []) as unknown as OrdenItem[]}
        cursosDisponibles={(cursos ?? []).map((c) => ({ id: c.id, nombre: c.nombre }))}
        talleresDisponibles={(talleres ?? []).map((t) => ({ id: t.id, nombre: t.nombre }))}
      />
    </main>
  );
}
