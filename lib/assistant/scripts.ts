// Source de vérité du questionnaire de l'assistant Voom Impulse.
// Le déroulé des questions est FIXE : l'IA ne fait jamais que comprendre
// une réponse libre et rédiger le plan (phases suivantes). Ici, tout est
// piloté par ce module, utilisé côté serveur (routes API) et côté client
// (types). Aucune donnée sensible ici : uniquement du texte et des choix.

export type Cible = "entreprise" | "commercial";

// Types de demandes possibles après l'inscription.
export type TypeDemande =
  | "inscription_entreprise"
  | "inscription_commercial"
  | "nouvelle_mission"
  | "ajouter_commerciaux"
  | "changer_zone_objectifs"
  | "changer_metier"
  | "maj_dispo_zone"
  | "ajouter_competence"
  | "autre";

export interface Option {
  valeur: string;
  label: string;
  // Si définie : après ce choix, on pose automatiquement une question libre
  // (non obligatoire) pour préciser la réponse. Ex : "Autre", "À une date précise".
  precisions?: string;
}

export interface Etape {
  id: string;
  texte?: string;
  type: "libre" | "unique" | "multiple";
  options?: Option[];
  // Question libre qui suit systématiquement une réponse (ex : préciser un objectif).
  precisions?: string;
  // Nombre maximum de caractères (libre uniquement).
  max?: number;
  // Indique que la question peut être passée sans réponse (ex : contraintes, remarques).
  facultatif?: boolean;
  // Le texte peut dépendre des réponses déjà données (ex : proposition calculée).
  texteDynamique?: (reponses: Reponses) => string;
}

export type Reponses = Record<string, any>;
export type Reponse = string | string[] | null;

// Constante présente pour la suite : passer à false pour masquer le tarif.
export const ANNONCER_TARIF = true;
export const TARIF_MENSUEL = "15 000 FCFA";

export const COMMUNES_ABIDJAN = [
  "Cocody", "Yopougon", "Marcory", "Plateau", "Abobo", "Adjamé",
  "Koumassi", "Treichville", "Port-Bouët", "Attécoubé", "Bingerville",
];

export function libelleOption(etape: Etape | undefined, valeur: string): string {
  return etape?.options?.find((o) => o.valeur === valeur)?.label ?? valeur;
}

export function libelleMultiples(etape: Etape | undefined, valeurs: string[]): string {
  return valeurs.map((v) => libelleOption(etape, v)).join(" + ");
}

function optionsCommunes(): Option[] {
  const opts: Option[] = COMMUNES_ABIDJAN.map((c) => ({ valeur: c, label: c }));
  opts.push({ valeur: "interieur_pays", label: "Intérieur du pays", precisions: "Quelle ville ?" });
  opts.push({ valeur: "plusieurs_zones", label: "Plusieurs zones" });
  return opts;
}

const OPTION_AUTRE: Option = { valeur: "autre", label: "Autre", precisions: "Précisez en une phrase (vous pouvez laisser vide)" };

// ---------------------------------------------------------------------------
// Étapes — INSCRIPTION ENTREPRISE
// ---------------------------------------------------------------------------

