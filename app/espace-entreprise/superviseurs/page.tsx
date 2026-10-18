"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";

interface Superviseur {
  id: string;
  nom: string | null;
  email: string;
}

export default function SuperviseursEntreprise() {
  const [pret, setPret] = useState(false);
  const [jeton, setJeton] = useState("");
  const [liste, setListe] = useState<Superviseur[]>([]);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [confirmer, setConfirmer] = useState<string | null>(null);
  const router = useRouter();

  async function charger() {
    const supabase = getSupabase();
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) { router.push("/login"); return; }
    const { data: profil } = await supabase.from("profils").select("role").eq("id", session.session.user.id).single();
    if (profil?.role !== "entreprise") { router.push("/login"); return; }

    const token = session.session.access_token;
    setJeton(token);
    const reponse = await fetch("/api/superviseurs", { headers: { Authorization: `Bearer ${token}` } });
    const json = await reponse.json();
    setListe(json.superviseurs ?? []);
    setPret(true);
  }

  useEffect(() => { charger(); }, []);

  async function creer(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    const reponse = await fetch("/api/superviseurs", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${jeton}` },
      body: JSON.stringify({ nom, email, motDePasse }),
    });
    const json = await reponse.json();
    if (!reponse.ok) { setErreur(json.erreur ?? "Création impossible"); setEnvoi(false); return; }
    setNom(""); setEmail(""); setMotDePasse(""); setEnvoi(false);
    charger();
  }

  async function supprimer(id: string) {
    await fetch("/api/superviseurs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${jeton}` },
      body: JSON.stringify({ id }),
    });
    setConfirmer(null);
    charger();
  }

  if (!pret) return <div className="min-h-screen flex items-center justify-center text-sm text-ardoise/50">Chargement…</div>;

  return (
    <div className="min-h-screen bg-ivoire px-5 py-6">
      <a href="/espace-entreprise/tableau-de-bord" className="text-xs text-ardoise/50">← Retour au tableau de bord</a>
      <h1 className="font-display text-xl text-encre mt-4">Mes superviseurs</h1>
      <p className="text-sm text-ardoise/60 mt-1">
        Un superviseur crée les missions et suit la présence de vos commerciaux loués (mise à disposition).
      </p>

      <h2 className="text-sm font-medium text-ardoise/60 mt-8">Superviseurs actuels</h2>
      <div className="mt-3 bg-white border border-ardoise/10 rounded-sm divide-y divide-ardoise/10">
        {liste.length === 0 && <p className="px-4 py-4 text-sm text-ardoise/40">Aucun superviseur pour l'instant.</p>}
        {liste.map((s) => (
          <div key={s.id} className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm text-encre">{s.nom ?? "—"}</p>
              <p className="text-xs text-ardoise/50">{s.email}</p>
            </div>
            {confirmer === s.id ? (
              <button onClick={() => supprimer(s.id)} className="text-xs text-white bg-rouille px-2 py-1 rounded-sm">Confirmer</button>
            ) : (
              <button onClick={() => setConfirmer(s.id)} className="text-xs text-rouille underline">Supprimer</button>
            )}
          </div>
        ))}
      </div>

      <h2 className="text-sm font-medium text-ardoise/60 mt-8">Créer un superviseur</h2>
      <form onSubmit={creer} className="mt-3 bg-white border border-ardoise/10 rounded-sm p-5 space-y-3">
        <label className="block">
          <span className="text-xs text-ardoise/60">Nom complet</span>
          <input required value={nom} onChange={(e) => setNom(e.target.value)}
            className="mt-1 w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs text-ardoise/60">Email</span>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs text-ardoise/60">Mot de passe (8 caractères minimum, à lui communiquer)</span>
          <input required type="password" minLength={8} value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)}
            className="mt-1 w-full border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />
        </label>
        {erreur && <p className="text-xs text-rouille">{erreur}</p>}
        <button disabled={envoi} className="w-full bg-encre text-white text-sm px-4 py-2.5 rounded-sm">
          {envoi ? "Création…" : "Créer le compte superviseur"}
        </button>
      </form>
    </div>
  );
}
