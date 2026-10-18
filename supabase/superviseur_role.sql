-- ============================================================================
-- VOOM IMPULSE — Rôle « superviseur »
-- À coller dans Supabase Dashboard → SQL Editor, puis Run.
-- Idempotent : peut être relancé sans casser l'existant.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Ajouter « superviseur » à l'enum des rôles
--    ⚠ Si Supabase signale « ALTER TYPE ... cannot run inside a transaction »,
--    cocher « Run as separate statements » (ou exécuter cette ligne seule).
-- ---------------------------------------------------------------------------
alter type role_utilisateur add value if not exists 'superviseur' after 'commercial';

-- ---------------------------------------------------------------------------
-- 2. Fonction utilitaire : est-ce un superviseur de cette entreprise ?
-- ---------------------------------------------------------------------------
create or replace function public.est_superviseur_de(entreprise uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profils p
    where p.id = auth.uid()
      and p.role = 'superviseur'
      and p.entreprise_id = est_superviseur_de.entreprise
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. RLS — le superviseur lit et crée les missions de SON entreprise
--    (Service 1 : mise à disposition uniquement)
-- ---------------------------------------------------------------------------
drop policy if exists "superviseur_lit_missions_entreprise" on public.missions;
create policy "superviseur_lit_missions_entreprise"
  on public.missions for select
  to authenticated
  using (
    service = 'service_1_mise_a_disposition'
    and public.est_superviseur_de(entreprise_id)
  );

drop policy if exists "superviseur_cree_missions_entreprise" on public.missions;
create policy "superviseur_cree_missions_entreprise"
  on public.missions for insert
  to authenticated
  with check (
    service = 'service_1_mise_a_disposition'
    and public.est_superviseur_de(entreprise_id)
  );

-- ---------------------------------------------------------------------------
-- 4. RLS — le superviseur lit les rattachements de SON entreprise (Service 1)
-- ---------------------------------------------------------------------------
drop policy if exists "superviseur_lit_rattachements_entreprise" on public.rattachements;
create policy "superviseur_lit_rattachements_entreprise"
  on public.rattachements for select
  to authenticated
  using (
    service = 'service_1_mise_a_disposition'
    and public.est_superviseur_de(entreprise_id)
  );

-- ---------------------------------------------------------------------------
-- 5. RLS — le superviseur lit les activations des commerciaux de SON entreprise
--    Contient mission_id et commercial_id ; missions et commerciaux sont
--    déjà filtrables par lui, on joint côté application.
-- ---------------------------------------------------------------------------
drop policy if exists "superviseur_lit_activations_entreprise" on public.activations;
create policy "superviseur_lit_activations_entreprise"
  on public.activations for select
  to authenticated
  using (
    public.est_superviseur_de(
      (select mission.entreprise_id from public.missions mission
       where mission.id = activations.mission_id)
    )
  );
