-- ---------------------------------------------------------------------
-- 0010_comprobantes_serie_b001.sql
-- Secuencia atómica y función para emisión de comprobantes Serie B001.
-- ---------------------------------------------------------------------

-- 1. Secuencia para correlativo de boletas B001
create sequence if not exists public.secuencia_comprobante_b001 start 1;

-- 2. Función segura y atómica para obtener el siguiente número correlativo
create or replace function public.obtener_siguiente_numero_comprobante(p_serie text)
returns int
language plpgsql
security definer
as $$
declare
  v_num int;
begin
  if p_serie = 'B001' then
    select nextval('public.secuencia_comprobante_b001') into v_num;
  else
    -- Fallback para series dinámicas o futuras
    select coalesce(max(numero), 0) + 1
      into v_num
      from public.comprobantes
     where serie = p_serie;
  end if;
  return v_num;
end;
$$;

revoke all on function public.obtener_siguiente_numero_comprobante(text) from public, anon, authenticated;
grant execute on function public.obtener_siguiente_numero_comprobante(text) to service_role;
