"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";

// Inscription réduite : email + mot de passe, c'est tout. La fiche reste vide
// ("À compléter") et l'assistant prend le relais pour remplir le compte.
export default function EspaceEntreprise() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
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
    if (auth.user.identities?.length === 0) {
      setErreur("Un compte existe déjà avec cet email. Connectez-vous plutôt.");
      setEnvoi(false);
      return;
    }

    // signUp ne renvoie pas toujours une session (ex : confirmation d'email activée).
    // Sans session, Supabase ne reçoit pas de JWT et la suite échoue : on se
    // connecte donc explicitement avant d'appeler le serveur.
    if (!auth.session) {
      const { error: erreurConnexion } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
      if (erreurConnexion) {
        setErreur("Compte créé, mais connexion automatique impossible. Connectez-vous puis appelez l'assistant. (" + erreurConnexion.message + ")");
        setEnvoi(false);
        return;
      }
    }

    // On valide la session en re-téléchargeant l'utilisateur auprès du serveur
    // d'authentification avant d'appeler l'API.
    const { data: { user: utilisateurConnecte }, error: erreurGetUser } = await supabase.auth.getUser();
    if (erreurGetUser || !utilisateurConnecte) {
      setErreur("Session utilisateur introuvable : " + (erreurGetUser?.message ?? "aucun utilisateur connecté"));
      setEnvoi(false);
      return;
    }

    // La fiche minimale et le profil sont créés côté serveur (aucun blocage RLS).
    const { data: jetons } = await supabase.auth.getSession();
    const jeton = jetons.session?.access_token ?? "";
    const reponse = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + jeton },
      body: JSON.stringify({ action: "inscrire", cible: "entreprise" }),
    });
    const resultat = await reponse.json();
    if (!reponse.ok) {
      setErreur("Compte créé mais profil non enregistré : " + (resultat.erreur ?? ""));
      setEnvoi(false);
      return;
    }

    router.push("/assistant");
  }

  return (
    <div className="min-h-screen bg-encre px-5 py-6">
      <a href="/" className="text-white/60 text-sm">← Retour</a>
      <h1 className="text-white font-display text-2xl mt-4">Créer votre compte entreprise</h1>
      <p className="text-white/70 text-sm mt-2">
        Renseignez seulement votre email et un mot de passe. Ensuite, notre assistant pose
        quelques questions simples pour remplir votre fiche à votre place.
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

        {erreur && <p className="text-xs text-ocreclair">{erreur}</p>}

        <button disabled={envoi} className="w-full bg-white text-encre font-medium text-sm px-4 py-3 rounded-sm">
          {envoi ? "Création…" : "Créer mon compte"}
        </button>

        <p className="text-center text-xs text-white/60 mt-4">
          Vous avez déjà un compte ?{" "}
          <a href="/login" className="text-white underline">
            Se connecter
          </a>
        </p>
      </form>
    </div>
  );
}
