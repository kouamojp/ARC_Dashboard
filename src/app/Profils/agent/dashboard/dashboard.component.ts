import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { Agent, Debiteur, Dette, Synthese } from '../../../core/models';
import { AgentService } from '../../../core/services/agent.service';
import { AuthService } from '../../../core/services/auth.service';
import { messageErreur } from '../../../core/utils/erreur-api';
import { consoliderParDebiteur } from '../../shared/consolidation';
import { LigneEncours } from '../../shared/graphique-encours/graphique-encours.component';
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

  readonly lignes = computed(() => consoliderParDebiteur(this.debiteurs(), this.dettes()));

  readonly encours = computed<LigneEncours[]>(() =>
    this.lignes().map(ligne => ({
      libelle: ligne.debiteur.societe_debitrice,
      solde: ligne.solde
    }))
  );

  readonly dettesEnRetard = computed(() => this.dettes().filter(dette => estEnRetard(dette)));

  /** Indicateurs de performance affichés en tête de tableau de bord. */
  readonly indicateurs = computed(() => {
    const enRetard = this.dettesEnRetard();
    const retards = enRetard
      .map(dette => joursDeRetard(dette) ?? 0)
      .sort((a, b) => b - a);

    return {
      societesARelancer: this.lignes().filter(ligne => ligne.enRetard > 0).length,
      dettesEnRetard: enRetard.length,
      montantEnRetard: enRetard.reduce((total, dette) => total + dette.solde, 0),
      retardMaximum: retards.length ? retards[0] : 0,
      dossiersSoldes: this.dettes().filter(dette => dette.solde <= 0).length
    };
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
