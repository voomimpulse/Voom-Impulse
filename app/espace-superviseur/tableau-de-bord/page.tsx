"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";

function FormulaireMission({ entrepriseId, rattaches, onCree }: {
  entrepriseId: string; rattaches: any[]; onCree: () => void;
}) {
  const [commercialId, setCommercialId] = useState("");
  const [objectif, setObjectif] = useState("");
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
      commercial_id: commercialId,
      service: "service_1_mise_a_disposition",
      objectif_journalier: objectif || null,
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
        <span className="text-xs text-ardoise/60">Commercial</span>
        <select required value={commercialId} onChange={(e) => setCommercialId(e.target.value)}
          className="mt-1 w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm">
          <option value="">Sélectionner…</option>
          {rattaches.map((r) => (
            <option key={r.id} value={r.commercial_id}>{r.commerciaux?.nom ?? "—"}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-xs text-ardoise/60">Objectif du jour</span>
        <input value={objectif} onChange={(e) => setObjectif(e.target.value)}
          className="mt-1 w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
      </label>
      <div className="pt-2 border-t border-ardoise/10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-ardoise/60">Zone de mission (pour l'auto-détection)</p>
          <button type="button" onClick={() => {
            navigator.geolocation.getCurrentPosition((pos) => {
              setLatitude(String(pos.coords.latitude));
              setLongitude(String(pos.coords.longitude));
            });
          }} className="text-xs text-ocre underline shrink-0">
            Utiliser ma position actuelle
          </button>
        </div>
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
        {envoi ? "Création…" : "Créer la mission"}
      </button>
    </form>
  );
}

export default function TableauDeBordSuperviseur() {
  const [pret, setPret] = useState(false);
  const [entrepriseId, setEntrepriseId] = useState<string | null>(null);
  const [nomEntreprise, setNomEntreprise] = useState("");
  const [nomSuperviseur, setNomSuperviseur] = useState("");
  const [rattaches, setRattaches] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [suivi, setSuivi] = useState<any[]>([]);
  const [joursActifs, setJoursActifs] = useState<Record<string, number>>({});
  const [formOuvert, setFormOuvert] = useState(false);
  const router = useRouter();

  async function charger() {
    const supabase = getSupabase();
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) { router.push("/login"); return; }

    const { data: profil } = await supabase
      .from("profils").select("role, entreprise_id, nom").eq("id", session.session.user.id).single();
    if (profil?.role !== "superviseur" || !profil.entreprise_id) { router.push("/login"); return; }

    setEntrepriseId(profil.entreprise_id);
    setNomSuperviseur(profil.nom ?? "");
    const { data: entreprise } = await supabase.from("entreprises").select("nom").eq("id", profil.entreprise_id).single();
    setNomEntreprise(entreprise?.nom ?? "");

    const aujourdhui = new Date().toISOString().slice(0, 10);
    const il30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

    const [r, m, a] = await Promise.all([
      supabase.from("rattachements")
        .select("id, statut, date_debut, commercial_id, commerciaux(nom)")
        .eq("entreprise_id", profil.entreprise_id)
        .eq("service", "service_1_mise_a_disposition")
        .eq("statut", "actif"),
      supabase.from("missions")
        .select("id, statut, objectif_journalier, latitude, commercial_id, commerciaux(nom)")
        .eq("entreprise_id", profil.entreprise_id)
        .eq("service", "service_1_mise_a_disposition")
        .order("created_at", { ascending: false }),
      supabase.from("activations")
        .select("mission_id, commercial_id, statut, heure_activation, date_jour")
        .gte("date_jour", il30),
    ]);

    const rattachesData = r.data ?? [];
    const missionsData = m.data ?? [];
    const activations = a.data ?? [];
    setRattaches(rattachesData);
    setMissions(missionsData);

    const duJour: Record<string, any> = {};
    activations.forEach((act: any) => { if (act.date_jour === aujourdhui) duJour[act.mission_id] = act; });
    setSuivi(
      missionsData
        .filter((mi: any) => mi.latitude && mi.commercial_id)
        .map((mi: any) => ({ nom: mi.commerciaux?.nom ?? "—", activation: duJour[mi.id] ?? null }))
    );

    const jours: Record<string, Set<string>> = {};
    activations.forEach((act: any) => {
      if (act.statut === "actif") {
        if (!jours[act.commercial_id]) jours[act.commercial_id] = new Set();
        jours[act.commercial_id].add(act.date_jour);
      }
    });
    const compte: Record<string, number> = {};
    Object.keys(jours).forEach((cle) => { compte[cle] = jours[cle].size; });
    setJoursActifs(compte);

    setPret(true);
  }

  useEffect(() => { charger(); }, []);

  if (!pret) return <div className="min-h-screen flex items-center justify-center text-sm text-ardoise/50">Chargement…</div>;

  return (
    <div className="min-h-screen bg-ivoire px-5 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl text-encre">Espace superviseur</h1>
          <p className="text-xs text-ardoise/50 mt-1">{nomSuperviseur}{nomEntreprise ? ` · ${nomEntreprise}` : ""}</p>
        </div>
        <button onClick={async () => { await getSupabase().auth.signOut(); router.push("/"); }} className="text-xs text-ardoise/50">
          Se déconnecter
        </button>
      </div>

      <h2 className="text-sm font-medium text-ardoise/60 mt-8">Suivi du jour</h2>
      <div className="mt-3 bg-white border border-ardoise/10 rounded-sm divide-y divide-ardoise/10">
        {suivi.length === 0 && <p className="px-4 py-4 text-sm text-ardoise/40">Aucune mission avec zone GPS pour l'instant.</p>}
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

      <h2 className="text-sm font-medium text-ardoise/60 mt-8">Mes commerciaux (30 derniers jours)</h2>
      <div className="mt-3 bg-white border border-ardoise/10 rounded-sm divide-y divide-ardoise/10">
        {rattaches.length === 0 && <p className="px-4 py-4 text-sm text-ardoise/40">Aucun commercial rattaché pour l'instant.</p>}
        {rattaches.map((r) => (
          <div key={r.id} className="px-4 py-3 flex items-center justify-between text-sm">
            <span>{r.commerciaux?.nom ?? "—"}</span>
            <span className="text-xs text-ardoise/50">{joursActifs[r.commercial_id] ?? 0} jour(s) actif(s)</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-8">
        <h2 className="text-sm font-medium text-ardoise/60">Missions</h2>
        <button onClick={() => setFormOuvert(!formOuvert)} className="text-xs bg-encre text-white px-3 py-1.5 rounded-sm">
          {formOuvert ? "Fermer" : "Nouvelle mission"}
        </button>
      </div>

      {formOuvert && entrepriseId && (
        <FormulaireMission entrepriseId={entrepriseId} rattaches={rattaches} onCree={() => { setFormOuvert(false); charger(); }} />
      )}

      <div className="mt-3 bg-white border border-ardoise/10 rounded-sm divide-y divide-ardoise/10">
        {missions.length === 0 && <p className="px-4 py-4 text-sm text-ardoise/40">Aucune mission pour l'instant.</p>}
        {missions.map((m) => (
          <div key={m.id} className="px-4 py-3 text-sm flex justify-between">
            <div>
              <span>{m.commerciaux?.nom ?? "—"}</span>
              {m.objectif_journalier && <p className="text-xs text-ardoise/50 mt-0.5">{m.objectif_journalier}</p>}
            </div>
            <span className="text-ardoise/50">{m.statut}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
