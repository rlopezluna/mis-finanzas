-- =====================================================================
-- Mis finanzas: base de datos en Supabase
-- Pega TODO este archivo en Supabase → SQL Editor → New query → Run.
-- Se puede ejecutar varias veces sin problema.
-- =====================================================================

-- Esquema privado: lo que está aquí NO se expone por la API de Supabase
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;  -- solo para que las reglas (RLS) puedan usar la función auxiliar

-- Datos de cada usuario: 'loan' (préstamo) y 'budget' (presupuesto, gastos, ahorro, deudas)
create table if not exists public.app_state (
  user_id    uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  key        text        not null check (key in ('loan', 'budget')),
  value      jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key),
  constraint app_state_tamano check (pg_column_size(value) < 300000)
);
alter table public.app_state drop constraint if exists app_state_objeto;
alter table public.app_state add constraint app_state_objeto check (jsonb_typeof(value) = 'object');

-- La hora de cada guardado ("t", en milisegundos) la pone el servidor, no el dispositivo:
-- así un celular con el reloj mal no puede ganarle a cambios más nuevos. Siempre avanza.
create or replace function private.sellar_hora()
returns trigger language plpgsql set search_path = '' as $$
declare ahora bigint := floor(extract(epoch from clock_timestamp()) * 1000);
begin
  if tg_op = 'UPDATE' and (old.value->>'t') ~ '^[0-9]+(\.[0-9]+)?$' then
    ahora := greatest(ahora, floor((old.value->>'t')::numeric)::bigint + 1);
  end if;
  new.value := jsonb_set(new.value, '{t}', to_jsonb(ahora));
  new.updated_at := now();
  return new;
end $$;
revoke all on function private.sellar_hora() from public, anon, authenticated;
drop trigger if exists app_state_sellar_hora on public.app_state;
create trigger app_state_sellar_hora before insert or update on public.app_state
  for each row execute function private.sellar_hora();

-- Invitados: el invitado (viewer) ve y edita el préstamo del dueño (owner)
create table if not exists public.shares (
  viewer_id  uuid primary key references auth.users(id) on delete cascade,
  owner_id   uuid not null    references auth.users(id) on delete cascade,
  owner_name text
);
create index if not exists shares_owner_id_idx on public.shares (owner_id);

alter table public.app_state enable row level security;
alter table public.shares    enable row level security;

revoke all on public.app_state, public.shares from anon;
revoke delete, truncate, references, trigger on public.app_state, public.shares from authenticated;
grant select, insert, update on public.app_state to authenticated;
grant select on public.shares to authenticated;
revoke insert, update on public.shares from authenticated;

-- ¿El usuario actual es invitado del dueño "o"? (privada, solo la usan las reglas)
create or replace function private.es_invitado_de(o uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.shares s where s.viewer_id = (select auth.uid()) and s.owner_id = o);
$$;
revoke all on function private.es_invitado_de(uuid) from public, anon;
grant execute on function private.es_invitado_de(uuid) to authenticated;

-- Reglas de seguridad (RLS): cada quien solo ve lo suyo; el invitado solo el préstamo de su dueño
drop policy if exists "leer propios" on public.app_state;
drop policy if exists "crear propios" on public.app_state;
drop policy if exists "editar propios" on public.app_state;
drop policy if exists "ver mi invitacion" on public.shares;

create policy "leer propios" on public.app_state for select to authenticated
  using (user_id = (select auth.uid()) or (key = 'loan' and private.es_invitado_de(user_id)));

create policy "crear propios" on public.app_state for insert to authenticated
  with check (user_id = (select auth.uid()) or (key = 'loan' and private.es_invitado_de(user_id)));

create policy "editar propios" on public.app_state for update to authenticated
  using      (user_id = (select auth.uid()) or (key = 'loan' and private.es_invitado_de(user_id)))
  with check (user_id = (select auth.uid()) or (key = 'loan' and private.es_invitado_de(user_id)));

create policy "ver mi invitacion" on public.shares for select to authenticated
  using (viewer_id = (select auth.uid()));

