import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ProfilsSharedModule } from '../shared/profils-shared.module';
import { DebiteurDashboardComponent } from './dashboard/dashboard.component';
import { DebiteurDettesComponent } from './dettes/dettes.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DebiteurDashboardComponent },
  { path: 'dettes', component: DebiteurDettesComponent }
];

@NgModule({
  declarations: [DebiteurDashboardComponent, DebiteurDettesComponent],
  imports: [
    ProfilsSharedModule,
    RouterModule.forChild(routes)
  ]
})
export class DebiteurModule { }
