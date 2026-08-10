import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { Agent, Debiteur, Partenaire, Synthese } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { DebiteurService } from '../../../core/services/debiteur.service';
import { messageErreur } from '../../../core/utils/erreur-api';

@Component({
  selector: 'app-debiteur-dashboard',
  templateUrl: './dashboard.component.html',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager
})
export class DebiteurDashboardComponent {
  private readonly service = inject(DebiteurService);
  private readonly auth = inject(AuthService);

  readonly profil = signal<Debiteur | null>(this.auth.utilisateur() as Debiteur | null);
  readonly synthese = signal<Synthese | null>(null);
  readonly agent = signal<Agent | null>(null);
  readonly partenaires = signal<Partenaire[]>([]);
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

    // L'agent et les partenaires sont accessoires : leur absence ne doit pas
    // faire échouer la page.
    this.service.agent().subscribe({ next: agent => this.agent.set(agent) });
    this.service.partenaires().subscribe({ next: liste => this.partenaires.set(liste) });
  }
}
