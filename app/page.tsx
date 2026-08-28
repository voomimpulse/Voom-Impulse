"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

function MarquePulse() {
  return (
    <svg width="96" height="26" viewBox="0 0 72 20" fill="none" aria-hidden="true">
      <path d="M0 10 H20 L26 2 L32 18 L38 6 L42 10 H72" stroke="#C8963E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function FormulaireEntreprise({ onDone }: { onDone: () => void }) {
  const [nom, setNom] = useState("");
  const [contact, setContact] = useState("");
  const [telephone, setTelephone] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    await getSupabase().from("entreprises").insert({
      nom, contact_nom: contact, contact_telephone: telephone,
    });
    onDone();
  }

  return (
    <form onSubmit={envoyer} className="mt-6 space-y-3">
      <input required placeholder="Nom de l'entreprise" value={nom} onChange={(e) => setNom(e.target.value)}
        className="w-full border border-ardoise/20 rounded-sm px-4 py-2.5 text-sm bg-ivoire" />
      <input required placeholder="Nom du contact" value={contact} onChange={(e) => setContact(e.target.value)}
        className="w-full border border-ardoise/20 rounded-sm px-4 py-2.5 text-sm bg-ivoire" />
      <input required placeholder="Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)}
        className="w-full border border-ardoise/20 rounded-sm px-4 py-2.5 text-sm bg-ivoire" />
      <button disabled={envoi} className="w-full bg-encre text-ivoire text-sm px-5 py-3 rounded-sm hover:bg-ardoise transition-colors">
        {envoi ? "Envoi..." : "Envoyer la demande"}
      </button>
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
    await getSupabase().from("commerciaux").insert({
      nom, telephone, zone_geographique: zone,
    });
    onDone();
  }

  return (
    <form onSubmit={envoyer} className="mt-6 space-y-3">
      <input required placeholder="Votre nom complet" value={nom} onChange={(e) => setNom(e.target.value)}
        className="w-full border border-ardoise/20 rounded-sm px-4 py-2.5 text-sm bg-ivoire" />
      <input required placeholder="Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)}
        className="w-full border border-ardoise/20 rounded-sm px-4 py-2.5 text-sm bg-ivoire" />
      <input required placeholder="Votre zone (ex: Cocody, Yopougon...)" value={zone} onChange={(e) => setZone(e.target.value)}
        className="w-full border border-ardoise/20 rounded-sm px-4 py-2.5 text-sm bg-ivoire" />
      <button disabled={envoi} className="w-full border border-ocre text-ocre text-sm px-5 py-3 rounded-sm hover:bg-ocre hover:text-ivoire transition-colors">
        {envoi ? "Envoi..." : "Postuler"}
      </button>
    </form>
  );
}

export default function Accueil() {
  const [formOuvert, setFormOuvert] = useState<"entreprise" | "commercial" | null>(null);
  const [confirmeEntreprise, setConfirmeEntreprise] = useState(false);
  const [confirmeCommercial, setConfirmeCommercial] = useState(false);

  return (
    <div>
      <header className="px-6 py-5 flex items-center gap-3 border-b border-ardoise/10">
        <MarquePulse />
        <span className="font-display text-lg text-encre">Voom Impulse</span>
      </header>

      <section className="px-6 pt-14 pb-10">
        <p className="text-xs uppercase tracking-widest text-ocre mb-4 font-medium">Marketing opérationnel</p>
        <h1 className="font-display text-4xl leading-[1.15] text-encre">
          Des commerciaux formés, suivis, et prêts à représenter votre marque.
        </h1>
        <p className="mt-6 text-ardoise/70 leading-relaxed">
          Voom Impulse recrute, forme et déploie des commerciaux sur le terrain — en mise à
          disposition pour renforcer vos équipes, ou en gestion complète de votre prospection.
        </p>
      </section>

      <section className="px-6 pb-8">
        <div className="border border-ardoise/10 bg-white rounded-md p-6 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-ocre/15 flex items-center justify-center mb-4">
            <span className="text-ocre font-display text-lg">E</span>
          </div>
          <p className="text-xs uppercase tracking-wide text-ardoise/50">Pour les entreprises</p>
          <h2 className="font-display text-2xl text-encre mt-1">Renforcez votre force de vente</h2>
          <ul className="mt-4 space-y-1.5 text-sm text-ardoise/70">
            <li>Mise à disposition de commerciaux qualifiés</li>
            <li>Ou gestion complète de votre prospection</li>
            <li>Remplacement assuré en cas d'absence</li>
          </ul>

          {confirmeEntreprise ? (
            <p className="mt-6 text-sm text-vert">Demande envoyée — nous vous recontactons rapidement.</p>
          ) : formOuvert === "entreprise" ? (
            <FormulaireEntreprise onDone={() => setConfirmeEntreprise(true)} />
          ) : (
            <button onClick={() => setFormOuvert("entreprise")}
              className="mt-6 w-full bg-encre text-ivoire text-sm px-5 py-3 rounded-sm hover:bg-ardoise transition-colors">
              Discuter de vos besoins
            </button>
          )}
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="border border-ardoise/10 bg-white rounded-md p-6 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-encre/10 flex items-center justify-center mb-4">
            <span className="text-encre font-display text-lg">C</span>
          </div>
          <p className="text-xs uppercase tracking-wide text-ardoise/50">Pour les commerciaux</p>
          <h2 className="font-display text-2xl text-encre mt-1">Rejoignez le vivier</h2>
          <ul className="mt-4 space-y-1.5 text-sm text-ardoise/70">
            <li>Missions terrain, événementiel, digital, télévente</li>
            <li>Suivi de vos performances</li>
            <li>Plusieurs types de contrats selon la mission</li>
          </ul>

          {confirmeCommercial ? (
            <p className="mt-6 text-sm text-vert">Candidature envoyée — nous vous recontactons rapidement.</p>
          ) : formOuvert === "commercial" ? (
            <FormulaireCommercial onDone={() => setConfirmeCommercial(true)} />
          ) : (
            <button onClick={() => setFormOuvert("commercial")}
              className="mt-6 w-full border border-ocre text-ocre text-sm px-5 py-3 rounded-sm hover:bg-ocre hover:text-ivoire transition-colors">
              Postuler
            </button>
          )}
        </div>
      </section>

      <footer className="px-6 py-8 border-t border-ardoise/10 text-xs text-ardoise/40">
        Voom Impulse — Abidjan, Côte d'Ivoire
      </footer>
    </div>
  );
}
