-- =====================================================================
-- MVP Web Corporativa - Esquema de base de datos (Supabase / PostgreSQL)
-- Versión 3: nombres de tablas, columnas, funciones y valores en ESPAÑOL
-- Ejecutar en: Supabase > SQL Editor (una sola vez, en un proyecto vacío)
--
-- Contenido de esta versión:
--   * clave_idempotencia (UNIQUE) en ordenes: evita órdenes duplicadas por doble clic.
--   * intentos_conciliacion / ultima_conciliacion_en: soporte del job de conciliación.
--   * url_zoom vive en acceso_edicion (tabla privada, no legible con la clave publicable).
--   * configuraciones.es_publica: la web pública lee solo lo marcado como público.
--   * RLS simplificado: un solo nivel de admin (es_admin). Sin roles con permisos.
--   * Auditoría diferida (bloque comentado al final).
--
-- Notas:
--   * El backend usa la clave secreta (omite RLS). Nunca exponerla al navegador.
--   * Los admins se autentican con Supabase Auth y se registran en usuarios_admin.
--   * Producción requiere plan Supabase Pro (backups diarios).
--   * Los nombres de esquemas de Supabase (auth, storage) siguen en inglés.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Utilidades
-- ---------------------------------------------------------------------
create or replace function public.establecer_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 1. usuarios_admin (vinculada a Supabase Auth)
-- ---------------------------------------------------------------------
create table public.usuarios_admin (
  id                uuid primary key references auth.users(id) on delete restrict,
  nombre_completo   text not null,
  correo            text not null unique,
  rol               text not null default 'propietario'
                    check (rol in ('propietario','admin')),  -- reservado; hoy todos tienen el mismo acceso
  activo            boolean not null default true,
  ultimo_acceso_en  timestamptz,
  creado_en         timestamptz not null default now()
);

-- Función auxiliar para RLS (security definer evita recursión de políticas)
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.usuarios_admin
    where id = auth.uid() and activo
  );
$$;

-- ---------------------------------------------------------------------
-- 2. clientes
-- ---------------------------------------------------------------------
create table public.clientes (
  id                    uuid primary key default gen_random_uuid(),
  nombres               text not null,
  apellidos             text not null,
  correo                text not null unique,
  telefono              text not null,
  tipo_documento        text check (tipo_documento in ('DNI','RUC','CE','PASAPORTE')),
  numero_documento      text,
  pais                  text default 'PE',
  ciudad                text,
  acepta_marketing      boolean not null default false,
  acepta_marketing_en   timestamptz,
  origen                text default 'web'
                        check (origen in ('tiktok_live','web','referido','otro')),
  creado_en             timestamptz not null default now(),
  actualizado_en        timestamptz not null default now()
);

create trigger trg_clientes_actualizado before update on public.clientes
  for each row execute function public.establecer_actualizado_en();

-- ---------------------------------------------------------------------
-- 3. cursos
-- ---------------------------------------------------------------------
create table public.cursos (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null,
  slug            text not null unique,
  descripcion     text,
  precio_pen      numeric(10,2) not null check (precio_pen >= 0),
  precio_usd      numeric(10,2) check (precio_usd >= 0),
  imagen_url      text,
  activo          boolean not null default true,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);

create trigger trg_cursos_actualizado before update on public.cursos
  for each row execute function public.establecer_actualizado_en();

-- ---------------------------------------------------------------------
-- 4. temas_curso (los 7 cursos dentro de la masterclass)
-- ---------------------------------------------------------------------
create table public.temas_curso (
  id           uuid primary key default gen_random_uuid(),
  curso_id     uuid not null references public.cursos(id) on delete cascade,
  titulo       text not null,
  descripcion  text,
  posicion     int not null default 0,
  activo       boolean not null default true
);

create index idx_temas_curso_curso on public.temas_curso(curso_id, posicion);

