import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ProfilsSharedModule } from '../shared/profils-shared.module';
import { PartenaireDashboardComponent } from './dashboard/dashboard.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: PartenaireDashboardComponent }
];

@NgModule({
  declarations: [PartenaireDashboardComponent],
  imports: [
    ProfilsSharedModule,
    RouterModule.forChild(routes)
  ]
})
export class PartenaireModule { }
