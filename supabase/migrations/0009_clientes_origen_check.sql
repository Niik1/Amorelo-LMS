-- Migración 0009: Ampliar los valores válidos de 'origen' en la tabla public.clientes
-- Permite registrar alumnos manuales desde el panel admin y ventas asistidas por WhatsApp.

alter table public.clientes drop constraint if exists clientes_origen_check;

alter table public.clientes add constraint clientes_origen_check
  check (
    origen is null or origen in (
      'tiktok_live',
      'web',
      'referido',
      'otro',
      'admin_manual',
      'manual',
      'whatsapp'
    )
  );
