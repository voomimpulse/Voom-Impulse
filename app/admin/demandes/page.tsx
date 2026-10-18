"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";

interface LigneDemande {
  id: string;
  type: string;
  statut: "nouvelle" | "en_traitement" | "traitee" | "refusee";
  resume: string | null;
  plan_propose: string | null;
  note_admin: string | null;
  created_at: string;
  traitee_at: string | null;
  contenu: { question: string; reponse: string }[] | null;
  role_auteur: string | null;
}

const FILTRES = [
  { id: "", label: "Toutes" },
  { id: "nouvelle", label: "Nouvelles" },
  { id: "en_traitement", label: "En traitement" },
  { id: "traitee", label: "Traitées" },
  { id: "refusee", label: "Refusées" },
];

const LABEL_TYPE: Record<string, string> = {
  inscription_entreprise: "Inscription entreprise",
  inscription_commercial: "Inscription commercial",
  nouvelle_mission: "Nouvelle mission",
  ajouter_commerciaux: "Ajout de commerciaux",
  changer_zone_objectifs: "Changement de zone ou d'objectifs",
  changer_metier: "Changement de métier",
  maj_dispo_zone: "Mise à jour disponibilité ou zone",
  ajouter_competence: "Ajout de compétence ou expérience",
  autre: "Autre question",
};

const LABEL_STATUT: Record<string, string> = {
  nouvelle: "Nouvelle",
  en_traitement: "En traitement",
  traitee: "Traitée",
  refusee: "Refusée",
};

function couleurStatut(statut: string) {
  return statut === "nouvelle" ? "text-ocre font-medium"
    : statut === "refusee" ? "text-rouille font-medium"
    : statut === "traitee" ? "text-vert font-medium"
    : "text-ardoise/60";
}

export default function PageDemandes() {
  const [demandes, setDemandes] = useState<LigneDemande[]>([]);
  const [noms, setNoms] = useState<Record<string, string>>({});
  const [filtre, setFiltre] = useState("");
  const [chargement, setChargement] = useState(true);
  const [detailOuvert, setDetailOuvert] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [erreur, setErreur] = useState("");
  const router = useRouter();

  async function jeton(): Promise<string | null> {
    const { data: session } = await getSupabase().auth.getSession();
    if (!session.session) { router.push("/login"); return null; }
    return session.session.access_token;
  }

  async function charger() {
    const t = await jeton();
    if (!t) return;
    const url = "/api/admin/demandes" + (filtre ? `?statut=${filtre}` : "");
    const reponse = await fetch(url, { headers: { Authorization: "Bearer " + t } });
    const data = await reponse.json();
    if (!reponse.ok) { setErreur(data.erreur ?? "Erreur"); return; }
    setErreur("");
    const liste: LigneDemande[] = data.demandes ?? [];
    setDemandes(liste);

    // Nom de l'auteur (jointure côté serveur : entreprises ou commerciaux).
    const misses: Record<string, string> = {};
    for (const d of liste as unknown as { id: string; entreprises?: { nom?: string | null }; commerciaux?: { nom?: string | null } }[]) {
      const ident = d.entreprises?.nom ?? d.commerciaux?.nom ?? null;
      if (ident) misses[d.id] = ident;
    }
    setNoms(misses);
    setChargement(false);
  }

  useEffect(() => { charger(); }, [filtre]);

  async function changerStatut(id: string, statut: string, noteAdmin?: string) {
    const t = await jeton();
    if (!t) return;
    const reponse = await fetch("/api/admin/demandes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + t },
      body: JSON.stringify({ id, statut, note_admin: noteAdmin }),
    });
    const data = await reponse.json();
    if (!reponse.ok) { setErreur(data.erreur ?? "Erreur"); return; }
    setDetailOuvert(null);
    charger();
  }

  if (chargement) return <p className="text-sm text-ardoise/50">Chargement…</p>;

  return (
    <div>
      <h1 className="font-display text-2xl text-encre">Demandes de l'assistant</h1>
      <p className="text-sm text-ardoise/60 mt-1">
        Inscriptions enrichies et demandes envoyées via l'assistant, à traiter par l'administrateur.
      </p>

      <div className="flex flex-wrap gap-2 mt-6">
        {FILTRES.map((f) => (
          <button key={f.id} onClick={() => setFiltre(f.id)}
            className={"text-xs rounded-full px-3 py-1.5 border " + (filtre === f.id ? "bg-encre text-white border-encre" : "bg-white text-encre border-ardoise/20")}>
            {f.label}
          </button>
        ))}
      </div>

      {erreur && <p className="text-xs text-rouille mt-4">{erreur}</p>}

      <div className="mt-4 bg-white border border-ardoise/10 rounded-sm divide-y divide-ardoise/10">
        {demandes.length === 0 && <p className="px-5 py-4 text-sm text-ardoise/40">Aucune demande.</p>}
        {demandes.map((d) => (
          <div key={d.id} className="px-5 py-3">
            <div className="flex items-center justify-between gap-3 cursor-pointer" onClick={() => { setDetailOuvert(detailOuvert === d.id ? null : d.id); setNote(d.note_admin ?? ""); }}>
              <div>
                <span className="text-sm text-encre">{LABEL_TYPE[d.type] ?? d.type}</span>
                {noms[d.id] && <span className="text-ardoise/40 text-xs ml-2">{noms[d.id]}</span>}
                <span className="text-ardoise/40 text-xs ml-2">
                  {new Date(d.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={"text-xs " + couleurStatut(d.statut)}>{LABEL_STATUT[d.statut]}</span>
              </div>
            </div>
            <p className="text-xs text-ardoise/50 mt-1 line-clamp-2">{d.resume ?? ""}</p>

            {detailOuvert === d.id && (
              <div className="mt-3 bg-ivoire border border-ardoise/10 rounded-sm p-4">
                <h3 className="text-xs font-medium text-ardoise/60">Réponses de la personne</h3>
                <div className="divide-y divide-ardoise/10 mt-1">
                  {(d.contenu ?? []).map((c, i) => (
                    <div key={i} className="py-2 text-sm grid grid-cols-2 gap-3">
                      <span className="text-ardoise/60">{c.question}</span>
                      <span className="text-encre break-words">{c.reponse}</span>
                    </div>
                  ))}
                </div>

                {d.plan_propose && (
                  <>
                    <h3 className="text-xs font-medium text-ardoise/60 mt-4">Plan proposé</h3>
                    <p className="text-sm text-encre whitespace-pre-wrap mt-1">{d.plan_propose}</p>
                  </>
                )}

                <h3 className="text-xs font-medium text-ardoise/60 mt-4">Note interne</h3>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                  placeholder="Note interne (non visible par la personne)"
                  className="w-full mt-1 border border-ardoise/20 rounded-sm px-3 py-2 text-sm" />

                <div className="flex flex-wrap gap-2 mt-3">
                  <button disabled={d.statut === "en_traitement"} onClick={() => changerStatut(d.id, "en_traitement", note)}
                    className="text-xs bg-ocre text-white px-3 py-1.5 rounded-sm disabled:opacity-40">En traitement</button>
                  <button disabled={d.statut === "traitee"} onClick={() => changerStatut(d.id, "traitee", note)}
                    className="text-xs bg-vert text-white px-3 py-1.5 rounded-sm disabled:opacity-40">Traitée</button>
                  <button disabled={d.statut === "refusee"} onClick={() => changerStatut(d.id, "refusee", note)}
                    className="text-xs bg-rouille text-white px-3 py-1.5 rounded-sm disabled:opacity-40">Refusée</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