const E1: Etape = { id: "E1", type: "libre", max: 120, texte: "Quel est le nom de votre entreprise ?" };
const E2a: Etape = { id: "E2a", type: "libre", max: 120, texte: "Quel est le nom de votre contact ? (vous, ou la personne à joindre)" };
const E2b: Etape = {
  id: "E2b", type: "libre", max: 20,
  texte: "Quel est son numéro de téléphone ? (les chiffres, le + international est accepté, ex : +225 07 00 00 00 00)",
};
const E3: Etape = {
  id: "E3", type: "unique",
  texte: "Quel est votre secteur d'activité ?",
  options: [
    { valeur: "telecoms", label: "Télécoms" },
    { valeur: "boissons_agro", label: "Boissons et agroalimentaire" },
    { valeur: "grande_distribution", label: "Grande distribution" },
    { valeur: "banque_finance", label: "Banque, assurance, finance" },
    { valeur: "cosmetique", label: "Cosmétique et beauté" },
    { valeur: "immobilier", label: "Immobilier" },
    { valeur: "sante", label: "Santé et pharmacie" },
    { valeur: "services_digital", label: "Services et digital" },
    OPTION_AUTRE,
  ],
};
const E4: Etape = {
  id: "E4", type: "unique",
  texte: "Ce que vous cherchez aujourd'hui :",
  options: [
    { valeur: "service_1_mise_a_disposition", label: "Louer des commerciaux que mon entreprise encadre" },
    { valeur: "service_2_gestion_complete", label: "Confier ma prospection à Voom Impulse" },
    { valeur: "je_ne_sais_pas", label: "Je ne sais pas, conseillez-moi" },
  ],
};
const E4a: Etape = {
  id: "E4a", type: "unique", texte: "Voulez-vous encadrer vous-même les commerciaux ?",
  options: [{ valeur: "oui", label: "Oui" }, { valeur: "non", label: "Non" }],
};
const E4b: Etape = {
  id: "E4b", type: "unique", texte: "Voulez-vous que Voom Impulse soit responsable du résultat de vente ?",
  options: [{ valeur: "oui", label: "Oui" }, { valeur: "non", label: "Non" }],
};
const E4c: Etape = {
  id: "E4c", type: "unique",
  texte: "Confirmez le type de collaboration qui vous convient :",
  texteDynamique: (r) => {
    const encadre = r.E4a === "oui";
    const resultat = r.E4b === "oui";
    if (encadre) return "D'après vos réponses, la mise à disposition semble vous correspondre : vous encadrez les commerciaux et Voom Impulse vous les met à disposition. Confirmez-vous ?";
    if (resultat) return "D'après vos réponses, la gestion complète semble vous correspondre : Voom Impulse pilote la prospection et est responsable du résultat de vente. Confirmez-vous ?";
    return "Nous pouvons démarrer avec la mise à disposition, et passer en gestion complète plus tard si vous le souhaitez. Confirmez-vous ? (Soit le service que Voom Impulse pilote le résultat de vente.)";
  },
  options: [
    { valeur: "service_1_mise_a_disposition", label: "Mise à disposition de commerciaux" },
    { valeur: "service_2_gestion_complete", label: "Gestion complète de la prospection" },
  ],
};

