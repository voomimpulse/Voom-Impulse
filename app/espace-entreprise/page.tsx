"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";

export default function EspaceEntreprise() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [nom, setNom] = useState("");
  const [contact, setContact] = useState("");
  const [telephone, setTelephone] = useState("");
  const [secteur, setSecteur] = useState("");
  const [besoins, setBesoins] = useState("");
  const [objectifs, setObjectifs] = useState("");
  const [collaboration, setCollaboration] = useState("");
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

    const { data: entreprise, error: erreurEntreprise } = await supabase
      .from("entreprises")
      .insert({
        nom, contact_nom: contact, contact_telephone: telephone,
        secteur_activite: secteur, besoins_ressources: besoins,
        objectifs_commerciaux: objectifs, type_collaboration_souhaite: collaboration || null,
      })
      .select()
      .single();

    if (erreurEntreprise || !entreprise) {
      setErreur("Compte créé mais fiche entreprise non enregistrée : " + (erreurEntreprise?.message ?? ""));
      setEnvoi(false);
      return;
    }

    await supabase.from("profils").insert({ id: auth.user.id, role: "entreprise", entreprise_id: entreprise.id });

    router.push("/espace-entreprise/tableau-de-bord");
  }

  return (
    <div className="min-h-screen bg-encre px-5 py-6">
      <a href="/" className="text-white/60 text-sm">← Retour</a>
      <h1 className="text-white font-display text-2xl mt-4">Créer votre compte entreprise</h1>
      <p className="text-white/70 text-sm mt-2">
        Une fois votre compte créé, vous accédez à votre espace pour suivre vos missions.
      </p>

      <form onSubmit={creerCompte} className="space-y-3 mt-6">
        <label className="block">
          <span className="text-xs text-white/70">Email</span>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-white/30 bg-white/10 text-white rounded-sm px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs text-white/70">Mot de passe</span>
          <input required type="password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)}
            className="mt-1 w-full border border-white/30 bg-white/10 text-white rounded-sm px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs text-white/70">Nom de l'entreprise</span>
          <input required value={nom} onChange={(e) => setNom(e.target.value)}
            className="mt-1 w-full border border-white/30 bg-white/10 text-white rounded-sm px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs text-white/70">Nom du contact</span>
          <input required value={contact} onChange={(e) => setContact(e.target.value)}
            className="mt-1 w-full border border-white/30 bg-white/10 text-white rounded-sm px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs text-white/70">Téléphone</span>
          <input required value={telephone} onChange={(e) => setTelephone(e.target.value)}
            className="mt-1 w-full border border-white/30 bg-white/10 text-white rounded-sm px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs text-white/70">Secteur d'activité</span>
          <input value={secteur} onChange={(e) => setSecteur(e.target.value)}
            className="mt-1 w-full border border-white/30 bg-white/10 text-white rounded-sm px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs text-white/70">Type de collaboration souhaitée</span>
          <select required value={collaboration} onChange={(e) => setCollaboration(e.target.value)}
            className="mt-1 w-full border border-white/30 bg-white/10 text-white rounded-sm px-3 py-2 text-sm">
            <option value="" className="text-encre">Sélectionner…</option>
            <option value="service_1_mise_a_disposition" className="text-encre">Mise à disposition de commerciaux</option>
            <option value="service_2_gestion_complete" className="text-encre">Gestion complète de la prospection</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-white/70">Vos besoins en ressources</span>
          <textarea value={besoins} onChange={(e) => setBesoins(e.target.value)} rows={2}
            className="mt-1 w-full border border-white/30 bg-white/10 text-white rounded-sm px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs text-white/70">Vos objectifs commerciaux</span>
          <textarea value={objectifs} onChange={(e) => setObjectifs(e.target.value)} rows={2}
            className="mt-1 w-full border border-white/30 bg-white/10 text-white rounded-sm px-3 py-2 text-sm" />
        </label>

        {erreur && <p className="text-xs text-ocreclair">{erreur}</p>}

        <button disabled={envoi} className="w-full bg-white text-encre font-medium text-sm px-4 py-3 rounded-sm">
          {envoi ? "Création…" : "Créer mon compte"}
        </button>
      </form>
    </div>
  );
}
