-- Migración 0013: Almacenar nombre completo del país en public.clientes
-- Cambia el valor por defecto de 'PE' a 'Perú' y normaliza los registros existentes.

-- 1. Actualizar el valor por defecto de la columna 'pais' a 'Perú'
alter table public.clientes
  alter column pais set default 'Perú';

-- 2. Normalizar registros existentes con siglas o variantes a su nombre completo oficial
update public.clientes
set pais = case
  when upper(trim(pais)) in ('PE', 'P', 'PERU') or pais is null then 'Perú'
  when upper(trim(pais)) in ('CO', 'COLOMBIA') then 'Colombia'
  when upper(trim(pais)) in ('MX', 'MEXICO') then 'México'
  when upper(trim(pais)) in ('CL', 'CHILE') then 'Chile'
  when upper(trim(pais)) in ('EC', 'ECUADOR') then 'Ecuador'
  when upper(trim(pais)) in ('AR', 'ARGENTINA') then 'Argentina'
  when upper(trim(pais)) in ('BO', 'BOLIVIA') then 'Bolivia'
  when upper(trim(pais)) in ('US', 'USA', 'ESTADOS UNIDOS') then 'Estados Unidos'
  when upper(trim(pais)) in ('ES', 'ESPANA', 'ESPAÑA') then 'España'
  when upper(trim(pais)) in ('PA', 'PANAMA') then 'Panamá'
  when upper(trim(pais)) in ('CR', 'COSTA RICA') then 'Costa Rica'
  when upper(trim(pais)) in ('DO', 'REP. DOMINICANA', 'REPUBLICA DOMINICANA') then 'Rep. Dominicana'
  when upper(trim(pais)) in ('UY', 'URUGUAY') then 'Uruguay'
  when upper(trim(pais)) in ('PY', 'PARAGUAY') then 'Paraguay'
  when upper(trim(pais)) in ('GT', 'GUATEMALA') then 'Guatemala'
  else pais
end;