const M5: Etape = {
  id: "M5", type: "unique", texte: "Combien de commerciaux recherchez-vous ?",
  options: [
    { valeur: "1", label: "1" },
    { valeur: "2_5", label: "2 à 5" },
    { valeur: "6_10", label: "6 à 10" },
    { valeur: "11_20", label: "11 à 20" },
    { valeur: "plus_20", label: "Plus de 20" },
    { valeur: "autre", label: "Autre nombre", precisions: "Quel nombre exactement ?" },
  ],
};
const M6: Etape = {
  id: "M6", type: "multiple", texte: "Quel(s) profil(s) recherchez-vous ? (plusieurs choix possibles)",
  options: [
    { valeur: "terrain", label: "Commercial terrain" },
    { valeur: "hote_hotesse", label: "Hôte ou hôtesse" },
    { valeur: "promoteur", label: "Promoteur ou promotrice" },
    { valeur: "animateur", label: "Animateur ou animatrice" },
    { valeur: "rayonniste", label: "Rayonniste" },
    { valeur: "superviseur", label: "Superviseur" },
    { valeur: "teleoperateur", label: "Téléopérateur ou télévendeur" },
    { valeur: "commercial_digital", label: "Commercial digital" },
  ],
};
const M7: Etape = {
  id: "M7", type: "multiple", texte: "Quel(s) style(s) d'activité ? (plusieurs choix possibles)",
  options: [
    { valeur: "terrain", label: "Terrain" },
    { valeur: "operationnel", label: "Opérationnel" },
    { valeur: "evenementiel", label: "Événementiel" },
    { valeur: "promotionnel", label: "Promotionnel" },
    { valeur: "digital", label: "Digital" },
    { valeur: "teletravail", label: "Télétravail" },
  ],
};
const M8: Etape = {
  id: "M8", type: "unique", texte: "Pour quelle durée ?",
  options: [
    { valeur: "quelques_jours", label: "Quelques jours" },
    { valeur: "1_mois", label: "1 mois" },
    { valeur: "3_mois", label: "3 mois" },
    { valeur: "6_mois", label: "6 mois" },
    { valeur: "1_an_plus", label: "1 an ou plus" },
    { valeur: "indeterminee", label: "Durée indéterminée" },
  ],
};
const M9: Etape = {
  id: "M9", type: "multiple", texte: "Quel type de contrat avez-vous envisagé ? (plusieurs choix possibles)",
  options: [
    { valeur: "prestation_service", label: "Prestation de service" },
    { valeur: "cdd", label: "CDD" },
    { valeur: "cdi", label: "CDI" },
    { valeur: "tacite_reconduction", label: "Tacite reconduction" },
    { valeur: "journalier", label: "Journalier ou à la tâche" },
    { valeur: "stage", label: "Stage" },
    { valeur: "peu_importe", label: "Peu importe" },
  ],
};
const M10: Etape = {
  id: "M10", type: "multiple", texte: "Où voulez-vous que les commerciaux travaillent ? (plusieurs choix possibles)",
  options: optionsCommunes(),
};
const M11: Etape = {
  id: "M11", type: "unique", texte: "Quand souhaitez-vous démarrer ?",
  options: [
    { valeur: "des_que_possible", label: "Dès que possible" },
    { valeur: "sous_1_semaine", label: "Sous une semaine" },
    { valeur: "sous_1_mois", label: "Sous un mois" },
    { valeur: "date_precise", label: "À une date précise", precisions: "Quelle date ?" },
  ],
};
const M12: Etape = {
  id: "M12", type: "unique", texte: "Qui encadrera les commerciaux au quotidien ?",
  texteDynamique: (r) => (
    r.M12 === "superviseurs_entreprise"
      ? "Qui encadrera les commerciaux au quotidien ? (Avec des superviseurs de votre entreprise : vous pourrez créer leurs comptes dans votre espace, rubrique « Mes superviseurs ».)"
      : "Qui encadrera les commerciaux au quotidien ?"
  ),
  options: [
    { valeur: "moi_meme", label: "Moi-même" },
    { valeur: "superviseurs_entreprise", label: "Un ou plusieurs superviseurs de mon entreprise" },
    { valeur: "personne", label: "Personne pour l'instant" },
  ],
};
const M13: Etape = {
  id: "M13", type: "unique",
  texte: `Pour la mise à disposition, le tarif est de ${TARIF_MENSUEL} par mois et par commercial. Il comprend le suivi des performances et le remplacement en cas d'absence.`,
  options: [
    { valeur: "tarif_convient", label: "Ce tarif me convient" },
    { valeur: "discuter", label: "Je souhaite en discuter" },
  ],
};
const M14: Etape = {
  id: "M14", type: "unique", texte: "Quel est votre objectif principal ?",
  precisions: "Précisez cet objectif en une phrase (non obligatoire)",
  options: [
    { valeur: "augmenter_ventes", label: "Augmenter mes ventes" },
    { valeur: "faire_connaître", label: "Faire connaître un produit ou une marque" },
    { valeur: "conquerir_clients", label: "Conquérir de nouveaux clients ou points de vente" },
    { valeur: "renforcer_equipe", label: "Renforcer mon équipe existante" },
    { valeur: "animer_evenement", label: "Animer un événement" },
    OPTION_AUTRE,
  ],
};

