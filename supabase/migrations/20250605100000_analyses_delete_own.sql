-- Suppression de ses propres découvertes
drop policy if exists "analyses_delete_own" on public.analyses;

create policy "analyses_delete_own"
on public.analyses for delete
to authenticated
using (auth.uid() = user_id);

notify pgrst, 'reload schema';
