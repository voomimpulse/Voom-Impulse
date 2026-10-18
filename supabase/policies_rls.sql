-- ============================================================================
-- Policies RLS — Voom Impulse
-- À coller dans Supabase > SQL Editor, puis Run.
-- Idempotent : peut être relancé sans casser l'existant.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Colonne user_id (avec fallback auth.uid() par défaut)
--    Si la colonne existe déjà, ces ALTER sont sans effet.
-- ---------------------------------------------------------------------------
alter table public.entreprises
  add column if not exists user_id uuid
    references auth.users (id) on delete cascade
    default auth.uid();

alter table public.commerciaux
  add column if not exists user_id uuid
    references auth.users (id) on delete cascade
    default auth.uid();

-- ---------------------------------------------------------------------------
-- 0b. Fonction utilitaire : est-ce un admin ?
--     security definer = la peut lire même si RLS bloque profils.
-- ---------------------------------------------------------------------------
create or replace function public.est_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profils
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- 1. Activer RLS partout
-- ---------------------------------------------------------------------------
alter table public.entreprises enable row level security;
alter table public.commerciaux   enable row level security;
alter table public.profils       enable row level security;

-- ---------------------------------------------------------------------------
-- 2. Table ENTREPRISES
-- ---------------------------------------------------------------------------
drop policy if exists "entreprise_insere_sa_fiche" on public.entreprises;
create policy "entreprise_insere_sa_fiche"
  on public.entreprises for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "entreprise_lit_sa_fiche" on public.entreprises;
create policy "entreprise_lit_sa_fiche"
  on public.entreprises for select
  to authenticated
  using (user_id = auth.uid() or public.est_admin());

drop policy if exists "entreprise_modifie_sa_fiche" on public.entreprises;
create policy "entreprise_modifie_sa_fiche"
  on public.entreprises for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "admin_gere_entreprises" on public.entreprises;
create policy "admin_gere_entreprises"
  on public.entreprises for all
  to authenticated
  using (public.est_admin())
  with check (public.est_admin());

-- ---------------------------------------------------------------------------
-- 3. Table COMMERCIAUX  (l'inscription commerciale a le même pattern)
-- ---------------------------------------------------------------------------
drop policy if exists "commercial_insere_son_profil" on public.commerciaux;
create policy "commercial_insere_son_profil"
  on public.commerciaux for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "commercial_lit_son_profil" on public.commerciaux;
create policy "commercial_lit_son_profil"
  on public.commerciaux for select
  to authenticated
  using (user_id = auth.uid() or public.est_admin());

drop policy if exists "commercial_modifie_son_profil" on public.commerciaux;
create policy "commercial_modifie_son_profil"
  on public.commerciaux for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "admin_gere_commerciaux" on public.commerciaux;
create policy "admin_gere_commerciaux"
  on public.commerciaux for all
  to authenticated
  using (public.est_admin())
  with check (public.est_admin());

-- ---------------------------------------------------------------------------
-- 4. Table PROFILS
--    Chacun insère UNIQUEMENT son propre profil, avec un rôle de base
--    (jamais 'admin' — sinon n'importe qui pourrait s'auto-déclarer admin).
--    Le rôle admin est géré manuellement dans le dashboard.
--    Compatible avec les inscriptions existantes : les inserts de profil
--    dans app/espace-entreprise/page.tsx et app/espace-commercial/page.tsx
--    utilisent id = auth.user.id et role 'entreprise' / 'commercial'.
-- ---------------------------------------------------------------------------
drop policy if exists "utilisateur_insere_son_profil" on public.profils;
create policy "utilisateur_insere_son_profil"
  on public.profils for insert
  to authenticated
  with check (id = auth.uid() and role in ('entreprise', 'commercial'));

drop policy if exists "utilisateur_lit_son_profil" on public.profils;
create policy "utilisateur_lit_son_profil"
  on public.profils for select
  to authenticated
  using (id = auth.uid() or public.est_admin());

drop policy if exists "admin_gere_profils" on public.profils;
create policy "admin_gere_profils"
  on public.profils for all
  to authenticated
  using (public.est_admin())
  with check (public.est_admin());
