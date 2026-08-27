export type TypeService = "service_1_mise_a_disposition" | "service_2_gestion_complete";

export type StatutFacture = "payee" | "impayee" | "en_retard";

export type StatutMission = "active" | "terminee" | "suspendue";

export interface Entreprise {
  id: string;
  nom: string;
  contact_nom: string | null;
  contact_telephone: string | null;
  secteur_activite: string | null;
  type_collaboration_souhaite: TypeService | null;
}

export interface Commercial {
  id: string;
  nom: string;
  telephone: string | null;
  type_commercial: string | null;
  style_activite: string | null;
  zone_geographique: string | null;
}

export interface Mission {
  id: string;
  commercial_id: string;
  entreprise_id: string;
  service: TypeService;
  statut: StatutMission;
  taux_commission: number | null;
}

export interface Facture {
  id: string;
  entreprise_id: string;
  service: TypeService;
  montant: number;
  statut: StatutFacture;
  date_echeance: string | null;
}

export const LABEL_SERVICE: Record<TypeService, string> = {
  service_1_mise_a_disposition: "Mise à disposition",
  service_2_gestion_complete: "Gestion complète",
};

export const LABEL_STATUT_FACTURE: Record<StatutFacture, string> = {
  payee: "Payée",
  impayee: "Impayée",
  en_retard: "En retard",
};
