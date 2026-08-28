"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

function FormulaireEntreprise({ onDone }: { onDone: () => void }) {
  const [nom, setNom] = useState("");
  const [contact, setContact] = useState("");
  const [telephone, setTelephone] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    await getSupabase().from("entreprises").insert({ nom, contact_nom: contact, contact_telephone: telephone });
    onDone();
  }

  return (
    <form onSubmit={envoyer} className="space-y-2.5">
      <input required placeholder="Nom de l'entreprise" value={nom} onChange={(e) => setNom(e.target.value)} className="w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
      <input required placeholder="Nom du contact" value={contact} onChange={(e) => setContact(e.target.value)} className="w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
      <input required placeholder="Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
      <button disabled={envoi} className="w-full bg-ardoise text-white text-sm px-4 py-2.5 rounded-sm">{envoi ? "Envoi…" : "Valider l'inscription"}</button>
    </form>
  );
}

function FormulaireCommercial({ onDone }: { onDone: () => void }) {
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [zone, setZone] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    await getSupabase().from("commerciaux").insert({ nom, telephone, zone_geographique: zone });
    onDone();
  }

  return (
    <form onSubmit={envoyer} className="space-y-2.5">
      <input required placeholder="Nom complet" value={nom} onChange={(e) => setNom(e.target.value)} className="w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
      <input required placeholder="Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
      <input required placeholder="Zone (ex : Cocody)" value={zone} onChange={(e) => setZone(e.target.value)} className="w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
      <button disabled={envoi} className="w-full bg-ocre text-white text-sm px-4 py-2.5 rounded-sm">{envoi ? "Envoi…" : "Valider l'inscription"}</button>
    </form>
  );
}

export default function Accueil() {
  const [espace, setEspace] = useState<"entreprise" | "commercial" | null>(null);
  const [fait, setFait] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-5 py-4 flex items-center justify-between">
        <span className="font-display text-xl text-encre">Voom Impulse</span>
        <span className="text-xs text-ardoise/40">Connexion — bientôt</span>
      </header>

      <main className="flex-1 flex flex-col justify-center px-5 py-4">
        <p className="text-xs uppercase tracking-widest text-ocre font-medium mb-2">Marketing opérationnel</p>
        <h1 className="font-display text-2xl leading-snug text-encre mb-6">
          Des commerciaux formés, suivis, prêts pour votre marque.
        </h1>

        {!espace && (
          <div className="grid grid-cols-1 gap-3">
            <button onClick={() => setEspace("entreprise")} className="bg-ardoise text-white text-sm font-medium px-5 py-4 rounded-sm text-left">
              Espace Entreprise <span className="block text-xs opacity-70 mt-0.5">Inscrire votre entreprise</span>
            </button>
            <button onClick={() => setEspace("commercial")} className="bg-ocre text-white text-sm font-medium px-5 py-4 rounded-sm text-left">
              Espace Commercial <span className="block text-xs opacity-70 mt-0.5">Créer votre profil</span>
            </button>
          </div>
        )}

        {espace && !fait && (
          <div className="mt-2">
            <button onClick={() => setEspace(null)} className="text-xs text-ardoise/50 mb-3">← Retour</button>
            {espace === "entreprise" ? <FormulaireEntreprise onDone={() => setFait(true)} /> : <FormulaireCommercial onDone={() => setFait(true)} />}
          </div>
        )}

        {fait && <p className="text-sm text-vert mt-2">Inscription enregistrée — nous vous recontactons rapidement.</p>}
      </main>

      <footer className="px-5 py-4 text-xs text-ardoise/40">Voom Impulse — Abidjan</footer>
    </div>
  );
}
