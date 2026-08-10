import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { Agent, Debiteur, Dette, Synthese } from '../../../core/models';
import { AgentService } from '../../../core/services/agent.service';
import { AuthService } from '../../../core/services/auth.service';
import { messageErreur } from '../../../core/utils/erreur-api';

@Component({
  selector: 'app-agent-dashboard',
  templateUrl: './dashboard.component.html',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager
})
export class AgentDashboardComponent {
  private readonly service = inject(AgentService);
  private readonly auth = inject(AuthService);

  readonly profil = signal<Agent | null>(this.auth.utilisateur() as Agent | null);
  readonly synthese = signal<Synthese | null>(null);
  readonly debiteurs = signal<Debiteur[]>([]);
  readonly dettes = signal<Dette[]>([]);
  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);

  /** Dettes dont le solde reste positif, triées du plus gros au plus petit. */
  readonly dettesEnCours = computed(() =>
    this.dettes()
      .filter(dette => dette.solde > 0)
      .sort((a, b) => b.solde - a.solde)
  );

  /** Raccourci société par identifiant, pour l'affichage du tableau. */
  readonly societes = computed(() => {
    const table = new Map<string, string>();
    for (const debiteur of this.debiteurs()) {
      table.set(debiteur.id, debiteur.societe_debitrice);
    }
    return table;
  });

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
    this.service.dettes().subscribe({ next: liste => this.dettes.set(liste) });
  }

  societeDe(debiteurId: string | null): string {
    return (debiteurId && this.societes().get(debiteurId)) || '—';
  }
}
