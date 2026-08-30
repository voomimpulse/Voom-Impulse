"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

interface OptionSimple { id: string; nom: string; }

interface Rattachement {
  id: string;
  service: string;
  date_debut: string;
  date_fin: string | null;
  statut: string;
  commerciaux: { nom: string } | null;
  entreprises: { nom: string } | null;
}

interface DemandeResiliation {
  id: string;
  demandeur: string;
  motif: string;
  statut: string;
  rattachement_id: string;
  rattachements: { commerciaux: { nom: string } | null; entreprises: { nom: string } | null } | null;
}

function FormulaireRattachement({ onCree }: { onCree: () => void }) {
  const [commerciaux, setCommerciaux] = useState<OptionSimple[]>([]);
  const [entreprises, setEntreprises] = useState<OptionSimple[]>([]);
  const [commercialId, setCommercialId] = useState("");
  const [entrepriseId, setEntrepriseId] = useState("");
  const [service, setService] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const supabase = getSupabase();
    Promise.all([
      supabase.from("commerciaux").select("id, nom").order("nom"),
      supabase.from("entreprises").select("id, nom").order("nom"),
    ]).then(([c, e]) => {
      setCommerciaux(c.data ?? []);
      setEntreprises(e.data ?? []);
    });
  }, []);

  async function creer(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    const { error } = await getSupabase().from("rattachements").insert({
      commercial_id: commercialId,
      entreprise_id: entrepriseId,
      service,
      date_debut: dateDebut || undefined,
      date_fin: dateFin || null,
      statut: "actif",
    });
    if (error) { setErreur(error.message); setEnvoi(false); return; }
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
        <select required value={service} onChange={(e) => setService(e.target.value)}
          className="mt-1 w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm">
          <option value="">Sélectionner…</option>
          <option value="service_1_mise_a_disposition">Mise à disposition</option>
          <option value="service_2_gestion_complete">Gestion complète</option>
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-ardoise/60">Date de début</span>
          <input required type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)}
            className="mt-1 w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs text-ardoise/60">Date de fin (optionnel)</span>
          <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)}
            className="mt-1 w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
        </label>
      </div>
      {erreur && <p className="text-xs text-rouille">{erreur}</p>}
      <button disabled={envoi} className="w-full bg-encre text-white text-sm px-4 py-2.5 rounded-sm">
        {envoi ? "Création…" : "Créer le rattachement"}
      </button>
    </form>
  );
}

function TraiterDemande({ demande, onTraite }: { demande: DemandeResiliation; onTraite: () => void }) {
  const [commerciaux, setCommerciaux] = useState<OptionSimple[]>([]);
  const [interimId, setInterimId] = useState("");
  const [decision, setDecision] = useState("");
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    getSupabase().from("commerciaux").select("id, nom").order("nom").then(({ data }) => setCommerciaux(data ?? []));
  }, []);

  async function valider(accepter: boolean) {
    setEnvoi(true);
    const supabase = getSupabase();
    await supabase.from("demandes_resiliation").update({
      statut: accepter ? "validee" : "refusee",
      decision_admin: decision,
      interim_commercial_id: interimId || null,
    }).eq("id", demande.id);

    if (accepter) {
      await supabase.from("rattachements").update({ statut: "resilie" }).eq("id", demande.rattachement_id);
    }
    onTraite();
  }

  return (
    <div className="bg-white border border-ocre/30 rounded-sm p-4 mt-3">
      <p className="text-sm font-medium text-encre">
        {demande.rattachements?.commerciaux?.nom ?? "—"} ↔ {demande.rattachements?.entreprises?.nom ?? "—"}
      </p>
      <p className="text-xs text-ardoise/50 mt-0.5">Demande de : {demande.demandeur}</p>
      <p className="text-sm text-ardoise/70 mt-2">{demande.motif}</p>

      <label className="block mt-3">
        <span className="text-xs text-ardoise/60">Votre décision (note interne)</span>
        <textarea value={decision} onChange={(e) => setDecision(e.target.value)} rows={2}
          className="mt-1 w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
      </label>
      <label className="block mt-2">
        <span className="text-xs text-ardoise/60">Commercial intérim (optionnel, si validation)</span>
        <select value={interimId} onChange={(e) => setInterimId(e.target.value)}
          className="mt-1 w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm">
          <option value="">Aucun</option>
          {commerciaux.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
      </label>

      <div className="flex gap-2 mt-3">
        <button onClick={() => valider(true)} disabled={envoi} className="flex-1 bg-vert text-white text-xs px-3 py-2 rounded-sm">
          Valider la résiliation
        </button>
        <button onClick={() => valider(false)} disabled={envoi} className="flex-1 bg-rouille text-white text-xs px-3 py-2 rounded-sm">
          Refuser
        </button>
      </div>
    </div>
  );
}

export default function Rattachements() {
  const [rattachements, setRattachements] = useState<Rattachement[]>([]);
  const [demandes, setDemandes] = useState<DemandeResiliation[]>([]);
  const [formOuvert, setFormOuvert] = useState(false);
  const [chargement, setChargement] = useState(true);

  async function charger() {
    const supabase = getSupabase();
    const [r, d] = await Promise.all([
      supabase.from("rattachements").select("id, service, date_debut, date_fin, statut, commerciaux(nom), entreprises(nom)").order("created_at", { ascending: false }),
      supabase.from("demandes_resiliation").select("id, demandeur, motif, statut, rattachement_id, rattachements(commerciaux(nom), entreprises(nom))").eq("statut", "en_attente"),
    ]);
    setRattachements((r.data ?? []) as unknown as Rattachement[]);
    setDemandes((d.data ?? []) as unknown as DemandeResiliation[]);
    setChargement(false);
  }

  useEffect(() => { charger(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-encre">Rattachements</h1>
          <p className="text-sm text-ardoise/60 mt-1">Contrats commercial ↔ entreprise et résiliations</p>
        </div>
        <button onClick={() => setFormOuvert(!formOuvert)} className="bg-encre text-white text-sm px-4 py-2 rounded-sm">
          {formOuvert ? "Fermer" : "Créer un rattachement"}
        </button>
      </div>

      {formOuvert && <FormulaireRattachement onCree={() => { setFormOuvert(false); charger(); }} />}

      {chargement && <p className="mt-8 text-sm text-ardoise/50">Chargement…</p>}

      {demandes.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-ocre">Demandes de résiliation en attente</h2>
          {demandes.map((d) => <TraiterDemande key={d.id} demande={d} onTraite={charger} />)}
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-medium text-ardoise/60">Tous les rattachements</h2>
        <div className="mt-3 bg-white border border-ardoise/10 rounded-sm divide-y divide-ardoise/10">
          {rattachements.map((r) => (
            <div key={r.id} className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-encre">{r.commerciaux?.nom} ↔ {r.entreprises?.nom}</p>
                <p className="text-xs text-ardoise/50 mt-0.5">
                  {r.service === "service_1_mise_a_disposition" ? "Mise à disposition" : "Gestion complète"}
                  {" · depuis " + r.date_debut}
                </p>
              </div>
              <span className={
                "text-xs px-3 py-1 rounded-full border " +
                (r.statut === "actif" ? "border-vert/40 text-vert" : r.statut === "en_resiliation" ? "border-ocre/40 text-ocre" : "border-rouille/40 text-rouille")
              }>
                {r.statut}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
