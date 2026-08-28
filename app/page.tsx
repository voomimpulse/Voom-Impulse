"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

const TYPES_COMMERCIAL = [
  { valeur: "terrain", label: "Commercial terrain" },
  { valeur: "hote_hotesse", label: "Hôte / hôtesse" },
  { valeur: "promoteur", label: "Promoteur" },
  { valeur: "animateur", label: "Animateur" },
  { valeur: "rayonniste", label: "Rayonniste" },
  { valeur: "superviseur", label: "Superviseur" },
  { valeur: "teleoperateur", label: "Téléopérateur" },
  { valeur: "commercial_digital", label: "Commercial digital" },
];

const STYLES_ACTIVITE = [
  { valeur: "terrain", label: "Terrain" },
  { valeur: "operationnel", label: "Opérationnel" },
  { valeur: "evenementiel", label: "Événementiel" },
  { valeur: "promotionnel", label: "Promotionnel" },
  { valeur: "digital", label: "Digital" },
  { valeur: "teletravail", label: "Télétravail" },
];

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

function ChampClair({ label, value, onChange, required = true }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs text-white/70">{label}</span>
      <input
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-white/30 bg-white/10 text-white placeholder-white/40 rounded-sm px-3 py-2 text-sm"
      />
    </label>
  );
}

function SelectClair({ label, value, onChange, options, sombre = false }: {
  label: string; value: string; onChange: (v: string) => void; options: { valeur: string; label: string }[]; sombre?: boolean;
}) {
  return (
    <label className="block">
      <span className={sombre ? "text-xs text-encre/70" : "text-xs text-white/70"}>{label}</span>
      <select
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={
          sombre
            ? "mt-1 w-full border border-encre/20 bg-white text-encre rounded-sm px-3 py-2 text-sm"
            : "mt-1 w-full border border-white/30 bg-white/10 text-white rounded-sm px-3 py-2 text-sm"
        }
      >
        <option value="" className="text-encre">Sélectionner…</option>
        {options.map((o) => (
          <option key={o.valeur} value={o.valeur} className="text-encre">{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function ZoneClaire({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs text-white/70">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="mt-1 w-full border border-white/30 bg-white/10 text-white placeholder-white/40 rounded-sm px-3 py-2 text-sm"
      />
    </label>
  );
}

function FormulaireEntreprise({ onDone }: { onDone: () => void }) {
  const [nom, setNom] = useState("");
  const [contact, setContact] = useState("");
  const [telephone, setTelephone] = useState("");
  const [secteur, setSecteur] = useState("");
  const [besoins, setBesoins] = useState("");
  const [objectifs, setObjectifs] = useState("");
  const [collaboration, setCollaboration] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    await getSupabase().from("entreprises").insert({
      nom,
      contact_nom: contact,
      contact_telephone: telephone,
      secteur_activite: secteur,
      besoins_ressources: besoins,
      objectifs_commerciaux: objectifs,
      type_collaboration_souhaite: collaboration || null,
    });
    onDone();
  }

  return (
    <form onSubmit={envoyer} className="space-y-3 mt-4">
      <ChampClair label="Nom de l'entreprise" value={nom} onChange={setNom} />
      <ChampClair label="Nom du contact" value={contact} onChange={setContact} />
      <ChampClair label="Téléphone" value={telephone} onChange={setTelephone} />
      <ChampClair label="Secteur d'activité" value={secteur} onChange={setSecteur} required={false} />
      <SelectClair
        label="Type de collaboration souhaitée"
        value={collaboration}
        onChange={setCollaboration}
        options={[
          { valeur: "service_1_mise_a_disposition", label: "Mise à disposition de commerciaux" },
          { valeur: "service_2_gestion_complete", label: "Gestion complète de la prospection" },
        ]}
      />
      <ZoneClaire label="Vos besoins en ressources" value={besoins} onChange={setBesoins} />
      <ZoneClaire label="Vos objectifs commerciaux" value={objectifs} onChange={setObjectifs} />
      <button disabled={envoi} className="w-full bg-white text-encre font-medium text-sm px-4 py-2.5 rounded-sm">
        {envoi ? "Envoi…" : "Envoyer ma demande"}
      </button>
    </form>
  );
}

function FormulaireCommercial({ onDone }: { onDone: () => void }) {
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [zone, setZone] = useState("");
  const [typeCommercial, setTypeCommercial] = useState("");
  const [styleActivite, setStyleActivite] = useState("");
  const [experience, setExperience] = useState("");
  const [competences, setCompetences] = useState("");
  const [ambitions, setAmbitions] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    await getSupabase().from("commerciaux").insert({
      nom,
      telephone,
      zone_geographique: zone,
      type_commercial: typeCommercial || null,
      style_activite: styleActivite || null,
      experience,
      competences: competences ? competences.split(",").map((c) => c.trim()) : [],
      ambitions_commerciales: ambitions,
    });
    onDone();
  }

  return (
    <form onSubmit={envoyer} className="space-y-3 mt-4">
      <ChampClair label="Nom complet" value={nom} onChange={setNom} />
      <ChampClair label="Téléphone" value={telephone} onChange={setTelephone} />
      <ChampClair label="Zone (ex : Cocody, Yopougon…)" value={zone} onChange={setZone} />
      <SelectClair label="Type de commercial" value={typeCommercial} onChange={setTypeCommercial} options={TYPES_COMMERCIAL} sombre />
      <SelectClair label="Style d'activité" value={styleActivite} onChange={setStyleActivite} options={STYLES_ACTIVITE} sombre />
      <ZoneClaire label="Votre expérience pratique" value={experience} onChange={setExperience} />
      <ChampClair label="Compétences (séparées par une virgule)" value={competences} onChange={setCompetences} required={false} />
      <ZoneClaire label="Vos ambitions commerciales" value={ambitions} onChange={setAmbitions} />
      <button disabled={envoi} className="w-full bg-encre text-white font-medium text-sm px-4 py-2.5 rounded-sm">
        {envoi ? "Envoi…" : "Créer mon profil"}
      </button>
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
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/10" />
        <div className="relative px-5 pt-4 max-w-[68%]">
          <h1 className="font-display text-2xl leading-snug text-encre font-semibold">
            Des commerciaux formés, suivis et prêts pour votre marque.
          </h1>
          <p className="mt-3 text-sm text-encre/75 leading-relaxed">
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
          {faitEntreprise && <p className="text-white text-sm mt-4">Demande enregistrée — nous évaluons votre besoin et revenons vers vous.</p>}
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
          {faitCommercial && <p className="text-white text-sm mt-4">Profil enregistré — vous serez contacté dès qu'une mission correspond.</p>}
        </div>

        {ouvert && (
          <button onClick={() => setOuvert(null)} className="text-xs text-ardoise/50">← Fermer</button>
        )}
      </main>

      <footer className="px-5 py-6 text-xs text-ardoise/40 bg-white">Voom Impulse — Abidjan</footer>
    </div>
  );
}
