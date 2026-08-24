import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Un tiers et son encours, avec l'information de retard s'il y en a. */
export interface LigneBarre {
  id: string;
  libelle: string;
  solde: number;
  enRetard: boolean;
}

/**
 * Encours par tiers, en barres proportionnelles au plus gros solde.
 *
 * Rendu en CSS plutôt qu'en Chart.js : le graphique n'apportait ici ni axe ni
 * interaction, et il imposait sa propre palette au reste de la page.
 */
@Component({
  selector: 'app-barres-encours',
  templateUrl: './barres-encours.component.html',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager
})
export class BarresEncoursComponent {
  readonly lignes = input<LigneBarre[]>([]);

  /** Au-delà, la liste cesse d'être lisible d'un coup d'œil. */
  readonly maximum = input(7);

  readonly retenues = computed(() =>
    [...this.lignes()]
      .filter(ligne => ligne.solde > 0)
      .sort((a, b) => b.solde - a.solde)
      .slice(0, this.maximum())
  );

  private readonly plafond = computed(() =>
    this.retenues().reduce((haut, ligne) => Math.max(haut, ligne.solde), 0)
  );

  part(solde: number): number {
    const haut = this.plafond();
    return haut > 0 ? (solde / haut) * 100 : 0;
  }
}