-- Versiones anteriores de este archivo creaban funciones en "public"; se quitan
drop function if exists public.es_invitado_de(uuid) cascade;
drop function if exists public.hacer_invitado(text, text);
drop function if exists public.quitar_invitado(text);
drop function if exists public.restablecer_password(text, text);
drop function if exists public.usuarios();

-- Botón "Eliminar mi cuenta" de la app (borra también a sus invitados).
-- Es la única función pública: la app la llama por la API.
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := (select auth.uid());
begin
  if me is null then raise exception 'no autorizado'; end if;
  delete from auth.users where id in (select viewer_id from public.shares where owner_id = me);
  delete from auth.users where id = me;
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ---------------------------------------------------------------------
-- Compartir en vivo: enlaces de solo lectura (sin cuenta) para el préstamo,
-- una deuda o una cuenta de saldo (vales, efectivo, débito).
-- ---------------------------------------------------------------------
create table if not exists public.shared_views (
  token      text primary key check (token ~ '^[A-Za-z0-9]{24,64}$'),
  owner_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item       text not null check (item ~ '^(loan|acct:[ved]|debt:[A-Za-z0-9_-]{1,40})$'),
  label      text check (length(label) <= 80),
  created_at timestamptz not null default now(),
  unique (owner_id, item)
);
alter table public.shared_views enable row level security;
revoke all on public.shared_views from anon;
grant select, insert, delete on public.shared_views to authenticated;

drop policy if exists "mis enlaces: ver" on public.shared_views;
drop policy if exists "mis enlaces: crear" on public.shared_views;
drop policy if exists "mis enlaces: borrar" on public.shared_views;
create policy "mis enlaces: ver"    on public.shared_views for select to authenticated using (owner_id = (select auth.uid()));
create policy "mis enlaces: crear"  on public.shared_views for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "mis enlaces: borrar" on public.shared_views for delete to authenticated using (owner_id = (select auth.uid()));

