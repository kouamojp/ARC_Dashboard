import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Synthese } from '../../../core/models';

/**
 * Bandeau d'indicateurs commun aux trois profils, alimenté par les endpoints
 * `/me/synthese`.
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
}
