"use client";
export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getSupabase } from "@/lib/supabaseClient";

// ============================================================================
// Utilitaire GPS : calcul de distance en mètres
// ============================================================================
function distanceMetres(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ============================================================================
// Hook : détection automatique de présence GPS
// ============================================================================
function useDetectionAutomatique(missions: any[], commercialId: string | null, onChange: () => void) {
  const dernierEtat = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!commercialId || !navigator.geolocation) return;
    const missionsAvecZone = missions.filter((m) => m.latitude && m.longitude);
    if (missionsAvecZone.length === 0) return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const supabase = getSupabase();
        for (const mission of missionsAvecZone) {
          const distance = distanceMetres(
            position.coords.latitude, position.coords.longitude,
            Number(mission.latitude), Number(mission.longitude)
          );
          const dansLaZone = distance <= (mission.rayon_metres ?? 200);
          const nouvelEtat = dansLaZone ? "actif" : "hors_zone";
          if (dernierEtat.current[mission.id] !== nouvelEtat) {
            dernierEtat.current[mission.id] = nouvelEtat;
            await supabase.from("activations").upsert({
              mission_id: mission.id,
              commercial_id: commercialId,
              date_jour: new Date().toISOString().slice(0, 10),
              heure_activation: dansLaZone ? new Date().toISOString() : null,
              statut: nouvelEtat,
            }, { onConflict: "mission_id,date_jour" });
            onChange();
          }
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [missions, commercialId]);
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
      demandeur: "commercial",
      motif,
    });
    if (error) { setErreur(error.message); setEnvoi(false); return; }
    onEnvoye();
  }

  return (
    <form onSubmit={envoyer} className="mt-3 bg-red-50/60 border border-red-100 rounded-xl p-3 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-bold text-rouille">Demande de résiliation</span>
        <button type="button" onClick={onFermer} className="text-xs text-slate-400">✕</button>
      </div>
      <textarea
        required
        placeholder="Précisez le motif…"
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
// Formulaire : Enregistrer une vente
// ============================================================================
function FormulaireVente({ missionId, onEnregistre }: { missionId: string; onEnregistre: () => void }) {
  const [produit, setProduit] = useState("");
  const [quantite, setQuantite] = useState("");
  const [montant, setMontant] = useState("");
  const [description, setDescription] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [ouvert, setOuvert] = useState(false);

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    const { error } = await getSupabase().from("activites").insert({
      mission_id: missionId,
      description,
      ventes_realisees: Number(montant),
      produit: produit || null,
      quantite_vendue: quantite ? Number(quantite) : null,
    });
    if (error) { setErreur(error.message); setEnvoi(false); return; }
    setProduit(""); setQuantite(""); setMontant(""); setDescription(""); setOuvert(false); setEnvoi(false);
    onEnregistre();
  }

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="mt-2 text-[11px] font-semibold text-[#0B2559] bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center gap-1"
      >
        <span>+</span> Enregistrer une vente
      </button>
    );
  }

  return (
    <form onSubmit={enregistrer} className="mt-2 bg-white border border-blue-100 rounded-xl p-3 space-y-2">
      <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
        <span className="text-[11px] font-bold text-encre">Nouvelle vente</span>
        <button type="button" onClick={() => setOuvert(false)} className="text-xs text-slate-400">✕</button>
      </div>
      <input
        placeholder="Produit vendu (ex : Pack Orange 4G)"
        value={produit}
        onChange={(e) => setProduit(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2559]"
      />
      <input
        type="number" step="1" placeholder="Quantité vendue"
        value={quantite}
        onChange={(e) => setQuantite(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2559]"
      />
      <input
        required type="number" step="0.01" placeholder="Montant (FCFA)"
        value={montant}
        onChange={(e) => setMontant(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2559]"
      />
      <input
        placeholder="Description (optionnel)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2559]"
      />
      {erreur && <p className="text-xs text-rouille">{erreur}</p>}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => setOuvert(false)}
          className="flex-1 bg-slate-100 text-slate-600 text-xs font-semibold py-2.5 rounded-lg hover:bg-slate-200 transition-colors"
        >
          Annuler
        </button>
        <button
          disabled={envoi}
          type="submit"
          className="flex-1 bg-vert text-white text-xs font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {envoi ? "Enregistrement…" : "Valider la vente"}
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// Page principale : Tableau de bord commercial
// ============================================================================
export default function TableauDeBordCommercial() {
  const [pret, setPret] = useState(false);
  const [commercialId, setCommercialId] = useState<string | null>(null);
  const [commercialNom, setCommercialNom] = useState("Mon espace");
  const [missions, setMissions] = useState<any[]>([]);
  const [activations, setActivations] = useState<Record<string, any>>({});
  const [rattachements, setRattachements] = useState<any[]>([]);
  const [totalCommissions, setTotalCommissions] = useState(0);
  const [resiliationOuverte, setResiliationOuverte] = useState<string | null>(null);
  const [menuProfilOuvert, setMenuProfilOuvert] = useState(false);
  const router = useRouter();

  async function charger() {
    const supabase = getSupabase();
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) { router.push("/login"); return; }

    const { data: profil } = await supabase
      .from("profils")
      .select("role, commercial_id, onboarding_termine, nom")
      .eq("id", session.session.user.id)
      .single();

    if (profil?.role !== "commercial" || !profil.commercial_id) { router.push("/login"); return; }
    if (profil.onboarding_termine === false) { router.push("/assistant"); return; }

    setCommercialId(profil.commercial_id);
    if (profil.nom) setCommercialNom(profil.nom);

    const aujourdhui = new Date().toISOString().slice(0, 10);
    const [m, r, a, comm] = await Promise.all([
      supabase
        .from("missions")
        .select("id, statut, service, latitude, longitude, rayon_metres, taux_commission, entreprises(nom)")
        .eq("commercial_id", profil.commercial_id),
      supabase
        .from("rattachements")
        .select("id, service, statut, date_debut, entreprises(nom)")
        .eq("commercial_id", profil.commercial_id),
      supabase
        .from("activations")
        .select("*")
        .eq("commercial_id", profil.commercial_id)
        .eq("date_jour", aujourdhui),
      supabase
        .from("commerciaux")
        .select("nom")
        .eq("id", profil.commercial_id)
        .maybeSingle(),
    ]);

    setMissions(m.data ?? []);
    setRattachements(r.data ?? []);

    const map: Record<string, any> = {};
    (a.data ?? []).forEach((act: any) => { map[act.mission_id] = act; });
    setActivations(map);

    if (comm.data?.nom && comm.data.nom !== "À compléter") {
      setCommercialNom(comm.data.nom);
    }

    const missionIds = (m.data ?? []).map((mi: any) => mi.id);
    if (missionIds.length > 0) {
      const { data: commissions } = await supabase
        .from("commissions")
        .select("montant_commission")
        .in("mission_id", missionIds);
      setTotalCommissions((commissions ?? []).reduce((t: number, c: any) => t + Number(c.montant_commission), 0));
    }

    setPret(true);
  }

  useEffect(() => { charger(); }, []);
  useDetectionAutomatique(missions, commercialId, charger);

  async function seDeconnecter() {
    await getSupabase().auth.signOut();
    router.push("/");
  }

  const missionsActives = missions.filter((m) => m.statut === "active");
  const rattachementsActifs = rattachements.filter((r) => r.statut === "actif");

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
            <Image
              src="/logo.png"
              alt="Voom Impulse"
              width={90}
              height={36}
              className="object-contain brightness-0 invert"
              priority
            />

            <div className="h-8 w-px bg-white/20 mx-1" />

            <div className="flex flex-col leading-tight">
              <span className="text-xs text-white/70 font-medium">Mon espace</span>
              <span className="text-sm font-bold text-white">commercial</span>
            </div>
          </div>

          {/* Avatar / profil commercial */}
          <div className="relative">
            <button
              onClick={() => setMenuProfilOuvert(!menuProfilOuvert)}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-full pl-1.5 pr-2.5 py-1 transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-white text-[#0B2559] flex items-center justify-center text-xs font-bold shadow-xs">
                🧑‍💼
              </div>
              <span className="text-[10px] text-white/70">▼</span>
            </button>

            {menuProfilOuvert && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-40 text-left">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-encre truncate">{commercialNom}</p>
                  <p className="text-[10px] text-slate-400">Compte Commercial</p>
                </div>
                <a
                  href="/assistant"
                  className="block px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                >
                  <span>Assistant Voom</span>
                  <span>🎧</span>
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
                📊
              </div>
              <div>
                <h2 className="font-bold text-sm text-encre">Résumé d'activité</h2>
                <p className="text-[11px] text-slate-400">Votre situation du moment</p>
              </div>
            </div>
            <span className="bg-blue-50 text-blue-900 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-blue-100">
              Aujourd'hui ▾
            </span>
          </div>

          {/* Grille des 3 indicateurs */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 mt-4 pt-3 border-t border-slate-100 text-center">
            <div className="px-2">
              <span className="text-[11px] text-slate-400 block font-medium">Rattachements</span>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="text-xl font-black text-encre font-display">
                  {rattachementsActifs.length}
                </span>
                <span className="text-xs text-blue-600">🤝</span>
              </div>
            </div>

            <div className="px-2">
              <span className="text-[11px] text-slate-400 block font-medium">Missions</span>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="text-xl font-black text-encre font-display">
                  {missionsActives.length}
                </span>
                <span className="text-xs text-blue-600">🎯</span>
              </div>
            </div>

            <div className="px-2">
              <span className="text-[11px] text-slate-400 block font-medium">Commissions</span>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="text-sm font-black text-vert font-display">
                  {totalCommissions > 0 ? totalCommissions.toLocaleString("fr-FR") : "—"}
                </span>
              </div>
              {totalCommissions > 0 && (
                <span className="text-[9px] text-slate-400">FCFA</span>
              )}
            </div>
          </div>
        </section>

        {/* CARTE GPS : Statut terrain du jour */}
        {missions.some((m) => m.latitude && m.longitude) && (
          <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-vert animate-pulse" />
                <h3 className="font-bold text-xs text-encre uppercase tracking-wider">
                  Détection terrain (GPS)
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Auto</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Laissez cette page ouverte — votre présence est détectée automatiquement.
            </p>
            <div className="divide-y divide-slate-100 mt-1">
              {missions.filter((m) => m.latitude && m.longitude).map((m) => {
                const activation = activations[m.id];
                return (
                  <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-encre">{m.entreprises?.nom ?? "Entreprise"}</span>
                    {activation?.statut === "actif" ? (
                      <span className="text-[11px] text-vert font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                        ✓ Actif ({new Date(activation.heure_activation).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })})
                      </span>
                    ) : activation?.statut === "hors_zone" ? (
                      <span className="text-[11px] text-ocre font-semibold bg-amber-50 px-2 py-0.5 rounded-full">
                        Hors zone
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
                        En attente…
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* CARTE 2 : Mes rattachements */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0B2559] text-white flex items-center justify-center text-sm shadow-xs">
                🤝
              </div>
              <div>
                <h2 className="font-bold text-sm text-encre">Mes rattachements</h2>
                <p className="text-[11px] text-slate-400">Vos entreprises partenaires.</p>
              </div>
            </div>
            <span className="text-slate-400 text-sm font-bold">›</span>
          </div>

          <div className="bg-[#F0F4FA] rounded-xl p-4">
            {rattachements.length === 0 ? (
              <div className="py-2 text-center">
                <p className="text-xs font-semibold text-blue-950 mb-3">
                  Aucun rattachement pour l'instant.
                </p>
                <a
                  href="/assistant"
                  className="bg-[#0B2559] hover:bg-[#12367d] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-xs transition-transform active:scale-95 inline-flex items-center gap-1.5"
                >
                  <span>Contacter l'assistant</span>
                </a>
              </div>
            ) : (
              <div className="divide-y divide-blue-200/50 text-left">
                {rattachements.map((r) => (
                  <div key={r.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-encre">
                        {r.entreprises?.nom ?? "Entreprise"}
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
                        onEnvoye={() => { setResiliationOuverte(null); charger(); }}
                        onFermer={() => setResiliationOuverte(null)}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CARTE 3 : Mes missions du jour */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0B2559] text-white flex items-center justify-center text-sm shadow-xs">
                🎯
              </div>
              <div>
                <h2 className="font-bold text-sm text-encre">Mes missions du jour</h2>
                <p className="text-[11px] text-slate-400">Vos missions en cours et à venir.</p>
              </div>
            </div>
          </div>

          <div className="bg-[#F0F4FA] rounded-xl p-4">
            {missions.length === 0 ? (
              <div className="flex items-center gap-3 text-left py-1">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-base shrink-0">
                  📋
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-950">Aucune mission pour l'instant.</p>
                  <p className="text-[11px] text-slate-500">Une entreprise doit vous affecter.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-blue-200/50">
                {missions.map((m) => {
                  const activation = activations[m.id];
                  return (
                    <div key={m.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-encre">
                            {m.entreprises?.nom ?? "Entreprise à confirmer"}
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

                      {/* Statut GPS de la mission */}
                      {m.latitude && m.longitude && (
                        <div className="mt-1.5">
                          {activation?.statut === "actif" ? (
                            <span className="text-[11px] text-vert font-semibold">
                              ✓ Présence détectée à {new Date(activation.heure_activation).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          ) : activation?.statut === "hors_zone" ? (
                            <span className="text-[11px] text-ocre font-semibold">
                              ⚠ Hors zone pour l'instant
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              En attente de détection GPS…
                            </span>
                          )}
                        </div>
                      )}

                      {/* Formulaire de vente si gestion complète */}
                      {m.service === "service_2_gestion_complete" && m.taux_commission && (
                        <FormulaireVente missionId={m.id} onEnregistre={charger} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* CARTE 4 : Assistant */}
        <a
          href="/assistant"
          className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between hover:border-blue-300 transition-all block group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
              🎧
            </div>
            <div>
              <h2 className="font-bold text-sm text-encre">Assistant Voom</h2>
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
            onClick={() => router.push("/espace-commercial/tableau-de-bord")}
            className="bg-[#0B2559] text-white rounded-xl px-4 py-1.5 flex flex-col items-center gap-0.5 shadow-xs"
          >
            <span className="text-base leading-none">🏠</span>
            <span className="text-[10px] font-bold">Accueil</span>
          </button>

          {/* Onglet 2 : Missions */}
          <button
            onClick={() => router.push("/espace-commercial/tableau-de-bord")}
            className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-[#0B2559] transition-colors py-1"
          >
            <span className="text-base leading-none">🎯</span>
            <span className="text-[10px] font-semibold">Missions</span>
          </button>

          {/* Onglet 3 : Assistant */}
          <a
            href="/assistant"
            className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-[#0B2559] transition-colors py-1"
          >
            <span className="text-base leading-none">🎧</span>
            <span className="text-[10px] font-semibold">Assistant</span>
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
