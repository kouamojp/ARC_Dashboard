import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { Dette, Partenaire, Synthese } from '../../../core/models';
import { DebiteurService } from '../../../core/services/debiteur.service';
import { messageErreur } from '../../../core/utils/erreur-api';
import { statutDe } from '../../shared/statut-dette';

@Component({
  selector: 'app-debiteur-dettes',
  templateUrl: './dettes.component.html',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager
})
export class DebiteurDettesComponent {
  private readonly service = inject(DebiteurService);

  readonly dettes = signal<Dette[]>([]);
  readonly partenaires = signal<Partenaire[]>([]);
  readonly synthese = signal<Synthese | null>(null);
  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);

  /** Filtre actif du tableau. */
  readonly filtre = signal<'toutes' | 'en_cours' | 'en_retard' | 'soldee'>('toutes');

  readonly nomsPartenaires = computed(() => {
    const table = new Map<string, string>();
    for (const partenaire of this.partenaires()) {
      table.set(partenaire.id, partenaire.nom);
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
    this.service.dettes().subscribe({
      next: dettes => {
        this.dettes.set(dettes);
        this.chargement.set(false);
      },
      error: erreur => {
        this.erreur.set(messageErreur(erreur, 'Impossible de charger vos dettes.'));
        this.chargement.set(false);
      }
    });

    this.service.synthese().subscribe({ next: synthese => this.synthese.set(synthese) });
    this.service.partenaires().subscribe({ next: liste => this.partenaires.set(liste) });
  }
}
