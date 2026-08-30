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

export default function TableauDeBordCommercial() {
  const [pret, setPret] = useState(false);
  const [missions, setMissions] = useState<any[]>([]);
  const [rattachements, setRattachements] = useState<any[]>([]);
  const [resiliationOuverte, setResiliationOuverte] = useState<string | null>(null);
  const router = useRouter();

  async function charger() {
    const supabase = getSupabase();
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) { router.push("/login"); return; }

    const { data: profil } = await supabase.from("profils").select("role, commercial_id").eq("id", session.session.user.id).single();
    if (profil?.role !== "commercial" || !profil.commercial_id) { router.push("/login"); return; }

    const [m, r] = await Promise.all([
      supabase.from("missions").select("id, statut, service, entreprises(nom)").eq("commercial_id", profil.commercial_id),
      supabase.from("rattachements").select("id, service, statut, date_debut, entreprises(nom)").eq("commercial_id", profil.commercial_id),
    ]);
    setMissions(m.data ?? []);
    setRattachements(r.data ?? []);
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

      <h2 className="text-sm font-medium text-ardoise/60 mt-6">Mes missions</h2>
      <div className="mt-3 bg-white border border-ardoise/10 rounded-sm divide-y divide-ardoise/10">
        {missions.length === 0 && <p className="px-4 py-4 text-sm text-ardoise/40">Aucune mission pour l'instant — vous serez contacté dès qu'une opportunité correspond à votre profil.</p>}
        {missions.map((m) => (
          <div key={m.id} className="px-4 py-3 text-sm flex justify-between">
            <span>{m.entreprises?.nom ?? "Entreprise à confirmer"}</span>
            <span className="text-ardoise/50">{m.statut}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
