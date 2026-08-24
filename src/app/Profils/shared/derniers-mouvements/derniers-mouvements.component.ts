import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { Debiteur, Dette } from '../../../core/models';
import { mouvementsRecents } from '../anciennete';

/** Une rentrée d'argent, telle que la dette la porte. */
export interface Mouvement {
  id: string;
  jour: string;
  mois: string;
  titre: string;
  detail: string;
  /** Renseigné quand aucun libellé de dette ne sert déjà de sous-titre. */
  solde: number | null;
  verse: number;
}

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/**
 * Derniers versements enregistrés, en regard de ce qui reste bloqué.
 *
 * L'API ne renvoie que le cumul versé et la date du dernier versement, pas le
 * détail des règlements : le montant affiché est donc annoncé comme un cumul.
 */
@Component({
  selector: 'app-derniers-mouvements',
  templateUrl: './derniers-mouvements.component.html',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager
})
export class DerniersMouvementsComponent {
  readonly dettes = input<Dette[]>([]);
  /** Facultatif : permet de nommer le débiteur plutôt que la dette seule. */
  readonly debiteurs = input<Debiteur[]>([]);
  readonly maximum = input(5);

  readonly mouvements = computed<Mouvement[]>(() => {
    const parId = new Map(this.debiteurs().map(debiteur => [debiteur.id, debiteur]));

    return mouvementsRecents(this.dettes(), this.maximum()).map(dette => {
      const quand = new Date(dette.dernier_versement!);
      const debiteur = dette.debiteur_id ? parId.get(dette.debiteur_id) : undefined;

      return {
        id: dette.id,
        jour: String(quand.getDate()).padStart(2, '0'),
        mois: MOIS[quand.getMonth()],
        titre: debiteur?.societe_debitrice ?? dette.intitule,
        detail: debiteur ? dette.intitule : '',
        solde: debiteur ? null : dette.solde,
        verse: dette.montant_verse
      };
    });
  });
}
