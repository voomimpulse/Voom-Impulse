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

function MarquePulse() {
  return (
    <svg width="96" height="26" viewBox="0 0 72 20" fill="none" aria-hidden="true">
      <path d="M0 10 H20 L26 2 L32 18 L38 6 L42 10 H72" stroke="#C8963E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function ChampTexte({ label, value, onChange, required = true, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-ardoise/60">{label}</span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-ardoise/20 rounded-sm px-4 py-2.5 text-sm bg-ivoire"
      />
    </label>
  );
}

function ChampSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { valeur: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-xs text-ardoise/60">{label}</span>
      <select
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-ardoise/20 rounded-sm px-4 py-2.5 text-sm bg-ivoire"
      >
        <option value="">Sélectionner…</option>
        {options.map((o) => (
          <option key={o.valeur} value={o.valeur}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function ChampTextarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs text-ardoise/60">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="mt-1 w-full border border-ardoise/20 rounded-sm px-4 py-2.5 text-sm bg-ivoire"
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
    <form onSubmit={envoyer} className="mt-6 space-y-3">
      <ChampTexte label="Nom de l'entreprise" value={nom} onChange={setNom} />
      <ChampTexte label="Nom du contact" value={contact} onChange={setContact} />
      <ChampTexte label="Téléphone" value={telephone} onChange={setTelephone} />
      <ChampTexte label="Secteur d'activité" value={secteur} onChange={setSecteur} required={false} />
      <ChampSelect
        label="Type de collaboration souhaitée"
        value={collaboration}
        onChange={setCollaboration}
        options={[
          { valeur: "service_1_mise_a_disposition", label: "Mise à disposition de commerciaux" },
          { valeur: "service_2_gestion_complete", label: "Gestion complète de la prospection" },
        ]}
      />
      <ChampTextarea label="Vos besoins en ressources" value={besoins} onChange={setBesoins} />
      <ChampTextarea label="Vos objectifs commerciaux" value={objectifs} onChange={setObjectifs} />
      <button disabled={envoi} className="w-full bg-encre text-ivoire text-sm px-5 py-3 rounded-sm hover:bg-ardoise transition-colors">
        {envoi ? "Envoi…" : "Créer votre fiche entreprise"}
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
    <form onSubmit={envoyer} className="mt-6 space-y-3">
      <ChampTexte label="Votre nom complet" value={nom} onChange={setNom} />
      <ChampTexte label="Téléphone" value={telephone} onChange={setTelephone} />
      <ChampTexte label="Votre zone (ex : Cocody, Yopougon…)" value={zone} onChange={setZone} />
      <ChampSelect label="Type de commercial" value={typeCommercial} onChange={setTypeCommercial} options={TYPES_COMMERCIAL} />
      <ChampSelect label="Style d'activité qui vous correspond" value={styleActivite} onChange={setStyleActivite} options={STYLES_ACTIVITE} />
      <ChampTextarea label="Votre expérience pratique" value={experience} onChange={setExperience} />
      <ChampTexte label="Vos compétences (séparées par une virgule)" value={competences} onChange={setCompetences} required={false} />
      <ChampTextarea label="Vos ambitions commerciales" value={ambitions} onChange={setAmbitions} />
      <button disabled={envoi} className="w-full border border-ocre text-ocre text-sm px-5 py-3 rounded-sm hover:bg-ocre hover:text-ivoire transition-colors">
        {envoi ? "Envoi…" : "Créer votre profil commercial"}
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
          <h2 className="font-display text-2xl text-encre mt-1">Créez votre fiche entreprise</h2>
          <ul className="mt-4 space-y-1.5 text-sm text-ardoise/70">
            <li>Mise à disposition de commerciaux qualifiés</li>
            <li>Ou gestion complète de votre prospection</li>
            <li>Remplacement assuré en cas d'absence</li>
          </ul>

          {confirmeEntreprise ? (
            <p className="mt-6 text-sm text-vert">Fiche enregistrée — nous vous recontactons rapidement.</p>
          ) : formOuvert === "entreprise" ? (
            <FormulaireEntreprise onDone={() => setConfirmeEntreprise(true)} />
          ) : (
            <button onClick={() => setFormOuvert("entreprise")}
              className="mt-6 w-full bg-encre text-ivoire text-sm px-5 py-3 rounded-sm hover:bg-ardoise transition-colors">
              S'inscrire comme entreprise
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
          <h2 className="font-display text-2xl text-encre mt-1">Créez votre profil</h2>
          <ul className="mt-4 space-y-1.5 text-sm text-ardoise/70">
            <li>Missions terrain, événementiel, digital, télévente</li>
            <li>Suivi de vos performances</li>
            <li>Plusieurs types de contrats selon la mission</li>
          </ul>

          {confirmeCommercial ? (
            <p className="mt-6 text-sm text-vert">Profil enregistré — nous vous recontactons rapidement.</p>
          ) : formOuvert === "commercial" ? (
            <FormulaireCommercial onDone={() => setConfirmeCommercial(true)} />
          ) : (
            <button onClick={() => setFormOuvert("commercial")}
              className="mt-6 w-full border border-ocre text-ocre text-sm px-5 py-3 rounded-sm hover:bg-ocre hover:text-ivoire transition-colors">
              S'inscrire comme commercial
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
