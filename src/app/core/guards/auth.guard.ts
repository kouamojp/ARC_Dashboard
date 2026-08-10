import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Réserve une route aux utilisateurs connectés.
 * L'URL demandée est conservée pour y revenir après connexion.
 */
export const authGuard: CanActivateFn = (_route, etat) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.estConnecte()) {
    return true;
  }

  return router.createUrlTree(['/pages/login-boxed'], {
    queryParams: { retour: etat.url }
  });
};
