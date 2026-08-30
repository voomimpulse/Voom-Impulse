"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";

function FormulaireNouvelleMission({ entrepriseId, onCree }: { entrepriseId: string; onCree: () => void }) {
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
    if (error) { setErreur(error.message); setEnvoi(false); return; }
    onCree();
  }

  return (
    <form onSubmit={creer} className="bg-white border border-ardoise/10 rounded-sm p-5 space-y-3 mt-4">
      <label className="block">
        <span className="text-xs text-ardoise/60">Type de collaboration</span>
        <select required value={service} onChange={(e) => setService(e.target.value)}
          className="mt-1 w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm">
          <option value="">Sélectionner…</option>
          <option value="service_1_mise_a_disposition">Mise à disposition</option>
          <option value="service_2_gestion_complete">Gestion complète</option>
        </select>
      </label>
      {service === "service_2_gestion_complete" && (
        <label className="block">
          <span className="text-xs text-ardoise/60">Taux de commission proposé (%)</span>
          <input type="number" step="0.1" value={tauxCommission} onChange={(e) => setTauxCommission(e.target.value)}
            className="mt-1 w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
        </label>
      )}
      <label className="block">
        <span className="text-xs text-ardoise/60">Objectif journalier</span>
        <input value={objectifJournalier} onChange={(e) => setObjectifJournalier(e.target.value)}
          className="mt-1 w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
      </label>
      <div className="pt-2 border-t border-ardoise/10">
        <p className="text-xs text-ardoise/60 mb-2">Zone de mission (pour l'auto-détection)</p>
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Latitude" value={latitude} onChange={(e) => setLatitude(e.target.value)}
            className="w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
          <input placeholder="Longitude" value={longitude} onChange={(e) => setLongitude(e.target.value)}
            className="w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
        </div>
        <input placeholder="Rayon en mètres (défaut 200)" value={rayon} onChange={(e) => setRayon(e.target.value)}
          className="w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm mt-3" />
      </div>
      {erreur && <p className="text-xs text-rouille">{erreur}</p>}
      <button disabled={envoi} className="w-full bg-encre text-white text-sm px-4 py-2.5 rounded-sm">
        {envoi ? "Envoi…" : "Envoyer la demande de mission"}
      </button>
    </form>
  );
}

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
      demandeur: "entreprise",
      motif,
    });
    if (error) { setErreur(error.message); setEnvoi(false); return; }
    onEnvoye();
  }

  return (
    <form onSubmit={envoyer} className="mt-3 space-y-2">
      <textarea required placeholder="Motif de la demande de résiliation" value={motif} onChange={(e) => setMotif(e.target.value)} rows={2}
        className="w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
      {erreur && <p className="text-xs text-rouille">{erreur}</p>}
      <button disabled={envoi} className="text-xs bg-rouille text-white px-3 py-1.5 rounded-sm">
        {envoi ? "Envoi…" : "Envoyer la demande de résiliation"}
      </button>
    </form>
  );
}

