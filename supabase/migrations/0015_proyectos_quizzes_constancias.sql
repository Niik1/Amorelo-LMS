-- Migración 0015: Tablas dedicadas para Proyectos Prácticos, Quizzes y control de Constancias
-- Soporte para lecciones tipo 'proyecto' y 'quiz', validación manual de proyectos por Brayan y cuestionarios teóricos

-- 1. Ampliar el check constraint de lecciones.tipo_contenido
ALTER TABLE public.lecciones
  DROP CONSTRAINT IF EXISTS lecciones_tipo_contenido_check;

ALTER TABLE public.lecciones
  ADD CONSTRAINT lecciones_tipo_contenido_check
  CHECK (tipo_contenido IN ('video', 'documento', 'imagen', 'pdf', 'texto', 'proyecto', 'quiz'));

-- 2. Tabla para definición de Proyectos Prácticos (1 a 1 con lecciones de tipo 'proyecto')
CREATE TABLE IF NOT EXISTS public.proyectos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leccion_id uuid NOT NULL UNIQUE REFERENCES public.lecciones(id) ON DELETE CASCADE,
  titulo_proyecto text NOT NULL,
  instrucciones text,
  foto_referencia_url text,
  es_obligatorio boolean NOT NULL DEFAULT true,
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

-- 3. Tabla para el seguimiento y aprobación de proyectos por alumna (validación de Brayan)
CREATE TABLE IF NOT EXISTS public.entregas_proyectos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id uuid NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
  matricula_id uuid NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
  perfil_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'enviado_whatsapp', 'aprobado', 'observado')),
  fecha_envio_whatsapp timestamptz,
  fecha_aprobacion timestamptz,
  aprobado_por uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  comentarios_admin text,
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT entregas_proyectos_proyecto_matricula_unique UNIQUE (proyecto_id, matricula_id)
);

-- 4. Tablas para Cuestionarios / Quizzes
CREATE TABLE IF NOT EXISTS public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leccion_id uuid NOT NULL UNIQUE REFERENCES public.lecciones(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descripcion text,
  porcentaje_minimo integer NOT NULL DEFAULT 80 CHECK (porcentaje_minimo >= 0 AND porcentaje_minimo <= 100),
  intentos_permitidos integer DEFAULT NULL, -- NULL significa intentos ilimitados
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.preguntas_quiz (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  enunciado text NOT NULL,
  orden integer NOT NULL DEFAULT 1,
  explicacion text,
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.opciones_quiz (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pregunta_id uuid NOT NULL REFERENCES public.preguntas_quiz(id) ON DELETE CASCADE,
  texto_opcion text NOT NULL,
  es_correcta boolean NOT NULL DEFAULT false,
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.intentos_quiz (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  matricula_id uuid NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
  perfil_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  puntaje integer NOT NULL CHECK (puntaje >= 0 AND puntaje <= 100),
  aprobado boolean NOT NULL DEFAULT false,
  respuestas_detalle jsonb DEFAULT '{}'::jsonb,
  creado_en timestamptz NOT NULL DEFAULT now()
);

-- 5. Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_proyectos_leccion_id ON public.proyectos(leccion_id);
CREATE INDEX IF NOT EXISTS idx_entregas_proyectos_matricula ON public.entregas_proyectos(matricula_id);
CREATE INDEX IF NOT EXISTS idx_entregas_proyectos_perfil ON public.entregas_proyectos(perfil_id);
CREATE INDEX IF NOT EXISTS idx_entregas_proyectos_estado ON public.entregas_proyectos(estado);
CREATE INDEX IF NOT EXISTS idx_quizzes_leccion_id ON public.quizzes(leccion_id);
CREATE INDEX IF NOT EXISTS idx_preguntas_quiz_quiz_id ON public.preguntas_quiz(quiz_id);
CREATE INDEX IF NOT EXISTS idx_opciones_quiz_pregunta_id ON public.opciones_quiz(pregunta_id);
CREATE INDEX IF NOT EXISTS idx_intentos_quiz_matricula ON public.intentos_quiz(matricula_id);
CREATE INDEX IF NOT EXISTS idx_intentos_quiz_perfil ON public.intentos_quiz(perfil_id);

-- 6. Habilitar RLS en todas las nuevas tablas
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregas_proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preguntas_quiz ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opciones_quiz ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intentos_quiz ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de Seguridad (RLS)

-- Proyectos: Alumnos autenticados pueden consultar, admins control total
CREATE POLICY "lectura autenticada proyectos" ON public.proyectos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin gestiona proyectos" ON public.proyectos
  FOR ALL TO authenticated USING (public.es_admin()) WITH CHECK (public.es_admin());

-- Entregas Proyectos: Alumna ve sus entregas; inserción y actualización protegidas vía servidor/admin
CREATE POLICY "alumna ve sus entregas de proyectos" ON public.entregas_proyectos
  FOR SELECT TO authenticated USING (perfil_id = auth.uid() OR public.es_admin());

CREATE POLICY "admin gestiona entregas proyectos" ON public.entregas_proyectos
  FOR ALL TO authenticated USING (public.es_admin()) WITH CHECK (public.es_admin());

-- Quizzes: Alumnos autenticados pueden ver cuestionario y preguntas
CREATE POLICY "lectura autenticada quizzes" ON public.quizzes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin gestiona quizzes" ON public.quizzes
  FOR ALL TO authenticated USING (public.es_admin()) WITH CHECK (public.es_admin());

CREATE POLICY "lectura autenticada preguntas quiz" ON public.preguntas_quiz
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin gestiona preguntas quiz" ON public.preguntas_quiz
  FOR ALL TO authenticated USING (public.es_admin()) WITH CHECK (public.es_admin());

-- Opciones Quiz: Solo administradores y backend seguro (evita fuga de columna es_correcta)
CREATE POLICY "admin gestiona opciones quiz" ON public.opciones_quiz
  FOR ALL TO authenticated USING (public.es_admin()) WITH CHECK (public.es_admin());

-- Intentos de Quiz: Alumna solo ve sus intentos; inserción segura en servidor vía calificarIntentoQuiz
CREATE POLICY "alumna ve sus intentos de quiz" ON public.intentos_quiz
  FOR SELECT TO authenticated USING (perfil_id = auth.uid() OR public.es_admin());

CREATE POLICY "admin gestiona intentos quiz" ON public.intentos_quiz
  FOR ALL TO authenticated USING (public.es_admin()) WITH CHECK (public.es_admin());

-- 8. Permisos de tabla para los roles de Supabase (authenticated, service_role, anon)
GRANT ALL ON TABLE public.proyectos TO authenticated, service_role;
GRANT SELECT ON TABLE public.proyectos TO anon;

GRANT ALL ON TABLE public.entregas_proyectos TO authenticated, service_role;
GRANT SELECT ON TABLE public.entregas_proyectos TO anon;

GRANT ALL ON TABLE public.quizzes TO authenticated, service_role;
GRANT SELECT ON TABLE public.quizzes TO anon;

GRANT ALL ON TABLE public.preguntas_quiz TO authenticated, service_role;
GRANT SELECT ON TABLE public.preguntas_quiz TO anon;

GRANT ALL ON TABLE public.opciones_quiz TO authenticated, service_role;
GRANT SELECT ON TABLE public.opciones_quiz TO anon;

GRANT ALL ON TABLE public.intentos_quiz TO authenticated, service_role;
GRANT SELECT ON TABLE public.intentos_quiz TO anon;
