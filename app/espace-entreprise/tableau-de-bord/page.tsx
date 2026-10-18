"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";

// ============================================================================
// Formulaire : Nouvelle mission
// ============================================================================
function FormulaireNouvelleMission({
  entrepriseId,
  onCree,
  onFermer,
}: {
  entrepriseId: string;
  onCree: () => void;
  onFermer: () => void;
}) {
  const [service, setService] = useState("");
  const [tauxCommission, setTauxCommission] = useState("");
  const [objectifJournalier, setObjectifJournalier] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [rayon, setRayon] = useState("200");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  async function creer(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    const { error } = await getSupabase().from("missions").insert({
      entreprise_id: entrepriseId,
      commercial_id: null,
      service,
      taux_commission: tauxCommission ? Number(tauxCommission) : null,
      objectif_journalier: objectifJournalier || null,
      statut: "active",
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      rayon_metres: rayon ? Number(rayon) : 200,
    });
    if (error) {
      setErreur(error.message);
      setEnvoi(false);
      return;
    }
    onCree();
  }

  return (
    <form
      onSubmit={creer}
      className="bg-white border border-blue-100 rounded-xl p-4 space-y-3 shadow-xs my-3 text-left"
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <h3 className="text-xs font-bold text-encre uppercase tracking-wider">
          Créer une nouvelle mission
        </h3>
        <button
          type="button"
          onClick={onFermer}
          className="text-xs text-slate-400 hover:text-encre font-bold"
        >
          ✕
        </button>
      </div>

      <label className="block">
        <span className="text-xs font-medium text-slate-600">Type de collaboration</span>
        <select
          required
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2559]"
        >
          <option value="">Sélectionner…</option>
          <option value="service_1_mise_a_disposition">Mise à disposition</option>
          <option value="service_2_gestion_complete">Gestion complète</option>
        </select>
      </label>

      {service === "service_2_gestion_complete" && (
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Taux de commission proposé (%)</span>
          <input
            type="number"
            step="0.1"
            value={tauxCommission}
            onChange={(e) => setTauxCommission(e.target.value)}
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2559]"
          />
        </label>
      )}

      <label className="block">
        <span className="text-xs font-medium text-slate-600">Objectif journalier</span>
        <input
          value={objectifJournalier}
          onChange={(e) => setObjectifJournalier(e.target.value)}
          placeholder="Ex : 10 ventes / jour"
          className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2559]"
        />
      </label>

      <div className="pt-2 border-t border-slate-100">
        <p className="text-xs font-medium text-slate-600 mb-1.5">
          Zone de mission (pour l'auto-détection GPS)
        </p>
        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="Latitude (ex: 5.35)"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none"
          />
          <input
            placeholder="Longitude (ex: -4.01)"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none"
          />
        </div>
        <input
          placeholder="Rayon en mètres (défaut 200)"
          value={rayon}
          onChange={(e) => setRayon(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none mt-2"
        />
      </div>

      {erreur && <p className="text-xs text-rouille">{erreur}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onFermer}
          className="flex-1 bg-slate-100 text-slate-600 text-xs font-semibold py-2.5 rounded-lg hover:bg-slate-200 transition-colors"
        >
          Annuler
        </button>
        <button
          disabled={envoi}
          type="submit"
          className="flex-1 bg-[#0B2559] text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-[#12367d] transition-colors disabled:opacity-50"
        >
          {envoi ? "Envoi…" : "Créer la mission"}
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// Formulaire : Résiliation d'un rattachement
// ============================================================================
function FormulaireResiliation({
  rattachementId,
  onEnvoye,
  onFermer,
}: {
  rattachementId: string;
  onEnvoye: () => void;
  onFermer: () => void;
}) {
  const [motif, setMotif] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    const { error } = await getSupabase().from("demandes_resiliation").insert({
      rattachement_id: rattachementId,
      demandeur: "entreprise",
      motif,
    });
    if (error) {
      setErreur(error.message);
      setEnvoi(false);
      return;
    }
    onEnvoye();
  }

  return (
    <form onSubmit={envoyer} className="mt-3 bg-red-50/60 border border-red-100 rounded-xl p-3 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-bold text-rouille">Demande de résiliation</span>
        <button type="button" onClick={onFermer} className="text-xs text-slate-400">
          ✕
        </button>
      </div>
      <textarea
        required
        placeholder="Précisez le motif de la résiliation…"
        value={motif}
        onChange={(e) => setMotif(e.target.value)}
        rows={2}
        className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-xs focus:outline-none"
      />
      {erreur && <p className="text-xs text-rouille">{erreur}</p>}
      <button
        disabled={envoi}
        type="submit"
        className="text-xs font-semibold bg-rouille text-white px-3 py-1.5 rounded-lg hover:bg-rouille/90 transition-colors"
      >
        {envoi ? "Envoi…" : "Confirmer la résiliation"}
      </button>
    </form>
  );
}

// ============================================================================
// Page principale : Tableau de bord entreprise
// ============================================================================
export default function TableauDeBordEntreprise() {
  const [pret, setPret] = useState(false);
  const [entrepriseId, setEntrepriseId] = useState<string | null>(null);
  const [entrepriseNom, setEntrepriseNom] = useState<string>("Mon entreprise");
  const [missions, setMissions] = useState<any[]>([]);
  const [suivi, setSuivi] = useState<any[]>([]);
  const [factures, setFactures] = useState<any[]>([]);
  const [rattachements, setRattachements] = useState<any[]>([]);
  const [formOuvert, setFormOuvert] = useState(false);
  const [resiliationOuverte, setResiliationOuverte] = useState<string | null>(null);
  const [menuProfilOuvert, setMenuProfilOuvert] = useState(false);
  const router = useRouter();

  async function charger() {
    const supabase = getSupabase();
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      router.push("/login");
      return;
    }

    const { data: profil } = await supabase
      .from("profils")
      .select("role, entreprise_id, onboarding_termine, nom")
      .eq("id", session.session.user.id)
      .single();

    if (profil?.role !== "entreprise" || !profil.entreprise_id) {
      router.push("/login");
      return;
    }

    // Fiche non remplie : retour à l'assistant pour terminer l'inscription.
    if (profil.onboarding_termine === false) {
      router.push("/assistant");
      return;
    }

    setEntrepriseId(profil.entreprise_id);
    if (profil.nom) setEntrepriseNom(profil.nom);

    const aujourdhui = new Date().toISOString().slice(0, 10);
    const [m, f, r, e] = await Promise.all([
      supabase
        .from("missions")
        .select("id, statut, service, latitude, commerciaux(id, nom)")
        .eq("entreprise_id", profil.entreprise_id),
      supabase.from("factures").select("*").eq("entreprise_id", profil.entreprise_id),
      supabase
        .from("rattachements")
        .select("id, service, statut, date_debut, commerciaux(nom)")
        .eq("entreprise_id", profil.entreprise_id),
      supabase.from("entreprises").select("nom").eq("id", profil.entreprise_id).maybeSingle(),
    ]);

    setMissions(m.data ?? []);
    setFactures(f.data ?? []);
    setRattachements(r.data ?? []);
    if (e.data?.nom && e.data.nom !== "À compléter") {
      setEntrepriseNom(e.data.nom);
    }

    const missionsAvecZone = (m.data ?? []).filter((mi: any) => mi.latitude && mi.commerciaux);
    if (missionsAvecZone.length > 0) {
      const ids = missionsAvecZone.map((mi: any) => mi.id);
      const { data: activations } = await supabase
        .from("activations")
        .select("mission_id, statut, heure_activation")
        .in("mission_id", ids)
        .eq("date_jour", aujourdhui);
      const activationsParMission: Record<string, any> = {};
      (activations ?? []).forEach((a: any) => {
        activationsParMission[a.mission_id] = a;
      });
      setSuivi(
        missionsAvecZone.map((mi: any) => ({
          nom: mi.commerciaux.nom,
          activation: activationsParMission[mi.id] ?? null,
        }))
      );
    } else {
      setSuivi([]);
    }

    setPret(true);
  }

  useEffect(() => {
    charger();
  }, []);

  async function seDeconnecter() {
    await getSupabase().auth.signOut();
    router.push("/");
  }

  if (!pret) {
    return (
      <div className="min-h-screen bg-[#F5F8FC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-3 border-[#0B2559] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-[#0B2559]">Chargement de votre espace…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F8FC] flex flex-col pb-24 text-encre">
      {/* ==================================================================== */}
      {/* EN-TÊTE SUPÉRIEUR (Fond dégradé bleu profond)                         */}
      {/* ==================================================================== */}
      <header className="bg-gradient-to-b from-[#07183B] via-[#0B2559] to-[#0E357F] text-white px-5 pt-4 pb-8 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          {/* Logo et intitulé */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="font-display font-black text-xl tracking-wide text-white">
                  VOOM
                </span>
                <span className="text-xs font-bold text-ocre">↗</span>
              </div>
              <span className="text-[11px] font-bold tracking-widest text-ocre -mt-1">
                IMPULSE
              </span>
            </div>

            <div className="h-8 w-px bg-white/20 mx-1" />

            <div className="flex flex-col leading-tight">
              <span className="text-xs text-white/70 font-medium">Mon espace</span>
              <span className="text-sm font-bold text-white">entreprise</span>
            </div>
          </div>

          {/* Avatar / profil entreprise */}
          <div className="relative">
            <button
              onClick={() => setMenuProfilOuvert(!menuProfilOuvert)}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-full pl-1.5 pr-2.5 py-1 transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-white text-[#0B2559] flex items-center justify-center text-xs font-bold shadow-xs">
                🏢
              </div>
              <span className="text-[10px] text-white/70">▼</span>
            </button>

            {menuProfilOuvert && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-40 text-left">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-encre truncate">{entrepriseNom}</p>
                  <p className="text-[10px] text-slate-400">Compte Entreprise</p>
                </div>
                <a
                  href="/assistant"
                  className="block px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                >
                  <span>Assistant Voom</span>
                  <span>🎧</span>
                </a>
                <a
                  href="/espace-entreprise/stock"
                  className="block px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                >
                  <span>Gérer mes stocks</span>
                  <span>📦</span>
                </a>
                <a
                  href="/espace-entreprise/superviseurs"
                  className="block px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                >
                  <span>Mes superviseurs</span>
                  <span>👥</span>
                </a>
                <button
                  onClick={seDeconnecter}
                  className="w-full text-left px-3 py-2 text-xs text-rouille hover:bg-red-50 flex items-center justify-between border-t border-slate-100 mt-1"
                >
                  <span>Se déconnecter</span>
                  <span>🚪</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* CORPS PRINCIPAL : Cartes d'activité                                   */}
      {/* ==================================================================== */}
      <main className="max-w-lg mx-auto w-full px-4 -mt-4 space-y-3.5">
        {/* CARTE 1 : Résumé d'activité */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-xs">
                📈
              </div>
              <div>
                <h2 className="font-bold text-sm text-encre">Résumé d'activité</h2>
                <p className="text-[11px] text-slate-400">Une vue rapide de votre activité</p>
              </div>
            </div>

            <span className="bg-blue-50 text-blue-900 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-blue-100">
              Ce mois-ci ▾
            </span>
          </div>

          {/* Grille des 3 indicateurs */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 mt-4 pt-3 border-t border-slate-100 text-center">
            <div className="px-2">
              <span className="text-[11px] text-slate-400 block font-medium">Rattachements</span>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="text-xl font-black text-encre font-display">
                  {rattachements.length}
                </span>
                <span className="text-xs text-blue-600">👥</span>
              </div>
            </div>

            <div className="px-2">
              <span className="text-[11px] text-slate-400 block font-medium">Missions</span>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="text-xl font-black text-encre font-display">
                  {missions.length}
                </span>
                <span className="text-xs text-blue-600">🎯</span>
              </div>
            </div>

            <div className="px-2">
              <span className="text-[11px] text-slate-400 block font-medium">Factures</span>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="text-xl font-black text-encre font-display">
                  {factures.length}
                </span>
                <span className="text-xs text-blue-600">📄</span>
              </div>
            </div>
          </div>
        </section>

        {/* SUIVI DU JOUR (Présence GPS des commerciaux) si actif */}
        {suivi.length > 0 && (
          <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-vert animate-pulse" />
                <h3 className="font-bold text-xs text-encre uppercase tracking-wider">
                  Suivi terrain du jour
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">GPS actif</span>
            </div>
            <div className="divide-y divide-slate-100 mt-1">
              {suivi.map((s, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-encre">{s.nom}</span>
                  {s.activation?.statut === "actif" ? (
                    <span className="text-[11px] text-vert font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                      ✓ Actif ({new Date(s.activation.heure_activation).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })})
                    </span>
                  ) : s.activation?.statut === "hors_zone" ? (
                    <span className="text-[11px] text-ocre font-semibold bg-amber-50 px-2 py-0.5 rounded-full">
                      Hors zone
                    </span>
                  ) : (
                    <span className="text-[11px] text-rouille font-semibold bg-red-50 px-2 py-0.5 rounded-full">
                      Absent
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CARTE 2 : Mes rattachements */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0B2559] text-white flex items-center justify-center text-sm shadow-xs">
                👥
              </div>
              <div>
                <h2 className="font-bold text-sm text-encre">Mes rattachements</h2>
                <p className="text-[11px] text-slate-400">Consultez et gérez vos rattachements.</p>
              </div>
            </div>
            <span className="text-slate-400 text-sm font-bold">›</span>
          </div>

          {/* Boîte intérieure douce */}
          <div className="bg-[#F0F4FA] rounded-xl p-4 text-center">
            {rattachements.length === 0 ? (
              <div className="py-2">
                <p className="text-xs font-semibold text-blue-950 mb-3">
                  Aucun rattachement pour l'instant.
                </p>
                <button
                  onClick={() => router.push("/assistant")}
                  className="bg-[#0B2559] hover:bg-[#12367d] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-xs transition-transform active:scale-95 inline-flex items-center gap-1.5"
                >
                  <span>+</span>
                  <span>Ajouter un rattachement</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-blue-200/50 text-left">
                {rattachements.map((r) => (
                  <div key={r.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-encre">
                        {r.commerciaux?.nom ?? "Commercial"}
                      </span>
                      <span
                        className={
                          "text-[10px] font-bold px-2 py-0.5 rounded-full " +
                          (r.statut === "actif"
                            ? "bg-emerald-100 text-vert"
                            : "bg-slate-200 text-slate-600")
                        }
                      >
                        {r.statut}
                      </span>
                    </div>

                    {r.statut === "actif" && resiliationOuverte !== r.id && (
                      <button
                        onClick={() => setResiliationOuverte(r.id)}
                        className="text-[10px] text-rouille underline mt-1 font-medium hover:text-red-700"
                      >
                        Demander une résiliation
                      </button>
                    )}

                    {resiliationOuverte === r.id && (
                      <FormulaireResiliation
                        rattachementId={r.id}
                        onEnvoye={() => {
                          setResiliationOuverte(null);
                          charger();
                        }}
                        onFermer={() => setResiliationOuverte(null)}
                      />
                    )}
                  </div>
                ))}

                <div className="pt-3 text-center">
                  <button
                    onClick={() => router.push("/assistant")}
                    className="bg-[#0B2559] text-white text-xs font-semibold px-4 py-2 rounded-full inline-flex items-center gap-1 hover:bg-[#12367d]"
                  >
                    <span>+</span> Ajouter un rattachement
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* CARTE 3 : Mes missions */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0B2559] text-white flex items-center justify-center text-sm shadow-xs">
                🎯
              </div>
              <div>
                <h2 className="font-bold text-sm text-encre">Mes missions</h2>
                <p className="text-[11px] text-slate-400">Suivez vos missions en cours et à venir.</p>
              </div>
            </div>

            <button
              onClick={() => setFormOuvert(!formOuvert)}
              className="bg-[#0B2559] hover:bg-[#12367d] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-xs transition-colors shrink-0"
            >
              {formOuvert ? "Fermer" : "Nouvelle mission"}
            </button>
          </div>

          {/* Formulaire de création de mission */}
          {formOuvert && entrepriseId && (
            <FormulaireNouvelleMission
              entrepriseId={entrepriseId}
              onCree={() => {
                setFormOuvert(false);
                charger();
              }}
              onFermer={() => setFormOuvert(false)}
            />
          )}

          {/* Boîte intérieure missions */}
          <div className="bg-[#F0F4FA] rounded-xl p-4">
            {missions.length === 0 ? (
              <div className="flex items-center gap-3 text-left py-1">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-base shrink-0">
                  📋
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-950">Aucune mission pour l'instant.</p>
                  <p className="text-[11px] text-slate-500">Créez une mission pour commencer.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-blue-200/50">
                {missions.map((m) => (
                  <div key={m.id} className="py-2 first:pt-0 last:pb-0 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-encre">
                        {m.commerciaux?.nom ?? "En attente d'affectation"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {m.service === "service_1_mise_a_disposition"
                          ? "Mise à disposition"
                          : "Gestion complète"}
                      </p>
                    </div>
                    <span
                      className={
                        "text-[10px] font-bold px-2 py-0.5 rounded-full " +
                        (m.statut === "active"
                          ? "bg-emerald-100 text-vert"
                          : "bg-slate-200 text-slate-600")
                      }
                    >
                      {m.statut}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CARTE 4 : Mes factures */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0B2559] text-white flex items-center justify-center text-sm shadow-xs">
                📄
              </div>
              <div>
                <h2 className="font-bold text-sm text-encre">Mes factures</h2>
                <p className="text-[11px] text-slate-400">Accédez à vos factures facilement.</p>
              </div>
            </div>
            <span className="text-slate-400 text-sm font-bold">›</span>
          </div>

          <div className="bg-[#F0F4FA] rounded-xl p-4">
            {factures.length === 0 ? (
              <div className="flex items-center gap-3 text-left py-1">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-base shrink-0">
                  📑
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-950">Aucune facture pour l'instant.</p>
                  <p className="text-[11px] text-slate-500">Vos factures apparaîtront ici.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-blue-200/50">
                {factures.map((f) => (
                  <div key={f.id} className="py-2 first:pt-0 last:pb-0 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-encre">
                        {Number(f.montant).toLocaleString("fr-FR")} FCFA
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {f.date_echeance ? `Échéance : ${f.date_echeance}` : "Facture"}
                      </p>
                    </div>
                    <span
                      className={
                        "text-[10px] font-bold px-2 py-0.5 rounded-full " +
                        (f.statut === "payee"
                          ? "bg-emerald-100 text-vert"
                          : f.statut === "en_retard"
                          ? "bg-red-100 text-rouille"
                          : "bg-amber-100 text-ocre")
                      }
                    >
                      {f.statut}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CARTE 5 : Assistant */}
        <a
          href="/assistant"
          className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between hover:border-blue-300 transition-all block group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
              🎧
            </div>
            <div>
              <h2 className="font-bold text-sm text-encre">Assistant</h2>
              <p className="text-[11px] text-slate-400">
                Besoin d'aide ? Notre assistant est là pour vous guider.
              </p>
            </div>
          </div>
          <span className="text-slate-400 text-sm font-bold group-hover:text-blue-900 group-hover:translate-x-0.5 transition-all">
            ›
          </span>
        </a>
      </main>

      {/* ==================================================================== */}
      {/* BARRE DE NAVIGATION INFÉRIEURE FIXE                                  */}
      {/* ==================================================================== */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/80 px-4 py-2 z-30 shadow-lg">
        <div className="max-w-lg mx-auto flex items-center justify-around">
          {/* Onglet 1 : Accueil (Actif) */}
          <button
            onClick={() => router.push("/espace-entreprise/tableau-de-bord")}
            className="bg-[#0B2559] text-white rounded-xl px-4 py-1.5 flex flex-col items-center gap-0.5 shadow-xs"
          >
            <span className="text-base leading-none">🏠</span>
            <span className="text-[10px] font-bold">Accueil</span>
          </button>

          {/* Onglet 2 : Stocks */}
          <a
            href="/espace-entreprise/stock"
            className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-[#0B2559] transition-colors py-1"
          >
            <span className="text-base leading-none">📦</span>
            <span className="text-[10px] font-semibold">Stocks</span>
          </a>

          {/* Onglet 3 : Superviseurs */}
          <a
            href="/espace-entreprise/superviseurs"
            className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-[#0B2559] transition-colors py-1"
          >
            <span className="text-base leading-none">👥</span>
            <span className="text-[10px] font-semibold">Superviseurs</span>
          </a>

          {/* Onglet 4 : Déconnexion */}
          <button
            onClick={seDeconnecter}
            className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-rouille transition-colors py-1"
          >
            <span className="text-base leading-none">🚪</span>
            <span className="text-[10px] font-semibold">Déconnexion</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
