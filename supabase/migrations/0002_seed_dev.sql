-- =====================================================================
-- 0002_seed_dev.sql — Datos mínimos de prueba (SOLO desarrollo)
-- No ejecutar en producción. Idempotente: se puede correr varias veces.
-- Crea: curso masterclass + 7 temas, 2 ediciones (1 finalizada, 1 abierta
-- con fechas dinámicas), acceso_edicion de prueba, configuraciones
-- públicas y 1 cupón de prueba.
-- Cómo usar: Supabase Dashboard > SQL Editor > pegar y ejecutar.
-- =====================================================================

DO $$
DECLARE
  v_curso_id           uuid;
  v_edicion_abierta_id uuid;
BEGIN
  -- 1. Curso masterclass (upsert por slug) -------------------------------
  INSERT INTO public.cursos (nombre, slug, descripcion, precio_pen, precio_usd, activo)
  VALUES (
    'Masterclass de Decoración y Globos',
    'masterclass-decoracion-globos',
    'Incluye 7 cursos: globos burbuja, lettering, costos y presupuestos, detalles personalizados y decoración para fechas especiales.',
    150.00, 40.00, true
  )
  ON CONFLICT (slug) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    precio_pen = EXCLUDED.precio_pen,
    precio_usd = EXCLUDED.precio_usd,
    activo = true;

  SELECT id INTO v_curso_id FROM public.cursos WHERE slug = 'masterclass-decoracion-globos';

  -- 2. Los 7 temas (solo si el curso aún no tiene temas) ------------------
  IF NOT EXISTS (SELECT 1 FROM public.temas_curso WHERE curso_id = v_curso_id) THEN
    INSERT INTO public.temas_curso (curso_id, titulo, descripcion, posicion, activo) VALUES
      (v_curso_id, 'Globos burbuja desde cero', 'Materiales, inflado y armado base.', 1, true),
      (v_curso_id, 'Lettering para detalles', 'Letras y mensajes personalizados.', 2, true),
      (v_curso_id, 'Costos y presupuestos', 'Qué precio ponerle a cada detalle para ganar.', 3, true),
      (v_curso_id, 'Detalles personalizados', 'Diseños a pedido para cada cliente.', 4, true),
      (v_curso_id, 'Fechas especiales', 'Día de la Madre, Padre, graduaciones, bodas y baby shower.', 5, true),
      (v_curso_id, 'Armado y estructura', 'Bases, soportes y terminaciones profesionales.', 6, true),
      (v_curso_id, 'Vende por TikTok Live', 'Cómo ofrecer y cerrar ventas en vivo.', 7, true);
  END IF;

  -- 3. Edición 1 finalizada (pasada, para probar el recambio) -------------
  IF NOT EXISTS (SELECT 1 FROM public.ediciones WHERE nombre = 'Edición 1 — Prueba' AND curso_id = v_curso_id) THEN
    INSERT INTO public.ediciones (curso_id, nombre, fecha_inicio, fecha_fin, horario_texto, cupos_maximos, precio_pen, precio_usd, estado)
    VALUES (v_curso_id, 'Edición 1 — Prueba', CURRENT_DATE - 30, CURRENT_DATE - 20, 'Lun a Vie · 7:00 pm (Lima)', 30, 150.00, 40.00, 'finalizada');
  END IF;

  -- 4. Edición 2 abierta (futura, es la "próxima edición" de la web) ------
  IF NOT EXISTS (SELECT 1 FROM public.ediciones WHERE nombre = 'Edición 2 — Prueba' AND curso_id = v_curso_id) THEN
    INSERT INTO public.ediciones (curso_id, nombre, fecha_inicio, fecha_fin, horario_texto, cupos_maximos, precio_pen, precio_usd, estado)
    VALUES (v_curso_id, 'Edición 2 — Prueba', CURRENT_DATE + 7, CURRENT_DATE + 21, 'Lun a Vie · 7:00 pm (Lima)', 30, 150.00, 40.00, 'abierta');
  END IF;

  SELECT id INTO v_edicion_abierta_id
  FROM public.ediciones
  WHERE nombre = 'Edición 2 — Prueba' AND curso_id = v_curso_id;

  -- 5. Acceso (Zoom de prueba, tabla privada) -----------------------------
  INSERT INTO public.acceso_edicion (edicion_id, url_zoom, notas)
  VALUES (v_edicion_abierta_id, 'https://zoom.us/test-edicion-2', 'Enlace de PRUEBA, no usar en producción.')
  ON CONFLICT (edicion_id) DO UPDATE SET
    url_zoom = EXCLUDED.url_zoom,
    notas = EXCLUDED.notas;

  -- 6. Configuraciones públicas (upsert por clave) ------------------------
  INSERT INTO public.configuraciones (clave, valor, es_publica) VALUES
    ('nombre_negocio', '"El taller de Amorelo"', true),
    ('whatsapp', '"+51991047674"', true),
    ('red_tiktok', '"https://www.tiktok.com/@eltallerdeamorelo"', true),
    -- Solo el % del sticker del hero, nunca el código del cupón.
    ('descuento_hero', '10', true)
  ON CONFLICT (clave) DO UPDATE SET
    valor = EXCLUDED.valor,
    es_publica = EXCLUDED.es_publica;

  -- 7. Cupón de prueba -----------------------------------------------------
  INSERT INTO public.cupones (codigo, tipo_descuento, valor_descuento, usos_maximos, etiqueta_live, activo)
  VALUES ('LIVE10', 'porcentaje', 10, 100, 'live de prueba', true)
  ON CONFLICT (codigo) DO NOTHING;
END $$;
