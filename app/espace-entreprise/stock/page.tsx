"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";

interface Mouvement {
  id: string;
  produit: string;
  type_mouvement: "entree" | "sortie";
  quantite: number;
  date_mouvement: string;
  reference_lot: string | null;
}

function FormulaireMouvement({ entrepriseId, onCree }: { entrepriseId: string; onCree: () => void }) {
  const [produit, setProduit] = useState("");
  const [type, setType] = useState<"entree" | "sortie">("entree");
  const [quantite, setQuantite] = useState("");
  const [referenceLot, setReferenceLot] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

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
    <form onSubmit={enregistrer} className="bg-white border border-ardoise/10 rounded-sm p-5 space-y-3">
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

export default function Stock() {
  const [pret, setPret] = useState(false);
  const [entrepriseId, setEntrepriseId] = useState<string | null>(null);
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const router = useRouter();

  async function charger() {
    const supabase = getSupabase();
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) { router.push("/login"); return; }

    const { data: profil } = await supabase.from("profils").select("role, entreprise_id").eq("id", session.session.user.id).single();
    if (profil?.role !== "entreprise" || !profil.entreprise_id) { router.push("/login"); return; }

    setEntrepriseId(profil.entreprise_id);
    const { data } = await supabase
      .from("stocks_mouvements")
      .select("id, produit, type_mouvement, quantite, date_mouvement, reference_lot")
      .eq("entreprise_id", profil.entreprise_id)
      .order("date_mouvement", { ascending: false });
    setMouvements((data ?? []) as Mouvement[]);
    setPret(true);
  }

  useEffect(() => { charger(); }, []);

  if (!pret) return <div className="min-h-screen flex items-center justify-center text-sm text-ardoise/50">Chargement…</div>;

  const parProduit: Record<string, { entrees: number; sorties: number }> = {};
  mouvements.forEach((m) => {
    if (!parProduit[m.produit]) parProduit[m.produit] = { entrees: 0, sorties: 0 };
    if (m.type_mouvement === "entree") parProduit[m.produit].entrees += Number(m.quantite);
    else parProduit[m.produit].sorties += Number(m.quantite);
  });

  return (
    <div className="min-h-screen bg-ivoire px-5 py-6">
      <div className="flex items-center justify-between print:hidden">
        <a href="/espace-entreprise/tableau-de-bord" className="text-xs text-ardoise/50">← Retour au tableau de bord</a>
        <button onClick={() => window.print()} className="text-xs bg-encre text-white px-3 py-1.5 rounded-sm">
          Imprimer le bilan
        </button>
      </div>

      <h1 className="font-display text-xl text-encre mt-4">Gestion des stocks</h1>

      <h2 className="text-sm font-medium text-ardoise/60 mt-8">Solde par produit</h2>
      <div className="mt-3 bg-white border border-ardoise/10 rounded-sm divide-y divide-ardoise/10">
        {Object.keys(parProduit).length === 0 && <p className="px-4 py-4 text-sm text-ardoise/40">Aucun mouvement enregistré.</p>}
        {Object.entries(parProduit).map(([produit, { entrees, sorties }]) => (
          <div key={produit} className="px-4 py-3 flex justify-between text-sm">
            <span>{produit}</span>
            <span className="text-encre font-medium">{entrees - sorties} en stock</span>
          </div>
        ))}
      </div>

      <div className="mt-8 print:hidden">
        <h2 className="text-sm font-medium text-ardoise/60 mb-3">Nouveau mouvement</h2>
        {entrepriseId && <FormulaireMouvement entrepriseId={entrepriseId} onCree={charger} />}
      </div>

      <h2 className="text-sm font-medium text-ardoise/60 mt-8">Historique des mouvements</h2>
      <div className="mt-3 bg-white border border-ardoise/10 rounded-sm divide-y divide-ardoise/10">
        {mouvements.length === 0 && <p className="px-4 py-4 text-sm text-ardoise/40">Aucun mouvement pour l'instant.</p>}
        {mouvements.map((m) => (
          <div key={m.id} className="px-4 py-3 flex justify-between text-sm">
            <div>
              <span>{m.produit}</span>
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
