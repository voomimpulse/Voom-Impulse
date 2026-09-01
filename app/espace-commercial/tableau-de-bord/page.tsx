"use client";
export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";

function FormulaireResiliation({ rattachementId, onEnvoye }: { rattachementId: string; onEnvoye: () => void }) {
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
    <form onSubmit={envoyer} className="mt-3 space-y-2">
      <textarea required placeholder="Motif de votre demande (ex : autre offre, désaccord...)" value={motif} onChange={(e) => setMotif(e.target.value)} rows={2}
        className="w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
      {erreur && <p className="text-xs text-rouille">{erreur}</p>}
      <button disabled={envoi} className="text-xs bg-rouille text-white px-3 py-1.5 rounded-sm">
        {envoi ? "Envoi…" : "Envoyer ma demande"}
      </button>
    </form>
  );
}

function distanceMetres(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
    return <button onClick={() => setOuvert(true)} className="text-xs text-encre underline mt-1">Enregistrer une vente</button>;
  }

  return (
    <form onSubmit={enregistrer} className="mt-2 space-y-2 bg-ivoire border border-ardoise/10 rounded-sm p-3">
      <input placeholder="Produit vendu (ex : Pack Orange 4G)" value={produit} onChange={(e) => setProduit(e.target.value)}
        className="w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
      <input type="number" step="1" placeholder="Quantité vendue" value={quantite} onChange={(e) => setQuantite(e.target.value)}
        className="w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
      <input required type="number" step="0.01" placeholder="Montant vendu (FCFA)" value={montant} onChange={(e) => setMontant(e.target.value)}
        className="w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
      <input placeholder="Description (optionnel)" value={description} onChange={(e) => setDescription(e.target.value)}
        className="w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
      {erreur && <p className="text-xs text-rouille">{erreur}</p>}
      <button disabled={envoi} className="w-full bg-vert text-white text-xs px-3 py-2 rounded-sm">
        {envoi ? "Enregistrement…" : "Valider la vente"}
      </button>
    </form>
  );
}

export default function TableauDeBordCommercial() {
  const [pret, setPret] = useState(false);
  const [commercialId, setCommercialId] = useState<string | null>(null);
  const [missions, setMissions] = useState<any[]>([]);
  const [activations, setActivations] = useState<Record<string, any>>({});
  const [rattachements, setRattachements] = useState<any[]>([]);
  const [totalCommissions, setTotalCommissions] = useState(0);
  const [resiliationOuverte, setResiliationOuverte] = useState<string | null>(null);
  const router = useRouter();

  async function charger() {
    const supabase = getSupabase();
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) { router.push("/login"); return; }

    const { data: profil } = await supabase.from("profils").select("role, commercial_id").eq("id", session.session.user.id).single();
    if (profil?.role !== "commercial" || !profil.commercial_id) { router.push("/login"); return; }

    setCommercialId(profil.commercial_id);
    const aujourdhui = new Date().toISOString().slice(0, 10);
    const [m, r, a] = await Promise.all([
      supabase.from("missions").select("id, statut, service, latitude, longitude, rayon_metres, taux_commission, entreprises(nom)").eq("commercial_id", profil.commercial_id),
      supabase.from("rattachements").select("id, service, statut, date_debut, entreprises(nom)").eq("commercial_id", profil.commercial_id),
      supabase.from("activations").select("*").eq("commercial_id", profil.commercial_id).eq("date_jour", aujourdhui),
    ]);
    setMissions(m.data ?? []);
    setRattachements(r.data ?? []);
    const map: Record<string, any> = {};
    (a.data ?? []).forEach((act: any) => { map[act.mission_id] = act; });
    setActivations(map);

    const missionIds = (m.data ?? []).map((mi: any) => mi.id);
    if (missionIds.length > 0) {
      const { data: commissions } = await supabase.from("commissions").select("montant_commission").in("mission_id", missionIds);
      setTotalCommissions((commissions ?? []).reduce((t: number, c: any) => t + Number(c.montant_commission), 0));
    }

    setPret(true);
  }

  useEffect(() => { charger(); }, []);
  useDetectionAutomatique(missions, commercialId, charger);

  if (!pret) return <div className="min-h-screen flex items-center justify-center text-sm text-ardoise/50">Chargement…</div>;

  return (
    <div className="min-h-screen bg-ivoire px-5 py-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl text-encre">Mon espace commercial</h1>
        <button onClick={async () => { await getSupabase().auth.signOut(); router.push("/"); }} className="text-xs text-ardoise/50">
          Se déconnecter
        </button>
      </div>

      <p className="text-xs text-ardoise/40 mt-2">
        Laissez cette page ouverte sur le terrain — votre présence est détectée automatiquement.
      </p>

      {totalCommissions > 0 && (
        <div className="bg-encre rounded-sm p-4 mt-6">
          <p className="text-xs text-white/60">Total commissions cumulées</p>
          <p className="text-2xl font-display text-white mt-1">{totalCommissions.toLocaleString("fr-FR")} FCFA</p>
        </div>
      )}

      <h2 className="text-sm font-medium text-ardoise/60 mt-8">Mes rattachements</h2>
      <div className="mt-3 bg-white border border-ardoise/10 rounded-sm divide-y divide-ardoise/10">
        {rattachements.length === 0 && <p className="px-4 py-4 text-sm text-ardoise/40">Aucun rattachement pour l'instant.</p>}
        {rattachements.map((r) => (
          <div key={r.id} className="px-4 py-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">{r.entreprises?.nom ?? "—"}</span>
              <span className={"text-xs " + (r.statut === "actif" ? "text-vert" : "text-ardoise/40")}>{r.statut}</span>
            </div>
            {r.statut === "actif" && resiliationOuverte !== r.id && (
              <button onClick={() => setResiliationOuverte(r.id)} className="text-xs text-rouille mt-1">Demander à quitter ce rattachement</button>
            )}
            {resiliationOuverte === r.id && (
              <FormulaireResiliation rattachementId={r.id} onEnvoye={() => { setResiliationOuverte(null); charger(); }} />
            )}
          </div>
        ))}
      </div>

      <h2 className="text-sm font-medium text-ardoise/60 mt-6">Mes missions du jour</h2>
      <div className="mt-3 bg-white border border-ardoise/10 rounded-sm divide-y divide-ardoise/10">
        {missions.length === 0 && <p className="px-4 py-4 text-sm text-ardoise/40">Aucune mission pour l'instant.</p>}
        {missions.map((m) => {
          const activation = activations[m.id];
          return (
            <div key={m.id} className="px-4 py-3">
              <div className="flex justify-between text-sm">
                <span>{m.entreprises?.nom ?? "Entreprise à confirmer"}</span>
                <span className="text-ardoise/50">{m.statut}</span>
              </div>
              {m.latitude && m.longitude && (
                <p className="text-xs mt-1">
                  {activation?.statut === "actif" ? (
                    <span className="text-vert">
                      Actif depuis {new Date(activation.heure_activation).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} (détecté automatiquement)
                    </span>
                  ) : activation?.statut === "hors_zone" ? (
                    <span className="text-ocre">Hors zone pour l'instant</span>
                  ) : (
                    <span className="text-ardoise/40">En attente de détection…</span>
                  )}
                </p>
              )}
              {m.service === "service_2_gestion_complete" && m.taux_commission && (
                <FormulaireVente missionId={m.id} onEnregistre={charger} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
