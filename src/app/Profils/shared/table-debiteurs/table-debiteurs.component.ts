import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { LigneDebiteur } from '../consolidation';

/**
 * Tableau consolidé des débiteurs, partagé par les espaces partenaire et agent.
 */
@Component({
  selector: 'app-table-debiteurs',
  templateUrl: './table-debiteurs.component.html',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager
})
export class TableDebiteursComponent {
  readonly lignes = input<LigneDebiteur[]>([]);
  readonly messageVide = input('Aucun débiteur à afficher.');

  classeTaux(taux: number): string {
    if (taux >= 75) {
      return 'bg-success';
    }
    return taux >= 40 ? 'bg-warning' : 'bg-danger';
  }
}
