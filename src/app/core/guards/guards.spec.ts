import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { signal } from '@angular/core';

import { authGuard } from './auth.guard';
import { profilGuard } from './profil.guard';
import { AuthService } from '../services/auth.service';
import { Profil } from '../models';

/** Double minimal : les guards ne lisent que ces deux signals. */
function faireAuth(connecte: boolean, profil: Profil | null) {
  return {
    estConnecte: signal(connecte),
    profil: signal(profil)
  };
}

function configurer(connecte: boolean, profil: Profil | null) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: faireAuth(connecte, profil) }
    ]
  });
}

const routeAvecProfil = (profil?: Profil) =>
  ({ data: profil ? { profil } : {} }) as unknown as ActivatedRouteSnapshot;

const etat = (url: string) => ({ url }) as RouterStateSnapshot;

describe('authGuard', () => {
  it('laisse passer un utilisateur connecté', () => {
    configurer(true, 'debiteur');

    const resultat = TestBed.runInInjectionContext(() =>
      authGuard(routeAvecProfil(), etat('/debiteur/dashboard'))
    );

    expect(resultat).toBeTrue();
  });

  it('redirige vers la connexion en conservant l\'URL demandée', () => {
    configurer(false, null);

    const resultat = TestBed.runInInjectionContext(() =>
      authGuard(routeAvecProfil(), etat('/debiteur/dettes'))
    ) as UrlTree;

    expect(resultat instanceof UrlTree).toBeTrue();
    expect(TestBed.inject(Router).serializeUrl(resultat))
      .toBe('/pages/login-boxed?retour=%2Fdebiteur%2Fdettes');
  });
});

describe('profilGuard', () => {
  it('laisse passer quand le profil correspond', () => {
    configurer(true, 'debiteur');

    const resultat = TestBed.runInInjectionContext(() =>
      profilGuard(routeAvecProfil('debiteur'), etat('/debiteur/dashboard'))
    );

    expect(resultat).toBeTrue();
  });

  it('renvoie un partenaire vers son propre espace, pas vers la connexion', () => {
    configurer(true, 'partenaire');

    const resultat = TestBed.runInInjectionContext(() =>
      profilGuard(routeAvecProfil('debiteur'), etat('/debiteur/dashboard'))
    ) as UrlTree;

    expect(TestBed.inject(Router).serializeUrl(resultat)).toBe('/partenaire/dashboard');
  });

  it('renvoie vers la connexion quand aucun profil n\'est connu', () => {
    configurer(false, null);

    const resultat = TestBed.runInInjectionContext(() =>
      profilGuard(routeAvecProfil('agent'), etat('/agent/dashboard'))
    ) as UrlTree;

    expect(TestBed.inject(Router).serializeUrl(resultat)).toBe('/pages/login-boxed');
  });

  it('laisse passer une route qui ne déclare aucun profil', () => {
    configurer(true, 'agent');

    const resultat = TestBed.runInInjectionContext(() =>
      profilGuard(routeAvecProfil(), etat('/quelque-part'))
    );

    expect(resultat).toBeTrue();
  });
});