const G5a: Etape = { id: "G5a", type: "libre", max: 200, texte: "Que voulez-vous vendre ou promouvoir ? Décrivez votre produit ou service." };
const G5b: Etape = {
  id: "G5b", type: "unique", texte: "De quel type s'agit-il ?",
  options: [
    { valeur: "produit_physique", label: "Produit physique" },
    { valeur: "service_abonnement", label: "Service ou abonnement" },
    { valeur: "notoriete", label: "Notoriété de marque" },
  ],
};
const G6: Etape = {
  id: "G6", type: "unique",
  texte: "Qui fournit le stock ? (Avec le stock fourni par vous : entrées, sorties et bilan sont suivis dans la plateforme.)",
  options: [
    { valeur: "fourni", label: "Nous fournissons le stock" },
    { valeur: "pas_de_produit", label: "Pas de produit physique" },
    { valeur: "pas_decide", label: "Pas encore décidé" },
  ],
};
const G7: Etape = {
  id: "G7", type: "unique",
  texte: "Quelle est votre marge approximative par vente ? (Le pourcentage de Voom Impulse se négocie avec vous selon le produit, il n'y a pas de chiffre imposé.)",
  options: [
    { valeur: "moins_10", label: "Moins de 10 %" },
    { valeur: "10_20", label: "10 à 20 %" },
    { valeur: "20_30", label: "20 à 30 %" },
    { valeur: "30_50", label: "30 à 50 %" },
    { valeur: "plus_50", label: "Plus de 50 %" },
    { valeur: "parler", label: "Je préfère en parler avec vous" },
  ],
};
const G8: Etape = {
  id: "G8", type: "multiple", texte: "Comment les ventes doivent-elles être réalisées ? (plusieurs choix possibles)",
  options: [
    { valeur: "porte_a_porte", label: "Porte-à-porte" },
    { valeur: "points_de_vente", label: "Points de vente et supermarchés" },
    { valeur: "evenements", label: "Événements" },
    { valeur: "digital", label: "Réseaux sociaux et digital" },
    { valeur: "teleprospection", label: "Téléprospection" },
  ],
};
const G9: Etape = { id: "G9", type: "multiple", texte: "Où voulez-vous que l'équipe travaille ? (plusieurs choix possibles)", options: optionsCommunes() };
const G10: Etape = {
  id: "G10", type: "unique", texte: "Quelle taille d'équipe envisagez-vous ?",
  options: [
    { valeur: "1_5", label: "1 à 5" },
    { valeur: "6_10", label: "6 à 10" },
    { valeur: "11_20", label: "11 à 20" },
    { valeur: "plus_20", label: "Plus de 20" },
    { valeur: "a_definir", label: "À définir avec vous" },
  ],
};
const G11a: Etape = {
  id: "G11a", type: "unique", texte: "Quel résultat visez-vous ?",
  options: [
    { valeur: "ventes_par_mois", label: "Nombre de ventes par mois" },
    { valeur: "chiffre_affaires", label: "Chiffre d'affaires" },
    { valeur: "nouveaux_clients", label: "Nouveaux clients" },
    { valeur: "notoriete", label: "Notoriété" },
  ],
};
const G11b: Etape = { id: "G11b", type: "libre", max: 200, texte: "Chiffrez ce résultat si vous pouvez (ex : 200 ventes par mois). Vous pouvez laisser vide." };
const G12: Etape = { id: "G12", type: "unique", texte: "Quand souhaitez-vous démarrer ?", options: M11.options };

const F1: Etape = { id: "F1", type: "libre", max: 500, facultatif: true, texte: "Avez-vous des contraintes ou des remarques à ajouter ? Vous pouvez passer." };

// ---------------------------------------------------------------------------
// Étapes — INSCRIPTION COMMERCIAL
// ---------------------------------------------------------------------------

