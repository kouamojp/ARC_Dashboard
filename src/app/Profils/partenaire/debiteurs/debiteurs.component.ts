import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import { Debiteur, Dette } from '../../../core/models';
import { PartenaireService } from '../../../core/services/partenaire.service';
import { messageErreur } from '../../../core/utils/erreur-api';
import { consoliderParDebiteur } from '../../shared/consolidation';
import { LigneEncours } from '../../shared/graphique-encours/graphique-encours.component';

@Component({
  selector: 'app-partenaire-debiteurs',
  templateUrl: './debiteurs.component.html',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager
})
export class PartenaireDebiteursComponent {
  private readonly service = inject(PartenaireService);

  readonly debiteurs = signal<Debiteur[]>([]);
  readonly dettes = signal<Dette[]>([]);
  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);

  readonly lignes = computed(() => consoliderParDebiteur(this.debiteurs(), this.dettes()));

  readonly encours = computed<LigneEncours[]>(() =>
    this.lignes().map(ligne => ({
      libelle: ligne.debiteur.societe_debitrice,
      solde: ligne.solde
    }))
  );

  constructor() {
    forkJoin({
      debiteurs: this.service.debiteurs(),
      dettes: this.service.dettes()
    }).subscribe({
      next: ({ debiteurs, dettes }) => {
        this.debiteurs.set(debiteurs);
        this.dettes.set(dettes);
        this.chargement.set(false);
      },
      error: erreur => {
        this.erreur.set(messageErreur(erreur, 'Impossible de charger votre portefeuille.'));
        this.chargement.set(false);
      }
    });
  }
}
