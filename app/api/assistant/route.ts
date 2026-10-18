import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  Cible,
  Etape,
  Reponses,
  TypeDemande,
  MENU_DEMANDES,
  LABELS_DEMANDES,
  itineraire,
  nettoyerSousNiveaux,
  libelleOption,
  libelleMultiples,
} from "@/lib/assistant/scripts";

// Le nuage Vercel reconstruit la page à chaque appel (page dynamique).
export const dynamic = "force-dynamic";

// Client admin (service role) : utilisé UNIQUEMENT côté serveur, à l'intérieur
// du handler (jamais au niveau module, sinon le build Vercel échoue faute de
// variables). Même modèle que app/api/superviseurs/route.ts.
function adminSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const cleService = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  return createClient(url, cleService, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const STYLE_ACTIF = ["tres_a_l_aise", "a_l_aise", "debutant"];

// Le service choisi, en tenant compte de la branche « je ne sais pas, conseillez-moi ».
function serviceChoisi(reponses: Reponses): "service_1_mise_a_disposition" | "service_2_gestion_complete" | null {
  const service = reponses.E4c ?? reponses.E4;
  if (service === "service_1_mise_a_disposition" || service === "service_2_gestion_complete") return service;
  return null;
}

// Vérifie le JWT de l'appelant et renvoie l'utilisateur + son profil.
async function authentifier(request: NextRequest) {
  const jeton = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!jeton) return null;

  const admin = adminSupabase();
  const { data: resultat } = await admin.auth.getUser(jeton);
  if (!resultat?.user) return null;

  const { data: profil } = await admin
    .from("profils")
    .select("id, role, entreprise_id, commercial_id, onboarding_termine")
    .eq("id", resultat.user.id)
    .maybeSingle();
  if (!profil) return { utilisateur: resultat.user, profil: null };
  return { utilisateur: resultat.user, profil };
}

