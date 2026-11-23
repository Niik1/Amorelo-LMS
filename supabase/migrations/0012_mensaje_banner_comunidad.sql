-- =====================================================================
-- 0012_mensaje_banner_comunidad.sql
-- Mensaje motivacional / anuncio del mentor en el banner del Aula Virtual
-- =====================================================================

insert into public.configuraciones (clave, valor, es_publica, actualizado_en)
values (
  'mensaje_banner_comunidad',
  '{"mensaje": "¡Cree en tu talento y que hoy sea un gran día de práctica! Cada detalle que preparas con amor te acerca a tu meta. ✨🎈", "autor": "Brayan Rodriguez", "activo": true}'::jsonb,
  true,
  now()
)
on conflict (clave) do nothing;
