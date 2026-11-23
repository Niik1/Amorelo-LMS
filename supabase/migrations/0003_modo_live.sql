-- =====================================================================
-- 0003_modo_live.sql — Modo Live + medición de interés por clics
-- Crea: lives, clics, cupones.oferta (marca live/normal, única por tipo),
-- cupones.mensaje_whatsapp (plantilla con {codigo} y {descuento}).
-- NO incluye live_id en cupones (medición por usos + clics).
-- Cómo usar: Supabase Dashboard > SQL Editor > pegar y ejecutar (DEV).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. lives (una fila por directo)
-- ---------------------------------------------------------------------
create table public.lives (
  id              uuid primary key default gen_random_uuid(),
  inicio          timestamptz not null default now(),
  fin_programado  timestamptz not null default (now() + interval '3 hours'),
  fin_real        timestamptz,
  estado          text not null default 'finalizado'
                  check (estado in ('en_vivo','finalizado')),
  apagado_por     text check (apagado_por in ('manual','automatico')),
  creado_en       timestamptz not null default now(),
  constraint chk_fin_live check (fin_programado >= inicio),
  constraint chk_fin_real_live check (fin_real is null or fin_real >= inicio)
);

-- Un solo live activo a la vez (a prueba de doble clic).
create unique index uq_lives_uno_en_vivo
  on public.lives (estado)
  where estado = 'en_vivo';

create index idx_lives_estado on public.lives(estado, inicio desc);

-- ---------------------------------------------------------------------
-- 2. clics (un registro por toque en CTA)
-- ---------------------------------------------------------------------
create table public.clics (
  id            uuid primary key default gen_random_uuid(),
  live_id       uuid references public.lives(id) on delete set null,
  tipo_oferta   text not null check (tipo_oferta in ('live','normal')),
  boton         text not null,
  creado_en     timestamptz not null default now()
);

create index idx_clics_live on public.clics(live_id, creado_en desc);
create index idx_clics_boton on public.clics(boton, creado_en desc);

-- ---------------------------------------------------------------------
-- 3. cupones: marca de oferta + mensaje (sin live_id)
-- ---------------------------------------------------------------------
alter table public.cupones
  add column if not exists oferta text check (oferta in ('live','normal'));

-- Una sola oferta live y una sola normal.
create unique index uq_cupones_oferta_live
  on public.cupones (oferta)
  where oferta = 'live';

create unique index uq_cupones_oferta_normal
  on public.cupones (oferta)
  where oferta = 'normal';

alter table public.cupones
  add column if not exists mensaje_whatsapp text;

-- ---------------------------------------------------------------------
-- 4. Función pública: live en vivo o vacío
-- ---------------------------------------------------------------------
create or replace function public.live_actual()
returns setof public.lives
language sql
stable
security definer
set search_path = ''
as $$
  select *
    from public.lives
   where estado = 'en_vivo'
   order by inicio desc
   limit 1;
$$;

grant execute on function public.live_actual() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- 5. RLS
-- ---------------------------------------------------------------------
alter table public.lives enable row level security;
alter table public.clics enable row level security;

-- La web muestra si hay live (sin detalles sensibles).
create policy "lectura publica live en vivo" on public.lives
  for select to anon, authenticated using (estado = 'en_vivo');

create policy "admin gestiona lives" on public.lives
  for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- Cualquiera puede registrar su clic; nadie los lee desde el navegador.
create policy "inserta clics anonimo" on public.clics
  for insert to anon, authenticated with check (true);

create policy "admin lee clics" on public.clics
  for select to authenticated using (public.es_admin());
