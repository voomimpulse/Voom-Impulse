"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

function IconeEntreprise() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6">
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1" strokeLinecap="round" />
    </svg>
  );
}

function IconeCommercial() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6">
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" strokeLinecap="round" />
    </svg>
  );
}

function Chevron() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
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
    await getSupabase().from("entreprises").insert({ nom, contact_nom: contact, contact_telephone: telephone });
    onDone();
  }

  return (
    <form onSubmit={envoyer} className="space-y-2.5 mt-4">
      <input required placeholder="Nom de l'entreprise" value={nom} onChange={(e) => setNom(e.target.value)} className="w-full border border-white/30 bg-white/10 placeholder-white/60 text-white rounded-sm px-3 py-2 text-sm" />
      <input required placeholder="Nom du contact" value={contact} onChange={(e) => setContact(e.target.value)} className="w-full border border-white/30 bg-white/10 placeholder-white/60 text-white rounded-sm px-3 py-2 text-sm" />
      <input required placeholder="Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full border border-white/30 bg-white/10 placeholder-white/60 text-white rounded-sm px-3 py-2 text-sm" />
      <button disabled={envoi} className="w-full bg-white text-encre font-medium text-sm px-4 py-2.5 rounded-sm">{envoi ? "Envoi…" : "Valider l'inscription"}</button>
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
    <form onSubmit={envoyer} className="space-y-2.5 mt-4">
      <input required placeholder="Nom complet" value={nom} onChange={(e) => setNom(e.target.value)} className="w-full border border-white/30 bg-white/10 placeholder-white/60 text-white rounded-sm px-3 py-2 text-sm" />
      <input required placeholder="Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full border border-white/30 bg-white/10 placeholder-white/60 text-white rounded-sm px-3 py-2 text-sm" />
      <input required placeholder="Zone (ex : Cocody)" value={zone} onChange={(e) => setZone(e.target.value)} className="w-full border border-white/30 bg-white/10 placeholder-white/60 text-white rounded-sm px-3 py-2 text-sm" />
      <button disabled={envoi} className="w-full bg-white text-ocre font-medium text-sm px-4 py-2.5 rounded-sm">{envoi ? "Envoi…" : "Valider l'inscription"}</button>
    </form>
  );
}

export default function Accueil() {
  const [ouvert, setOuvert] = useState<"entreprise" | "commercial" | null>(null);
  const [faitEntreprise, setFaitEntreprise] = useState(false);
  const [faitCommercial, setFaitCommercial] = useState(false);

  return (
    <div>
      <header className="px-5 py-4 flex items-center justify-between">
        <img src="/logo.png" alt="Voom Impulse" className="h-10 w-auto" />
        <button className="border border-ardoise text-ardoise text-sm font-medium px-4 py-1.5 rounded-full">
          Connexion
        </button>
      </header>

      <section className="relative h-72 overflow-hidden">
        <img src="/cover.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/60 to-transparent" />
        <div className="relative px-5 pt-4 max-w-[65%]">
          <h1 className="font-display text-2xl leading-snug text-encre">
            Des commerciaux formés, suivis et prêts pour votre marque.
          </h1>
          <p className="mt-3 text-sm text-ardoise/80 leading-relaxed">
            Voom Impulse accompagne les entreprises dans le recrutement et la gestion de leurs
            commerciaux, tout en proposant aux professionnels des missions adaptées à leur profil.
          </p>
        </div>
        <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 400 40" preserveAspectRatio="none">
          <path d="M0,20 C100,40 300,0 400,20 L400,40 L0,40 Z" fill="#F0A22E" opacity="0.9" />
          <path d="M0,28 C120,45 280,10 400,28 L400,40 L0,40 Z" fill="#123A5C" />
        </svg>
      </section>

      <main className="px-5 py-6 space-y-4 bg-white">
        <div className="bg-encre rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <IconeEntreprise />
              </div>
              <div>
                <p className="text-white font-display text-xl leading-tight">ESPACE ENTREPRISE</p>
                <p className="text-ocre text-sm font-medium mt-1">Inscrivez votre entreprise</p>
              </div>
            </div>
            {!ouvert && (
              <button onClick={() => setOuvert("entreprise")} className="shrink-0 mt-1">
                <Chevron />
              </button>
            )}
          </div>
          <p className="text-white/80 text-xs mt-4">
            Commerciaux qualifiés • Gestion de votre prospection • Remplacement assuré
          </p>

          {ouvert === "entreprise" && !faitEntreprise && <FormulaireEntreprise onDone={() => setFaitEntreprise(true)} />}
          {faitEntreprise && <p className="text-white text-sm mt-4">Inscription enregistrée — nous vous recontactons rapidement.</p>}
        </div>

        <div className="bg-ocre rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                <IconeCommercial />
              </div>
              <div>
                <p className="text-white font-display text-xl leading-tight">ESPACE COMMERCIAL</p>
                <p className="text-encre text-sm font-medium mt-1">Créez votre profil</p>
              </div>
            </div>
            {!ouvert && (
              <button onClick={() => setOuvert("commercial")} className="shrink-0 mt-1">
                <Chevron />
              </button>
            )}
          </div>
          <p className="text-white/85 text-xs mt-4">
            Mission terrain • Événementiel • Digital • Télévente — Suivi de vos performances
          </p>

          {ouvert === "commercial" && !faitCommercial && <FormulaireCommercial onDone={() => setFaitCommercial(true)} />}
          {faitCommercial && <p className="text-white text-sm mt-4">Profil enregistré — nous vous recontactons rapidement.</p>}
        </div>

        {ouvert && (
          <button onClick={() => setOuvert(null)} className="text-xs text-ardoise/50">← Fermer</button>
        )}
      </main>

      <footer className="px-5 py-6 text-xs text-ardoise/40 bg-white">Voom Impulse — Abidjan</footer>
    </div>
  );
}
