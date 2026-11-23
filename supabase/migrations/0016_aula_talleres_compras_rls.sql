-- Migración 0016: Habilitar lectura para alumnos autenticados en sus propios talleres, órdenes y comprobantes
-- Permite que los estudiantes con cuenta en el aula virtual visualicen su historial personal.

-- 1. Políticas para reservas_taller
DROP POLICY IF EXISTS "reservas_estudiante_select" ON public.reservas_taller;
CREATE POLICY "reservas_estudiante_select"
  ON public.reservas_taller
  FOR SELECT
  TO authenticated
  USING (
    cliente_id IN (
      SELECT cliente_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- 2. Políticas para ordenes
DROP POLICY IF EXISTS "ordenes_estudiante_select" ON public.ordenes;
CREATE POLICY "ordenes_estudiante_select"
  ON public.ordenes
  FOR SELECT
  TO authenticated
  USING (
    cliente_id IN (
      SELECT cliente_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- 3. Políticas para orden_items
DROP POLICY IF EXISTS "orden_items_estudiante_select" ON public.orden_items;
CREATE POLICY "orden_items_estudiante_select"
  ON public.orden_items
  FOR SELECT
  TO authenticated
  USING (
    orden_id IN (
      SELECT o.id
      FROM public.ordenes o
      JOIN public.profiles p ON p.cliente_id = o.cliente_id
      WHERE p.id = auth.uid()
    )
  );

-- 4. Políticas para comprobantes
DROP POLICY IF EXISTS "comprobantes_estudiante_select" ON public.comprobantes;
CREATE POLICY "comprobantes_estudiante_select"
  ON public.comprobantes
  FOR SELECT
  TO authenticated
  USING (
    orden_id IN (
      SELECT o.id
      FROM public.ordenes o
      JOIN public.profiles p ON p.cliente_id = o.cliente_id
      WHERE p.id = auth.uid()
    )
  );
