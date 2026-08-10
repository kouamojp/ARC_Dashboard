import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  IdentifiantsConnexion,
  Profil,
  ReponseAuth,
  ReponseUtilisateur,
  UtilisateurConnecte,
  estProfilValide
} from '../models';

const CLE_TOKEN = 'recouvrement.token';
const CLE_PROFIL = 'recouvrement.profil';

/**
 * Source de vérité de la session : token, profil et utilisateur connecté.
 *
 * L'état est exposé en signals, ce qui permet aux composants de réagir sans
 * zone.js. Seuls le token et le profil sont persistés ; l'utilisateur est
 * rechargé depuis /auth/me au démarrage, pour ne jamais afficher de données
 * périmées.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/auth`;

  private readonly _token = signal<string | null>(this.lireToken());
  private readonly _profil = signal<Profil | null>(this.lireProfil());
  private readonly _utilisateur = signal<UtilisateurConnecte | null>(null);

  readonly token = this._token.asReadonly();
  readonly profil = this._profil.asReadonly();
  readonly utilisateur = this._utilisateur.asReadonly();

  readonly estConnecte = computed(() => this._token() !== null);

  /** Nom lisible de l'utilisateur, quel que soit son profil. */
  readonly nomAffiche = computed(() => {
    const utilisateur = this._utilisateur();
    if (!utilisateur) {
      return '';
    }
    if ('societe_debitrice' in utilisateur) {
      return utilisateur.societe_debitrice;
    }
    if ('prenom' in utilisateur) {
      return `${utilisateur.prenom} ${utilisateur.nom}`.trim();
    }
    return utilisateur.nom;
  });

  connexion(identifiants: IdentifiantsConnexion): Observable<ReponseAuth> {
    return this.http.post<ReponseAuth>(`${this.base}/login`, identifiants).pipe(
      tap(reponse => this.ouvrirSession(reponse.token, reponse.profil, reponse.utilisateur))
    );
  }

  /**
   * Déconnexion complète : le back-end place le token sur liste noire, puis
   * l'état local est vidé. L'échec côté serveur ne doit pas empêcher la
   * déconnexion locale.
   */
  deconnexion(): Observable<void> {
    return this.http.post<unknown>(`${this.base}/logout`, {}).pipe(
      catchError(() => of(null)),
      tap(() => this.fermerSession()),
      map(() => undefined)
    );
  }

  /** Vide la session sans appeler le serveur (token déjà invalide). */
  fermerSession(): void {
    this._token.set(null);
    this._profil.set(null);
    this._utilisateur.set(null);
    localStorage.removeItem(CLE_TOKEN);
    localStorage.removeItem(CLE_PROFIL);
  }

  rafraichir(): Observable<ReponseAuth> {
    return this.http.post<ReponseAuth>(`${this.base}/refresh`, {}).pipe(
      tap(reponse => this.ouvrirSession(reponse.token, reponse.profil, reponse.utilisateur))
    );
  }

  chargerUtilisateur(): Observable<ReponseUtilisateur> {
    return this.http.get<ReponseUtilisateur>(`${this.base}/me`).pipe(
      tap(reponse => {
        this._profil.set(reponse.profil);
        this._utilisateur.set(reponse.utilisateur);
        localStorage.setItem(CLE_PROFIL, reponse.profil);
      })
    );
  }

  /**
   * Rejoue la session persistée au démarrage de l'application.
   * Un token périmé ou révoqué se solde par une session vidée, sans erreur.
   */
  restaurerSession(): Observable<void> {
    if (!this._token()) {
      return of(undefined);
    }

    return this.chargerUtilisateur().pipe(
      map(() => undefined),
      catchError(() => {
        this.fermerSession();
        return of(undefined);
      })
    );
  }

  private ouvrirSession(token: string, profil: Profil, utilisateur: UtilisateurConnecte): void {
    this._token.set(token);
    this._profil.set(profil);
    this._utilisateur.set(utilisateur);
    localStorage.setItem(CLE_TOKEN, token);
    localStorage.setItem(CLE_PROFIL, profil);
  }

  private lireToken(): string | null {
    return localStorage.getItem(CLE_TOKEN);
  }

  private lireProfil(): Profil | null {
    const valeur = localStorage.getItem(CLE_PROFIL);
    return estProfilValide(valeur) ? valeur : null;
  }
}
