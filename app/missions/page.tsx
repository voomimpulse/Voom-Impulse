"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { LABEL_SERVICE, TypeService } from "@/lib/types";

interface LigneMission {
  id: string;
  statut: string;
  service: TypeService;
  taux_commission: number | null;
  commerciaux: { nom: string } | null;
  entreprises: { nom: string } | null;
}

export default function Missions() {
  const [missions, setMissions] = useState<LigneMission[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    async function charger() {
      const { data } = await supabase
        .from("missions")
        .select("id, statut, service, taux_commission, commerciaux(nom), entreprises(nom)")
        .order("created_at", { ascending: false });
      setMissions((data ?? []) as unknown as LigneMission[]);
      setChargement(false);
    }
    charger();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-encre">Missions</h1>
          <p className="text-sm text-ardoise/60 mt-1">Rattachement commercial ↔ entreprise</p>
        </div>
        <button className="bg-encre text-ivoire text-sm px-4 py-2 rounded-sm hover:bg-ardoise transition-colors">
          Créer une mission
        </button>
      </div>

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