// Charge une session appartenant bien à l'appelant et encore en cours.
async function verifierSession(admin: SupabaseClient, userId: string, sessionId: unknown) {
  if (typeof sessionId !== "string") return null;
  const { data: session } = await admin
    .from("assistant_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!session || session.statut !== "en_cours") return null;
  return session;
}

function roleVersCible(role: string): Cible | null {
  if (role === "entreprise") return "entreprise";
  if (role === "commercial") return "commercial";
  return null;
}

// État du session stocké dans assistant_sessions.etat (jsonb).
interface EtatSession {
  cible: Cible;
  type_demande: TypeDemande;
  index: number;
  reponses: Reponses;
}

function etapeCourante(liste: Etape[], etat: EtatSession): Etape | null {
  if (etat.index >= liste.length) return null;
  return liste[etat.index];
}

// Résout le texte (texteDynamique est une fonction : jamais envoyée au client).
function texteEtape(etape: Etape, reponses: Reponses): string {
  return typeof etape.texteDynamique === "function" ? etape.texteDynamique(reponses) : (etape.texte ?? "");
}


// Transforme les réponses brutes en liste lisible pour le récapitulatif
// et pour l'administrateur (dans demandes.contenu). L'identifiant sert au
// bouton Retour (modifier une réponse précédente).
function reponsesLisibles(liste: Etape[], reponses: Reponses) {
  const resultats: { id: string; question: string; reponse: string }[] = [];
  for (const etape of liste) {
    if (etape.texteDynamique) continue; // étape calculée, pas une question posée
    const rep = reponses[etape.id];
    if (rep === undefined || rep === null || rep === "") continue;
    let texte: string;
    if (etape.type === "multiple" && Array.isArray(rep)) texte = libelleMultiples(etape, rep);
    else if (etape.type === "unique") texte = libelleOption(etape, String(rep));
    else texte = String(rep);
    let question = texteEtape(etape, reponses);
    if (etape.id.endsWith("_prec")) question = "Précision";
    if (etape.type === "libre") texte = texte.length > 300 ? texte.slice(0, 300) + "…" : texte;
    resultats.push({ id: etape.id, question, reponse: texte });
  }
  return resultats;
}

// Résumé court stocké dans demandes.resume (texte brut, sans IA en phase 1).
function resumeCourt(lisibles: { question: string; reponse: string }[]): string {
  const morceaux: string[] = [];
  for (const l of lisibles) {
    if (l.question.startsWith("Maintenez") || l.question.startsWith("Comprenez")) continue;
    if (l.question.startsWith("Précision")) continue;
    morceaux.push(l.reponse);
    if (morceaux.length >= 4) break;
  }
  return morceaux.join(" · ").slice(0, 200);
}

// État renvoyé au client : étape en cours, position, réponse et récap lisibles.
function etatPourClient(session: { id: string; statut: string; etat: EtatSession }) {
  const etat = session.etat;
  const liste = itineraire(etat.type_demande, { ...etat.reponses });
  const totale = liste.length;
  const etape = etapeCourante(liste, etat);
  return {
    mode: "conversation" as const,
    session_id: session.id,
    statut: session.statut,
    cible: etat.cible,
    type_demande: etat.type_demande,
    etape: etape
      ? {
          id: etape.id,
          texte: texteEtape(etape, etat.reponses),
          type: etape.type,
          options: etape.options ?? null,
          max: etape.max ?? 500,
          facultatif: Boolean(etape.facultatif),
        }
      : null,
    index: Math.min(etat.index, totale),
    total: totale,
    reponses: reponsesLisibles(liste, etat.reponses),
  };
}

function erreurReponse(message: string) {
  return NextResponse.json({ erreur: message }, { status: 400 });
}

// Validation légère d'un numéro de téléphone : chiffres, espaces, +225 accepté.
function telephoneValide(texte: string): boolean {
  return /^(\+?225\s?)?[0-9][0-9 .-]{5,20}$/.test(texte.trim());
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

// Inscription réduite : le navigateur crée le compte (email + mot de passe),
// puis appelle cette action qui crée la fiche minimale et le profil côté
// serveur (aucun blocage RLS possible).
async function actionInscrire(admin: SupabaseClient, utilisateur: any, cibleBrute: unknown) {
  const cible = String(cibleBrute ?? "").toLowerCase();

  // Compte déjà profilé (auto-réparation sur relance) : on accepte.
  const { data: profilExistant } = await admin
    .from("profils")
    .select("id, role, entreprise_id, commercial_id")
    .eq("id", utilisateur.id)
    .maybeSingle();
  if (profilExistant) {
    if (roleVersCible(profilExistant.role) !== cible) {
      return NextResponse.json({ erreur: "Ce compte est déjà relié à un autre espace." }, { status: 400 });
    }
    await admin.from("profils").update({ onboarding_termine: false }).eq("id", utilisateur.id);
    return NextResponse.json({ ok: true, cible });
  }

  let ficheId: string | null = null;
  if (cible === "entreprise") {
    const { data: fiche, error } = await admin
      .from("entreprises")
      .insert({ user_id: utilisateur.id, nom: "À compléter" })
      .select("id")
      .single();
    if (error || !fiche) return NextResponse.json({ erreur: "Fiche entreprise impossible : " + error?.message }, { status: 500 });
    ficheId = fiche.id;
  } else if (cible === "commercial") {
    const { data: fiche, error } = await admin
      .from("commerciaux")
      .insert({ user_id: utilisateur.id, nom: "À compléter" })
      .select("id")
      .single();
    if (error || !fiche) return NextResponse.json({ erreur: "Fiche commercial impossible : " + error?.message }, { status: 500 });
    ficheId = fiche.id;
  } else {
    return NextResponse.json({ erreur: "Espace inconnu" }, { status: 400 });
  }

  const { error: erreurProfil } = await admin.from("profils").insert({
    id: utilisateur.id,
    role: cible,
    ...(cible === "entreprise" ? { entreprise_id: ficheId } : { commercial_id: ficheId }),
    onboarding_termine: false,
  });
  if (erreurProfil) {
    // On ne laisse pas un compte auth sans profil derrière lui.
    await admin.from(cible === "entreprise" ? "entreprises" : "commerciaux").delete().eq("id", ficheId);
    return NextResponse.json({ erreur: "Profil impossible : " + erreurProfil.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, cible });
}

// Retrouve la session en cours ; si aucune et que l'onboarding n'est pas
// terminé, en crée une.
async function actionSession(admin: SupabaseClient, utilisateur: any, profil: any, { creerTypeDemande }: { creerTypeDemande?: TypeDemande }) {
  const cible = roleVersCible(profil.role);
  if (!cible) return NextResponse.json({ erreur: "Rôle inconnu" }, { status: 400 });

  // Compte d'avant l'assistant : on le laisse tranquille.
  if (profil.onboarding_termine !== false && !creerTypeDemande) {
    return NextResponse.json({
      mode: "menu",
      cible,
      menu: MENU_DEMANDES[cible],
    });
  }

  const { data: sessions } = await admin
    .from("assistant_sessions")
    .select("*")
    .eq("user_id", utilisateur.id)
    .eq("cible", cible)
    .eq("statut", "en_cours")
    .order("updated_at", { ascending: false })
    .limit(1);

  let session = sessions?.[0];
  if (!session) {
    const etat: EtatSession = {
      cible,
      type_demande: creerTypeDemande ?? (cible === "entreprise" ? "inscription_entreprise" : "inscription_commercial"),
      index: 0,
      reponses: {},
    };
    const { data: nouvelleSession, error } = await admin
      .from("assistant_sessions")
      .insert({ user_id: utilisateur.id, cible, type_demande: etat.type_demande, etat, statut: "en_cours" })
      .select("*")
      .single();
    if (error || !nouvelleSession) return NextResponse.json({ erreur: "Session impossible : " + error?.message }, { status: 500 });
    session = nouvelleSession;
  } else if (creerTypeDemande) {
    // Une demande a été créée : on abandonne l'ancienne session en cours.
    await admin.from("assistant_sessions").update({ statut: "abandonne" }).eq("id", session.id);
    const etat: EtatSession = { cible, type_demande: creerTypeDemande, index: 0, reponses: {} };
    const { data: nouvelleSession, error } = await admin
      .from("assistant_sessions")
      .insert({ user_id: utilisateur.id, cible, type_demande: creerTypeDemande, etat, statut: "en_cours" })
      .select("*")
      .single();
    if (error || !nouvelleSession) return NextResponse.json({ erreur: "Session impossible : " + error?.message }, { status: 500 });
    session = nouvelleSession;
  }

  return NextResponse.json(etatPourClient(session));
}

// Traite une réponse (choix ou texte libre), sauvegarde et avance.
async function actionRepondre(admin: SupabaseClient, session: any, etapeId: string, valeur: any) {
  const etat: EtatSession = session.etat;
  const liste = itineraire(etat.type_demande, { ...etat.reponses });
  const etape = etapeCourante(liste, etat);

  if (!etape || etape.id !== etapeId) {
    return erreurReponse("Cette question n'est plus la question en cours. Rechargez la page.");
  }
  if (etape.type === "libre") {
    const texte = typeof valeur === "string" ? valeur.trim() : "";
    if (texte.length > (etape.max ?? 500)) return erreurReponse(`Réponse trop longue (maximum ${etape.max} caractères).`);
    if (!texte) {
      if (!etape.facultatif) return erreurReponse("Merci d'écrire une réponse.");
      etat.reponses[etape.id] = null;
    } else if (etape.id === "E2b" || etape.id === "C2a") {
      if (!telephoneValide(texte)) return erreurReponse("Numéro douteux : chiffres et espaces seulement (+ international accepté).");
      etat.reponses[etape.id] = texte;
    } else {
      etat.reponses[etape.id] = texte;
    }
  } else if (etape.type === "unique") {
    const valeursAutorisees = (etape.options ?? []).map((o) => o.valeur);
    if (typeof valeur !== "string" || !valeursAutorisees.includes(valeur)) {
      return erreurReponse("Choix non reconnu, veuillez utiliser les boutons.");
    }
    etat.reponses[etape.id] = valeur;
  } else if (etape.type === "multiple") {
    const valeursAutorisees = new Set((etape.options ?? []).map((o) => o.valeur));
    if (!Array.isArray(valeur) || valeur.length === 0 || valeur.some((v) => !valeursAutorisees.has(v))) {
      return erreurReponse("Choix non reconnu, veuillez utiliser les boutons.");
    }
    etat.reponses[etape.id] = valeur;
  } else {
    return erreurReponse("Type de question inconnu.");
  }

  // Changement des styles : on supprime les niveaux devenus obsolètes.
  nettoyerSousNiveaux(etat.reponses, etapeId);

  const nouvelleListe = itineraire(etat.type_demande, etat.reponses);
  etat.index = etat.index + 1;

  const { error } = await admin
    .from("assistant_sessions")
    .update({ etat, updated_at: new Date().toISOString() })
    .eq("id", session.id);
  if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });

  return NextResponse.json(etatPourClient({ ...session, etat }));
}

// Retour en arrière : réouvre une réponse précédente.
async function actionRetour(admin: SupabaseClient, session: any, etapeId: string) {
  const etat: EtatSession = session.etat;
  const liste = itineraire(etat.type_demande, { ...etat.reponses });
  const position = liste.findIndex((e) => e.id === etapeId);
  if (position < 0) return erreurReponse("Question à modifier introuvable.");
  etat.index = position;
  delete etat.reponses[etapeId];
  // En répondant à nouveau, on repartira proprement d'ici.
  for (let i = position + 1; i < liste.length; i++) {
    delete etat.reponses[liste[i].id];
  }
  const { error } = await admin
    .from("assistant_sessions")
    .update({ etat, updated_at: new Date().toISOString() })
    .eq("id", session.id);
  if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });
  return NextResponse.json(etatPourClient({ ...session, etat }));
}

