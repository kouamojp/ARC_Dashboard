import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { ACCUEIL_PROFILS, estProfilValide } from '../models';
import { AuthService } from '../services/auth.service';

/**
 * Aiguille la racine de l'application : vers l'espace du profil connecté, ou
 * vers la page de connexion. Utilisé sur une route sans composant, il n'y a
 * donc jamais de rendu intermédiaire.
 */
export const accueilGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const profil = auth.profil();

  if (auth.estConnecte() && estProfilValide(profil)) {
    return router.parseUrl(ACCUEIL_PROFILS[profil]);
  }

  return router.parseUrl('/pages/login-boxed');
};
