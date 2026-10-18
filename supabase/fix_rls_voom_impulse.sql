-- ===========================================================================
--  VOOM IMPULSE — RLS définitif + réparation des comptes orphelins
--  À exécuter dans Supabase Dashboard → SQL Editor (idempotent, peut être
--  relancé sans danger).
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. TABLE « entreprises »
-- ---------------------------------------------------------------------------
alter table public.entreprises enable row level security;

-- Lecture publique (page /entreprises) + lectures pour les joins côté app.
drop policy if exists "entreprises_select_public" on public.entreprises;
create policy "entreprises_select_public"
  on public.entreprises for select
  to anon, authenticated
  using (true);

-- Création : uniquement l'utilisateur connecté, pour sa propre entreprise.
drop policy if exists "entreprises_insert_proprietaire" on public.entreprises;
create policy "entreprises_insert_proprietaire"
  on public.entreprises for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Modification : propriétaire ou admin.
drop policy if exists "entreprises_update_proprietaire_ou_admin" on public.entreprises;
create policy "entreprises_update_proprietaire_ou_admin"
  on public.entreprises for update
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profils p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    auth.uid() = user_id
    or exists (
      select 1 from public.profils p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Suppression : admin uniquement.
drop policy if exists "entreprises_delete_admin" on public.entreprises;
create policy "entreprises_delete_admin"
  on public.entreprises for delete
  to authenticated
  using (
    exists (
      select 1 from public.profils p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- 2. TABLE « profils » — indispensable : le login et les dashboards lisent la
--    ligne du profil, et la sous-requête admin d'entreprises s'y réfère.
-- ---------------------------------------------------------------------------
alter table public.profils enable row level security;

-- Chacun lit son propre profil.
drop policy if exists "profils_select_proprietaire" on public.profils;
create policy "profils_select_proprietaire"
  on public.profils for select
  to authenticated
  using (auth.uid() = id);

-- Chacun insère son propre profil (auto-réparation au login incluse).
drop policy if exists "profils_insert_proprietaire" on public.profils;
create policy "profils_insert_proprietaire"
  on public.profils for insert
  to authenticated
  with check (auth.uid() = id);

-- Chacun modifie son propre profil (ajustements futurs du role, etc.).
drop policy if exists "profils_update_proprietaire" on public.profils;
create policy "profils_update_proprietaire"
  on public.profils for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 3. TABLE « commerciaux » — l'inscription commercial n'a pas de colonne
--    user_id : l'insert est policy « authenticated » simple ; les lectures
--    servent aux joins (missions, rattachements, admin).
-- ---------------------------------------------------------------------------
alter table public.commerciaux enable row level security;

drop policy if exists "commerciaux_select_authenticated" on public.commerciaux;
create policy "commerciaux_select_authenticated"
  on public.commerciaux for select
  to authenticated
  using (true);

drop policy if exists "commerciaux_insert_authenticated" on public.commerciaux;
create policy "commerciaux_insert_authenticated"
  on public.commerciaux for insert
  to authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- 4. RÉPARATION DES DONNÉES : comptes créés avant le fix (utilisateurs
--    présents dans auth.users sans ligne dans profils). On recrée le profil
--    depuis la fiche entreprise liée par user_id.
-- ---------------------------------------------------------------------------
insert into public.profils (id, role, entreprise_id)
select e.user_id, 'entreprise'::role_utilisateur, e.id
from public.entreprises e
where e.user_id is not null
  and not exists (select 1 from public.profils p where p.id = e.user_id)
on conflict (id) do nothing;

-- Contrôle : combien de comptes auth n'ont toujours pas de profil ?
-- Ces comptes-là devront être recréés via le formulaire d'inscription.
-- select au.id
-- from auth.users au
-- left join public.profils p on p.id = au.id
-- where p.id is null and au.last_sign_in_at is null;