-- ---------------------------------------------------------------------
-- 5. ediciones (datos públicos) + acceso_edicion (datos privados)
-- ---------------------------------------------------------------------
create table public.ediciones (
  id              uuid primary key default gen_random_uuid(),
  curso_id        uuid not null references public.cursos(id) on delete restrict,
  nombre          text not null,
  fecha_inicio    date not null,
  fecha_fin       date not null,
  horario_texto   text,
  cupos_maximos   int check (cupos_maximos is null or cupos_maximos > 0),
  precio_pen      numeric(10,2) not null check (precio_pen >= 0),
  precio_usd      numeric(10,2) check (precio_usd >= 0),
  estado          text not null default 'borrador'
                  check (estado in ('borrador','abierta','cerrada','finalizada')),
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now(),
  constraint chk_fechas_edicion check (fecha_fin >= fecha_inicio)
);

create index idx_ediciones_curso_estado on public.ediciones(curso_id, estado);

create trigger trg_ediciones_actualizado before update on public.ediciones
  for each row execute function public.establecer_actualizado_en();

-- Datos sensibles de la edición (enlace de Zoom). NUNCA legibles con la clave publicable.
create table public.acceso_edicion (
  edicion_id      uuid primary key references public.ediciones(id) on delete cascade,
  url_zoom        text,
  notas           text,
  actualizado_en  timestamptz not null default now()
);

create trigger trg_acceso_edicion_actualizado before update on public.acceso_edicion
  for each row execute function public.establecer_actualizado_en();

-- ---------------------------------------------------------------------
-- 6. cupones
-- ---------------------------------------------------------------------
create table public.cupones (
  id               uuid primary key default gen_random_uuid(),
  codigo           text not null unique,
  tipo_descuento   text not null check (tipo_descuento in ('porcentaje','monto_fijo')),
  valor_descuento  numeric(10,2) not null check (valor_descuento > 0),
  valido_desde     timestamptz,
  valido_hasta     timestamptz,
  usos_maximos     int check (usos_maximos is null or usos_maximos > 0),
  usos_actuales    int not null default 0 check (usos_actuales >= 0),
  curso_id         uuid references public.cursos(id) on delete set null,
  etiqueta_live    text,
  activo           boolean not null default true,
  creado_por       uuid references public.usuarios_admin(id) on delete set null,
  creado_en        timestamptz not null default now(),
  actualizado_en   timestamptz not null default now(),
  constraint chk_cupon_porcentaje check (tipo_descuento <> 'porcentaje' or valor_descuento <= 100),
  constraint chk_cupon_codigo_mayusculas check (codigo = upper(codigo)),
  constraint chk_cupon_fechas check (valido_hasta is null or valido_desde is null or valido_hasta >= valido_desde)
);

create index idx_cupones_activo on public.cupones(activo, valido_hasta);

create trigger trg_cupones_actualizado before update on public.cupones
  for each row execute function public.establecer_actualizado_en();

-- ---------------------------------------------------------------------
-- 7. ordenes
-- ---------------------------------------------------------------------
create sequence public.secuencia_numero_orden start 1;

create table public.ordenes (
  id                       uuid primary key default gen_random_uuid(),
  numero_orden             text not null unique
                           default ('ORD-' || lpad(nextval('public.secuencia_numero_orden')::text, 6, '0')),
  -- Idempotencia: el checkout genera un UUID al cargar la página y lo reenvía en cada intento.
  -- Si llega la misma clave, el servidor devuelve la orden existente (no crea otra).
  clave_idempotencia       text not null unique,
  cliente_id               uuid not null references public.clientes(id) on delete restrict,
  edicion_id               uuid not null references public.ediciones(id) on delete restrict,
  cupon_id                 uuid references public.cupones(id) on delete restrict,
  moneda                   text not null default 'PEN' check (moneda in ('PEN','USD')),
  subtotal                 numeric(10,2) not null check (subtotal >= 0),
  monto_descuento          numeric(10,2) not null default 0 check (monto_descuento >= 0),
  total                    numeric(10,2) not null check (total >= 0),
  estado                   text not null default 'pendiente'
                           check (estado in ('pendiente','pagada','fallida','cancelada','expirada','reembolsada')),
  tipo_comprobante         text not null default 'boleta' check (tipo_comprobante in ('boleta','factura')),
  facturacion_tipo_doc     text check (facturacion_tipo_doc in ('DNI','RUC','CE','PASAPORTE')),
  facturacion_numero_doc   text,
  facturacion_nombre       text,
  facturacion_direccion    text,
  estado_inscripcion       text not null default 'pendiente'
                           check (estado_inscripcion in ('pendiente','enviada','confirmada','fallida')),
  intentos_inscripcion     int not null default 0,
  inscripcion_enviada_en   timestamptz,
  -- Conciliación de pagos (job cron)
  intentos_conciliacion    int not null default 0,
  ultima_conciliacion_en   timestamptz,
  utm_origen               text,
  utm_campana              text,
  pagada_en                timestamptz,
  creado_en                timestamptz not null default now(),
  actualizado_en           timestamptz not null default now(),
  constraint chk_total_orden check (total = subtotal - monto_descuento),
  constraint chk_factura_ruc check (
    tipo_comprobante <> 'factura'
    or (facturacion_tipo_doc = 'RUC' and facturacion_numero_doc is not null and facturacion_direccion is not null)
  )
);