const C1: Etape = { id: "C1", type: "libre", max: 120, texte: "Quel est votre nom complet ?" };
const C2a: Etape = {
  id: "C2a", type: "libre", max: 20,
  texte: "Quel est votre numéro de téléphone ? (les chiffres, le + international est accepté, ex : +225 07 00 00 00 00)",
};
const C2b: Etape = {
  id: "C2b", type: "unique", texte: "Êtes-vous joignable sur WhatsApp ?",
  options: [{ valeur: "oui", label: "Oui" }, { valeur: "non", label: "Non" }],
};
const C3: Etape = {
  id: "C3", type: "unique", texte: "Où habitez-vous ?",
  options: [
    ...COMMUNES_ABIDJAN.map((c) => ({ valeur: c, label: c })),
    { valeur: "autre_ville", label: "Autre ville", precisions: "Quelle ville ?" },
    { valeur: "je_puis_me_deplacer", label: "Je peux me déplacer" },
  ],
};
const C4: Etape = {
  id: "C4", type: "unique", texte: "Quel est votre métier principal ?",
  options: [
    { valeur: "terrain", label: "Commercial terrain (prospection directe)" },
    { valeur: "hote_hotesse", label: "Hôte ou hôtesse (accueil, présentation produit)" },
    { valeur: "promoteur", label: "Promoteur ou promotrice (mise en avant en point de vente)" },
    { valeur: "animateur", label: "Animateur ou animatrice (démonstration, dégustation)" },
    { valeur: "rayonniste", label: "Rayonniste (mise en rayon)" },
    { valeur: "superviseur", label: "Superviseur ou chef d'équipe" },
    { valeur: "teleoperateur", label: "Téléopérateur ou télévendeur" },
    { valeur: "commercial_digital", label: "Commercial digital" },
  ],
};
const C5: Etape = {
  id: "C5", type: "multiple", texte: "Dans quels styles d'activité êtes-vous à l'aise ? (plusieurs choix possibles, on vous demandera votre niveau pour chacun)",
  options: [
    { valeur: "terrain", label: "Terrain" },
    { valeur: "operationnel", label: "Opérationnel" },
    { valeur: "evenementiel", label: "Événementiel" },
    { valeur: "promotionnel", label: "Promotionnel" },
    { valeur: "digital", label: "Digital" },
    { valeur: "teletravail", label: "Télétravail" },
  ],
};
const C6a: Etape = {
  id: "C6a", type: "unique", texte: "Depuis combien de temps travaillez-vous dans ce domaine ?",
  options: [
    { valeur: "aucune", label: "Aucune expérience" },
    { valeur: "moins_1_an", label: "Moins d'un an" },
    { valeur: "1_3_ans", label: "1 à 3 ans" },
    { valeur: "3_5_ans", label: "3 à 5 ans" },
    { valeur: "plus_5_ans", label: "Plus de 5 ans" },
  ],
};
const C6b: Etape = {
  id: "C6b", type: "multiple", texte: "Dans quels secteurs avez-vous déjà travaillé ? (plusieurs choix possibles)",
  options: [
    { valeur: "telecoms", label: "Télécoms" },
    { valeur: "boissons_agro", label: "Boissons et agroalimentaire" },
    { valeur: "grande_distribution", label: "Grande distribution" },
    { valeur: "banque_assurance", label: "Banque et assurance" },
    { valeur: "cosmetique", label: "Cosmétique" },
    { valeur: "immobilier", label: "Immobilier" },
    { valeur: "services", label: "Services" },
    OPTION_AUTRE,
  ],
};
const C6c: Etape = {
  id: "C6c", type: "libre", max: 2000, facultatif: true,
  texte: "Racontez en une ou deux phrases votre meilleure expérience de vente ou de terrain. Vous pouvez passer. (Astuce : vous pourrez utiliser le micro pour le dire en vocal.)",
};
const C7: Etape = {
  id: "C7", type: "multiple", texte: "Quelles sont vos compétences ? (plusieurs choix possibles)",
  options: [
    { valeur: "porte_a_porte", label: "Porte-à-porte" },
    { valeur: "negociation", label: "Négociation et conclusion de vente" },
    { valeur: "presentation_produit", label: "Présentation de produit" },
    { valeur: "animation", label: "Animation et démonstration" },
    { valeur: "mise_en_rayon", label: "Mise en rayon" },
    { valeur: "telephone", label: "Téléphone et télévente" },
    { valeur: "reseaux_sociaux", label: "Réseaux sociaux et vente en ligne" },
    { valeur: "encaissement", label: "Encaissement et Mobile Money" },
    { valeur: "gestion_equipe", label: "Gestion d'équipe" },
    OPTION_AUTRE,
  ],
};
const C8: Etape = {
  id: "C8", type: "multiple", texte: "Quelles langues parlez-vous ? (plusieurs choix possibles)",
  options: [
    { valeur: "francais", label: "Français" },
    { valeur: "anglais", label: "Anglais" },
    { valeur: "dioula", label: "Dioula" },
    { valeur: "baoule", label: "Baoulé" },
    { valeur: "bete", label: "Bété" },
    { valeur: "senoufo", label: "Sénoufo" },
    OPTION_AUTRE,
  ],
};
const C9a: Etape = {
  id: "C9a", type: "unique", texte: "Quelle est votre disponibilité ?",
  options: [
    { valeur: "temps_plein", label: "Temps plein" },
    { valeur: "temps_partiel", label: "Temps partiel" },
    { valeur: "week_ends", label: "Week-ends uniquement" },
    { valeur: "evenements", label: "Événements ponctuels" },
  ],
};
const C9b: Etape = {
  id: "C9b", type: "unique", texte: "Quand pouvez-vous commencer ?",
  options: [
    { valeur: "des_maintenant", label: "Dès maintenant" },
    { valeur: "sous_1_semaine", label: "Sous une semaine" },
    { valeur: "sous_1_mois", label: "Sous un mois" },
  ],
};
const C10: Etape = {
  id: "C10", type: "multiple", texte: "Quels types de contrat acceptez-vous ? (plusieurs choix possibles, dans profil en interne)",
  options: [
    { valeur: "prestation_service", label: "Prestation de service" },
    { valeur: "cdd", label: "CDD" },
    { valeur: "cdi", label: "CDI" },
    { valeur: "journalier", label: "Journalier ou à la tâche" },
    { valeur: "stage", label: "Stage" },
    { valeur: "peu_importe", label: "Peu importe" },
  ],
};
const C11a: Etape = {
  id: "C11a", type: "multiple", texte: "Comment vous déplacez-vous ? (plusieurs choix possibles)",
  options: [
    { valeur: "moto", label: "Moto" },
    { valeur: "vehicule", label: "Véhicule" },
    { valeur: "transport_commun", label: "Transport en commun" },
    { valeur: "a_pied", label: "À pied" },
  ],
};
const C11b: Etape = {
  id: "C11b", type: "unique",
  texte: "Avez-vous un smartphone avec localisation et données mobiles ? (Si oui : votre présence sur le terrain est détectée automatiquement tant que l'application reste ouverte pendant la mission.)",
  options: [
    { valeur: "oui_android", label: "Oui, Android" },
    { valeur: "oui_iphone", label: "Oui, iPhone" },
    { valeur: "non", label: "Non ou pas de forfait" },
  ],
};
const C12: Etape = {
  id: "C12", type: "multiple", texte: "Quelles sont vos ambitions ? (plusieurs choix possibles)",
  precisions: "Précisez votre ambition en une phrase (non obligatoire)",
  options: [
    { valeur: "revenu_complementaire", label: "Gagner un revenu complémentaire" },
    { valeur: "en_faire_metier", label: "En faire mon métier" },
    { valeur: "evoluer_superviseur", label: "Évoluer vers superviseur ou chef d'équipe" },
    { valeur: "apprendre_autre_metier", label: "Apprendre un autre métier (promoteur, animateur…)" },
    { valeur: "grandes_marques", label: "Travailler avec de grandes marques" },
    OPTION_AUTRE,
  ],
};
const C13: Etape = {
  id: "C13", type: "unique",
  texte: "Quel type de rémunération préférez-vous ? (Aucun montant n'est annoncé ici : tout dépend de la mission.)",
  options: [
    { valeur: "fixe", label: "Fixe" },
    { valeur: "commission", label: "À la commission" },
    { valeur: "mixte", label: "Mixte" },
    { valeur: "ouvert", label: "Je suis ouvert" },
  ],
};

