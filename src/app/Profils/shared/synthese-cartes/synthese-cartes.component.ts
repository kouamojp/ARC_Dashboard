import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { Synthese } from '../../../core/models';

/**
 * Rangée d'indicateurs commune aux trois profils, alimentée par les endpoints
 * `/me/synthese`.
 *
 * Les montants sont posés au filet plutôt qu'en cartes colorées : sur un
 * tableau de bord d'argent, la couleur doit rester disponible pour dire ce qui
 * est rentré et ce qui manque, pas pour distinguer quatre tuiles entre elles.
 */
@Component({
  selector: 'app-synthese-cartes',
  templateUrl: './synthese-cartes.component.html',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager
})
export class SyntheseCartesComponent {
  readonly synthese = input<Synthese | null>(null);
  readonly chargement = input(false);

  /** Nombre de dettes en retard, quand l'appelant sait le calculer. */
  readonly enRetard = input<number | null>(null);

  readonly note = computed(() => {
    const retard = this.enRetard();

    if (retard === null) {
      return 'Reconnu moins versé';
    }

    return retard > 0 ? `Dont ${retard} dette(s) en retard` : 'Aucune dette en retard';
  });
}
