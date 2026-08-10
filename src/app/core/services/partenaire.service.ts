import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Debiteur, Dette, Partenaire, Rapport, Synthese } from '../models';

/**
 * Espace personnel du partenaire connecté.
 */
@Injectable({ providedIn: 'root' })
export class PartenaireService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/partenaire/me`;

  profil(): Observable<Partenaire> {
    return this.http.get<Partenaire>(this.base);
  }

  dettes(): Observable<Dette[]> {
    return this.http.get<Dette[]>(`${this.base}/dettes`);
  }

  debiteurs(): Observable<Debiteur[]> {
    return this.http.get<Debiteur[]>(`${this.base}/debiteurs`);
  }

  /** Null tant qu'aucun rapport n'a été produit (204 côté API). */
  rapport(): Observable<Rapport | null> {
    return this.http.get<Rapport | null>(`${this.base}/rapport`);
  }

  synthese(): Observable<Synthese> {
    return this.http.get<Synthese>(`${this.base}/synthese`);
  }
}
