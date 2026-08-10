import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formate un montant entier à la française : séparateur d'espace insécable
 * fine et devise en suffixe. `{{ 1500000 | montant }}` donne « 1 500 000 FCFA ».
 */
@Pipe({ name: 'montant', standalone: false })
export class MontantPipe implements PipeTransform {
  transform(valeur: number | null | undefined, devise = 'FCFA'): string {
    if (valeur === null || valeur === undefined || Number.isNaN(valeur)) {
      return '—';
    }

    const formate = Math.trunc(valeur)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    return devise ? `${formate} ${devise}` : formate;
  }
}
