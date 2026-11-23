-- Migración 0008: Tipo de contenido y recurso para lecciones estilo Blackboard
ALTER TABLE public.lecciones
  ADD COLUMN IF NOT EXISTS tipo_contenido text NOT NULL DEFAULT 'video',
  ADD COLUMN IF NOT EXISTS recurso_url text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lecciones_tipo_contenido_check'
  ) THEN
    ALTER TABLE public.lecciones
      ADD CONSTRAINT lecciones_tipo_contenido_check
      CHECK (tipo_contenido IN ('video', 'documento', 'imagen', 'pdf'));
  END IF;
END $$;
