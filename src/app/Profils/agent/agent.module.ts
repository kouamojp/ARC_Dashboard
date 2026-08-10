import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ProfilsSharedModule } from '../shared/profils-shared.module';
import { AgentDashboardComponent } from './dashboard/dashboard.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: AgentDashboardComponent }
];

@NgModule({
  declarations: [AgentDashboardComponent],
  imports: [
    ProfilsSharedModule,
    RouterModule.forChild(routes)
  ]
})
export class AgentModule { }
