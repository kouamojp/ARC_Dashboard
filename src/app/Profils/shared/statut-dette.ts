import { Dette } from '../../core/models';

export type StatutDette = 'soldee' | 'en_retard' | 'en_cours';

/**
 * Échéance d'une dette sous forme de date.
 *
 * Le champ est stocké en chaîne libre côté MongoDB : une valeur illisible
 * renvoie null plutôt que de produire une date invalide.
 */
export function echeanceDe(dette: Dette): Date | null {
  if (!dette.date_echeance_mensuelle) {
    return null;
  }

  const horodatage = Date.parse(dette.date_echeance_mensuelle);
  return Number.isNaN(horodatage) ? null : new Date(horodatage);
}

/**
 * Une dette est soldée dès que son solde est nul, en retard si son échéance
 * est passée, en cours sinon. Sans échéance exploitable, elle reste « en cours ».
 */
export function statutDe(dette: Dette, aujourdhui: Date = new Date()): StatutDette {
  if (dette.solde <= 0) {
    return 'soldee';
  }

  const echeance = echeanceDe(dette);

  return echeance && echeance < aujourdhui ? 'en_retard' : 'en_cours';
}

export function estEnRetard(dette: Dette, aujourdhui: Date = new Date()): boolean {
  return statutDe(dette, aujourdhui) === 'en_retard';
}

/** Nombre de jours de retard, ou null si la dette n'est pas en retard. */
export function joursDeRetard(dette: Dette, aujourdhui: Date = new Date()): number | null {
  if (!estEnRetard(dette, aujourdhui)) {
    return null;
  }

  const echeance = echeanceDe(dette)!;
  const millisecondesParJour = 24 * 60 * 60 * 1000;

  return Math.floor((aujourdhui.getTime() - echeance.getTime()) / millisecondesParJour);
}

export const LIBELLES_STATUT: Record<StatutDette, string> = {
  soldee: 'Soldée',
  en_retard: 'En retard',
  en_cours: 'En cours'
};

export const CLASSES_STATUT: Record<StatutDette, string> = {
  soldee: 'bg-success',
  en_retard: 'bg-danger',
  en_cours: 'bg-warning text-dark'
};