// Question de niveau posée pour chaque style choisi à C5 (générée à la volée).
function etapeNiveau(valeurStyle: string): Etape {
  const libelle = C5.options?.find((o) => o.valeur === valeurStyle)?.label ?? valeurStyle;
  return {
    id: `C5n_${valeurStyle}`,
    type: "unique",
    texte: `Pour « ${libelle} », quel est votre niveau ?`,
    options: [
      { valeur: "debutant", label: "Débutant" },
      { valeur: "a_l_aise", label: "À l'aise" },
      { valeur: "tres_a_l_aise", label: "Très à l'aise" },
    ],
  };
}

// ---------------------------------------------------------------------------
// Construction de l'itinéraire (les étapes dans l'ordre, selon les réponses)
// ---------------------------------------------------------------------------

function ajouteEtape(liste: Etape[], etape: Etape, r: Reponses) {
  liste.push(etape);
  const reponse = r[etape.id];
  // 1. Si une option choisie porte une précision spécifique (ex : "Autre", "À une date précise", "Autre ville", "Intérieur du pays")
  if (reponse !== undefined && reponse !== null && etape.options) {
    const opt = etape.options.find((o) =>
      Array.isArray(reponse)
        ? reponse.includes(o.valeur) && Boolean(o.precisions)
        : o.valeur === reponse && Boolean(o.precisions)
    );
    if (opt?.precisions) {
      liste.push({
        id: `${etape.id}_prec`,
        type: "libre",
        max: 200,
        facultatif: true,
        texte: opt.precisions,
      });
      return;
    }
  }
  // 2. Si l'étape elle-même a une précision systématique (ex : M14, C12)
  if (etape.precisions) {
    liste.push({
      id: `${etape.id}_prec`,
      type: "libre",
      max: 200,
      facultatif: true,
      texte: etape.precisions,
    });
  }
}

