import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import { DEVISE, Dette, Partenaire, Recu } from '../../../core/models';
import { DebiteurService } from '../../../core/services/debiteur.service';
import { messageErreur } from '../../../core/utils/erreur-api';

/** Toutes années confondues. */
const TOUTES = 'toutes';

/**
 * Reçus de versement du débiteur.
 *
 * Deux origines se mêlent dans cette liste : les règlements encaissés par le
 * tunnel de paiement en ligne et ceux saisis à la main dans le back-office
 * (chèque, espèces, virement). Le débiteur n'a pas à faire la différence — elle
 * n'est signalée que pour lui permettre de retrouver un paiement qu'il a
 * lui-même effectué depuis son espace.
 */
@Component({
  selector: 'app-debiteur-recus',
  templateUrl: './recus.component.html',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager
})
export class DebiteurRecusComponent {
  private readonly service = inject(DebiteurService);

  readonly devise = DEVISE;
  readonly toutes = TOUTES;

  readonly recus = signal<Recu[]>([]);
  readonly dettes = signal<Dette[]>([]);
  readonly partenaires = signal<Partenaire[]>([]);
  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);

  /** Filtres du tableau. */
  readonly annee = signal<string>(TOUTES);
  readonly recherche = signal('');

  readonly nomsDettes = computed(() => {
    const table = new Map<string, string>();
    for (const dette of this.dettes()) {
      table.set(dette.id, dette.intitule);
    }
    return table;
  });

  readonly nomsPartenaires = computed(() => {
    const table = new Map<string, string>();
    for (const partenaire of this.partenaires()) {
      table.set(partenaire.id, partenaire.nom);
    }
    return table;
  });

  /** Années présentes dans les reçus, de la plus récente à la plus ancienne. */
  readonly annees = computed(() => {
    const annees = new Set<string>();
    for (const recu of this.recus()) {
      const annee = this.anneeDe(recu);
      if (annee) {
        annees.add(annee);
      }
    }
    return [...annees].sort().reverse();
  });

  readonly recusAffiches = computed(() => {
    const annee = this.annee();
    const terme = this.recherche().trim().toLowerCase();

    return this.recus().filter(recu => {
      if (annee !== TOUTES && this.anneeDe(recu) !== annee) {
        return false;
      }

      if (!terme) {
        return true;
      }

      // La recherche porte sur ce que le débiteur a sous les yeux : bordereau,
      // dette et mode de règlement.
      return [recu.bordereau, this.intituleDette(recu), recu.mode]
        .some(valeur => (valeur || '').toLowerCase().includes(terme));
    });
  });

  /** Total des reçus affichés : suit les filtres, pas l'ensemble. */
  readonly totalAffiche = computed(() =>
    this.recusAffiches().reduce((somme, recu) => somme + (recu.montant || 0), 0)
  );

  readonly dernierVersement = computed(() => {
    const dates = this.recus()
      .map(recu => recu.date)
      .filter((date): date is string => !!date)
      .sort();

    return dates.length ? dates[dates.length - 1] : null;
  });

  constructor() {
    forkJoin({
      recus: this.service.recus(),
      dettes: this.service.dettes()
    }).subscribe({
      next: ({ recus, dettes }) => {
        this.recus.set(recus);
        this.dettes.set(dettes);
        this.chargement.set(false);
      },
      error: erreur => {
        this.erreur.set(messageErreur(erreur, 'Impossible de charger vos reçus.'));
        this.chargement.set(false);
      }
    });

    // Accessoire : sans les partenaires, la colonne affiche simplement un tiret.
    this.service.partenaires().subscribe({ next: liste => this.partenaires.set(liste) });
  }

  intituleDette(recu: Recu): string {
    return (recu.dette_id && this.nomsDettes().get(recu.dette_id)) || '—';
  }

  nomPartenaire(recu: Recu): string {
    return (recu.partenaire_id && this.nomsPartenaires().get(recu.partenaire_id)) || '—';
  }

  /** Vrai pour un reçu émis par le tunnel de paiement de cet espace. */
  estEnLigne(recu: Recu): boolean {
    return !!recu.paiement_id;
  }

  imprimer(): void {
    window.print();
  }

  private anneeDe(recu: Recu): string | null {
    return recu.date ? recu.date.slice(0, 4) : null;
  }
}
