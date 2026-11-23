-- =====================================================================
-- Cupones: solo descuentos porcentuales
--
-- * Desactiva los cupones históricos de monto fijo (no se borran: pueden
--   tener canjes asociados).
-- * Agrega una restricción que impide crear o editar cupones con
--   tipo_descuento distinto de 'porcentaje'. Se declara NOT VALID para no
--   fallar si en el entorno quedan filas históricas; PostgreSQL la aplica
--   igual a toda fila nueva o actualizada, así que un cupón legacy no se
--   puede reactivar ni modificar.
-- =====================================================================

update public.cupones
   set activo = false
 where tipo_descuento = 'monto_fijo'
   and activo;

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conname = 'chk_cupon_solo_porcentaje'
       and conrelid = 'public.cupones'::regclass
  ) then
    alter table public.cupones
      add constraint chk_cupon_solo_porcentaje
      check (tipo_descuento = 'porcentaje') not valid;
  end if;
end
$$;

comment on constraint chk_cupon_solo_porcentaje on public.cupones
  is 'Los cupones nuevos o editados solo pueden ser porcentaje.';