function itineraireEntreprise(r: Reponses): Etape[] {
  const t: Etape[] = [E1, E2a, E2b];
  ajouteEtape(t, E3, r);
  t.push(E4);

  // Branche "je ne sais pas" : deux questions oui/non, puis proposition à confirmer.
  if (r.E4 === "je_ne_sais_pas") {
    t.push(E4a);
    if (r.E4a !== undefined) {
      t.push(E4b);
    }
    if (r.E4b !== undefined) {
      t.push(E4c);
    }
  }

  const service = r.E4 === "je_ne_sais_pas" ? r.E4c : r.E4;

  if (service === "service_1_mise_a_disposition") {
    ajouteEtape(t, M5, r);
    t.push(M6, M7, M8, M9);
    ajouteEtape(t, M10, r);
    ajouteEtape(t, M11, r);
    t.push(M12);
    if (ANNONCER_TARIF) t.push(M13);
    ajouteEtape(t, M14, r);
  } else if (service === "service_2_gestion_complete") {
    t.push(G5a, G5b, G6, G7, G8);
    ajouteEtape(t, G9, r);
    t.push(G10, G11a, G11b);
    ajouteEtape(t, G12, r);
  }

  t.push(F1);
  return t;
}

function itineraireCommercial(r: Reponses): Etape[] {
  const t: Etape[] = [C1, C2a, C2b];
  ajouteEtape(t, C3, r);
  t.push(C4, C5);

  // Une question de niveau par style choisi à C5
  const styles = Array.isArray(r.C5) ? (r.C5 as string[]) : [];
  for (const style of styles) {
    t.push(etapeNiveau(style));
  }

  t.push(C6a);
  ajouteEtape(t, C6b, r);
  t.push(C6c);
  ajouteEtape(t, C7, r);
  ajouteEtape(t, C8, r);
  t.push(C9a, C9b, C10, C11a, C11b);
  ajouteEtape(t, C12, r);
  t.push(C13);
  return t;
}

// ---------------------------------------------------------------------------
// Demandes après l'inscription : mini-scripts réutilisant les mêmes étapes.
// ---------------------------------------------------------------------------

function avecEntete(_r: Reponses, texte: string, suite: Etape[]): Etape[] {
  return [
    { id: "intro", type: "unique", texte, options: [{ valeur: "continuer", label: "Continuer" }] },
    ...suite,
    F1,
  ];
}

