"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import { LABEL_SERVICE, TypeService } from "@/lib/types";

interface LigneMission {
  id: string;
  statut: string;
  service: TypeService;
  taux_commission: number | null;
  commerciaux: { nom: string } | null;
  entreprises: { nom: string } | null;
}

interface OptionSimple { id: string; nom: string; }

function FormulaireMission({ onCree }: { onCree: () => void }) {
  const [commerciaux, setCommerciaux] = useState<OptionSimple[]>([]);
  const [entreprises, setEntreprises] = useState<OptionSimple[]>([]);
  const [commercialId, setCommercialId] = useState("");
  const [entrepriseId, setEntrepriseId] = useState("");
  const [service, setService] = useState<TypeService | "">("");
  const [tauxCommission, setTauxCommission] = useState("");
  const [objectifJournalier, setObjectifJournalier] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [rayon, setRayon] = useState("200");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    async function charger() {
      const supabase = getSupabase();
      const [c, e] = await Promise.all([
        supabase.from("commerciaux").select("id, nom").order("nom"),
        supabase.from("entreprises").select("id, nom").order("nom"),
      ]);
      setCommerciaux(c.data ?? []);
      setEntreprises(e.data ?? []);
    }
    charger();
  }, []);

  async function creer(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    const supabase = getSupabase();
    const { error } = await supabase.from("missions").insert({
      commercial_id: commercialId,
      entreprise_id: entrepriseId,
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
    <form onSubmit={creer} className="bg-white border border-ardoise/10 rounded-sm p-6 space-y-3 mt-4">
      <label className="block">
        <span className="text-xs text-ardoise/60">Commercial</span>
        <select required value={commercialId} onChange={(e) => setCommercialId(e.target.value)}
          className="mt-1 w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm">
          <option value="">Sélectionner…</option>
          {commerciaux.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="text-xs text-ardoise/60">Entreprise</span>
        <select required value={entrepriseId} onChange={(e) => setEntrepriseId(e.target.value)}
          className="mt-1 w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm">
          <option value="">Sélectionner…</option>
          {entreprises.map((en) => <option key={en.id} value={en.id}>{en.nom}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="text-xs text-ardoise/60">Service</span>
        <select required value={service} onChange={(e) => setService(e.target.value as TypeService)}
          className="mt-1 w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm">
          <option value="">Sélectionner…</option>
          <option value="service_1_mise_a_disposition">Mise à disposition</option>
          <option value="service_2_gestion_complete">Gestion complète</option>
        </select>
      </label>
      {service === "service_2_gestion_complete" && (
        <label className="block">
          <span className="text-xs text-ardoise/60">Taux de commission (%)</span>
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
        <p className="text-xs text-ardoise/60 mb-2">Zone de mission (optionnel — pour la détection terrain)</p>
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Latitude (ex: 5.359952)" value={latitude} onChange={(e) => setLatitude(e.target.value)}
            className="w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
          <input placeholder="Longitude (ex: -4.008256)" value={longitude} onChange={(e) => setLongitude(e.target.value)}
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

export default function Missions() {
  const [missions, setMissions] = useState<LigneMission[]>([]);
  const [chargement, setChargement] = useState(true);
  const [formOuvert, setFormOuvert] = useState(false);

  async function chargerMissions() {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("missions")
      .select("id, statut, service, taux_commission, commerciaux(nom), entreprises(nom)")
      .order("created_at", { ascending: false });
    setMissions((data ?? []) as unknown as LigneMission[]);
    setChargement(false);
  }

  useEffect(() => {
    chargerMissions();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-encre">Missions</h1>
          <p className="text-sm text-ardoise/60 mt-1">Rattachement commercial ↔ entreprise</p>
        </div>
        <button onClick={() => setFormOuvert(!formOuvert)} className="bg-encre text-white text-sm px-4 py-2 rounded-sm hover:bg-ardoise transition-colors">
          {formOuvert ? "Fermer" : "Créer une mission"}
        </button>
      </div>

      {formOuvert && (
        <FormulaireMission onCree={() => { setFormOuvert(false); chargerMissions(); }} />
      )}

      {chargement && <p className="mt-8 text-sm text-ardoise/50">Chargement…</p>}

      <div className="mt-6 bg-white border border-ardoise/10 rounded-sm divide-y divide-ardoise/10">
        {missions.map((m) => (
          <div key={m.id} className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-encre">
                {m.commerciaux?.nom ?? "—"} → {m.entreprises?.nom ?? "—"}
              </p>
              <p className="text-xs text-ardoise/50 mt-0.5">
                {LABEL_SERVICE[m.service]}
                {m.taux_commission ? ` · commission ${m.taux_commission}%` : ""}
              </p>
            </div>
            <span
              className={
                "text-xs px-3 py-1 rounded-full border " +
                (m.statut === "active"
                  ? "border-vert/40 text-vert"
                  : "border-ardoise/20 text-ardoise/50")
              }
            >
              {m.statut}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
