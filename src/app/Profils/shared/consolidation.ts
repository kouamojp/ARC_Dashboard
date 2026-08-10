import { Debiteur, Dette } from '../../core/models';
import { estEnRetard } from './statut-dette';

/** Un débiteur et ses chiffres consolidés. */
export interface LigneDebiteur {
  debiteur: Debiteur;
  nombreDettes: number;
  reconnu: number;
  verse: number;
  solde: number;
  /** Part du reconnu déjà versée, en pourcentage à une décimale. */
  taux: number;
  enRetard: number;
}

/**
 * Regroupe des dettes par débiteur.
 *
 * L'agrégation se fait côté client : l'API renvoie les dettes à plat et le
 * volume d'un portefeuille ou d'un secteur reste modeste. Si les volumes
 * augmentaient, ce calcul aurait sa place dans un endpoint dédié.
 */
export function consoliderParDebiteur(debiteurs: Debiteur[], dettes: Dette[]): LigneDebiteur[] {
  return debiteurs
    .map(debiteur => {
      const siennes = dettes.filter(dette => dette.debiteur_id === debiteur.id);
      const reconnu = siennes.reduce((total, dette) => total + dette.montant_reconnu, 0);
      const verse = siennes.reduce((total, dette) => total + dette.montant_verse, 0);
      const solde = siennes.reduce((total, dette) => total + dette.solde, 0);

      return {
        debiteur,
        nombreDettes: siennes.length,
        reconnu,
        verse,
        solde,
        taux: reconnu > 0 ? Math.round((verse / reconnu) * 1000) / 10 : 0,
        enRetard: siennes.filter(dette => estEnRetard(dette)).length
      };
    })
    .sort((a, b) => b.solde - a.solde);
}
