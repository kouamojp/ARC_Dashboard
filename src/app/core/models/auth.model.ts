import { Profil } from './profil.model';
import { UtilisateurConnecte } from './metier.model';

/** Corps attendu par POST /api/auth/login. */
export interface IdentifiantsConnexion {
  profil: Profil;
  email: string;
  password: string;
}

/** Réponse de POST /api/auth/login et de POST /api/auth/refresh. */
export interface ReponseAuth {
  token: string;
  type: 'bearer';
  /** Durée de validité du token, en secondes. */
  expires_in: number;
  profil: Profil;
  utilisateur: UtilisateurConnecte;
}

/** Réponse de GET /api/auth/me. */
export interface ReponseUtilisateur {
  profil: Profil;
  utilisateur: UtilisateurConnecte;
}

/**
 * Codes d'erreur renvoyés par le back-end sur les réponses 401 et 403.
 * Ils permettent de distinguer « reconnecte-toi » de « tu n'as pas le droit ».
 */
export type CodeErreurAuth =
  | 'token_expire'
  | 'token_invalide'
  | 'profil_inconnu'
  | 'profil_non_autorise'
  | 'compte_introuvable';

/** Corps d'erreur normalisé de l'API. */
export interface ErreurApi {
  message: string;
  code?: CodeErreurAuth;
  /** Présent sur les 422 : messages de validation indexés par champ. */
  errors?: Record<string, string[]>;
}
