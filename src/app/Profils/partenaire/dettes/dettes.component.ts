import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import { Debiteur, Dette } from '../../../core/models';
import { PartenaireService } from '../../../core/services/partenaire.service';
import { messageErreur } from '../../../core/utils/erreur-api';
import { statutDe } from '../../shared/statut-dette';

@Component({
  selector: 'app-partenaire-dettes',
  templateUrl: './dettes.component.html',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager
})
export class PartenaireDettesComponent {
  private readonly service = inject(PartenaireService);

  readonly dettes = signal<Dette[]>([]);
  readonly debiteurs = signal<Debiteur[]>([]);
  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);
  readonly filtre = signal<'toutes' | 'en_cours' | 'en_retard' | 'soldee'>('toutes');

  readonly nomsDebiteurs = computed(() => {
    const table = new Map<string, string>();
    for (const debiteur of this.debiteurs()) {
      table.set(debiteur.id, debiteur.societe_debitrice);
    }
    return table;
  });

  readonly dettesAffichees = computed(() => {
    const filtre = this.filtre();
    if (filtre === 'toutes') {
      return this.dettes();
    }
    return this.dettes().filter(dette => statutDe(dette) === filtre);
  });

  readonly compteurs = computed(() => {
    const dettes = this.dettes();
    return {
      toutes: dettes.length,
      en_cours: dettes.filter(d => statutDe(d) === 'en_cours').length,
      en_retard: dettes.filter(d => statutDe(d) === 'en_retard').length,
      soldee: dettes.filter(d => statutDe(d) === 'soldee').length
    };
  });

  constructor() {
    forkJoin({
      dettes: this.service.dettes(),
      debiteurs: this.service.debiteurs()
    }).subscribe({
      next: ({ dettes, debiteurs }) => {
        this.dettes.set(dettes);
        this.debiteurs.set(debiteurs);
        this.chargement.set(false);
      },
      error: erreur => {
        this.erreur.set(messageErreur(erreur, 'Impossible de charger les dettes.'));
        this.chargement.set(false);
      }
    });
  }
}
