/**
 * Devise unique de l'application.
 *
 * Tous les montants manipulés — dettes, versements, encours, rapports — sont
 * exprimés en francs CFA. La valeur reflète `App\Support\Montants::DEVISE`
 * côté API, qui l'expose dans les synthèses et les rapports sous la clé
 * `devise` : préférer cette valeur lorsqu'elle est disponible dans la réponse,
 * et n'utiliser cette constante que pour les affichages qui n'en disposent pas.
 */
export const DEVISE = " FCFA";
