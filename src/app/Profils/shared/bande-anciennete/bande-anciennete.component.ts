import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { Dette, Synthese } from '../../../core/models';
import { montantImmobilise, repartirParAge, TrancheAge } from '../anciennete';

/**
 * La bande d'ancienneté : le solde étalé sur l'axe du temps.
 *
 * Chaque segment pèse son montant et chauffe avec son âge. C'est le seul
 * élément saturé du tableau de bord : tout le reste tient au filet.
 */
@Component({
  selector: 'app-bande-anciennete',
  templateUrl: './bande-anciennete.component.html',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager
})
export class BandeAncienneteComponent {
  readonly dettes = input<Dette[]>([]);
  readonly synthese = input<Synthese | null>(null);
  readonly chargement = input(false);

  readonly tranches = computed<TrancheAge[]>(() => repartirParAge(this.dettes()));

  readonly immobilise = computed(() => montantImmobilise(this.tranches()));

  readonly devise = computed(() => this.synthese()?.devise ?? '');

  readonly taux = computed(() => this.synthese()?.taux_recouvrement ?? 0);

  /** Le retard cumulé n'a de sens que si quelque chose reste dû. */
  readonly aDesDonnees = computed(() => this.tranches().length > 0);

  /**
   * Le décalage donne la cascade de gauche à droite : la bande se construit
   * dans le sens de la lecture, du plus récent au plus ancien.
   */
  retard(rang: number): string {
    return `${rang * 0.07}s`;
  }
}
