"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function EspaceCommercial() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [zone, setZone] = useState("");
  const [typeCommercial, setTypeCommercial] = useState("");
  const [styleActivite, setStyleActivite] = useState("");
  const [experience, setExperience] = useState("");
  const [competences, setCompetences] = useState("");
  const [ambitions, setAmbitions] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const router = useRouter();

  async function creerCompte(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    const supabase = getSupabase();

    const { data: auth, error: erreurAuth } = await supabase.auth.signUp({ email, password: motDePasse });
    if (erreurAuth || !auth.user) {
      setErreur("Impossible de créer le compte : " + (erreurAuth?.message ?? ""));
      setEnvoi(false);
      return;
    }

    const { data: commercial, error: erreurCommercial } = await supabase
      .from("commerciaux")
      .insert({
        nom,
        telephone,
        zone_geographique: zone,
        type_commercial: typeCommercial || null,
        style_activite: styleActivite || null,
        experience,
        competences: competences ? competences.split(",").map((c) => c.trim()) : [],
        ambitions_commerciales: ambitions,
      })
      .select()
      .single();

    if (erreurCommercial || !commercial) {
      setErreur("Compte créé mais profil non enregistré : " + (erreurCommercial?.message ?? ""));
      setEnvoi(false);
      return;
    }

    await supabase.from("profils").insert({ id: auth.user.id, role: "commercial", commercial_id: commercial.id });

    router.push("/espace-commercial/tableau-de-bord");
  }

  return (
    <div className="min-h-screen bg-ocre px-5 py-6">
      <a href="/" className="text-encre/60 text-sm">← Retour</a>
      <h1 className="text-encre font-display text-2xl mt-4">Créer votre compte commercial</h1>
      <p className="text-encre/70 text-sm mt-2">
        Une fois votre compte créé, vous accédez à votre espace pour suivre vos missions.
      </p>

      <form onSubmit={creerCompte} className="space-y-3 mt-6">
        <label className="block">
          <span className="text-xs text-encre/70">Email</span>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-encre/20 bg-white text-encre rounded-sm px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs text-encre/70">Mot de passe</span>
          <input required type="password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)}
            className="mt-1 w-full border border-encre/20 bg-white text-encre rounded-sm px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs text-encre/70">Nom complet</span>
          <input required value={nom} onChange={(e) => setNom(e.target.value)}
            className="mt-1 w-full border border-encre/20 bg-white text-encre rounded-sm px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs text-encre/70">Téléphone</span>
          <input required value={telephone} onChange={(e) => setTelephone(e.target.value)}
            className="mt-1 w-full border border-encre/20 bg-white text-encre rounded-sm px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs text-encre/70">Zone (ex : Cocody, Yopougon…)</span>
          <input required value={zone} onChange={(e) => setZone(e.target.value)}
            className="mt-1 w-full border border-encre/20 bg-white text-encre rounded-sm px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs text-encre/70">Type de commercial</span>
          <select required value={typeCommercial} onChange={(e) => setTypeCommercial(e.target.value)}
            className="mt-1 w-full border border-encre/20 bg-white text-encre rounded-sm px-3 py-2 text-sm">
            <option value="">Sélectionner…</option>
            {TYPES_COMMERCIAL.map((o) => <option key={o.valeur} value={o.valeur}>{o.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-encre/70">Style d'activité</span>
          <select required value={styleActivite} onChange={(e) => setStyleActivite(e.target.value)}
            className="mt-1 w-full border border-encre/20 bg-white text-encre rounded-sm px-3 py-2 text-sm">
            <option value="">Sélectionner…</option>
            {STYLES_ACTIVITE.map((o) => <option key={o.valeur} value={o.valeur}>{o.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-encre/70">Votre expérience pratique</span>
          <textarea value={experience} onChange={(e) => setExperience(e.target.value)} rows={2}
            className="mt-1 w-full border border-encre/20 bg-white text-encre rounded-sm px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs text-encre/70">Compétences (séparées par une virgule)</span>
          <input value={competences} onChange={(e) => setCompetences(e.target.value)}
            className="mt-1 w-full border border-encre/20 bg-white text-encre rounded-sm px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs text-encre/70">Vos ambitions commerciales</span>
          <textarea value={ambitions} onChange={(e) => setAmbitions(e.target.value)} rows={2}
            className="mt-1 w-full border border-encre/20 bg-white text-encre rounded-sm px-3 py-2 text-sm" />
        </label>

        {erreur && <p className="text-xs text-rouille">{erreur}</p>}

        <button disabled={envoi} className="w-full bg-encre text-white font-medium text-sm px-4 py-3 rounded-sm">
          {envoi ? "Création…" : "Créer mon profil"}
        </button>
      </form>
    </div>
  );
}
