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
      m := substr(s.item, 6);
      v := jsonb_build_object('m', m,
        'cIni', b->'cIni', 'cDate', b->'cDate', 'dIni', b->'dIni', 'dDate', b->'dDate',
        'vIni', b->'vIni', 'vDate', b->'vDate', 'vAmt', b->'vAmt',
        'exp', coalesce((select jsonb_agg(e) from jsonb_array_elements(coalesce(b->'exp', '[]'::jsonb)) e where e->>'m' = m), '[]'::jsonb),
        'inc', coalesce((select jsonb_agg(e) from jsonb_array_elements(coalesce(b->'inc', '[]'::jsonb)) e where e->>'m' = m), '[]'::jsonb));
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
