-- =====================================================================
-- 0004_oferta_activa.sql — Unicidad de oferta solo entre ACTIVOS
-- Reemplaza los índices de 0003 (uno por tipo sin importar estado) por
-- índices que permiten inactivos ilimitados y un solo activo por tipo.
-- Cómo usar: Supabase Dashboard > SQL Editor > pegar y ejecutar (DEV).
-- =====================================================================

drop index if exists public.uq_cupones_oferta_live;
drop index if exists public.uq_cupones_oferta_normal;

create unique index uq_cupones_oferta_live_activa
  on public.cupones (oferta)
  where oferta = 'live' and activo;

create unique index uq_cupones_oferta_normal_activa
  on public.cupones (oferta)
  where oferta = 'normal' and activo;
