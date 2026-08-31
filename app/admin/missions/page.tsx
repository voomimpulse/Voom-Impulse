"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import { useTypeAdmin } from "@/lib/adminContext";
import { LABEL_SERVICE, TypeService } from "@/lib/types";

interface OptionSimple { id: string; nom: string; }

interface LigneMission {
  id: string;
  statut: string;
  service: TypeService;
  taux_commission: number | null;
  commercial_id: string | null;
  commerciaux: { nom: string } | null;
  entreprises: { nom: string } | null;
}

function AssignationCommercial({ missionId, onAssigne }: { missionId: string; onAssigne: () => void }) {
  const [commerciaux, setCommerciaux] = useState<OptionSimple[]>([]);
  const [choix, setChoix] = useState("");
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    getSupabase().from("commerciaux").select("id, nom").order("nom").then(({ data }) => setCommerciaux(data ?? []));
  }, []);

  async function assigner() {
    if (!choix) return;
    setEnvoi(true);
    await getSupabase().from("missions").update({ commercial_id: choix }).eq("id", missionId);
    onAssigne();
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <select value={choix} onChange={(e) => setChoix(e.target.value)} className="text-xs border border-ardoise/20 rounded-sm px-2 py-1.5 flex-1">
        <option value="">Choisir un commercial…</option>
        {commerciaux.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
      </select>
      <button onClick={assigner} disabled={envoi || !choix} className="text-xs bg-encre text-white px-3 py-1.5 rounded-sm">
        {envoi ? "…" : "Assigner"}
      </button>
    </div>
  );
}

export default function Missions() {
  const typeAdmin = useTypeAdmin();
  const [missions, setMissions] = useState<LigneMission[]>([]);
  const [chargement, setChargement] = useState(true);

  async function chargerMissions() {
    let requete = getSupabase()
      .from("missions")
      .select("id, statut, service, taux_commission, commercial_id, commerciaux(nom), entreprises(nom)")
      .order("created_at", { ascending: false });

    if (typeAdmin === "gestion_complete") requete = requete.eq("service", "service_2_gestion_complete");
    if (typeAdmin === "mise_a_disposition") requete = requete.eq("service", "service_1_mise_a_disposition");

    const { data } = await requete;
    setMissions((data ?? []) as unknown as LigneMission[]);
    setChargement(false);
  }

  useEffect(() => { chargerMissions(); }, [typeAdmin]);

  const enAttente = missions.filter((m) => !m.commercial_id);
  const assignees = missions.filter((m) => m.commercial_id);

  return (
    <div>
      <h1 className="font-display text-2xl text-encre">Missions</h1>
      <p className="text-sm text-ardoise/60 mt-1">
        {typeAdmin === "gestion_complete" && "Missions Service 2 — Gestion complète"}
        {typeAdmin === "mise_a_disposition" && "Missions Service 1 — Mise à disposition"}
        {typeAdmin === "principal" && "Toutes les missions, tous services confondus"}
      </p>

      {chargement && <p className="mt-8 text-sm text-ardoise/50">Chargement…</p>}

      {enAttente.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-ocre">En attente d'affectation</h2>
          <div className="mt-3 space-y-3">
            {enAttente.map((m) => (
              <div key={m.id} className="bg-white border border-ocre/30 rounded-sm p-4">
                <p className="text-sm font-medium text-encre">{m.entreprises?.nom ?? "—"}</p>
                <p className="text-xs text-ardoise/50 mt-0.5">
                  {LABEL_SERVICE[m.service]}
                  {m.taux_commission ? ` · commission ${m.taux_commission}%` : ""}
                </p>
                <AssignationCommercial missionId={m.id} onAssigne={chargerMissions} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-medium text-ardoise/60">Missions assignées</h2>
        <div className="mt-3 bg-white border border-ardoise/10 rounded-sm divide-y divide-ardoise/10">
          {assignees.length === 0 && <p className="px-5 py-4 text-sm text-ardoise/40">Aucune mission assignée pour l'instant.</p>}
          {assignees.map((m) => (
            <div key={m.id} className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-encre">
                  {m.commerciaux?.nom} → {m.entreprises?.nom}
                </p>
                <p className="text-xs text-ardoise/50 mt-0.5">
                  {LABEL_SERVICE[m.service]}
                  {m.taux_commission ? ` · commission ${m.taux_commission}%` : ""}
                </p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full border border-vert/40 text-vert">{m.statut}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
