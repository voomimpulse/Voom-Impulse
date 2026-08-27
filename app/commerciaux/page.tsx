"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import { Commercial } from "@/lib/types";

const LABEL_TYPE: Record<string, string> = {
  terrain: "Commercial terrain",
  hote_hotesse: "Hôte / hôtesse",
  promoteur: "Promoteur",
  animateur: "Animateur",
  rayonniste: "Rayonniste",
  superviseur: "Superviseur",
  teleoperateur: "Téléopérateur",
  commercial_digital: "Commercial digital",
};

export default function Commerciaux() {
  const [commerciaux, setCommerciaux] = useState<Commercial[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    async function charger() {
      const { data } = await getSupabase().from("commerciaux").select("*").order("nom");
      setCommerciaux((data ?? []) as Commercial[]);
      setChargement(false);
    }
    charger();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-encre">Vivier de commerciaux</h1>
          <p className="text-sm text-ardoise/60 mt-1">{commerciaux.length} profil(s) au vivier</p>
        </div>
        <button className="bg-encre text-ivoire text-sm px-4 py-2 rounded-sm hover:bg-ardoise transition-colors">
          Ajouter un profil
        </button>
      </div>

      {chargement && <p className="mt-8 text-sm text-ardoise/50">Chargement…</p>}

      {!chargement && commerciaux.length === 0 && (
        <p className="mt-8 text-sm text-ardoise/50">
          Aucun commercial enregistré pour l'instant. Les fiches d'entretien alimenteront cette liste.
        </p>
      )}

      <div className="mt-6 bg-white border border-ardoise/10 rounded-sm divide-y divide-ardoise/10">
        {commerciaux.map((c) => (
          <div key={c.id} className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-encre">{c.nom}</p>
              <p className="text-xs text-ardoise/50 mt-0.5">
                {c.zone_geographique || "Zone non précisée"}
                {c.style_activite ? ` · ${c.style_activite}` : ""}
              </p>
            </div>
            {c.type_commercial && (
              <span className="text-xs px-3 py-1 rounded-full bg-ivoire border border-ardoise/20 text-ardoise">
                {LABEL_TYPE[c.type_commercial] ?? c.type_commercial}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
