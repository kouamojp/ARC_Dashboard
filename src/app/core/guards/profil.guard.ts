import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { ACCUEIL_PROFILS, Profil, estProfilValide } from '../models';
import { AuthService } from '../services/auth.service';

/**
 * Restreint une branche de routes à un profil.
 *
 * Le profil attendu se déclare dans les données de la route :
 *
 *     { path: 'debiteur', canActivate: [authGuard, profilGuard],
 *       data: { profil: 'debiteur' }, ... }
 *
 * Un utilisateur connecté sous un autre profil est renvoyé vers son propre
 * espace plutôt que vers la page de connexion : il est authentifié, il n'est
 * simplement pas au bon endroit.
 */
export const profilGuard: CanActivateFn = route => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const attendu = route.data['profil'] as Profil | undefined;
  const courant = auth.profil();

  if (!attendu || attendu === courant) {
    return true;
  }

  if (estProfilValide(courant)) {
    return router.parseUrl(ACCUEIL_PROFILS[courant]);
  }

  return router.createUrlTree(['/pages/login-boxed']);
};
