import { NgModule } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';

import { SharedModule } from '../../shared.module';
import { MontantPipe } from './montant.pipe';
import { SyntheseCartesComponent } from './synthese-cartes/synthese-cartes.component';
import { TableDettesComponent } from './table-dettes/table-dettes.component';
import { TableDebiteursComponent } from './table-debiteurs/table-debiteurs.component';
import { GraphiqueRecouvrementComponent } from './graphique-recouvrement/graphique-recouvrement.component';
import { GraphiqueEncoursComponent } from './graphique-encours/graphique-encours.component';
import { BandeAncienneteComponent } from './bande-anciennete/bande-anciennete.component';
import { BarresEncoursComponent } from './barres-encours/barres-encours.component';
import { DerniersMouvementsComponent } from './derniers-mouvements/derniers-mouvements.component';
import { FileRelancesComponent } from './file-relances/file-relances.component';

/**
 * Briques communes aux trois espaces profil.
 */
@NgModule({
  declarations: [
    MontantPipe,
    SyntheseCartesComponent,
    TableDettesComponent,
    TableDebiteursComponent,
    GraphiqueRecouvrementComponent,
    GraphiqueEncoursComponent,
    BandeAncienneteComponent,
    BarresEncoursComponent,
    DerniersMouvementsComponent,
    FileRelancesComponent
  ],
  imports: [
    SharedModule,
    BaseChartDirective
  ],
  exports: [
    SharedModule,
    MontantPipe,
    SyntheseCartesComponent,
    TableDettesComponent,
    TableDebiteursComponent,
    GraphiqueRecouvrementComponent,
    GraphiqueEncoursComponent,
    BandeAncienneteComponent,
    BarresEncoursComponent,
    DerniersMouvementsComponent,
    FileRelancesComponent
  ]
})
export class ProfilsSharedModule { }
