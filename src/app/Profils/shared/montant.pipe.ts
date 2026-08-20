import { Pipe, PipeTransform } from "@angular/core";

import { DEVISE } from "../../core/models";

/**
 * Formate un montant entier à la française : séparateur d'espace pour les
 * milliers et devise en suffixe.
 *
 *   {{ 1500000 | montant }}          → « 1 500 000 FCFA »
 *   {{ 1500000 | montant: '' }}      → « 1 500 000 »
 *   {{ 1500000 | montant: s.devise } → devise renvoyée par l'API
 *
 * La forme sans devise sert aux tableaux, où la répétition du sigle sur chaque
 * cellule nuirait à la lecture : la devise y est annoncée une fois en légende.
 */
@Pipe({ name: "montant", standalone: false })
export class MontantPipe implements PipeTransform {
  transform(
    valeur: number | null | undefined,
    devise: string = DEVISE,
  ): string {
    if (valeur === null || valeur === undefined || Number.isNaN(valeur)) {
      return "—";
    }

    const formate = Math.trunc(valeur)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ");

    // Le suffixe est nettoyé pour rester correct hors HTML — attribut title,
    // libellé accessible, export — où les espaces ne sont pas fusionnées.
    const suffixe = devise.trim();

    return suffixe ? `${formate} ${suffixe}` : formate;
  }
}