// Finalisation côté serveur : fiche (liste blanche), profil_ia, demande.
async function actionTerminer(admin: SupabaseClient, utilisateur: any, profil: any, session: any) {
  const etat: EtatSession = session.etat;
  const reponses = etat.reponses;
  const liste = itineraire(etat.type_demande, { ...reponses });
  const lisibles = reponsesLisibles(liste, reponses);

  const { error: erreurChargement } = await admin
    .from("assistant_sessions")
    .select("id")
    .eq("id", session.id)
    .eq("statut", "en_cours")
    .maybeSingle();
  if (erreurChargement) return NextResponse.json({ erreur: erreurChargement.message }, { status: 500 });

  const contenu = lisibles;
  const resume = `${LABELS_DEMANDES[etat.type_demande]} : ${resumeCourt(lisibles)}`;
  const estInscription = etat.type_demande === "inscription_entreprise" || etat.type_demande === "inscription_commercial";

  if (estInscription) {
    if (etat.cible === "entreprise" && profil.entreprise_id) {
      // besoins_ressources : texte résumé des réponses de la branche choisie.
      const idsBesoins =
        serviceChoisi(reponses) === "service_1_mise_a_disposition"
          ? ["M5", "M6", "M7", "M8", "M9", "M10", "M11", "M12"]
          : ["G5a", "G5b", "G6", "G7", "G8", "G9", "G10"];
      const besoins = idsBesoins
        .map((id) => {
          const etape = liste.find((e) => e.id === id);
          const v = reponses[id];
          if (v === undefined || v === null || v === "") return "";
          return Array.isArray(v) ? libelleMultiples(etape, v) : libelleOption(etape, String(v));
        })
        .filter(Boolean)
        .join(" · ");
      const serviceValide = serviceChoisi(reponses);
      const objectifs =
        (reponses.M14 ? libelleOption(liste.find((e) => e.id === "M14"), String(reponses.M14)) : "") +
        (reponses.G11a ? libelleOption(liste.find((e) => e.id === "G11a"), String(reponses.G11a)) : "") +
        (reponses.M14_prec ? " — " + reponses.M14_prec : "") +
        (reponses.G11b ? " — " + reponses.G11b : "");

      const secteur =
        etat.reponses.E3 === "autre" && etat.reponses.E3_prec
          ? String(etat.reponses.E3_prec)
          : etat.reponses.E3
          ? libelleOption(liste.find((e) => e.id === "E3"), String(etat.reponses.E3))
          : null;

      const { error } = await admin
        .from("entreprises")
        .update({
          nom: etat.reponses.E1,
          contact_nom: etat.reponses.E2a ?? null,
          contact_telephone: etat.reponses.E2b ?? null,
          secteur_activite: secteur,
          type_collaboration_souhaite: serviceValide,
          besoins_ressources: besoins || null,
          objectifs_commerciaux: objectifs || null,
          profil_ia: etat.reponses,
        })
        .eq("id", profil.entreprise_id);
      if (error) return NextResponse.json({ erreur: "Fiche entreprise : " + error.message }, { status: 500 });

      const { error: erreurDemande } = await admin.from("demandes").insert({
        auteur_id: utilisateur.id,
        role_auteur: "entreprise",
        entreprise_id: profil.entreprise_id,
        type: "inscription_entreprise",
        contenu,
        resume,
        statut: "nouvelle",
      });
      if (erreurDemande) return NextResponse.json({ erreur: "Demande : " + erreurDemande.message }, { status: 500 });
    } else if (etat.cible === "commercial" && profil.commercial_id) {
      // style_activite = le style où la personne est le plus à l'aise.
      const styles = Array.isArray(etat.reponses.C5) ? (etat.reponses.C5 as string[]) : [];
      let styleActif: string | null = null;
      for (const niveau of STYLE_ACTIF) {
        for (const style of styles) {
          if (etat.reponses[`C5n_${style}`] === niveau && !styleActif) {
            styleActif = style;
            break;
          }
        }
        if (styleActif) break;
      }
      if (!styleActif && styles.length > 0) {
        styleActif = styles[0];
      }
      const zone = etat.reponses.C3 === "autre_ville" ? String(etat.reponses.C3_prec ?? "Autre ville") : libelleOption(liste.find((e) => e.id === "C3"), String(etat.reponses.C3));
      const disponibilite =
        (etat.reponses.C9a ? libelleOption(liste.find((e) => e.id === "C9a"), String(etat.reponses.C9a)) : "") +
        (etat.reponses.C9b ? " — " + libelleOption(liste.find((e) => e.id === "C9b"), String(etat.reponses.C9b)) : "");
      const ambitions =
        (etat.reponses.C12 ? libelleMultiples(liste.find((e) => e.id === "C12"), etat.reponses.C12 as string[]) : "") +
        (etat.reponses.C12_prec ? " — " + etat.reponses.C12_prec : "");

      const { error } = await admin
        .from("commerciaux")
        .update({
          nom: etat.reponses.C1,
          telephone: etat.reponses.C2a ?? null,
          zone_geographique: zone,
          type_commercial: etat.reponses.C4 ?? null,
          style_activite: styleActif,
          experience: etat.reponses.C6c ?? null,
          competences: Array.isArray(etat.reponses.C7) ? etat.reponses.C7 : [],
          ambitions_commerciales: ambitions || null,
          disponibilite: disponibilite || null,
          profil_ia: etat.reponses,
        })
        .eq("id", profil.commercial_id);
      if (error) return NextResponse.json({ erreur: "Fiche commercial : " + error.message }, { status: 500 });

      const { error: erreurDemande } = await admin.from("demandes").insert({
        auteur_id: utilisateur.id,
        role_auteur: "commercial",
        commercial_id: profil.commercial_id,
        type: "inscription_commercial",
        contenu,
        resume,
        statut: "nouvelle",
      });
      if (erreurDemande) return NextResponse.json({ erreur: "Demande : " + erreurDemande.message }, { status: 500 });
    }

    // Onboarding terminé : la personne passe dans son espace normal.
    await admin
      .from("profils")
      .update({
        onboarding_termine: true,
        nom: etat.cible === "entreprise" ? (etat.reponses.E1 ?? null) : (etat.reponses.C1 ?? null),
      })
      .eq("id", utilisateur.id);
  } else {
    // Demande simple après l'inscription : uniquement une ligne dans demandes.
    const entrepriseId = etat.cible === "entreprise" ? profil.entreprise_id : null;
    const commercialId = etat.cible === "commercial" ? profil.commercial_id : null;
    const { error: erreurDemande } = await admin.from("demandes").insert({
      auteur_id: utilisateur.id,
      role_auteur: etat.cible,
      entreprise_id: entrepriseId,
      commercial_id: commercialId,
      type: etat.type_demande,
      contenu,
      resume,
      statut: "nouvelle",
    });
    if (erreurDemande) return NextResponse.json({ erreur: "Demande : " + erreurDemande.message }, { status: 500 });
  }

  await admin.from("assistant_sessions").update({ statut: "termine", updated_at: new Date().toISOString() }).eq("id", session.id);

  return NextResponse.json({
    ok: true,
    redirection: estInscription ? (etat.cible === "entreprise" ? "/espace-entreprise/tableau-de-bord" : "/espace-commercial/tableau-de-bord") : null,
  });
}

