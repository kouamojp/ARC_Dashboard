import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { Agent, Debiteur, Dette, Synthese } from '../../../core/models';
import { AgentService } from '../../../core/services/agent.service';
import { AuthService } from '../../../core/services/auth.service';
import { messageErreur } from '../../../core/utils/erreur-api';
import { construireFileRelances } from '../../shared/file-relances/file-relances.component';
import { estEnRetard, joursDeRetard } from '../../shared/statut-dette';

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

  readonly relances = computed(() => construireFileRelances(this.debiteurs(), this.dettes()));

  readonly dettesEnRetard = computed(() => this.dettes().filter(dette => estEnRetard(dette)));

  readonly surtitre = computed(() => {
    const nombre = this.debiteurs().length;
    return nombre ? `Espace agent · ${nombre} débiteur(s) assigné(s)` : 'Espace agent';
  });

  /** Indicateurs de suivi du portefeuille. */
  readonly indicateurs = computed(() => {
    const enRetard = this.dettesEnRetard();
    const retards = enRetard
      .map(dette => joursDeRetard(dette) ?? 0)
      .sort((a, b) => b - a);

    return {
      dettesEnRetard: enRetard.length,
      retardMaximum: retards.length ? retards[0] : 0
    };
  });

  /**
   * Une phrase qui dit ce qu'il y a à faire, pas ce que la page contient.
   * Le retard le plus ancien est le seul chiffre qui décide d'un ordre du jour.
   */
  readonly resume = computed(() => {
    if (this.chargement()) {
      return 'Chargement de votre portefeuille…';
    }

    const { retardMaximum, dettesEnRetard } = this.indicateurs();

    if (!dettesEnRetard) {
      return 'Aucune échéance dépassée dans votre portefeuille.';
    }

    return `Le retard le plus ancien de votre portefeuille atteint ${retardMaximum} jour(s).`;
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
}
