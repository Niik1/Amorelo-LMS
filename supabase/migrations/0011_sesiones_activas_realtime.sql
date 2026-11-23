-- Habilitar Supabase Realtime en sesiones_activas para expulsión instantánea
ALTER TABLE public.sesiones_activas REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sesiones_activas' 
    AND policyname = 'Los alumnos pueden ver su propia sesión activa'
  ) THEN
    CREATE POLICY "Los alumnos pueden ver su propia sesión activa"
    ON public.sesiones_activas
    FOR SELECT
    TO authenticated
    USING (perfil_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'sesiones_activas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sesiones_activas;
  END IF;
END $$;
