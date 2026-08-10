import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ProfilsSharedModule } from '../shared/profils-shared.module';
import { PartenaireDashboardComponent } from './dashboard/dashboard.component';
import { PartenaireDebiteursComponent } from './debiteurs/debiteurs.component';
import { PartenaireDettesComponent } from './dettes/dettes.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: PartenaireDashboardComponent },
  { path: 'debiteurs', component: PartenaireDebiteursComponent },
  { path: 'dettes', component: PartenaireDettesComponent }
];

@NgModule({
  declarations: [
    PartenaireDashboardComponent,
    PartenaireDebiteursComponent,
    PartenaireDettesComponent
  ],
  imports: [
    ProfilsSharedModule,
    RouterModule.forChild(routes)
  ]
})
export class PartenaireModule { }