create index idx_ordenes_cliente      on public.ordenes(cliente_id);
create index idx_ordenes_estado       on public.ordenes(estado, creado_en desc);
create index idx_ordenes_edicion      on public.ordenes(edicion_id);
create index idx_ordenes_pendientes   on public.ordenes(creado_en) where estado = 'pendiente';
create index idx_ordenes_inscripcion  on public.ordenes(estado_inscripcion) where estado_inscripcion <> 'confirmada';

create trigger trg_ordenes_actualizado before update on public.ordenes
  for each row execute function public.establecer_actualizado_en();

-- ---------------------------------------------------------------------
-- 8. canjes_cupon
-- ---------------------------------------------------------------------
create table public.canjes_cupon (
  id                 uuid primary key default gen_random_uuid(),
  cupon_id           uuid not null references public.cupones(id) on delete restrict,
  orden_id           uuid not null unique references public.ordenes(id) on delete restrict,
  cliente_id         uuid not null references public.clientes(id) on delete restrict,
  descuento_aplicado numeric(10,2) not null check (descuento_aplicado >= 0),
  canjeado_en        timestamptz not null default now()
);

create index idx_canjes_cupon on public.canjes_cupon(cupon_id);

-- ---------------------------------------------------------------------
-- 9. pagos
-- ---------------------------------------------------------------------
create table public.pagos (
  id                        uuid primary key default gen_random_uuid(),
  orden_id                  uuid not null references public.ordenes(id) on delete restrict,
  proveedor                 text not null check (proveedor in ('mercadopago','paypal')),
  proveedor_preferencia_id  text,
  proveedor_pago_id         text,
  metodo_pago               text,
  estado                    text not null default 'pendiente'
                            check (estado in ('pendiente','aprobado','rechazado','cancelado','reembolsado')),
  monto                     numeric(10,2) not null check (monto >= 0),
  moneda                    text not null check (moneda in ('PEN','USD')),
  respuesta_cruda           jsonb,
  pagado_en                 timestamptz,
  creado_en                 timestamptz not null default now(),
  actualizado_en            timestamptz not null default now(),
  unique (proveedor, proveedor_pago_id)
);

create index idx_pagos_orden       on public.pagos(orden_id);
create index idx_pagos_preferencia on public.pagos(proveedor, proveedor_preferencia_id);

create trigger trg_pagos_actualizado before update on public.pagos
  for each row execute function public.establecer_actualizado_en();

-- ---------------------------------------------------------------------
-- 10. eventos_webhook (idempotencia de webhooks)
-- ---------------------------------------------------------------------
create table public.eventos_webhook (
  id             uuid primary key default gen_random_uuid(),
  proveedor      text not null check (proveedor in ('mercadopago','paypal')),
  evento_id      text not null,
  tipo_evento    text,
  contenido      jsonb not null,
  procesado      boolean not null default false,
  procesado_en   timestamptz,
  error          text,
  recibido_en    timestamptz not null default now(),
  unique (proveedor, evento_id)
);

create index idx_eventos_webhook_pendientes on public.eventos_webhook(procesado, recibido_en);

