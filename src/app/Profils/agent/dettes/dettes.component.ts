import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import { Debiteur, Dette } from '../../../core/models';
import { AgentService } from '../../../core/services/agent.service';
import { messageErreur } from '../../../core/utils/erreur-api';
import { joursDeRetard, statutDe } from '../../shared/statut-dette';

@Component({
  selector: 'app-agent-dettes',
  templateUrl: './dettes.component.html',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager
})
export class AgentDettesComponent {
  private readonly service = inject(AgentService);

  readonly dettes = signal<Dette[]>([]);
  readonly debiteurs = signal<Debiteur[]>([]);
  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);

  /** Les retards d'abord : c'est le cœur du travail d'un agent. */
  readonly filtre = signal<'en_retard' | 'en_cours' | 'soldee' | 'toutes'>('en_retard');

  readonly nomsDebiteurs = computed(() => {
    const table = new Map<string, string>();
    for (const debiteur of this.debiteurs()) {
      table.set(debiteur.id, debiteur.societe_debitrice);
    }
    return table;
  });

  readonly dettesAffichees = computed(() => {
    const filtre = this.filtre();
    const dettes = filtre === 'toutes'
      ? this.dettes()
      : this.dettes().filter(dette => statutDe(dette) === filtre);

    // Les plus anciens retards en tête, puis les plus gros soldes.
    return [...dettes].sort((a, b) => {
      const retardA = joursDeRetard(a) ?? -1;
      const retardB = joursDeRetard(b) ?? -1;
      return retardB - retardA || b.solde - a.solde;
    });
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

  /** Montant total immobilisé par les dettes en retard. */
  readonly montantEnRetard = computed(() =>
    this.dettes()
      .filter(dette => statutDe(dette) === 'en_retard')
      .reduce((total, dette) => total + dette.solde, 0)
  );

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
        this.erreur.set(messageErreur(erreur, 'Impossible de charger les dettes suivies.'));
        this.chargement.set(false);
      }
    });
  }
}
