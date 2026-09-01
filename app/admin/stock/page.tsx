"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

interface OptionSimple { id: string; nom: string; }

interface Mouvement {
  id: string;
  produit: string;
  type_mouvement: "entree" | "sortie";
  quantite: number;
  date_mouvement: string;
  reference_lot: string | null;
  entreprises: { nom: string } | null;
}

function FormulaireMouvement({ onCree }: { onCree: () => void }) {
  const [entreprises, setEntreprises] = useState<OptionSimple[]>([]);
  const [entrepriseId, setEntrepriseId] = useState("");
  const [produit, setProduit] = useState("");
  const [type, setType] = useState<"entree" | "sortie">("entree");
  const [quantite, setQuantite] = useState("");
  const [referenceLot, setReferenceLot] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    getSupabase().from("entreprises").select("id, nom").order("nom").then(({ data }) => setEntreprises(data ?? []));
  }, []);

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    const { error } = await getSupabase().from("stocks_mouvements").insert({
      entreprise_id: entrepriseId,
      produit,
      type_mouvement: type,
      quantite: Number(quantite),
      reference_lot: referenceLot || null,
    });
    if (error) { setErreur(error.message); setEnvoi(false); return; }
    setProduit(""); setQuantite(""); setReferenceLot("");
    setEnvoi(false);
    onCree();
  }

  return (
    <form onSubmit={enregistrer} className="bg-white border border-ardoise/10 rounded-sm p-6 space-y-3 mt-4">
      <label className="block">
        <span className="text-xs text-ardoise/60">Entreprise</span>
        <select required value={entrepriseId} onChange={(e) => setEntrepriseId(e.target.value)}
          className="mt-1 w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm">
          <option value="">Sélectionner…</option>
          {entreprises.map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => setType("entree")}
          className={"text-sm px-3 py-2 rounded-sm border " + (type === "entree" ? "bg-vert text-white border-vert" : "border-ardoise/20 text-ardoise/60")}>
          Entrée
        </button>
        <button type="button" onClick={() => setType("sortie")}
          className={"text-sm px-3 py-2 rounded-sm border " + (type === "sortie" ? "bg-rouille text-white border-rouille" : "border-ardoise/20 text-ardoise/60")}>
          Sortie
        </button>
      </div>
      <label className="block">
        <span className="text-xs text-ardoise/60">Produit</span>
        <input required value={produit} onChange={(e) => setProduit(e.target.value)}
          className="mt-1 w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
      </label>
      <label className="block">
        <span className="text-xs text-ardoise/60">Quantité</span>
        <input required type="number" step="0.01" value={quantite} onChange={(e) => setQuantite(e.target.value)}
          className="mt-1 w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
      </label>
      <label className="block">
        <span className="text-xs text-ardoise/60">Référence lot (optionnel)</span>
        <input value={referenceLot} onChange={(e) => setReferenceLot(e.target.value)}
          className="mt-1 w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
      </label>
      {erreur && <p className="text-xs text-rouille">{erreur}</p>}
      <button disabled={envoi} className="w-full bg-encre text-white text-sm px-4 py-2.5 rounded-sm">
        {envoi ? "Enregistrement…" : "Enregistrer le mouvement"}
      </button>
    </form>
  );
}

export default function StockAdmin() {
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [formOuvert, setFormOuvert] = useState(false);
  const [chargement, setChargement] = useState(true);

  async function charger() {
    const { data } = await getSupabase()
      .from("stocks_mouvements")
      .select("id, produit, type_mouvement, quantite, date_mouvement, reference_lot, entreprises(nom)")
      .order("date_mouvement", { ascending: false });
    setMouvements((data ?? []) as unknown as Mouvement[]);
    setChargement(false);
  }

  useEffect(() => { charger(); }, []);

  const parEntrepriseProduit: Record<string, { entrees: number; sorties: number }> = {};
  mouvements.forEach((m) => {
    const cle = `${m.entreprises?.nom ?? "—"} · ${m.produit}`;
    if (!parEntrepriseProduit[cle]) parEntrepriseProduit[cle] = { entrees: 0, sorties: 0 };
    if (m.type_mouvement === "entree") parEntrepriseProduit[cle].entrees += Number(m.quantite);
    else parEntrepriseProduit[cle].sorties += Number(m.quantite);
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-encre">Stock — Gestion complète</h1>
          <p className="text-sm text-ardoise/60 mt-1">Stocks des entreprises gérées en Service 2</p>
        </div>
        <button onClick={() => setFormOuvert(!formOuvert)} className="bg-encre text-white text-sm px-4 py-2 rounded-sm">
          {formOuvert ? "Fermer" : "Nouveau mouvement"}
        </button>
      </div>

      {formOuvert && <FormulaireMouvement onCree={() => { setFormOuvert(false); charger(); }} />}

      {chargement && <p className="mt-8 text-sm text-ardoise/50">Chargement…</p>}

      <h2 className="text-sm font-medium text-ardoise/60 mt-8">Solde par entreprise et produit</h2>
      <div className="mt-3 bg-white border border-ardoise/10 rounded-sm divide-y divide-ardoise/10">
        {Object.keys(parEntrepriseProduit).length === 0 && <p className="px-5 py-4 text-sm text-ardoise/40">Aucun mouvement enregistré.</p>}
        {Object.entries(parEntrepriseProduit).map(([cle, { entrees, sorties }]) => (
          <div key={cle} className="px-5 py-3 flex justify-between text-sm">
            <span>{cle}</span>
            <span className="text-encre font-medium">{entrees - sorties} en stock</span>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-medium text-ardoise/60 mt-8">Historique</h2>
      <div className="mt-3 bg-white border border-ardoise/10 rounded-sm divide-y divide-ardoise/10">
        {mouvements.length === 0 && <p className="px-5 py-4 text-sm text-ardoise/40">Aucun mouvement pour l'instant.</p>}
        {mouvements.map((m) => (
          <div key={m.id} className="px-5 py-3 flex justify-between text-sm">
            <div>
              <span>{m.entreprises?.nom} — {m.produit}</span>
              {m.reference_lot && <span className="text-xs text-ardoise/40 ml-2">Lot: {m.reference_lot}</span>}
            </div>
            <div className="text-right">
              <span className={m.type_mouvement === "entree" ? "text-vert" : "text-rouille"}>
                {m.type_mouvement === "entree" ? "+" : "-"}{m.quantite}
              </span>
              <p className="text-xs text-ardoise/40">{new Date(m.date_mouvement).toLocaleDateString("fr-FR")}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
