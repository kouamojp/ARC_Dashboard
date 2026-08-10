import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Agent, Debiteur, Dette, Partenaire, Synthese } from '../models';

/**
 * Espace personnel du débiteur connecté.
 * Le périmètre est déterminé par le token, aucun identifiant n'est transmis.
 */
@Injectable({ providedIn: 'root' })
export class DebiteurService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/debiteur/me`;

  profil(): Observable<Debiteur> {
    return this.http.get<Debiteur>(this.base);
  }

  dettes(): Observable<Dette[]> {
    return this.http.get<Dette[]>(`${this.base}/dettes`);
  }

  partenaires(): Observable<Partenaire[]> {
    return this.http.get<Partenaire[]>(`${this.base}/partenaires`);
  }

  /** Null tant qu'aucun agent de recouvrement n'est assigné (204 côté API). */
  agent(): Observable<Agent | null> {
    return this.http.get<Agent | null>(`${this.base}/agent`);
  }

  synthese(): Observable<Synthese> {
    return this.http.get<Synthese>(`${this.base}/synthese`);
  }
}
