"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import { useTypeAdmin } from "@/lib/adminContext";
import { LABEL_SERVICE, LABEL_STATUT_FACTURE, TypeService, StatutFacture } from "@/lib/types";

interface OptionSimple { id: string; nom: string; }

interface Facture {
  id: string;
  entreprise_id: string;
  service: TypeService;
  montant: number;
  statut: StatutFacture;
  date_echeance: string | null;
  date_paiement: string | null;
  mode_paiement: string | null;
  entreprises: { nom: string } | null;
}

function FormulaireFacture({ typeAdmin, onCree }: { typeAdmin: string; onCree: () => void }) {
  const [entreprises, setEntreprises] = useState<OptionSimple[]>([]);
  const [entrepriseId, setEntrepriseId] = useState("");
  const [service, setService] = useState(typeAdmin === "gestion_complete" ? "service_2_gestion_complete" : typeAdmin === "mise_a_disposition" ? "service_1_mise_a_disposition" : "");
  const [montant, setMontant] = useState("");
  const [dateEcheance, setDateEcheance] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    getSupabase().from("entreprises").select("id, nom").order("nom").then(({ data }) => setEntreprises(data ?? []));
  }, []);

  async function creer(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    const { error } = await getSupabase().from("factures").insert({
      entreprise_id: entrepriseId,
      service,
      montant: Number(montant),
      date_echeance: dateEcheance || null,
      statut: "impayee",
    });
    if (error) { setErreur(error.message); setEnvoi(false); return; }
    onCree();
  }

  return (
    <form onSubmit={creer} className="bg-white border border-ardoise/10 rounded-sm p-6 space-y-3 mt-4">
      <label className="block">
        <span className="text-xs text-ardoise/60">Entreprise</span>
        <select required value={entrepriseId} onChange={(e) => setEntrepriseId(e.target.value)}
          className="mt-1 w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm">
          <option value="">Sélectionner…</option>
          {entreprises.map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}
        </select>
      </label>
      {typeAdmin === "principal" && (
        <label className="block">
          <span className="text-xs text-ardoise/60">Service</span>
          <select required value={service} onChange={(e) => setService(e.target.value)}
            className="mt-1 w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm">
            <option value="">Sélectionner…</option>
            <option value="service_1_mise_a_disposition">Mise à disposition</option>
            <option value="service_2_gestion_complete">Gestion complète</option>
          </select>
        </label>
      )}
      <label className="block">
        <span className="text-xs text-ardoise/60">Montant (FCFA)</span>
        <input required type="number" step="1" value={montant} onChange={(e) => setMontant(e.target.value)}
          className="mt-1 w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
      </label>
      <label className="block">
        <span className="text-xs text-ardoise/60">Date d'échéance</span>
        <input type="date" value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)}
          className="mt-1 w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
      </label>
      {erreur && <p className="text-xs text-rouille">{erreur}</p>}
      <button disabled={envoi} className="w-full bg-encre text-white text-sm px-4 py-2.5 rounded-sm">
        {envoi ? "Création…" : "Créer la facture"}
      </button>
    </form>
  );
}

