import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { DEVISE, Dette } from '../../../core/models';
import {
  CLASSES_STATUT,
  LIBELLES_STATUT,
  StatutDette,
  joursDeRetard,
  statutDe
} from '../statut-dette';

/**
 * Tableau de dettes commun aux trois profils.
 *
 * La colonne « tiers » est optionnelle et paramétrable : un débiteur n'a pas
 * besoin de se voir lui-même, alors qu'un partenaire ou un agent veut savoir
 * de quel débiteur relève chaque ligne.
 */
@Component({
  selector: 'app-table-dettes',
  templateUrl: './table-dettes.component.html',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager
})
export class TableDettesComponent {
  /** Annoncée une fois en légende plutôt que répétée sur chaque cellule. */
  readonly devise = DEVISE;

  readonly dettes = input<Dette[]>([]);

  /** En-tête de la colonne tiers. Null pour masquer la colonne. */
  readonly libelleTiers = input<string | null>(null);

  /** Correspondance identifiant → nom affichable pour la colonne tiers. */
  readonly nomsTiers = input<Map<string, string>>(new Map());

  /** Champ de la dette portant l'identifiant du tiers. */
  readonly cleTiers = input<'debiteur_id' | 'partenaire_id'>('debiteur_id');

  readonly messageVide = input('Aucune dette à afficher.');

  statut(dette: Dette): StatutDette {
    return statutDe(dette);
  }

  libelleStatut(dette: Dette): string {
    return LIBELLES_STATUT[this.statut(dette)];
  }

  classeStatut(dette: Dette): string {
    return CLASSES_STATUT[this.statut(dette)];
  }

  retard(dette: Dette): number | null {
    return joursDeRetard(dette);
  }

  nomTiers(dette: Dette): string {
    const identifiant = dette[this.cleTiers()];
    return (identifiant && this.nomsTiers().get(identifiant)) || '—';
  }

  /** Part versée d'une dette, pour la barre de progression de la ligne. */
  progression(dette: Dette): number {
    if (dette.montant_reconnu <= 0) {
      return 0;
    }

    return Math.min(100, Math.round((dette.montant_verse / dette.montant_reconnu) * 100));
  }
}
