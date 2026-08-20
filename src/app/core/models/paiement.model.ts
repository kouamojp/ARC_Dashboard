/**
 * Paiement en ligne d'une dette par le débiteur.
 *
 * Le front n'encaisse jamais lui-même : il déclare une intention de paiement à
 * l'API, qui dialogue avec le prestataire (carte, PayPal, Orange Money, MTN
 * MoMo) et reste seule à décider du statut. Aucune donnée de carte ne transite
 * par cette application — le prestataire prend la main sur sa propre page.
 */

/** Moyens de paiement proposés au débiteur. */
export type MoyenPaiement = 'carte' | 'orange_money' | 'mtn_momo' | 'paypal';

export const MOYENS_PAIEMENT: readonly MoyenPaiement[] = [
  'carte',
  'orange_money',
  'mtn_momo',
  'paypal'
] as const;

/**
 * Cycle de vie d'un paiement, calqué sur les statuts renvoyés par l'API.
 *
 *  initie     → intention créée, le débiteur n'a pas encore agi
 *  en_attente → le prestataire attend la validation du payeur (code USSD, 3-D Secure)
 *  reussi     → fonds confirmés, montants de la dette mis à jour côté API
 *  echoue     → refus du prestataire ou expiration du délai de validation
 *  annule     → abandon par le débiteur
 */
export type StatutPaiement = 'initie' | 'en_attente' | 'reussi' | 'echoue' | 'annule';

/** Statuts sur lesquels il reste quelque chose à attendre. */
export function paiementEnCours(statut: StatutPaiement): boolean {
  return statut === 'initie' || statut === 'en_attente';
}

/**
 * Trace d'une notification déclenchée par l'API à la confirmation du paiement.
 *
 * L'envoi est fait côté serveur : le front ne fait que restituer au débiteur
 * qui a été prévenu, pour qu'il sache que sa démarche est enregistrée.
 */
export interface NotificationPaiement {
  destinataire: 'admin' | 'partenaire' | 'agent' | 'debiteur';
  canal: 'email' | 'sms' | 'push';
  /** Nom du destinataire lorsque l'API le communique. */
  nom: string | null;
  envoyee: boolean;
}

/** Ressource paiement telle que renvoyée par l'API. */
export interface Paiement {
  id: string;
  /** Référence lisible communiquée au débiteur (rapprochement comptable). */
  reference: string;
  dette_id: string;
  partenaire_id: string | null;
  montant: number;
  devise: string;
  moyen: MoyenPaiement;
  statut: StatutPaiement;
  /** Page du prestataire vers laquelle rediriger (carte, PayPal). Null sinon. */
  url_redirection: string | null;
  /** Consigne affichable pour le mobile money (« Validez sur votre téléphone »). */
  instruction: string | null;
  /** Motif du refus, présent sur les statuts `echoue` et `annule`. */
  message_echec: string | null;
  notifications: NotificationPaiement[];
  cree_le: string | null;
  confirme_le: string | null;
}

/** Corps de POST /api/debiteur/me/paiements. */
export interface DemandePaiement {
  dette_id: string;
  montant: number;
  moyen: MoyenPaiement;
  /** Numéro à débiter, requis pour `orange_money` et `mtn_momo`. */
  telephone?: string;
  /** URL sur laquelle le prestataire renvoie le débiteur après redirection. */
  url_retour?: string;
}

/** Métadonnées d'affichage d'un moyen de paiement. */
export interface DescriptionMoyen {
  moyen: MoyenPaiement;
  libelle: string;
  detail: string;
  icone: string;
  /** Le moyen exige un numéro de téléphone mobile. */
  telephoneRequis: boolean;
}

export const DESCRIPTIONS_MOYENS: readonly DescriptionMoyen[] = [
  {
    moyen: 'carte',
    libelle: 'Carte bancaire',
    detail: 'Visa, Mastercard — paiement sécurisé 3-D Secure',
    icone: 'pe-7s-credit',
    telephoneRequis: false
  },
  {
    moyen: 'orange_money',
    libelle: 'Orange Money',
    detail: 'Validation par code sur votre téléphone',
    icone: 'pe-7s-phone',
    telephoneRequis: true
  },
  {
    moyen: 'mtn_momo',
    libelle: 'MTN Mobile Money',
    detail: 'Validation par code sur votre téléphone',
    icone: 'pe-7s-call',
    telephoneRequis: true
  },
  {
    moyen: 'paypal',
    libelle: 'PayPal',
    detail: 'Redirection vers votre compte PayPal',
    icone: 'pe-7s-global',
    telephoneRequis: false
  }
] as const;

export const LIBELLES_MOYENS: Record<MoyenPaiement, string> = {
  carte: 'Carte bancaire',
  orange_money: 'Orange Money',
  mtn_momo: 'MTN Mobile Money',
  paypal: 'PayPal'
};

export const LIBELLES_STATUT_PAIEMENT: Record<StatutPaiement, string> = {
  initie: 'Initié',
  en_attente: 'En attente de validation',
  reussi: 'Réussi',
  echoue: 'Échoué',
  annule: 'Annulé'
};

export const CLASSES_STATUT_PAIEMENT: Record<StatutPaiement, string> = {
  initie: 'bg-secondary',
  en_attente: 'bg-warning text-dark',
  reussi: 'bg-success',
  echoue: 'bg-danger',
  annule: 'bg-dark'
};

export const LIBELLES_DESTINATAIRES: Record<NotificationPaiement['destinataire'], string> = {
  admin: 'Administration Arcréances',
  partenaire: 'Partenaire créancier',
  agent: 'Agent de recouvrement',
  debiteur: 'Vous-même'
};