-- ---------------------------------------------------------------------
-- 11. comprobantes (boletas, facturas y notas de crédito SUNAT)
-- ---------------------------------------------------------------------
create table public.comprobantes (
  id                          uuid primary key default gen_random_uuid(),
  orden_id                    uuid not null references public.ordenes(id) on delete restrict,
  pago_id                     uuid references public.pagos(id) on delete restrict,
  comprobante_relacionado_id  uuid references public.comprobantes(id) on delete restrict,
  tipo_documento              text not null check (tipo_documento in ('boleta','factura','nota_credito')),
  serie                       text,
  numero                      int,
  cliente_tipo_doc            text,
  cliente_numero_doc          text,
  cliente_nombre              text,
  cliente_direccion           text,
  subtotal                    numeric(10,2) not null check (subtotal >= 0),
  igv                         numeric(10,2) not null default 0 check (igv >= 0),
  total                       numeric(10,2) not null check (total >= 0),
  moneda                      text not null check (moneda in ('PEN','USD')),
  estado_sunat                text not null default 'pendiente'
                              check (estado_sunat in ('pendiente','aceptado','rechazado','error')),
  codigo_sunat                text,
  mensaje_sunat               text,
  id_externo                  text,
  ruta_pdf                    text,
  ruta_xml                    text,
  ruta_cdr                    text,
  intentos                    int not null default 0,
  ultimo_error                text,
  proximo_reintento_en        timestamptz,  -- el cron procesa las filas con proximo_reintento_en <= now()
  emitido_en                  timestamptz,
  creado_en                   timestamptz not null default now(),
  actualizado_en              timestamptz not null default now(),
  unique (serie, numero),
  constraint chk_nota_credito_ref check (
    tipo_documento <> 'nota_credito' or comprobante_relacionado_id is not null
  )
);

create index idx_comprobantes_orden    on public.comprobantes(orden_id);
create index idx_comprobantes_reintento on public.comprobantes(estado_sunat, proximo_reintento_en)
  where estado_sunat in ('pendiente','error');

-- Evita emitir dos comprobantes (no notas de crédito) para la misma orden
create unique index uq_comprobantes_uno_por_orden
  on public.comprobantes(orden_id)
  where tipo_documento in ('boleta','factura');

create trigger trg_comprobantes_actualizado before update on public.comprobantes
  for each row execute function public.establecer_actualizado_en();

-- ---------------------------------------------------------------------
-- 12. registro_correos
-- ---------------------------------------------------------------------
create table public.registro_correos (
  id                   uuid primary key default gen_random_uuid(),
  orden_id             uuid references public.ordenes(id) on delete set null,
  cliente_id           uuid references public.clientes(id) on delete set null,
  tipo                 text not null check (tipo in ('confirmacion_orden','comprobante','recordatorio','otro')),
  correo_destino       text not null,
  mensaje_proveedor_id text,
  estado               text not null default 'en_cola' check (estado in ('en_cola','enviado','fallido')),
  error                text,
  enviado_en           timestamptz,
  creado_en            timestamptz not null default now()
);

create index idx_registro_correos_orden on public.registro_correos(orden_id);

-- ---------------------------------------------------------------------
-- 13. configuraciones (configuración del negocio)
-- ---------------------------------------------------------------------
create table public.configuraciones (
  clave           text primary key,
  valor           jsonb not null,
  es_publica      boolean not null default false,  -- true = la web pública puede leerla (nombre, WhatsApp, redes)
  actualizado_por uuid references public.usuarios_admin(id) on delete set null,
  actualizado_en  timestamptz not null default now()
);

create trigger trg_configuraciones_actualizado before update on public.configuraciones
  for each row execute function public.establecer_actualizado_en();

-- ---------------------------------------------------------------------
-- 14. Funciones de negocio (solo backend / clave secreta)
-- ---------------------------------------------------------------------

