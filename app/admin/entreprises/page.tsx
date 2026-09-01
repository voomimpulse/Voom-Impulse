"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import { Entreprise, LABEL_SERVICE } from "@/lib/types";

function FormulaireEdition({ entreprise, onSauvegarde, onAnnuler }: {
  entreprise: Entreprise; onSauvegarde: () => void; onAnnuler: () => void;
}) {
  const [nom, setNom] = useState(entreprise.nom);
  const [contactNom, setContactNom] = useState(entreprise.contact_nom ?? "");
  const [contactTelephone, setContactTelephone] = useState(entreprise.contact_telephone ?? "");
  const [secteur, setSecteur] = useState(entreprise.secteur_activite ?? "");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  async function sauvegarder(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    const { error } = await getSupabase().from("entreprises").update({
      nom, contact_nom: contactNom, contact_telephone: contactTelephone, secteur_activite: secteur,
    }).eq("id", entreprise.id);
    if (error) { setErreur(error.message); setEnvoi(false); return; }
    onSauvegarde();
  }

  return (
    <form onSubmit={sauvegarder} className="px-5 py-4 space-y-2 bg-ivoire">
      <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom"
        className="w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
      <input value={contactNom} onChange={(e) => setContactNom(e.target.value)} placeholder="Contact"
        className="w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
      <input value={contactTelephone} onChange={(e) => setContactTelephone(e.target.value)} placeholder="Téléphone"
        className="w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
      <input value={secteur} onChange={(e) => setSecteur(e.target.value)} placeholder="Secteur d'activité"
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

export default function Entreprises() {
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [chargement, setChargement] = useState(true);
  const [enEdition, setEnEdition] = useState<string | null>(null);
  const [confirmerSuppression, setConfirmerSuppression] = useState<string | null>(null);

  async function charger() {
    const { data } = await getSupabase().from("entreprises").select("*").order("nom");
    setEntreprises((data ?? []) as Entreprise[]);
    setChargement(false);
  }

  useEffect(() => { charger(); }, []);

  async function supprimer(id: string) {
    await getSupabase().from("entreprises").delete().eq("id", id);
    setConfirmerSuppression(null);
    charger();
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-encre">Entreprises partenaires</h1>
      <p className="text-sm text-ardoise/60 mt-1">{entreprises.length} entreprise(s) enregistrée(s)</p>

      {chargement && <p className="mt-8 text-sm text-ardoise/50">Chargement…</p>}

      <div className="mt-6 bg-white border border-ardoise/10 rounded-sm divide-y divide-ardoise/10">
        {entreprises.map((e) => (
          <div key={e.id}>
            {enEdition === e.id ? (
              <FormulaireEdition entreprise={e} onSauvegarde={() => { setEnEdition(null); charger(); }} onAnnuler={() => setEnEdition(null)} />
            ) : (
              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-encre">{e.nom}</p>
                  <p className="text-xs text-ardoise/50 mt-0.5">
                    {e.secteur_activite || "Secteur non précisé"}
                    {e.contact_nom ? ` · ${e.contact_nom}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {e.type_collaboration_souhaite && (
                    <span className="text-xs px-3 py-1 rounded-full bg-ivoire border border-ocre/40 text-ocre">
                      {LABEL_SERVICE[e.type_collaboration_souhaite]}
                    </span>
                  )}
                  <button onClick={() => setEnEdition(e.id)} className="text-xs text-encre underline">Modifier</button>
                  {confirmerSuppression === e.id ? (
                    <button onClick={() => supprimer(e.id)} className="text-xs text-white bg-rouille px-2 py-1 rounded-sm">Confirmer</button>
                  ) : (
                    <button onClick={() => setConfirmerSuppression(e.id)} className="text-xs text-rouille underline">Supprimer</button>
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
