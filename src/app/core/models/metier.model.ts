/**
 * Modèles métier, calqués sur les ressources JSON exposées par l'API.
 *
 * Rappels sur les conventions du back-end :
 *  - `_id` MongoDB est toujours renvoyé sous la clé `id`, en chaîne ;
 *  - les montants sont normalisés en entiers, en FCFA ;
 *  - une relation optionnelle absente donne un 204, restitué en `null`.
 */

export interface Debiteur {
  id: string;
  societe_debitrice: string;
  gerant: string;
  ville: string;
  localisation: string;
  telephone: string;
  email: string;
  agent_id: string | null;
  partenaires_ids: string[];
  cree_le: string | null;
  modifie_le: string | null;
}

export interface Partenaire {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  telephone: string;
  email: string;
  secteur: string;
  cree_le: string | null;
  modifie_le: string | null;
}

export interface Agent {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  cree_le: string | null;
  modifie_le: string | null;
}

export interface Dette {
  id: string;
  intitule: string;
  montant_reclame: number;
  montant_reconnu: number;
  montant_verse: number;
  solde: number;
  dernier_versement: string | null;
  date_echeance_mensuelle: string | null;
  debiteur_id: string | null;
  partenaire_id: string | null;
}

export interface Rapport {
  id: string;
  partenaire_id: string | null;
  montant_creance: number;
  nbre_dossier_transmi: number;
  nbre_dossier_actif: number;
  nbre_dossier_localiser: number;
  nbre_dossier_payement: number;
  entr_physiq: number;
  trans_courier: number;
  negoc_en_cours: number;
  protocol_signe: number;
  echange_tel: number;
  echange_email: number;
  commentaire: string | null;
  devise: string;
  cree_le: string | null;
  modifie_le: string | null;
}

/** Agrégat renvoyé par les endpoints `/me/synthese`. */
export interface Synthese {
  nombre_dettes: number;
  montant_reclame: number;
  montant_reconnu: number;
  montant_verse: number;
  solde: number;
  /** Part du montant reconnu déjà recouvrée, en pourcentage. */
  taux_recouvrement: number;
  devise: string;
  /** Présent uniquement pour les profils partenaire et agent. */
  nombre_debiteurs?: number;
}

/** Utilisateur connecté, quel que soit son profil. */
export type UtilisateurConnecte = Debiteur | Partenaire | Agent;