-- Marca una orden como pagada de forma idempotente.
-- La usan tanto el webhook como el job de conciliación.
-- Devuelve true solo la primera vez (la que realmente cambia el estado).
create or replace function public.marcar_orden_pagada(p_orden_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.ordenes
     set estado = 'pagada',
         pagada_en = coalesce(pagada_en, now())
   where id = p_orden_id
     and estado <> 'pagada';
  return found;
end;
$$;

revoke all on function public.marcar_orden_pagada(uuid) from public, anon, authenticated;
grant execute on function public.marcar_orden_pagada(uuid) to service_role;

-- Canjea un cupón de forma atómica al confirmarse el pago.
-- Devuelve true si se canjeó; false si el cupón ya no era válido.
create or replace function public.canjear_cupon(
  p_cupon_id    uuid,
  p_orden_id    uuid,
  p_cliente_id  uuid,
  p_descuento   numeric
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cupon public.cupones%rowtype;
begin
  select * into v_cupon from public.cupones where id = p_cupon_id for update;

  if not found or not v_cupon.activo then
    return false;
  end if;
  if v_cupon.valido_desde is not null and now() < v_cupon.valido_desde then return false; end if;
  if v_cupon.valido_hasta is not null and now() > v_cupon.valido_hasta then return false; end if;
  if v_cupon.usos_maximos is not null and v_cupon.usos_actuales >= v_cupon.usos_maximos then
    return false;
  end if;

  insert into public.canjes_cupon (cupon_id, orden_id, cliente_id, descuento_aplicado)
  values (p_cupon_id, p_orden_id, p_cliente_id, p_descuento)
  on conflict (orden_id) do nothing;

  if found then
    update public.cupones set usos_actuales = usos_actuales + 1 where id = p_cupon_id;
  end if;

  return true;
end;
$$;

revoke all on function public.canjear_cupon(uuid, uuid, uuid, numeric) from public, anon, authenticated;
grant execute on function public.canjear_cupon(uuid, uuid, uuid, numeric) to service_role;

-- Órdenes pendientes que el cron debe conciliar contra Mercado Pago / PayPal.
-- Ej.: select * from ordenes_pendientes_por_conciliar('10 minutes', '48 hours', 50);
create or replace function public.ordenes_pendientes_por_conciliar(
  p_edad_min interval default '10 minutes',
  p_edad_max interval default '48 hours',
  p_limite   int default 50
) returns setof public.ordenes
language sql
stable
security definer
set search_path = ''
as $$
  select *
    from public.ordenes
   where estado = 'pendiente'
     and creado_en <= now() - p_edad_min
     and creado_en >= now() - p_edad_max
     and (ultima_conciliacion_en is null or ultima_conciliacion_en <= now() - interval '5 minutes')
   order by creado_en
   limit p_limite;
$$;

revoke all on function public.ordenes_pendientes_por_conciliar(interval, interval, int) from public, anon, authenticated;
grant execute on function public.ordenes_pendientes_por_conciliar(interval, interval, int) to service_role;

-- Cupos disponibles de una edición (null = sin límite).
create or replace function public.cupos_disponibles_edicion(p_edicion_id uuid)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when e.cupos_maximos is null then null
    else greatest(e.cupos_maximos - (
      select count(*) from public.ordenes o
      where o.edicion_id = e.id and o.estado = 'pagada'
    ), 0)::int
  end
  from public.ediciones e
  where e.id = p_edicion_id;
$$;

grant execute on function public.cupos_disponibles_edicion(uuid) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- 15. Row Level Security
-- Principio: todo cerrado por defecto. El navegador (anon) solo lee contenido
-- público. TODAS las escrituras del checkout, pagos y comprobantes pasan por
-- el servidor con la clave secreta.
-- ---------------------------------------------------------------------
alter table public.usuarios_admin      enable row level security;
alter table public.clientes            enable row level security;
alter table public.cursos              enable row level security;
alter table public.temas_curso         enable row level security;
alter table public.ediciones           enable row level security;
alter table public.acceso_edicion      enable row level security;
alter table public.cupones             enable row level security;
alter table public.ordenes             enable row level security;
alter table public.canjes_cupon        enable row level security;
alter table public.pagos               enable row level security;
alter table public.eventos_webhook     enable row level security;
alter table public.comprobantes        enable row level security;
alter table public.registro_correos    enable row level security;
alter table public.configuraciones     enable row level security;

-- Lectura pública: solo contenido que la web muestra
create policy "lectura publica cursos activos" on public.cursos
  for select to anon, authenticated using (activo);

create policy "lectura publica temas activos" on public.temas_curso
  for select to anon, authenticated using (activo);

create policy "lectura publica ediciones abiertas" on public.ediciones
  for select to anon, authenticated using (estado = 'abierta');

create policy "lectura publica configuracion publica" on public.configuraciones
  for select to anon, authenticated using (es_publica);

-- Admin: gestión de contenido y configuración
create policy "admin gestiona cursos" on public.cursos
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

create policy "admin gestiona temas" on public.temas_curso
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

create policy "admin gestiona ediciones" on public.ediciones
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

create policy "admin gestiona acceso_edicion" on public.acceso_edicion
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

create policy "admin gestiona cupones" on public.cupones
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

create policy "admin gestiona configuraciones" on public.configuraciones
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Admin: lectura de ventas y clientes (las escrituras las hace el backend)
create policy "admin lee clientes" on public.clientes
  for select to authenticated using (public.es_admin());

create policy "admin lee ordenes" on public.ordenes
  for select to authenticated using (public.es_admin());

create policy "admin lee pagos" on public.pagos
  for select to authenticated using (public.es_admin());

create policy "admin lee comprobantes" on public.comprobantes
  for select to authenticated using (public.es_admin());

create policy "admin lee canjes" on public.canjes_cupon
  for select to authenticated using (public.es_admin());

create policy "admin lee registro de correos" on public.registro_correos
  for select to authenticated using (public.es_admin());

-- Cada admin ve su propia fila
create policy "lee su propio usuario admin" on public.usuarios_admin
  for select to authenticated using (id = auth.uid());

-- eventos_webhook y acceso_edicion (para anon): sin políticas => solo la clave secreta

-- ---------------------------------------------------------------------
-- 16. Storage: bucket privado para comprobantes
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', false)
on conflict (id) do nothing;

-- Sin políticas para anon/authenticated: los archivos se sirven desde el
-- backend mediante URLs firmadas y temporales (createSignedUrl).

-- ---------------------------------------------------------------------
-- 17. Datos iniciales de ejemplo (opcional, editar o eliminar)
-- ---------------------------------------------------------------------
-- insert into public.configuraciones (clave, valor, es_publica) values
--   ('nombre_negocio', '"Nombre del negocio"', true),
--   ('whatsapp',       '"+51999999999"',       true),
--   ('red_tiktok',     '"https://tiktok.com/@usuario"', true),
--   ('plantilla_correo_confirmacion', '{"asunto":"Tu inscripción está confirmada"}', false);

-- insert into public.cursos (nombre, slug, descripcion, precio_pen, precio_usd)
-- values ('Masterclass de Decoración y Globos', 'masterclass-decoracion-globos',
--         'Incluye 7 cursos: globos, lettering, costos y presupuestos y más.', 150.00, 40.00);

-- ---------------------------------------------------------------------
-- 18. DIFERIDO: registro de auditoría
-- Con un solo admin no aporta valor todavía. Activar cuando haya más usuarios.
-- ---------------------------------------------------------------------
-- create table public.registro_auditoria (
--   id              bigint generated always as identity primary key,
--   usuario_admin_id uuid references public.usuarios_admin(id) on delete set null,
--   accion          text not null,
--   tipo_entidad    text,
--   entidad_id      uuid,
--   metadatos       jsonb,
--   direccion_ip    inet,
--   creado_en       timestamptz not null default now()
-- );
-- alter table public.registro_auditoria enable row level security;
-- create policy "admin lee auditoria" on public.registro_auditoria
--   for select to authenticated using (public.es_admin());

-- ---------------------------------------------------------------------
-- 19. PRUEBA OBLIGATORIA ANTES DE LANZAR (ejecutar con la clave publicable, no en el SQL Editor)
-- Todas estas consultas deben devolver vacío o error de permisos:
--   select * from ordenes;
--   select * from clientes;
--   select * from pagos;
--   select * from comprobantes;
--   select * from cupones;
--   select * from acceso_edicion;
--   select * from configuraciones where es_publica = false;
-- Y debe devolver datos:
--   select * from cursos;  select * from ediciones;  select * from configuraciones where es_publica;
-- ---------------------------------------------------------------------