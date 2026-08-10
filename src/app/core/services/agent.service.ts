import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Agent, Debiteur, Dette, Synthese } from '../models';

/**
 * Espace personnel de l'agent de recouvrement connecté.
 */
@Injectable({ providedIn: 'root' })
export class AgentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/agent/me`;

  profil(): Observable<Agent> {
    return this.http.get<Agent>(this.base);
  }

  debiteurs(): Observable<Debiteur[]> {
    return this.http.get<Debiteur[]>(`${this.base}/debiteurs`);
  }

  dettes(): Observable<Dette[]> {
    return this.http.get<Dette[]>(`${this.base}/dettes`);
  }

  synthese(): Observable<Synthese> {
    return this.http.get<Synthese>(`${this.base}/synthese`);
  }
}
