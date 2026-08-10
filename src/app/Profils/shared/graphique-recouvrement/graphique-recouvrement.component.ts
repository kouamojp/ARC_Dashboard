import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ChartConfiguration } from 'chart.js';

import { Synthese } from '../../../core/models';

/**
 * Anneau versé / restant dû, alimenté par une synthèse.
 */
@Component({
  selector: 'app-graphique-recouvrement',
  templateUrl: './graphique-recouvrement.component.html',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager
})
export class GraphiqueRecouvrementComponent {
  readonly synthese = input<Synthese | null>(null);

  readonly aDesDonnees = computed(() => {
    const s = this.synthese();
    return !!s && s.montant_reconnu > 0;
  });

  readonly donnees = computed<ChartConfiguration<'doughnut'>['data']>(() => {
    const s = this.synthese();

    return {
      labels: ['Versé', 'Restant dû'],
      datasets: [
        {
          data: [s?.montant_verse ?? 0, Math.max(0, s?.solde ?? 0)],
          backgroundColor: ['#3ac47d', '#d92550'],
          hoverBackgroundColor: ['#34ad70', '#c11f47'],
          borderWidth: 0
        }
      ]
    };
  });

  readonly options: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { position: 'bottom' }
    }
  };
}
