import {Component, Input, ChangeDetectionStrategy} from '@angular/core';

@Component({
  selector: 'app-page-title',
  templateUrl: './page-title.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class PageTitleComponent {

  @Input() heading: string = '';
  @Input() subheading: string = '';

  /**
   * Surtitre en chasse fixe : dit où l'on se trouve avant de dire quoi on
   * regarde — « Espace agent · 14 débiteurs assignés ».
   */
  @Input() eyebrow: string = '';

  /**
   * Vignette d'icône du gabarit d'origine. Laissée disponible pour la vitrine
   * ArchitectUI, mais éteinte sur les espaces métier : la même icône sur toutes
   * les pages ne distinguait rien.
   */
  @Input() icon: string = '';

}
