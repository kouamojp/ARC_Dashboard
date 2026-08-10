import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

/**
 * Attache le token aux appels vers l'API et traite les sessions expirées.
 *
 * Seules les requêtes visant `environment.apiUrl` sont concernées : les
 * requêtes d'assets ne doivent jamais transporter le token.
 */
export const authInterceptor: HttpInterceptorFn = (requete, suivant) => {
  if (!requete.url.startsWith(environment.apiUrl)) {
    return suivant(requete);
  }

  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();

  const requeteApi = requete.clone({
    setHeaders: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  return suivant(requeteApi).pipe(
    catchError((erreur: HttpErrorResponse) => {
      // Un 401 sur la connexion elle-même est un mauvais mot de passe, pas une
      // session expirée : c'est au formulaire de l'afficher.
      const estTentativeConnexion = requete.url.endsWith('/auth/login');

      if (erreur.status === 401 && !estTentativeConnexion) {
        auth.fermerSession();
        router.navigate(['/pages/login-boxed'], {
          queryParams: { retour: router.url }
        });
      }

      return throwError(() => erreur);
    })
  );
};
