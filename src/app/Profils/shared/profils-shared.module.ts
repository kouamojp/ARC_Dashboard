import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared.module';
import { MontantPipe } from './montant.pipe';
import { SyntheseCartesComponent } from './synthese-cartes/synthese-cartes.component';

/**
 * Briques communes aux trois espaces profil.
 */
@NgModule({
  declarations: [
    MontantPipe,
    SyntheseCartesComponent
  ],
  imports: [
    SharedModule
  ],
  exports: [
    SharedModule,
    MontantPipe,
    SyntheseCartesComponent
  ]
})
export class ProfilsSharedModule { }
