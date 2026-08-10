import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controleur: HttpTestingController;
  let auth: AuthService;
  let routeur: { navigate: jasmine.Spy; url: string };

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('recouvrement.token', 'jeton-abc');
    localStorage.setItem('recouvrement.profil', 'debiteur');

    routeur = { navigate: jasmine.createSpy('navigate'), url: '/debiteur/dettes' };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: routeur }
      ]
    });

    http = TestBed.inject(HttpClient);
    controleur = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    controleur.verify();
    localStorage.clear();
  });

  it('attache le token aux appels vers l\'API', () => {
    http.get(`${environment.apiUrl}/debiteur/me`).subscribe();

    const requete = controleur.expectOne(`${environment.apiUrl}/debiteur/me`);
    expect(requete.request.headers.get('Authorization')).toBe('Bearer jeton-abc');
    expect(requete.request.headers.get('Accept')).toBe('application/json');
    requete.flush({});
  });

  it('laisse intactes les requêtes hors API', () => {
    http.get('/assets/images/logo.png').subscribe();

    const requete = controleur.expectOne('/assets/images/logo.png');
    expect(requete.request.headers.has('Authorization')).toBeFalse();
    requete.flush({});
  });

  it('ferme la session et redirige sur un 401', () => {
    http.get(`${environment.apiUrl}/debiteur/me`).subscribe({ error: () => undefined });

    controleur.expectOne(`${environment.apiUrl}/debiteur/me`).flush(
      { message: 'Session expirée', code: 'token_expire' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(auth.estConnecte()).toBeFalse();
    expect(routeur.navigate).toHaveBeenCalledWith(
      ['/pages/login-boxed'],
      { queryParams: { retour: '/debiteur/dettes' } }
    );
  });

  it('ne déconnecte pas sur un 401 de la page de connexion', () => {
    http.post(`${environment.apiUrl}/auth/login`, {}).subscribe({ error: () => undefined });

    controleur.expectOne(`${environment.apiUrl}/auth/login`).flush(
      { message: 'Adresse email ou mot de passe incorrect.' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(auth.estConnecte()).toBeTrue();
    expect(routeur.navigate).not.toHaveBeenCalled();
  });

  it('laisse remonter les autres erreurs sans toucher à la session', () => {
    let statutRecu = 0;
    http.get(`${environment.apiUrl}/debiteur/me`).subscribe({
      error: erreur => (statutRecu = erreur.status)
    });

    controleur.expectOne(`${environment.apiUrl}/debiteur/me`).flush(
      { message: 'Votre profil n\'a pas accès à cette ressource.' },
      { status: 403, statusText: 'Forbidden' }
    );

    expect(statutRecu).toBe(403);
    expect(auth.estConnecte()).toBeTrue();
    expect(routeur.navigate).not.toHaveBeenCalled();
  });
});
