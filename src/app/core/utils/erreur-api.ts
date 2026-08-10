import { HttpErrorResponse } from '@angular/common/http';

import { ErreurApi } from '../models';

/**
 * Message affichable à partir d'une erreur HTTP.
 *
 * L'API renvoie systématiquement du JSON avec une clé `message` ; ce helper
 * couvre les cas où elle n'a pas pu répondre (serveur éteint, réseau coupé).
 */
export function messageErreur(erreur: unknown, defaut = 'Une erreur est survenue.'): string {
  if (!(erreur instanceof HttpErrorResponse)) {
    return defaut;
  }

  if (erreur.status === 0) {
    return 'Impossible de joindre le serveur. Vérifiez votre connexion.';
  }

  const corps = erreur.error as ErreurApi | null;

  if (corps?.errors) {
    const premier = Object.values(corps.errors)[0];
    if (premier?.length) {
      return premier[0];
    }
  }

  return corps?.message ?? defaut;
}

/**
 * Erreurs de validation d'un 422, indexées par champ, prêtes à être affichées
 * sous chaque contrôle du formulaire.
 */
export function erreursValidation(erreur: unknown): Record<string, string> {
  if (!(erreur instanceof HttpErrorResponse) || erreur.status !== 422) {
    return {};
  }

  const champs = (erreur.error as ErreurApi | null)?.errors ?? {};

  return Object.entries(champs).reduce<Record<string, string>>((resultat, [champ, messages]) => {
    if (messages?.length) {
      resultat[champ] = messages[0];
    }
    return resultat;
  }, {});
}
