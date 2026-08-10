import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { Debiteur, Partenaire, Rapport, Synthese } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { PartenaireService } from '../../../core/services/partenaire.service';
import { messageErreur } from '../../../core/utils/erreur-api';

@Component({
  selector: 'app-partenaire-dashboard',
  templateUrl: './dashboard.component.html',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager
})
export class PartenaireDashboardComponent {
  private readonly service = inject(PartenaireService);
  private readonly auth = inject(AuthService);

  readonly profil = signal<Partenaire | null>(this.auth.utilisateur() as Partenaire | null);
  readonly synthese = signal<Synthese | null>(null);
  readonly debiteurs = signal<Debiteur[]>([]);
  readonly rapport = signal<Rapport | null>(null);
  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);

  constructor() {
    this.service.synthese().subscribe({
      next: synthese => {
        this.synthese.set(synthese);
        this.chargement.set(false);
      },
      error: erreur => {
        this.erreur.set(messageErreur(erreur, 'Impossible de charger votre synthèse.'));
        this.chargement.set(false);
      }
    });

    this.service.debiteurs().subscribe({ next: liste => this.debiteurs.set(liste) });
    this.service.rapport().subscribe({ next: rapport => this.rapport.set(rapport) });
  }
}
