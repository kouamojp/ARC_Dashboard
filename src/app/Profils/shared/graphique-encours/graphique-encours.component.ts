import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ChartConfiguration } from 'chart.js';

/** Une barre du graphique : un tiers et son encours. */
export interface LigneEncours {
  libelle: string;
  solde: number;
}

/**
 * Barres horizontales des encours par tiers, triées par montant décroissant.
 */
@Component({
  selector: 'app-graphique-encours',
  templateUrl: './graphique-encours.component.html',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager
})
export class GraphiqueEncoursComponent {
  readonly lignes = input<LigneEncours[]>([]);

  /** Au-delà, le graphique devient illisible : on garde les plus gros encours. */
  readonly maximum = input(10);

  readonly retenues = computed(() =>
    [...this.lignes()]
      .filter(ligne => ligne.solde > 0)
      .sort((a, b) => b.solde - a.solde)
      .slice(0, this.maximum())
  );

  readonly donnees = computed<ChartConfiguration<'bar'>['data']>(() => ({
    labels: this.retenues().map(ligne => ligne.libelle),
    datasets: [
      {
        label: 'Encours',
        data: this.retenues().map(ligne => ligne.solde),
        backgroundColor: '#3f6ad8',
        hoverBackgroundColor: '#2f57b8',
        borderWidth: 0,
        borderRadius: 3
      }
    ]
  }));

  readonly options: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { beginAtZero: true }
    }
  };

  hauteur(): number {
    // Une barre lisible réclame une quarantaine de pixels.
    return Math.max(160, this.retenues().length * 42);
  }
}
