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

function FormulaireEdition({ commercial, onSauvegarde, onAnnuler }: {
  commercial: Commercial; onSauvegarde: () => void; onAnnuler: () => void;
}) {
  const [nom, setNom] = useState(commercial.nom);
  const [telephone, setTelephone] = useState(commercial.telephone ?? "");
  const [zone, setZone] = useState(commercial.zone_geographique ?? "");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  async function sauvegarder(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    const { error } = await getSupabase().from("commerciaux").update({
      nom, telephone, zone_geographique: zone,
    }).eq("id", commercial.id);
    if (error) { setErreur(error.message); setEnvoi(false); return; }
    onSauvegarde();
  }

  return (
    <form onSubmit={sauvegarder} className="px-5 py-4 space-y-2 bg-ivoire">
      <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom"
        className="w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
      <input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Téléphone"
        className="w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
      <input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Zone géographique"
        className="w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
      {erreur && <p className="text-xs text-rouille">{erreur}</p>}
      <div className="flex gap-2">
        <button disabled={envoi} className="text-xs bg-vert text-white px-3 py-1.5 rounded-sm">
          {envoi ? "…" : "Enregistrer"}
        </button>
        <button type="button" onClick={onAnnuler} className="text-xs text-ardoise/50 px-3 py-1.5">Annuler</button>
      </div>
    </form>
  );
}

export default function Commerciaux() {
  const [commerciaux, setCommerciaux] = useState<Commercial[]>([]);
  const [chargement, setChargement] = useState(true);
  const [enEdition, setEnEdition] = useState<string | null>(null);
  const [confirmerSuppression, setConfirmerSuppression] = useState<string | null>(null);

  async function charger() {
    const { data } = await getSupabase().from("commerciaux").select("*").order("nom");
    setCommerciaux((data ?? []) as Commercial[]);
    setChargement(false);
  }

  useEffect(() => { charger(); }, []);

  async function supprimer(id: string) {
    await getSupabase().from("commerciaux").delete().eq("id", id);
    setConfirmerSuppression(null);
    charger();
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-encre">Vivier de commerciaux</h1>
      <p className="text-sm text-ardoise/60 mt-1">{commerciaux.length} profil(s) au vivier</p>

      {chargement && <p className="mt-8 text-sm text-ardoise/50">Chargement…</p>}

      <div className="mt-6 bg-white border border-ardoise/10 rounded-sm divide-y divide-ardoise/10">
        {commerciaux.map((c) => (
          <div key={c.id}>
            {enEdition === c.id ? (
              <FormulaireEdition commercial={c} onSauvegarde={() => { setEnEdition(null); charger(); }} onAnnuler={() => setEnEdition(null)} />
            ) : (
              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-encre">{c.nom}</p>
                  <p className="text-xs text-ardoise/50 mt-0.5">
                    {c.zone_geographique || "Zone non précisée"}
                    {c.style_activite ? ` · ${c.style_activite}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {c.type_commercial && (
                    <span className="text-xs px-3 py-1 rounded-full bg-ivoire border border-ardoise/20 text-ardoise">
                      {LABEL_TYPE[c.type_commercial] ?? c.type_commercial}
                    </span>
                  )}
                  <button onClick={() => setEnEdition(c.id)} className="text-xs text-encre underline">Modifier</button>
                  {confirmerSuppression === c.id ? (
                    <button onClick={() => supprimer(c.id)} className="text-xs text-white bg-rouille px-2 py-1 rounded-sm">Confirmer</button>
                  ) : (
                    <button onClick={() => setConfirmerSuppression(c.id)} className="text-xs text-rouille underline">Supprimer</button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
