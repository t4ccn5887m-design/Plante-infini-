-- =============================================================================
-- Wilder Pro — pro_appointments (RDV planifiés dans l’app)
-- À coller dans : Supabase → SQL Editor → Run
-- Idempotent. Ne touche PAS submit_pro_brief / pro_briefs / analyses…
-- =============================================================================

create table if not exists public.pro_appointments (
  id            uuid primary key default gen_random_uuid(),
  studio_id     uuid not null references public.pro_studios (id) on delete cascade,
  link_id       uuid not null references public.pro_links (id) on delete cascade,
  starts_at     timestamptz not null,
  duration_min  integer not null default 60
                check (duration_min > 0 and duration_min <= 24 * 60),
  notes         text not null default '',
  created_at    timestamptz not null default now()
);

create index if not exists pro_appointments_studio_starts_idx
  on public.pro_appointments (studio_id, starts_at);

create index if not exists pro_appointments_link_id_idx
  on public.pro_appointments (link_id);

alter table public.pro_appointments enable row level security;

grant select, insert, update, delete on table public.pro_appointments to authenticated;
revoke all on table public.pro_appointments from anon;

drop policy if exists "pro_appointments_select_own" on public.pro_appointments;
create policy "pro_appointments_select_own"
  on public.pro_appointments for select to authenticated
  using (
    exists (
      select 1 from public.pro_studios s
      where s.id = studio_id and s.pro_user_id = auth.uid()
    )
  );

drop policy if exists "pro_appointments_insert_own" on public.pro_appointments;
create policy "pro_appointments_insert_own"
  on public.pro_appointments for insert to authenticated
  with check (
    exists (
      select 1 from public.pro_studios s
      where s.id = studio_id and s.pro_user_id = auth.uid()
    )
  );

drop policy if exists "pro_appointments_update_own" on public.pro_appointments;
create policy "pro_appointments_update_own"
  on public.pro_appointments for update to authenticated
  using (
    exists (
      select 1 from public.pro_studios s
      where s.id = studio_id and s.pro_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.pro_studios s
      where s.id = studio_id and s.pro_user_id = auth.uid()
    )
  );

drop policy if exists "pro_appointments_delete_own" on public.pro_appointments;
create policy "pro_appointments_delete_own"
  on public.pro_appointments for delete to authenticated
  using (
    exists (
      select 1 from public.pro_studios s
      where s.id = studio_id and s.pro_user_id = auth.uid()
    )
  );

notify pgrst, 'reload schema';