export default function TableauDeBordEntreprise() {
  const [pret, setPret] = useState(false);
  const [entrepriseId, setEntrepriseId] = useState<string | null>(null);
  const [missions, setMissions] = useState<any[]>([]);
  const [suivi, setSuivi] = useState<any[]>([]);
  const [factures, setFactures] = useState<any[]>([]);
  const [rattachements, setRattachements] = useState<any[]>([]);
  const [formOuvert, setFormOuvert] = useState(false);
  const [resiliationOuverte, setResiliationOuverte] = useState<string | null>(null);
  const router = useRouter();

  async function charger() {
    const supabase = getSupabase();
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) { router.push("/login"); return; }

    const { data: profil } = await supabase.from("profils").select("role, entreprise_id").eq("id", session.session.user.id).single();
    if (profil?.role !== "entreprise" || !profil.entreprise_id) { router.push("/login"); return; }

    setEntrepriseId(profil.entreprise_id);
    const aujourdhui = new Date().toISOString().slice(0, 10);
    const [m, f, r] = await Promise.all([
      supabase.from("missions").select("id, statut, service, latitude, commerciaux(id, nom)").eq("entreprise_id", profil.entreprise_id),
      supabase.from("factures").select("*").eq("entreprise_id", profil.entreprise_id),
      supabase.from("rattachements").select("id, service, statut, date_debut, commerciaux(nom)").eq("entreprise_id", profil.entreprise_id),
    ]);
    setMissions(m.data ?? []);
    setFactures(f.data ?? []);
    setRattachements(r.data ?? []);

    const missionsAvecZone = (m.data ?? []).filter((mi: any) => mi.latitude && mi.commerciaux);
    if (missionsAvecZone.length > 0) {
      const ids = missionsAvecZone.map((mi: any) => mi.id);
      const { data: activations } = await supabase.from("activations").select("mission_id, statut, heure_activation").in("mission_id", ids).eq("date_jour", aujourdhui);
      const activationsParMission: Record<string, any> = {};
      (activations ?? []).forEach((a: any) => { activationsParMission[a.mission_id] = a; });
      setSuivi(missionsAvecZone.map((mi: any) => ({
        nom: mi.commerciaux.nom,
        activation: activationsParMission[mi.id] ?? null,
      })));
    } else {
      setSuivi([]);
    }

    setPret(true);
  }

  useEffect(() => { charger(); }, []);

  if (!pret) return <div className="min-h-screen flex items-center justify-center text-sm text-ardoise/50">Chargement…</div>;

  return (
    <div className="min-h-screen bg-ivoire px-5 py-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl text-encre">Mon espace entreprise</h1>
        <button onClick={async () => { await getSupabase().auth.signOut(); router.push("/"); }} className="text-xs text-ardoise/50">
          Se déconnecter
        </button>
      </div>

      {suivi.length > 0 && (
        <>
          <h2 className="text-sm font-medium text-ardoise/60 mt-8">Suivi du jour</h2>
          <div className="mt-3 bg-white border border-ardoise/10 rounded-sm divide-y divide-ardoise/10">
            {suivi.map((s, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between text-sm">
                <span>{s.nom}</span>
                {s.activation?.statut === "actif" ? (
                  <span className="text-xs text-vert">
                    Actif depuis {new Date(s.activation.heure_activation).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                ) : s.activation?.statut === "hors_zone" ? (
                  <span className="text-xs text-ocre">Hors zone</span>
                ) : (
                  <span className="text-xs text-rouille">Absent</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="text-sm font-medium text-ardoise/60 mt-8">Mes rattachements</h2>
      <div className="mt-3 bg-white border border-ardoise/10 rounded-sm divide-y divide-ardoise/10">
        {rattachements.length === 0 && <p className="px-4 py-4 text-sm text-ardoise/40">Aucun rattachement pour l'instant.</p>}
        {rattachements.map((r) => (
          <div key={r.id} className="px-4 py-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">{r.commerciaux?.nom ?? "—"}</span>
              <span className={"text-xs " + (r.statut === "actif" ? "text-vert" : "text-ardoise/40")}>{r.statut}</span>
            </div>
            {r.statut === "actif" && resiliationOuverte !== r.id && (
              <button onClick={() => setResiliationOuverte(r.id)} className="text-xs text-rouille mt-1">
                Demander une résiliation
              </button>
            )}
            {resiliationOuverte === r.id && (
              <FormulaireResiliation rattachementId={r.id} onEnvoye={() => { setResiliationOuverte(null); charger(); }} />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-8">
        <h2 className="text-sm font-medium text-ardoise/60">Mes missions</h2>
        <button onClick={() => setFormOuvert(!formOuvert)} className="text-xs bg-encre text-white px-3 py-1.5 rounded-sm">
          {formOuvert ? "Fermer" : "Nouvelle mission"}
        </button>
      </div>

      {formOuvert && entrepriseId && (
        <FormulaireNouvelleMission entrepriseId={entrepriseId} onCree={() => { setFormOuvert(false); charger(); }} />
      )}

      <div className="mt-3 bg-white border border-ardoise/10 rounded-sm divide-y divide-ardoise/10">
        {missions.length === 0 && <p className="px-4 py-4 text-sm text-ardoise/40">Aucune mission pour l'instant.</p>}
        {missions.map((m) => (
          <div key={m.id} className="px-4 py-3 text-sm flex justify-between">
            <span>{m.commerciaux?.nom ?? "En attente d'affectation"}</span>
            <span className="text-ardoise/50">{m.statut}</span>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-medium text-ardoise/60 mt-6">Mes factures</h2>
      <div className="mt-3 bg-white border border-ardoise/10 rounded-sm divide-y divide-ardoise/10">
        {factures.length === 0 && <p className="px-4 py-4 text-sm text-ardoise/40">Aucune facture pour l'instant.</p>}
        {factures.map((f) => (
          <div key={f.id} className="px-4 py-3 text-sm flex justify-between">
            <span>{Number(f.montant).toLocaleString("fr-FR")} FCFA</span>
            <span className="text-ardoise/50">{f.statut}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
