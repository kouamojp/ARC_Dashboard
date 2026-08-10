import { NgModule } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';

import { SharedModule } from '../../shared.module';
import { MontantPipe } from './montant.pipe';
import { SyntheseCartesComponent } from './synthese-cartes/synthese-cartes.component';
import { TableDettesComponent } from './table-dettes/table-dettes.component';
import { TableDebiteursComponent } from './table-debiteurs/table-debiteurs.component';
import { GraphiqueRecouvrementComponent } from './graphique-recouvrement/graphique-recouvrement.component';
import { GraphiqueEncoursComponent } from './graphique-encours/graphique-encours.component';

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
    GraphiqueEncoursComponent
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
    GraphiqueEncoursComponent
  ]
})
export class ProfilsSharedModule { }
