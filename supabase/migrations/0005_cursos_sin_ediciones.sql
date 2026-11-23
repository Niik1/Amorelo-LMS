-- =====================================================================
-- 0005_cursos_sin_ediciones.sql — El curso pasa a ser la unidad de venta
-- Elimina el modelo de ediciones (clases en vivo por Zoom) y el temario
-- en base. Las órdenes pasan a apuntar directamente al curso.
--
-- Cómo usar: Supabase Dashboard > SQL Editor > pegar y ejecutar (DEV).
-- Si hay órdenes reales en producción, exportar `ediciones` a CSV antes
-- de ejecutar: el backfill conserva el curso, no la edición.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. ordenes.curso_id
-- ---------------------------------------------------------------------
alter table public.ordenes
  add column if not exists curso_id uuid;

update public.ordenes o
   set curso_id = e.curso_id
  from public.ediciones e
 where e.id = o.edicion_id
   and o.curso_id is null;

-- Si alguna orden no pudo resolverse, esta línea falla y la transacción
-- se revierte completa, sin dejar la tabla a medio migrar.
alter table public.ordenes
  alter column curso_id set not null;

alter table public.ordenes
  drop constraint if exists ordenes_curso_id_fkey;

alter table public.ordenes
  add constraint ordenes_curso_id_fkey
  foreign key (curso_id) references public.cursos(id) on delete restrict;

create index if not exists idx_ordenes_curso on public.ordenes(curso_id);

-- ---------------------------------------------------------------------
-- 2. Quitar la dependencia de ediciones
-- ---------------------------------------------------------------------
alter table public.ordenes
  drop constraint if exists ordenes_edicion_id_fkey;

alter table public.ordenes
  drop column if exists edicion_id;

-- ---------------------------------------------------------------------
-- 3. Función pública de cupos (ya no hay cupos)
-- ---------------------------------------------------------------------
drop function if exists public.cupos_disponibles_edicion(uuid);

-- ---------------------------------------------------------------------
-- 4. Tablas del modelo anterior
-- acceso_edicion primero: su FK apunta a ediciones.
-- ---------------------------------------------------------------------
drop table if exists public.acceso_edicion;
drop table if exists public.ediciones;
drop table if exists public.temas_curso;

commit;
