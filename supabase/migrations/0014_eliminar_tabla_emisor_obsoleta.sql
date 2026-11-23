-- Migración 0014: Eliminar tabla emisor obsoleta
-- La configuración fiscal y visual de comprobantes se administra de forma integral
-- a través de la clave 'configuracion_comprobante' en public.configuraciones.

drop table if exists public.emisor cascade;
