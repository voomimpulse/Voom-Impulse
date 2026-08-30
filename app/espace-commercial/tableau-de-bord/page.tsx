"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
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

// Distance entre 2 points GPS en mètres (formule de Haversine)
function distanceMetres(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function BoutonActivation({ mission, commercialId, activation, onActive }: {
  mission: any; commercialId: string; activation: any; onActive: () => void;
}) {
  const [verification, setVerification] = useState(false);
  const [message, setMessage] = useState("");

  function verifierPresence() {
    if (!navigator.geolocation) {
      setMessage("Localisation non disponible sur cet appareil.");
      return;
    }
    setVerification(true);
    setMessage("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const distance = distanceMetres(
          position.coords.latitude, position.coords.longitude,
          Number(mission.latitude), Number(mission.longitude)
        );
        const dansLaZone = distance <= (mission.rayon_metres ?? 200);
        const supabase = getSupabase();
        await supabase.from("activations").upsert({
          mission_id: mission.id,
          commercial_id: commercialId,
          date_jour: new Date().toISOString().slice(0, 10),
          heure_activation: dansLaZone ? new Date().toISOString() : null,
          statut: dansLaZone ? "actif" : "hors_zone",
        }, { onConflict: "mission_id,date_jour" });
        setMessage(dansLaZone
          ? "Présence confirmée — vous êtes bien dans la zone."
          : `Vous êtes à ${Math.round(distance)} m de la zone (rayon autorisé : ${mission.rayon_metres ?? 200} m).`);
        setVerification(false);
        onActive();
      },
      () => { setMessage("Impossible d'obtenir votre position — vérifiez l'autorisation de localisation."); setVerification(false); },
      { enableHighAccuracy: true }
    );
  }

  const dejaActif = activation?.statut === "actif";

  return (
    <div className="mt-2">
      {dejaActif ? (
        <p className="text-xs text-vert">Activé aujourd'hui à {new Date(activation.heure_activation).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
      ) : (
        <button onClick={verifierPresence} disabled={verification} className="text-xs bg-ocre text-white px-3 py-1.5 rounded-sm">
          {verification ? "Vérification…" : "Je suis arrivé — vérifier ma présence"}
        </button>
      )}
      {message && <p className="text-xs text-ardoise/50 mt-1">{message}</p>}
    </div>
  );
}

export default function TableauDeBordCommercial() {
  const [pret, setPret] = useState(false);
  const [commercialId, setCommercialId] = useState<string | null>(null);
  const [missions, setMissions] = useState<any[]>([]);
  const [activations, setActivations] = useState<Record<string, any>>({});
  const [rattachements, setRattachements] = useState<any[]>([]);
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
      supabase.from("missions").select("id, statut, service, latitude, longitude, rayon_metres, entreprises(nom)").eq("commercial_id", profil.commercial_id),
      supabase.from("rattachements").select("id, service, statut, date_debut, entreprises(nom)").eq("commercial_id", profil.commercial_id),
      supabase.from("activations").select("*").eq("commercial_id", profil.commercial_id).eq("date_jour", aujourdhui),
    ]);
    setMissions(m.data ?? []);
    setRattachements(r.data ?? []);
    const map: Record<string, any> = {};
    (a.data ?? []).forEach((act: any) => { map[act.mission_id] = act; });
    setActivations(map);
    setPret(true);
  }

  useEffect(() => { charger(); }, []);

  if (!pret) return <div className="min-h-screen flex items-center justify-center text-sm text-ardoise/50">Chargement…</div>;

  return (
    <div className="min-h-screen bg-ivoire px-5 py-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl text-encre">Mon espace commercial</h1>
        <button onClick={async () => { await getSupabase().auth.signOut(); router.push("/"); }} className="text-xs text-ardoise/50">
          Se déconnecter
        </button>
      </div>

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
              <button onClick={() => setResiliationOuverte(r.id)} className="text-xs text-rouille mt-1">
                Demander à quitter ce rattachement
              </button>
            )}
            {resiliationOuverte === r.id && (
              <FormulaireResiliation rattachementId={r.id} onEnvoye={() => { setResiliationOuverte(null); charger(); }} />
            )}
          </div>
        ))}
      </div>

      <h2 className="text-sm font-medium text-ardoise/60 mt-6">Mes missions du jour</h2>
      <div className="mt-3 bg-white border border-ardoise/10 rounded-sm divide-y divide-ardoise/10">
        {missions.length === 0 && <p className="px-4 py-4 text-sm text-ardoise/40">Aucune mission pour l'instant — vous serez contacté dès qu'une opportunité correspond à votre profil.</p>}
        {missions.map((m) => (
          <div key={m.id} className="px-4 py-3">
            <div className="flex justify-between text-sm">
              <span>{m.entreprises?.nom ?? "Entreprise à confirmer"}</span>
              <span className="text-ardoise/50">{m.statut}</span>
            </div>
            {m.latitude && m.longitude && commercialId && (
              <BoutonActivation mission={m} commercialId={commercialId} activation={activations[m.id]} onActive={charger} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