export function itineraire(typeDemande: TypeDemande, r: Reponses): Etape[] {
  switch (typeDemande) {
    case "inscription_entreprise":
      return itineraireEntreprise(r);
    case "inscription_commercial":
      return itineraireCommercial(r);
    case "nouvelle_mission": {
      const suite: Etape[] = [];
      ajouteEtape(suite, M5, r);
      suite.push(M6, M7);
      ajouteEtape(suite, M10, r);
      ajouteEtape(suite, M11, r);
      ajouteEtape(suite, M14, r);
      return avecEntete(r, "Voom Impulse initialise une nouvelle mission. Répondez aux questions suivantes.", suite);
    }
    case "ajouter_commerciaux": {
      const suite: Etape[] = [];
      ajouteEtape(suite, M5, r);
      suite.push(M6);
      ajouteEtape(suite, M10, r);
      return avecEntete(r, "Voom Impulse initialise l'ajout de commerciaux. Répondez aux questions suivantes.", suite);
    }
    case "changer_zone_objectifs": {
      const suite: Etape[] = [];
      ajouteEtape(suite, M10, r);
      ajouteEtape(suite, M11, r);
      suite.push(M12);
      ajouteEtape(suite, M14, r);
      return avecEntete(r, "Voom Impulse initialise une mise à jour de votre zone ou de vos objectifs.", suite);
    }
    case "changer_metier": {
      const suite: Etape[] = [C4, C5];
      for (const style of Array.isArray(r.C5) ? (r.C5 as string[]) : []) {
        suite.push(etapeNiveau(style));
      }
      return avecEntete(r, "Voom Impulse initialise un changement de métier.", suite);
    }
    case "maj_dispo_zone": {
      const suite: Etape[] = [];
      ajouteEtape(suite, C3, r);
      suite.push(C9a, C9b);
      return avecEntete(r, "Voom Impulse initialise une mise à jour de votre disponibilité ou de votre zone.", suite);
    }
    case "ajouter_competence": {
      const suite: Etape[] = [];
      ajouteEtape(suite, C7, r);
      ajouteEtape(suite, C6b, r);
      suite.push(C6c);
      return avecEntete(r, "Voom Impulse initialise l'ajout d'une expérience ou de compétences.", suite);
    }
    case "autre":
    default:
      return avecEntete(r, "Écrivez votre demande, nous la transmettons à l'administrateur.", [
        { id: "LIBRE", type: "libre", max: 500, texte: "Votre demande :" },
      ]);
  }
}

// Nettoyage des sous-niveaux quand on change les styles (C5).
export function nettoyerSousNiveaux(reponses: Reponses, etapeRepondue: string) {
  if (etapeRepondue === "C5" || etapeRepondue === "changer_metier:C5") {
    for (const cle of Object.keys(reponses)) {
      if (cle.startsWith("C5n_")) delete reponses[cle];
    }
  }
}

// ---------------------------------------------------------------------------
// Menus de demandes après l'inscription (section 8 du cahier des charges)
// ---------------------------------------------------------------------------

export const MENU_DEMANDES: Record<Cible, { id: string; label: string; description: string }[]> = {
  entreprise: [
    { id: "nouvelle_mission", label: "Nouvelle mission", description: "Demande de nouveaux commerciaux pour une mission" },
    { id: "ajouter_commerciaux", label: "Ajouter des commerciaux", description: "Élargir votre vivier de collaborateurs" },
    { id: "changer_zone_objectifs", label: "Changer ma zone ou mes objectifs", description: "Adapter la zone de travail ou les objectifs" },
    { id: "resiliation_lien", label: "Résilier un rattachement", description: "Formulaire existant du tableau de bord" },
    { id: "autre", label: "Autre question", description: "Écrivez librement, l'administrateur la lira" },
  ],
  commercial: [
    { id: "changer_metier", label: "Changer de métier", description: "Modifier votre métier principal" },
    { id: "maj_dispo_zone", label: "Mettre à jour ma disponibilité ou ma zone", description: "Disponibilité ou lieu de travail" },
    { id: "ajouter_competence", label: "Ajouter une compétence ou une expérience", description: "Enrichir votre profil du vivier" },
    { id: "resiliation_lien", label: "Quitter un rattachement", description: "Formulaire existant du tableau de bord" },
    { id: "autre", label: "Autre question", description: "Écrivez librement, l'administrateur la lira" },
  ],
};

export const LABELS_DEMANDES: Record<TypeDemande, string> = {
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
