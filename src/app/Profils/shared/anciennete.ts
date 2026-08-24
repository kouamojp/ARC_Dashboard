import { Dette } from '../../core/models';
import { echeanceDe, joursDeRetard } from './statut-dette';

/**
 * Balance âgée : le solde réparti par ancienneté de l'échéance.
 *
 * Les tranches reprennent celles du métier — 30, 60 et 90 jours — parce que
 * c'est sur elles que se décident les relances : au-delà de 90 jours, un
 * dossier bascule en contentieux.
 */
export interface TrancheAge {
  /** Rang de 0 (à échoir) à 4 (plus de 90 jours), utilisé pour la couleur. */
  rang: 0 | 1 | 2 | 3 | 4;
  libelle: string;
  montant: number;
  nombre: number;
}

const TRANCHES: readonly { rang: TrancheAge['rang']; libelle: string; min: number; max: number }[] = [
  { rang: 0, libelle: 'À échoir', min: -Infinity, max: 0 },
  { rang: 1, libelle: '1–30 j', min: 1, max: 30 },
  { rang: 2, libelle: '31–60 j', min: 31, max: 60 },
  { rang: 3, libelle: '61–90 j', min: 61, max: 90 },
  { rang: 4, libelle: '+ de 90 j', min: 91, max: Infinity }
];

/**
 * Répartit le solde des dettes non soldées par tranche d'ancienneté.
 *
 * Une dette sans échéance exploitable — le champ est libre côté MongoDB —
 * compte comme « à échoir » : rien ne permet d'affirmer qu'elle est en retard.
 * Les tranches vides sont écartées pour que la bande ne montre que du réel.
 */
export function repartirParAge(dettes: Dette[], aujourdhui: Date = new Date()): TrancheAge[] {
  const cumuls = TRANCHES.map(tranche => ({ ...tranche, montant: 0, nombre: 0 }));

  for (const dette of dettes) {
    if (dette.solde <= 0) {
      continue;
    }

    const retard = joursDeRetard(dette, aujourdhui) ?? 0;
    const tranche = cumuls.find(t => retard >= t.min && retard <= t.max)!;

    tranche.montant += dette.solde;
    tranche.nombre += 1;
  }

  return cumuls
    .filter(tranche => tranche.montant > 0)
    .map(({ rang, libelle, montant, nombre }) => ({ rang, libelle, montant, nombre }));
}

/** Montant immobilisé depuis plus de 90 jours, le chiffre qui décide d'une relance. */
export function montantImmobilise(tranches: TrancheAge[]): number {
  return tranches.find(tranche => tranche.rang === 4)?.montant ?? 0;
}

/**
 * Dettes ayant connu un versement, de la plus récente à la plus ancienne.
 * Sert à montrer que l'argent rentre, en regard de ce qui reste bloqué.
 */
export function mouvementsRecents(dettes: Dette[], maximum = 5): Dette[] {
  return dettes
    .filter(dette => dette.montant_verse > 0 && !!dette.dernier_versement)
    .map(dette => ({ dette, quand: Date.parse(dette.dernier_versement!) }))
    .filter(entree => !Number.isNaN(entree.quand))
    .sort((a, b) => b.quand - a.quand)
    .slice(0, maximum)
    .map(entree => entree.dette);
}

/** Échéance la plus proche parmi les dettes non soldées, ou null. */
export function prochaineEcheance(dettes: Dette[]): Date | null {
  const dates = dettes
    .filter(dette => dette.solde > 0)
    .map(dette => echeanceDe(dette))
    .filter((date): date is Date => date !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  return dates.length ? dates[0] : null;
}
