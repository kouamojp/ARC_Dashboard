import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ProfilsSharedModule } from '../shared/profils-shared.module';
import { DebiteurDashboardComponent } from './dashboard/dashboard.component';
import { DebiteurDettesComponent } from './dettes/dettes.component';
import { DebiteurPaiementsComponent } from './paiements/paiements.component';
import { DebiteurRecusComponent } from './recus/recus.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DebiteurDashboardComponent },
  { path: 'dettes', component: DebiteurDettesComponent },
  { path: 'paiements', component: DebiteurPaiementsComponent },
  { path: 'recus', component: DebiteurRecusComponent }
];

@NgModule({
  declarations: [
    DebiteurDashboardComponent,
    DebiteurDettesComponent,
    DebiteurPaiementsComponent,
    DebiteurRecusComponent
  ],
  imports: [
    ProfilsSharedModule,
    RouterModule.forChild(routes)
  ]
})
export class DebiteurModule { }
