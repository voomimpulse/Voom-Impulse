"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const router = useRouter();

  async function connecter(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    const { error } = await getSupabase().auth.signInWithPassword({ email, password: motDePasse });
    if (error) {
      setErreur("Email ou mot de passe incorrect.");
      setEnvoi(false);
      return;
    }
    router.push("/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-ivoire">
      <form onSubmit={connecter} className="w-full max-w-sm bg-white border border-ardoise/10 rounded-md p-8">
        <img src="/logo.png" alt="Voom Impulse" className="h-10 mb-6" />
        <h1 className="font-display text-xl text-encre mb-6">Connexion</h1>

        <label className="block mb-3">
          <span className="text-xs text-ardoise/60">Email</span>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
        </label>
        <label className="block mb-4">
          <span className="text-xs text-ardoise/60">Mot de passe</span>
          <input required type="password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)}
            className="mt-1 w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
        </label>

        {erreur && <p className="text-xs text-rouille mb-3">{erreur}</p>}

        <button disabled={envoi} className="w-full bg-encre text-white text-sm px-4 py-2.5 rounded-sm">
          {envoi ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