export async function POST(request: NextRequest) {
  const appelant = await authentifier(request);
  if (!appelant || !appelant.utilisateur) {
    return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const admin = adminSupabase();

  let corps: any = {};
  try {
    corps = await request.json();
  } catch {
    return erreurReponse("Corps de requête invalide");
  }

  switch (corps.action) {
    case "inscrire":
      return actionInscrire(admin, appelant.utilisateur, corps.cible);
    default:
      // Toutes les autres actions exigent un profil existant.
      if (!appelant.profil) {
        return NextResponse.json({ erreur: "Profil introuvable : terminez d'abord l'inscription." }, { status: 400 });
      }
      break;
  }

  switch (corps.action) {
    case "session":
    case "menu":
      return actionSession(admin, appelant.utilisateur, appelant.profil, {});
    case "creer_demande": {
      if (!appelant.profil || appelant.profil.onboarding_termine === false) {
        return NextResponse.json({ erreur: "Terminer d'abord l'inscription." }, { status: 400 });
      }
      if (!["nouvelle_mission", "ajouter_commerciaux", "changer_zone_objectifs", "changer_metier", "maj_dispo_zone", "ajouter_competence", "autre"].includes(corps.type_demande)) {
        return NextResponse.json({ erreur: "Type de demande inconnu" }, { status: 400 });
      }
      return actionSession(admin, appelant.utilisateur, appelant.profil, { creerTypeDemande: corps.type_demande });
    }
    case "repondre": {
      const session = await verifierSession(admin, appelant.utilisateur.id, corps.session_id);
      if (!session) return NextResponse.json({ erreur: "Session introuvable" }, { status: 404 });
      if (typeof corps.etape_id !== "string") return erreurReponse("Question manquante");
      return actionRepondre(admin, session, corps.etape_id, corps.valeur);
    }
    case "retour": {
      const session = await verifierSession(admin, appelant.utilisateur.id, corps.session_id);
      if (!session) return NextResponse.json({ erreur: "Session introuvable" }, { status: 404 });
      if (typeof corps.etape_id !== "string") return erreurReponse("Question manquante");
      return actionRetour(admin, session, corps.etape_id);
    }
    case "terminer": {
      const session = await verifierSession(admin, appelant.utilisateur.id, corps.session_id);
      if (!session) return NextResponse.json({ erreur: "Session introuvable" }, { status: 404 });
      if (!appelant.profil) return NextResponse.json({ erreur: "Profil introuvable" }, { status: 400 });
      return actionTerminer(admin, appelant.utilisateur, appelant.profil, session);
    }
    case "recommencer": {
      if (corps.session_id) {
        const session = await verifierSession(admin, appelant.utilisateur.id, corps.session_id);
        if (session) {
          await admin.from("assistant_sessions").update({ statut: "abandonne", updated_at: new Date().toISOString() }).eq("id", session.id);
        }
      }
      return actionSession(admin, appelant.utilisateur, appelant.profil, {});
    }
    default:
      return NextResponse.json({ erreur: "Action inconnue" }, { status: 400 });
  }
}
