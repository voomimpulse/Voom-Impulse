"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Entreprise, LABEL_SERVICE } from "@/lib/types";

export default function Entreprises() {
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    async function charger() {
      const { data } = await supabase.from("entreprises").select("*").order("nom");
      setEntreprises((data ?? []) as Entreprise[]);
      setChargement(false);
    }
    charger();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-encre">Entreprises partenaires</h1>
          <p className="text-sm text-ardoise/60 mt-1">{entreprises.length} entreprise(s) enregistrée(s)</p>
        </div>
        <button className="bg-encre text-ivoire text-sm px-4 py-2 rounded-sm hover:bg-ardoise transition-colors">
          Ajouter une entreprise
        </button>
      </div>

      {chargement && <p className="mt-8 text-sm text-ardoise/50">Chargement…</p>}

      {!chargement && entreprises.length === 0 && (
        <p className="mt-8 text-sm text-ardoise/50">
          Aucune entreprise enregistrée pour l'instant. Ajoutez la première fiche pour commencer.
        </p>
      )}

      <div className="mt-6 bg-white border border-ardoise/10 rounded-sm divide-y divide-ardoise/10">
        {entreprises.map((e) => (
          <div key={e.id} className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-encre">{e.nom}</p>
              <p className="text-xs text-ardoise/50 mt-0.5">
                {e.secteur_activite || "Secteur non précisé"}
                {e.contact_nom ? ` · ${e.contact_nom}` : ""}
              </p>
            </div>
            {e.type_collaboration_souhaite && (
              <span className="text-xs px-3 py-1 rounded-full bg-ivoire border border-ocre/40 text-ocre">
                {LABEL_SERVICE[e.type_collaboration_souhaite]}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
