/**
 * Les trois profils métier pouvant se connecter au tableau de bord.
 * Les valeurs correspondent exactement aux guards déclarés côté Laravel.
 */
export type Profil = 'debiteur' | 'partenaire' | 'agent';

export const PROFILS: readonly Profil[] = ['debiteur', 'partenaire', 'agent'] as const;

/** Libellés affichables, notamment dans le sélecteur de la page de connexion. */
export const LIBELLES_PROFILS: Record<Profil, string> = {
  debiteur: 'Débiteur',
  partenaire: 'Partenaire',
  agent: 'Agent de recouvrement'
};

/** Racine de navigation propre à chaque profil, une fois connecté. */
export const ACCUEIL_PROFILS: Record<Profil, string> = {
  debiteur: '/debiteur/dashboard',
  partenaire: '/partenaire/dashboard',
  agent: '/agent/dashboard'
};

export function estProfilValide(valeur: unknown): valeur is Profil {
  return typeof valeur === 'string' && (PROFILS as readonly string[]).includes(valeur);
}