function LigneFacture({ facture, onMiseAJour }: { facture: Facture; onMiseAJour: () => void }) {
  const [modePaiement, setModePaiement] = useState("");
  const [ouvert, setOuvert] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  async function marquerPayee() {
    setEnvoi(true);
    await getSupabase().from("factures").update({
      statut: "payee",
      date_paiement: new Date().toISOString().slice(0, 10),
      mode_paiement: modePaiement || null,
    }).eq("id", facture.id);
    onMiseAJour();
  }

  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-encre">{facture.entreprises?.nom ?? "—"}</p>
          <p className="text-xs text-ardoise/50 mt-0.5">
            {Number(facture.montant).toLocaleString("fr-FR")} FCFA · {LABEL_SERVICE[facture.service]}
            {facture.date_echeance ? ` · échéance ${new Date(facture.date_echeance).toLocaleDateString("fr-FR")}` : ""}
          </p>
        </div>
        <span className={"text-xs px-3 py-1 rounded-full border " + (facture.statut === "payee" ? "border-vert/40 text-vert" : "border-rouille/40 text-rouille")}>
          {LABEL_STATUT_FACTURE[facture.statut]}
        </span>
      </div>
      {facture.statut !== "payee" && (
        ouvert ? (
          <div className="flex items-center gap-2 mt-2">
            <input placeholder="Mode de paiement (ex: Mobile Money)" value={modePaiement} onChange={(e) => setModePaiement(e.target.value)}
              className="text-xs border border-ardoise/20 rounded-sm px-2 py-1.5 flex-1" />
            <button onClick={marquerPayee} disabled={envoi} className="text-xs bg-vert text-white px-3 py-1.5 rounded-sm">
              {envoi ? "…" : "Confirmer"}
            </button>
          </div>
        ) : (
          <button onClick={() => setOuvert(true)} className="text-xs text-vert mt-2">Marquer comme payée</button>
        )
      )}
    </div>
  );
}

export default function Factures() {
  const typeAdmin = useTypeAdmin();
  const [factures, setFactures] = useState<Facture[]>([]);
  const [formOuvert, setFormOuvert] = useState(false);
  const [chargement, setChargement] = useState(true);

  async function charger() {
    let requete = getSupabase().from("factures").select("*, entreprises(nom)").order("created_at", { ascending: false });
    if (typeAdmin === "gestion_complete") requete = requete.eq("service", "service_2_gestion_complete");
    if (typeAdmin === "mise_a_disposition") requete = requete.eq("service", "service_1_mise_a_disposition");
    const { data } = await requete;
    setFactures((data ?? []) as unknown as Facture[]);
    setChargement(false);
  }

  useEffect(() => { charger(); }, [typeAdmin]);

  const impayees = factures.filter((f) => f.statut !== "payee");
  const payees = factures.filter((f) => f.statut === "payee");
  const totalImpaye = impayees.reduce((t, f) => t + Number(f.montant), 0);
  const totalPaye = payees.reduce((t, f) => t + Number(f.montant), 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-encre">Factures</h1>
          <p className="text-sm text-ardoise/60 mt-1">Suivi payé / impayé par entreprise</p>
        </div>
        <button onClick={() => setFormOuvert(!formOuvert)} className="bg-encre text-white text-sm px-4 py-2 rounded-sm">
          {formOuvert ? "Fermer" : "Créer une facture"}
        </button>
      </div>

      {formOuvert && <FormulaireFacture typeAdmin={typeAdmin} onCree={() => { setFormOuvert(false); charger(); }} />}

      <div className="grid grid-cols-2 gap-4 mt-8">
        <div className="bg-white border border-ardoise/10 rounded-sm p-5">
          <p className="text-xs text-ardoise/60">Total encaissé</p>
          <p className="font-display text-2xl text-vert mt-1">{totalPaye.toLocaleString("fr-FR")} FCFA</p>
        </div>
        <div className="bg-white border border-ardoise/10 rounded-sm p-5">
          <p className="text-xs text-ardoise/60">Total en attente</p>
          <p className="font-display text-2xl text-rouille mt-1">{totalImpaye.toLocaleString("fr-FR")} FCFA</p>
        </div>
      </div>

      {chargement && <p className="mt-8 text-sm text-ardoise/50">Chargement…</p>}

      {impayees.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-rouille">Impayées</h2>
          <div className="mt-3 bg-white border border-ardoise/10 rounded-sm divide-y divide-ardoise/10">
            {impayees.map((f) => <LigneFacture key={f.id} facture={f} onMiseAJour={charger} />)}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-medium text-ardoise/60">Payées</h2>
        <div className="mt-3 bg-white border border-ardoise/10 rounded-sm divide-y divide-ardoise/10">
          {payees.length === 0 && <p className="px-5 py-4 text-sm text-ardoise/40">Aucune facture payée pour l'instant.</p>}
          {payees.map((f) => <LigneFacture key={f.id} facture={f} onMiseAJour={charger} />)}
        </div>
      </div>
    </div>
  );
}
