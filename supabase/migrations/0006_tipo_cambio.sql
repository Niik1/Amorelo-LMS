-- 0006_tipo_cambio.sql — Tipo de cambio de referencia para el panel.
-- No participa del cálculo de precios: el precio en soles y el precio en
-- dólares se descuentan con el cupón. El tipo de cambio solo muestra cuánto
-- equivale el precio en dólares en soles.

insert into public.configuraciones (clave, valor, es_publica)
values ('tipo_cambio', '3.43'::jsonb, false)
on conflict (clave) do nothing;
