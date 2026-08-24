import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { Debiteur, Dette } from '../../../core/models';
import { joursDeRetard } from '../statut-dette';

/** Un tiers en retard, avec ce qu'il faut pour décider de l'appeler. */
export interface LigneRelance {
  id: string;
  nom: string;
  lieu: string | null;
  nombre: number;
  jours: number;
  solde: number;
}

/**
 * File des relances : qui rappeler, dans quel ordre.
 *
 * Le tri se fait sur l'ancienneté et non sur le montant — un petit impayé de
 * six mois se recouvre moins bien qu'un gros de trois semaines.
 */
@Component({
  selector: 'app-file-relances',
  templateUrl: './file-relances.component.html',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager
})
export class FileRelancesComponent {
  readonly lignes = input<LigneRelance[]>([]);
  readonly maximum = input(5);

  readonly retenues = computed(() => this.lignes().slice(0, this.maximum()));
}

/**
 * Construit la file à partir des débiteurs et de leurs dettes.
 *
 * Exporté à côté du composant plutôt que dans `consolidation.ts` : le calcul
 * ne sert qu'ici, et le regroupement par débiteur y est déjà fait autrement.
 */
export function construireFileRelances(
  debiteurs: Debiteur[],
  dettes: Dette[],
  aujourdhui: Date = new Date()
): LigneRelance[] {
  return debiteurs
    .map(debiteur => {
      const retards = dettes
        .filter(dette => dette.debiteur_id === debiteur.id)
        .map(dette => ({ dette, jours: joursDeRetard(dette, aujourdhui) }))
        .filter((entree): entree is { dette: Dette; jours: number } => entree.jours !== null);

      return {
        id: debiteur.id,
        nom: debiteur.societe_debitrice,
        lieu: debiteur.ville || null,
        nombre: retards.length,
        jours: retards.reduce((pire, entree) => Math.max(pire, entree.jours), 0),
        solde: retards.reduce((total, entree) => total + entree.dette.solde, 0)
      };
    })
    .filter(ligne => ligne.nombre > 0)
    .sort((a, b) => b.jours - a.jours);
}