-- Lo que ve quien abre el enlace. Solo devuelve lo compartido y nunca las notas de los pagos.
create or replace function public.ver_compartido(t text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare s public.shared_views; v jsonb; b jsonb; d jsonb; m text; upd timestamptz;
begin
  if t is null or t !~ '^[A-Za-z0-9]{24,64}$' then return null; end if;
  select * into s from public.shared_views where token = t;
  if not found then return null; end if;

  if s.item = 'loan' then
    select value, updated_at into v, upd from public.app_state where user_id = s.owner_id and key = 'loan';
    if v is null then return null; end if;
    v := v || jsonb_build_object('pay', coalesce((select jsonb_agg(p - 'n' order by o)
           from jsonb_array_elements(coalesce(v->'pay', '[]'::jsonb)) with ordinality as x(p, o)), '[]'::jsonb));
  else
    select value, updated_at into b, upd from public.app_state where user_id = s.owner_id and key = 'budget';
    if b is null then return null; end if;
    if s.item like 'debt:%' then
      select x into d from jsonb_array_elements(coalesce(b->'debts', '[]'::jsonb)) x where x->>'id' = substr(s.item, 6) limit 1;
      if d is null then return null; end if;
      v := d || jsonb_build_object('pay', coalesce((select jsonb_agg(p - 'n' order by o)
             from jsonb_array_elements(coalesce(d->'pay', '[]'::jsonb)) with ordinality as y(p, o)), '[]'::jsonb));
    else
      -- Solo los datos de la cuenta compartida: nunca saldos ni fechas de las otras cuentas
      m := substr(s.item, 6);
      v := jsonb_build_object('m', m) || case m
        when 'v' then jsonb_build_object('vIni', b->'vIni', 'vDate', b->'vDate', 'vAmt', b->'vAmt')
        when 'e' then jsonb_build_object('cIni', b->'cIni', 'cDate', b->'cDate')
        when 'd' then jsonb_build_object('dIni', b->'dIni', 'dDate', b->'dDate')
        else '{}'::jsonb end || jsonb_build_object(
        'exp', coalesce((select jsonb_agg(jsonb_build_object('m', e->'m', 'a', e->'a', 'd', e->'d', 'n', e->'n', 'c', e->'c'))
                 from jsonb_array_elements(coalesce(b->'exp', '[]'::jsonb)) e where e->>'m' = m), '[]'::jsonb),
        'inc', coalesce((select jsonb_agg(jsonb_build_object('m', e->'m', 'a', e->'a', 'd', e->'d', 'n', e->'n'))
                 from jsonb_array_elements(coalesce(b->'inc', '[]'::jsonb)) e where e->>'m' = m), '[]'::jsonb));
    end if;
  end if;

  return jsonb_build_object('item', s.item, 'label', s.label, 'at', upd, 'data', v,
    'owner', (select replace(u.email, '@mis-finanzas.app', '') from auth.users u where u.id = s.owner_id));
end $$;
revoke all on function public.ver_compartido(text) from public;
grant execute on function public.ver_compartido(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Herramientas de administración: viven en el esquema privado y SOLO
-- se usan desde el SQL Editor de Supabase.
-- ---------------------------------------------------------------------

-- Convierte la cuenta "invitado" en invitada de "dueno" (ambas cuentas deben existir).
-- Ejemplo:  select private.hacer_invitado('mama', 'rafa');
create or replace function private.hacer_invitado(invitado text, dueno text)
returns text language plpgsql security definer set search_path = '' as $$
declare v uuid; o uuid;
begin
  select id into v from auth.users where email = lower(invitado) || '@mis-finanzas.app';
  select id into o from auth.users where email = lower(dueno)    || '@mis-finanzas.app';
  if v is null then raise exception 'No existe el usuario %. Primero crea su cuenta desde la app.', invitado; end if;
  if o is null then raise exception 'No existe el usuario %.', dueno; end if;
  if v = o then raise exception 'Una cuenta no puede ser invitada de sí misma.'; end if;
  insert into public.shares (viewer_id, owner_id, owner_name) values (v, o, lower(dueno))
    on conflict (viewer_id) do update set owner_id = excluded.owner_id, owner_name = excluded.owner_name;
  return lower(invitado) || ' ahora ve y edita el préstamo de ' || lower(dueno);
end $$;

-- Quita el permiso de invitado.  Ejemplo:  select private.quitar_invitado('mama');
create or replace function private.quitar_invitado(invitado text)
returns text language plpgsql security definer set search_path = '' as $$
begin
  delete from public.shares where viewer_id = (select id from auth.users where email = lower(invitado) || '@mis-finanzas.app');
  return 'Listo';
end $$;

-- Restablece una contraseña olvidada.  Ejemplo:  select private.restablecer_password('rafa', 'NuevaClave123');
create or replace function private.restablecer_password(usuario text, nueva text)
returns text language plpgsql security definer set search_path = '' as $$
declare u uuid;
begin
  if length(nueva) < 8 then raise exception 'La contraseña debe tener al menos 8 caracteres'; end if;
  select id into u from auth.users where email = lower(usuario) || '@mis-finanzas.app';
  if u is null then raise exception 'No existe el usuario %', usuario; end if;
  update auth.users set encrypted_password = extensions.crypt(nueva, extensions.gen_salt('bf')) where id = u;
  delete from auth.sessions where user_id = u;
  return 'Contraseña cambiada para ' || lower(usuario);
end $$;

-- Lista de cuentas.  Ejemplo:  select * from private.usuarios();
create or replace function private.usuarios()
returns table (usuario text, creado timestamptz, ultimo_acceso timestamptz, invitado_de text)
language sql security definer set search_path = '' as $$
  select replace(u.email, '@mis-finanzas.app', ''), u.created_at, u.last_sign_in_at, s.owner_name
  from auth.users u left join public.shares s on s.viewer_id = u.id
  order by u.created_at;
$$;

revoke all on function private.hacer_invitado(text, text)       from public, anon, authenticated;
revoke all on function private.quitar_invitado(text)            from public, anon, authenticated;
revoke all on function private.restablecer_password(text, text) from public, anon, authenticated;
revoke all on function private.usuarios()                       from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Atajo de iPhone: una llave por cuenta que SOLO permite agregar gastos o
-- ingresos (no deja leer nada). Se guarda cifrada (sha256); la llave completa
-- se muestra una sola vez al crearla. Borrarla corta el acceso al instante.
-- ---------------------------------------------------------------------
create table if not exists public.atajo_llaves (
  owner_id   uuid primary key references auth.users(id) on delete cascade,
  hash       text not null unique,
  pista      text not null,
  created_at timestamptz not null default now(),
  last_used  timestamptz
);
alter table public.atajo_llaves enable row level security;
revoke all on public.atajo_llaves from public, anon, authenticated;  -- solo se usa con las funciones de abajo

-- Crea (o reemplaza) la llave de la cuenta actual y la devuelve una sola vez
create or replace function public.crear_llave_atajo()
returns text language plpgsql volatile security definer set search_path = '' as $$
declare me uuid := (select auth.uid()); k text;
begin
  if me is null then raise exception 'no autorizado'; end if;
  if exists (select 1 from public.shares where viewer_id = me) then raise exception 'Las cuentas invitadas no pueden usar el atajo'; end if;
  k := 'mf_' || substr(translate(encode(extensions.gen_random_bytes(36), 'base64'), '+/=', ''), 1, 40);
  insert into public.atajo_llaves (owner_id, hash, pista) values (me, encode(extensions.digest(k, 'sha256'), 'hex'), right(k, 4))
    on conflict (owner_id) do update set hash = excluded.hash, pista = excluded.pista, created_at = now(), last_used = null;
  return k;
end $$;

create or replace function public.borrar_llave_atajo()
returns void language sql volatile security definer set search_path = '' as $$
  delete from public.atajo_llaves where owner_id = (select auth.uid());
$$;

create or replace function public.estado_llave_atajo()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('pista', pista, 'creada', created_at, 'usada', last_used)
  from public.atajo_llaves where owner_id = (select auth.uid());
$$;

-- Formas de pago activas de un presupuesto, en orden v, e, c, d. Sin elección guardada = las cuatro.
create or replace function private.metodos_activos(b jsonb)
returns text[] language sql immutable set search_path = '' as $$
  select coalesce(nullif(array(select x from unnest(array['v','e','c','d']) x
    where jsonb_typeof(b->'methods') <> 'array' or (b->'methods') ? x), '{}'), array['v','e','c','d']);
$$;
create or replace function private.nombres_metodos(ms text[], sep text default ', ')
returns text language sql immutable set search_path = '' as $$
  select string_agg(case x when 'v' then 'Vales' when 'e' then 'Efectivo' when 'c' then 'Crédito' else 'Débito' end, sep order by array_position(array['v','e','c','d'], x))
  from unnest(ms) x;
$$;
revoke all on function private.metodos_activos(jsonb) from public, anon, authenticated;
revoke all on function private.nombres_metodos(text[], text) from public, anon, authenticated;

-- La usa el atajo al abrirse: la lista de formas de pago de quien tiene la llave, para "Elegir de la lista".
-- Solo devuelve nombres de métodos. Con una llave no válida devuelve las cuatro: el error claro lo da registrar_por_atajo.
create or replace function public.metodos_atajo(llave text, tipo text default 'gasto')
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare o uuid; b jsonb; usa text[] := array['v','e','c','d'];
begin
  if llave ~ '^mf_[A-Za-z0-9]{30,60}$' then
    select owner_id into o from public.atajo_llaves where hash = encode(extensions.digest(llave, 'sha256'), 'hex');
    if o is not null then
      select value into b from public.app_state where user_id = o and key = 'budget';
      if b is not null then usa := private.metodos_activos(b); end if;
    end if;
  end if;
  if lower(coalesce(tipo, '')) = 'ingreso' then
    usa := array(select x from unnest(usa) x where x in ('e','d'));
    if cardinality(usa) = 0 then usa := array['e','d']; end if;
  end if;
  return jsonb_build_object('metodos', to_jsonb(string_to_array(private.nombres_metodos(usa, '|'), '|')));
end $$;

-- La usa el atajo: agrega un gasto (o ingreso) con la fecha de hoy en hora de México.
-- Nunca devuelve datos de la cuenta; solo un mensaje para la notificación.
create or replace function public.registrar_por_atajo(llave text, monto numeric, metodo text,
  concepto text default '', tipo text default 'gasto', categoria text default 'Otro')
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare o uuid; m text; t text; a numeric; c text; n text; f text; mov jsonb; campo text; b jsonb; usa text[];
begin
  if llave is null or llave !~ '^mf_[A-Za-z0-9]{30,60}$' then
    return jsonb_build_object('ok', false, 'mensaje', 'Llave no válida. Revisa el atajo.');
  end if;
  select owner_id into o from public.atajo_llaves where hash = encode(extensions.digest(llave, 'sha256'), 'hex');
  if o is null then return jsonb_build_object('ok', false, 'mensaje', 'Esta llave ya no funciona. Crea una nueva en la app.'); end if;

  t := case lower(coalesce(tipo, 'gasto')) when 'ingreso' then 'ingreso' else 'gasto' end;
  m := case lower(translate(trim(coalesce(metodo, '')), 'ÉéÍíÁá', 'eeiiaa'))
         when 'v' then 'v' when 'vales' then 'v'
         when 'e' then 'e' when 'efectivo' then 'e'
         when 'c' then 'c' when 'credito' then 'c' when 'tarjeta de credito' then 'c'
         when 'd' then 'd' when 'debito' then 'd' when 'tarjeta de debito' then 'd'
         else null end;
  if m is null or (t = 'ingreso' and m not in ('e', 'd')) then
    return jsonb_build_object('ok', false, 'mensaje', case when t = 'ingreso' then 'Elige Efectivo o Débito.' else 'Elige Vales, Efectivo, Crédito o Débito.' end);
  end if;
  -- Solo las formas de pago que el usuario activó en la app (Más > Cuenta > Métodos de pago)
  select value into b from public.app_state where user_id = o and key = 'budget';
  if b is null then return jsonb_build_object('ok', false, 'mensaje', 'Abre la app una vez antes de usar el atajo.'); end if;
  usa := private.metodos_activos(b);
  if not (m = any(usa)) then
    return jsonb_build_object('ok', false, 'mensaje', 'No tienes ' ||
      case m when 'v' then 'vales activados' when 'e' then 'efectivo activado' when 'c' then 'crédito activado' else 'débito activado' end ||
      '. Elige ' || private.nombres_metodos(case when t = 'ingreso' then array(select x from unnest(usa) x where x in ('e','d')) else usa end, ' o ') || '.');
  end if;
  a := round(coalesce(monto, 0), 2);
  if a <= 0 or a >= 10000000 then return jsonb_build_object('ok', false, 'mensaje', 'Escribe un monto mayor a cero.'); end if;
  n := left(trim(coalesce(concepto, '')), 120);
  c := case when categoria in ('Comida','Transporte','Casa','Salud','Ropa','Entretenimiento','Otro') then categoria else 'Otro' end;
  f := to_char((now() at time zone 'America/Mexico_City')::date, 'YYYY-MM-DD');

  if t = 'gasto' then mov := jsonb_build_object('n', n, 'a', a, 'd', f, 'm', m, 'c', c); campo := 'exp';
  else mov := jsonb_build_object('m', m, 'a', a, 'd', f, 'n', n); campo := 'inc'; end if;

  update public.app_state
     set value = jsonb_set(value, array[campo], coalesce(value->campo, '[]'::jsonb) || jsonb_build_array(mov))
   where user_id = o and key = 'budget';
  update public.atajo_llaves set last_used = now() where owner_id = o;

  return jsonb_build_object('ok', true, 'mensaje',
    case when t = 'gasto' then 'Gasto' else 'Ingreso' end || ' de $' || to_char(a, 'FM999,999,990.00') || ' guardado (' ||
    case m when 'v' then 'vales' when 'e' then 'efectivo' when 'c' then 'crédito' else 'débito' end || ').');
end $$;

revoke all on function public.crear_llave_atajo()  from public, anon;
revoke all on function public.borrar_llave_atajo() from public, anon;
revoke all on function public.estado_llave_atajo() from public, anon;
grant execute on function public.crear_llave_atajo()  to authenticated;
grant execute on function public.borrar_llave_atajo() to authenticated;
grant execute on function public.estado_llave_atajo() to authenticated;
revoke all on function public.metodos_atajo(text, text) from public;
grant execute on function public.metodos_atajo(text, text) to anon, authenticated;
revoke all on function public.registrar_por_atajo(text, numeric, text, text, text, text) from public;
grant execute on function public.registrar_por_atajo(text, numeric, text, text, text, text) to anon, authenticated;
