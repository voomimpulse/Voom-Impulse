"use client";
export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";

// L'assistant conversationnel Voom Impulse.
// En phase 1, tout fonctionne en MODE BOUTONS (robuste, sans dépendance IA) :
// le serveur pilote les étapes du script et décide de la prochaine question.

interface EtapeClient {
  id: string;
  texte: string;
  type: "libre" | "unique" | "multiple";
  options: { valeur: string; label: string }[] | null;
  max: number;
  facultatif: boolean;
}

interface ReponseLisible {
  id: string;
  question: string;
  reponse: string;
}

interface EtatReponse {
  mode: "conversation" | "menu";
  session_id?: string;
  cible?: "entreprise" | "commercial";
  type_demande?: string;
  etape?: EtapeClient | null;
  index?: number;
  total?: number;
  reponses?: ReponseLisible[];
  menu?: { id: string; label: string; description: string }[];
  erreur?: string;
  redirection?: string | null;
}

export default function PageAssistant() {
  const [phase, setPhase] = useState<"chargement" | "conversation" | "menu" | "fin">("chargement");
  const [messageFin, setMessageFin] = useState<string>("");
  const [redirectionFin, setRedirectionFin] = useState<string | null>(null);
  const [erreur, setErreur] = useState("");
  const [etape, setEtape] = useState<EtapeClient | null>(null);
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [reponses, setReponses] = useState<ReponseLisible[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cible, setCible] = useState<"entreprise" | "commercial" | null>(null);
  const [saisie, setSaisie] = useState("");
  const [selections, setSelections] = useState<string[]>([]);
  const [menu, setMenu] = useState<EtatReponse["menu"]>([]);
  const [modifierOuvert, setModifierOuvert] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const finMessagesRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  async function appelle(corps: Record<string, unknown>): Promise<EtatReponse | null> {
    const supabase = getSupabase();
    const { data: jetons } = await supabase.auth.getSession();
    if (!jetons.session) {
      router.push("/login");
      return null;
    }
    try {
      const reponse = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + jetons.session.access_token,
        },
        body: JSON.stringify(corps),
      });
      const data = await reponse.json();
      if (!reponse.ok) {
        setErreur(data.erreur ?? "Erreur inattendue");
        return null;
      }
      return data as EtatReponse;
    } catch {
      setErreur("Connexion impossible. Vérifiez votre accès à internet.");
      return null;
    }
  }

  function appliqueEtat(etat: EtatReponse) {
    if (etat.mode === "menu") {
      setMenu(etat.menu ?? []);
      setPhase("menu");
      return;
    }
    setReponses(etat.reponses ?? []);
    setEtape(etat.etape ?? null);
    setIndex(etat.index ?? 0);
    setTotal(etat.total ?? 0);
    setSessionId(etat.session_id ?? null);
    setCible(etat.cible ?? null);
    setSaisie("");
    setSelections([]);
    setErreur("");
    setModifierOuvert(false);
    setPhase("conversation");
  }

  useEffect(() => {
    (async () => {
      const etat = await appelle({ action: "session" });
      if (etat) appliqueEtat(etat);
      else setPhase("conversation");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    finMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [reponses, etape]);

  async function repondre(valeur: string | string[]) {
    if (!etape || !sessionId || envoi) return;
    setEnvoi(true);
    setErreur("");
    const etat = await appelle({
      action: "repondre",
      session_id: sessionId,
      etape_id: etape.id,
      valeur,
    });
    if (etat) appliqueEtat(etat);
    setEnvoi(false);
  }

  async function retour(etapeId: string) {
    if (!sessionId || envoi) return;
    setEnvoi(true);
    setErreur("");
    const etat = await appelle({
      action: "retour",
      session_id: sessionId,
      etape_id: etapeId,
    });
    if (etat) appliqueEtat(etat);
    setEnvoi(false);
  }

  async function recommencer() {
    if (!sessionId || envoi) return;
    if (!confirm("Voulez-vous vraiment recommencer ce questionnaire depuis le début ?")) return;
    setEnvoi(true);
    setErreur("");
    const etat = await appelle({ action: "recommencer", session_id: sessionId });
    if (etat) appliqueEtat(etat);
    setEnvoi(false);
  }

  async function validerFinalisation() {
    if (!sessionId || envoi) return;
    setEnvoi(true);
    setErreur("");
    const etat: any = await appelle({ action: "terminer", session_id: sessionId });
    setEnvoi(false);
    if (etat?.ok) {
      setRedirectionFin(etat.redirection ?? null);
      setMessageFin(
        cible === "entreprise"
          ? "Votre demande et vos besoins ont bien été enregistrés. Un conseiller Voom Impulse reviendra vers vous très vite pour valider le plan et démarrer votre collaboration."
          : "Félicitations ! Votre profil commercial a bien été enregistré dans le vivier Voom Impulse. Vous serez contacté dès qu'une mission correspond à vos critères."
      );
      setPhase("fin");
      return;
    }
    if (etat?.erreur) setErreur(etat.erreur);
  }

  async function creerDemande(type: string) {
    if (type === "resiliation_lien") {
      router.push(
        cible === "commercial"
          ? "/espace-commercial/tableau-de-bord"
          : "/espace-entreprise/tableau-de-bord"
      );
      return;
    }
    const etat = await appelle({ action: "creer_demande", type_demande: type });
    if (etat) appliqueEtat(etat);
  }

  async function retourMenu() {
    const etat = await appelle({ action: "session" });
    if (etat) appliqueEtat(etat);
  }

  // ------------------------------------------------------------------
  // Rendu : Chargement
  // ------------------------------------------------------------------
  if (phase === "chargement") {
    return (
      <div className="min-h-screen bg-ivoire flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-3 border-encre border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-encre">Chargement de votre assistant…</p>
        <p className="text-xs text-ardoise/60 mt-1">Préparation de vos questions</p>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Rendu : Menu des demandes (post-onboarding)
  // ------------------------------------------------------------------
  if (phase === "menu") {
    const lienTableauDeBord =
      cible === "commercial"
        ? "/espace-commercial/tableau-de-bord"
        : "/espace-entreprise/tableau-de-bord";

    return (
      <div className="min-h-screen bg-ivoire px-5 py-6 max-w-lg mx-auto flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-ardoise/10">
          <div>
            <h1 className="font-display text-xl text-encre">Assistant Voom Impulse</h1>
            <p className="text-xs text-ardoise/60 mt-0.5">Votre fiche est déjà enregistrée</p>
          </div>
          <a
            href={lienTableauDeBord}
            className="text-xs font-medium text-encre bg-white border border-ardoise/20 rounded-sm px-3 py-1.5 hover:bg-encre hover:text-white transition-colors"
          >
            Mon tableau de bord →
          </a>
        </div>

        <p className="text-sm text-encre/80 mt-5 font-medium">Que souhaitez-vous faire aujourd'hui ?</p>

        <div className="mt-4 space-y-2.5 flex-1">
          {(menu ?? []).map((m) => (
            <button
              key={m.id}
              onClick={() => creerDemande(m.id)}
              className="w-full text-left bg-white border border-ardoise/15 rounded-md p-4 hover:border-encre/30 hover:shadow-xs transition-all flex flex-col"
            >
              <span className="text-sm font-medium text-encre">{m.label}</span>
              <span className="text-xs text-ardoise/60 mt-1">{m.description}</span>
            </button>
          ))}
        </div>

        {erreur && <p className="text-xs text-rouille mt-4">{erreur}</p>}
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Rendu : Écran final de confirmation
  // ------------------------------------------------------------------
  if (phase === "fin") {
    const redirection =
      redirectionFin ||
      (cible === "commercial"
        ? "/espace-commercial/tableau-de-bord"
        : "/espace-entreprise/tableau-de-bord");

    return (
      <div className="min-h-screen bg-ivoire px-6 py-12 flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-vert/10 text-vert rounded-full flex items-center justify-center text-2xl font-bold mb-5">
          ✓
        </div>
        <h1 className="font-display text-2xl text-encre">Demande validée</h1>
        <p className="text-sm text-encre/80 mt-3 leading-relaxed">{messageFin}</p>

        <div className="w-full space-y-3 mt-8">
          <button
            onClick={() => router.push(redirection)}
            className="w-full bg-encre text-white text-sm font-medium px-4 py-3.5 rounded-sm hover:bg-encre/90 transition-colors shadow-xs"
          >
            Accéder à mon tableau de bord →
          </button>
          <button
            onClick={retourMenu}
            className="w-full border border-ardoise/20 text-encre text-xs px-4 py-2.5 rounded-sm hover:bg-white transition-colors"
          >
            Retour au menu de l'assistant
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Rendu : Conversation & Questionnaire
  // ------------------------------------------------------------------
  const avanceEtape = etape && etape.id !== "intro" ? Math.min(index + 1, total) : index;
  const repondues = reponses.length;

  return (
    <div className="min-h-screen bg-ivoire flex flex-col">
      {/* En-tête fixe avec barre de progression */}
      <header className="bg-encre text-white px-5 py-3.5 shadow-xs sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm tracking-wide">Voom Impulse</span>
            <span className="text-white/40 text-xs">· Assistant</span>
          </div>
          <span className="text-white/70 text-xs font-mono">
            {etape && etape.id !== "intro" ? `Question ${avanceEtape} / ${total || "…"}` : "Récapitulatif"}
          </span>
        </div>
        <div className="h-1 bg-white/15 rounded-full mt-2.5 overflow-hidden">
          <div
            className="h-1 bg-ocre rounded-full transition-all duration-300"
            style={{
              width: total > 0 && etape ? `${Math.round((avanceEtape / total) * 100)}%` : "100%",
            }}
          />
        </div>
      </header>

      {/* Zone de conversation (défilement) */}
      <main className="flex-1 overflow-y-auto px-4 py-5 max-w-xl w-full mx-auto space-y-3.5">
        {/* Bulle d'accueil initiale */}
        <div className="flex justify-start">
          <div className="max-w-[88%] bg-white border border-ardoise/15 rounded-2xl rounded-tl-xs px-4 py-3 text-sm text-encre shadow-xs leading-relaxed">
            <p className="font-medium text-encre">Bonjour ! Je suis l'assistant Voom Impulse.</p>
            <p className="mt-1 text-ardoise/80 text-xs">
              Je vais vous poser quelques questions simples pour remplir votre fiche à votre place. Vos
              réponses sont enregistrées automatiquement.
            </p>
            <p className="mt-1.5 text-[11px] text-ardoise/50">
              ℹ️ Votre voix est transformée en texte puis supprimée. À tout moment, vous pouvez
              modifier une réponse avec le bouton ↩.
            </p>
          </div>
        </div>

        {/* Historique des échanges (Questions de l'assistant + Réponses de l'utilisateur) */}
        {reponses.map((r) => (
          <div key={r.id} className="space-y-2">
            {/* Question de l'assistant */}
            <div className="flex justify-start">
              <div className="max-w-[88%] bg-white border border-ardoise/15 rounded-2xl rounded-tl-xs px-4 py-3 text-sm text-encre shadow-xs">
                {r.question}
              </div>
            </div>

            {/* Réponse de l'utilisateur */}
            <div className="flex justify-end">
              <div className="max-w-[85%] bg-encre text-white rounded-2xl rounded-tr-xs px-4 py-2.5 text-sm shadow-xs break-words">
                {r.reponse}
              </div>
            </div>
          </div>
        ))}

        {/* Question active actuelle */}
        {etape && (
          <div className="flex justify-start pt-1">
            <div className="max-w-[88%] bg-white border-2 border-encre/20 rounded-2xl rounded-tl-xs px-4 py-3 text-sm text-encre font-medium shadow-xs leading-relaxed">
              {etape.texte}
            </div>
          </div>
        )}

        {/* Écran de récapitulatif (quand toutes les questions sont répondues) */}
        {!etape && repondues > 0 && (
          <div className="bg-white border border-ardoise/15 rounded-md p-5 shadow-xs mt-4">
            <div className="flex items-center justify-between pb-3 border-b border-ardoise/10">
              <h2 className="font-display text-lg text-encre">Récapitulatif de vos réponses</h2>
              <span className="text-xs text-vert font-medium bg-vert/10 px-2.5 py-1 rounded-full">
                Prêt à valider
              </span>
            </div>

            <div className="divide-y divide-ardoise/10 mt-2 max-h-80 overflow-y-auto">
              {reponses.map((r) => (
                <div key={r.id} className="py-2.5 text-xs flex justify-between items-start gap-4">
                  <span className="text-ardoise/70 font-medium">{r.question}</span>
                  <span className="text-encre text-right font-medium break-words max-w-[55%]">
                    {r.reponse}
                  </span>
                </div>
              ))}
            </div>

            {erreur && <p className="text-xs text-rouille mt-3">{erreur}</p>}

            <div className="space-y-2.5 mt-5 pt-3 border-t border-ardoise/10">
              <button
                disabled={envoi}
                onClick={validerFinalisation}
                className="w-full bg-vert text-white text-sm font-medium px-4 py-3.5 rounded-sm hover:bg-vert/90 transition-colors shadow-xs"
              >
                {envoi ? "Enregistrement en cours…" : "C'est correct, je valide"}
              </button>

              <button
                type="button"
                onClick={() => setModifierOuvert(!modifierOuvert)}
                className="w-full bg-white border border-ardoise/20 text-encre text-xs font-medium px-4 py-2.5 rounded-sm hover:bg-ivoire transition-colors"
              >
                {modifierOuvert ? "Fermer la liste des modifications" : "Je veux modifier une réponse"}
              </button>

              <button
                disabled={envoi}
                type="button"
                onClick={recommencer}
                className="w-full text-rouille text-xs underline py-1 hover:text-rouille/80"
              >
                Recommencer le questionnaire
              </button>
            </div>

            {/* Liste déroulante des questions à rouvrir */}
            {modifierOuvert && (
              <div className="mt-3 border border-ardoise/15 rounded-sm divide-y divide-ardoise/10 bg-ivoire/50">
                <p className="px-3 py-2 text-[11px] text-ardoise/60 font-medium">
                  Cliquez sur la question à modifier :
                </p>
                {reponses.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => retour(r.id)}
                    className="w-full text-left px-3 py-2.5 text-xs text-encre hover:bg-white transition-colors flex justify-between items-center"
                  >
                    <span className="truncate pr-2">{r.question}</span>
                    <span className="text-ardoise/40 text-[10px]">Modifier ↩</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Panneau de retour en arrière pendant le questionnaire */}
        {etape && modifierOuvert && (
          <div className="bg-white border border-ardoise/15 rounded-md p-4 shadow-xs mt-2">
            <div className="flex justify-between items-center pb-2 border-b border-ardoise/10">
              <p className="text-xs text-ardoise/70 font-medium">Quelle question souhaitez-vous modifier ?</p>
              <button
                onClick={() => setModifierOuvert(false)}
                className="text-xs text-ardoise/40 hover:text-encre"
              >
                ✕ Fermer
              </button>
            </div>
            <div className="divide-y divide-ardoise/10 max-h-48 overflow-y-auto mt-1">
              {reponses.map((r) => (
                <button
                  key={r.id}
                  onClick={() => retour(r.id)}
                  className="w-full text-left py-2 text-xs text-encre hover:text-encre font-medium flex justify-between"
                >
                  <span className="truncate pr-2">{r.question}</span>
                  <span className="text-ardoise/50 text-[11px] shrink-0">Modifier ↩</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={finMessagesRef} />
      </main>

      {/* Barre d'interaction fixe en bas (Boutons ou Saisie) */}
      {etape && (
        <footer className="border-t border-ardoise/15 bg-white px-4 py-3 shadow-lg sticky bottom-0 z-20">
          <div className="max-w-xl mx-auto">
            {/* Ligne d'outils (Bouton retour) */}
            <div className="flex items-center justify-between pb-2">
              {reponses.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setModifierOuvert(!modifierOuvert)}
                  className="text-xs text-ardoise/60 hover:text-encre flex items-center gap-1 font-medium"
                >
                  <span>↩</span> Modifier une réponse précédente
                </button>
              ) : (
                <span />
              )}
              {etape.facultatif && etape.type === "libre" && (
                <button
                  disabled={envoi}
                  type="button"
                  onClick={() => repondre("")}
                  className="text-xs text-ardoise/50 hover:text-encre underline"
                >
                  Passer cette question
                </button>
              )}
            </div>

            {/* Question de type LIBRE : Champ texte + bouton micro + bouton envoyer */}
            {etape.type === "libre" && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={saisie}
                  onChange={(e) => setSaisie(e.target.value)}
                  maxLength={etape.max || 500}
                  placeholder={etape.facultatif ? "Votre réponse (facultative)" : "Votre réponse…"}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (saisie.trim() || etape.facultatif)) {
                      repondre(saisie);
                    }
                  }}
                  className="flex-1 border border-ardoise/20 rounded-md px-3.5 py-2.5 text-sm bg-ivoire/30 focus:bg-white focus:outline-none focus:ring-1 focus:ring-encre"
                />

                {/* Bouton micro (Phase 1 : indicateur clair que le mode bouton/texte est actif) */}
                <button
                  type="button"
                  onClick={() => alert("Saisie vocale : disponible dès l'activation du module audio IA.")}
                  title="Saisie vocale"
                  className="p-2.5 rounded-md border border-ardoise/20 text-ardoise/40 hover:text-encre hover:border-ardoise/40 transition-colors"
                >
                  🎙️
                </button>

                <button
                  disabled={envoi || (!etape.facultatif && !saisie.trim())}
                  type="button"
                  onClick={() => repondre(saisie)}
                  className="bg-encre text-white text-sm font-medium px-4 py-2.5 rounded-md disabled:opacity-40 hover:bg-encre/90 transition-colors shrink-0"
                >
                  {envoi ? "…" : "Envoyer"}
                </button>
              </div>
            )}

            {/* Question de type UNIQUE : Boutons arrondis tapables (1 tap = réponse immédiate) */}
            {etape.type === "unique" && (
              <div className="flex flex-wrap gap-2 pt-1 max-h-56 overflow-y-auto">
                {(etape.options ?? []).map((o) => (
                  <button
                    key={o.valeur}
                    disabled={envoi}
                    type="button"
                    onClick={() => repondre(o.valeur)}
                    className="bg-white border border-encre/25 text-encre text-xs font-medium rounded-full px-4 py-2.5 hover:bg-encre hover:text-white transition-all shadow-xs active:scale-95"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}

            {/* Question de type MULTIPLE : On coche plusieurs puis valider */}
            {etape.type === "multiple" && (
              <div className="space-y-3 pt-1">
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {(etape.options ?? []).map((o) => {
                    const coche = selections.includes(o.valeur);
                    return (
                      <button
                        key={o.valeur}
                        type="button"
                        onClick={() =>
                          setSelections((prev) =>
                            coche ? prev.filter((v) => v !== o.valeur) : [...prev, o.valeur]
                          )
                        }
                        className={
                          "text-xs font-medium rounded-full px-3.5 py-2 border transition-all " +
                          (coche
                            ? "bg-encre text-white border-encre shadow-xs"
                            : "bg-white text-encre border-ardoise/25 hover:border-encre/40")
                        }
                      >
                        {coche ? "✓ " : "+ "}
                        {o.label}
                      </button>
                    );
                  })}
                </div>

                <button
                  disabled={envoi || selections.length === 0}
                  type="button"
                  onClick={() => repondre(selections)}
                  className="w-full bg-encre text-white text-sm font-medium px-4 py-3 rounded-md disabled:opacity-40 hover:bg-encre/90 transition-colors shadow-xs"
                >
                  {envoi ? "Envoi…" : `Valider ma sélection (${selections.length})`}
                </button>
              </div>
            )}

            {erreur && <p className="text-xs text-rouille mt-2">{erreur}</p>}
          </div>
        </footer>
      )}
    </div>
  );
}
