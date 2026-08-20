import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { DemandePaiement, Paiement, paiementEnCours } from '../models';

/** Intervalle entre deux relectures du statut, en millisecondes. */
const PERIODE_SUIVI = 4000;

/**
 * Paiements du débiteur connecté.
 *
 * Le périmètre est déduit du token, comme sur le reste de l'espace débiteur :
 * aucun identifiant de débiteur n'est transmis.
 */
@Injectable({ providedIn: 'root' })
export class PaiementService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/debiteur/me/paiements`;

  /** Historique, du plus récent au plus ancien. */
  historique(): Observable<Paiement[]> {
    return this.http.get<Paiement[]>(this.base);
  }

  /**
   * Déclare une intention de paiement.
   *
   * L'API répond avec le paiement créé : une URL de redirection pour la carte
   * et PayPal, une consigne de validation pour le mobile money.
   */
  initier(demande: DemandePaiement): Observable<Paiement> {
    return this.http.post<Paiement>(this.base, demande);
  }

  statut(id: string): Observable<Paiement> {
    return this.http.get<Paiement>(`${this.base}/${id}`);
  }

  /** Abandon explicite d'un paiement encore en attente. */
  annuler(id: string): Observable<Paiement> {
    return this.http.post<Paiement>(`${this.base}/${id}/annuler`, {});
  }

  /**
   * Relit le statut jusqu'à ce que le prestataire tranche.
   *
   * Le mobile money est asynchrone : le débiteur valide sur son téléphone, et
   * seule l'API sait quand les fonds sont confirmés. Le flux émet chaque
   * lecture — y compris la dernière, décisive — puis se termine de lui-même, ou
   * au bout de `tentatives` lectures si le payeur n'a jamais validé.
   */
  suivre(id: string, tentatives = 45): Observable<Paiement> {
    let restantes = tentatives;

    return timer(PERIODE_SUIVI, PERIODE_SUIVI).pipe(
      switchMap(() => this.statut(id)),
      takeWhile(paiement => paiementEnCours(paiement.statut) && --restantes > 0, true)
    );
  }
}
