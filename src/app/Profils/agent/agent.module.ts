import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ProfilsSharedModule } from '../shared/profils-shared.module';
import { AgentDashboardComponent } from './dashboard/dashboard.component';
import { AgentDebiteursComponent } from './debiteurs/debiteurs.component';
import { AgentDettesComponent } from './dettes/dettes.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: AgentDashboardComponent },
  { path: 'debiteurs', component: AgentDebiteursComponent },
  { path: 'dettes', component: AgentDettesComponent }
];

@NgModule({
  declarations: [
    AgentDashboardComponent,
    AgentDebiteursComponent,
    AgentDettesComponent
  ],
  imports: [
    ProfilsSharedModule,
    RouterModule.forChild(routes)
  ]
})
export class AgentModule { }
