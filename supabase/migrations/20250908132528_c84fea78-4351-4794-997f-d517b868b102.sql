
-- 1) Backfill de perfiles faltantes para usuarios que ya tienen inscripciones
insert into public.profiles (id, first_name, last_name, email, created_at, updated_at)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data->>'first_name',''), 'Usuario') as first_name,
  coalesce(nullif(u.raw_user_meta_data->>'last_name',''), 'Desconocido') as last_name,
  coalesce(u.email, concat(u.id::text, '@example.local')) as email,
  now(), now()
from auth.users u
where exists (select 1 from public.inscriptions i where i.user_id = u.id)
  and not exists (select 1 from public.profiles p where p.id = u.id);

-- 2) Foreign keys principales en inscriptions
alter table public.inscriptions
  add constraint inscriptions_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.inscriptions
  add constraint inscriptions_inscription_period_id_fkey
  foreign key (inscription_period_id) references public.inscription_periods(id) on delete cascade;

alter table public.inscriptions
  add constraint inscriptions_target_position_type_id_fkey
  foreign key (target_position_type_id) references public.position_types(id) on delete set null;

-- 3) Foreign keys en tablas de selecciones
alter table public.inscription_subject_selections
  add constraint iss_inscription_id_fkey
  foreign key (inscription_id) references public.inscriptions(id) on delete cascade,
  add constraint iss_subject_id_fkey
  foreign key (subject_id) references public.subjects(id) on delete cascade;

alter table public.inscription_position_selections
  add constraint ips_inscription_id_fkey
  foreign key (inscription_id) references public.inscriptions(id) on delete cascade,
  add constraint ips_admin_pos_id_fkey
  foreign key (administrative_position_id) references public.administrative_positions(id) on delete cascade;

-- 4) Índices para rendimiento
create index if not exists idx_inscriptions_user_id on public.inscriptions (user_id);
create index if not exists idx_inscriptions_inscription_period_id on public.inscriptions (inscription_period_id);
create index if not exists idx_iss_inscription_id on public.inscription_subject_selections (inscription_id);
create index if not exists idx_ips_inscription_id on public.inscription_position_selections (inscription_id);
