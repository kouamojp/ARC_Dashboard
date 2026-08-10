import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {BaseLayoutComponent} from './Layout/base-layout/base-layout.component';
import {PagesLayoutComponent} from './Layout/pages-layout/pages-layout.component';

// Import all components from barrel file
import {
  // Dashboard components
  AnalyticsComponent,
  
  // Elements components
  StandardComponent,
  DropdownsComponent,
  CardsComponent,
  ListGroupsComponent,
  TimelineComponent,
  IconsComponent,
  
  // Components
  AccordionsComponent,
  TabsComponent,
  CarouselComponent,
  ModalsComponent,
  PaginationComponent,
  ProgressBarComponent,
  TooltipsPopoversComponent,
  
  // Form components
  ControlsComponent,
  LayoutComponent,
  
  // Table components
  RegularComponent,
  TablesMainComponent,
  
  // Widget components
  ChartBoxes3Component,
  
  // User pages components
  LoginBoxedComponent,

  // Chart components
  ChartjsComponent
} from './components.barrel';

import {accueilGuard} from './core/guards/accueil.guard';
import {authGuard} from './core/guards/auth.guard';
import {profilGuard} from './core/guards/profil.guard';

const routes: Routes = [
  // La racine aiguille vers l'espace du profil connecté, ou vers la connexion.
  {path: '', pathMatch: 'full', canActivate: [accueilGuard], children: []},
  {
    // Espaces métier, réservés chacun à son profil.
    path: '',
    component: BaseLayoutComponent,
    children: [
      {
        path: 'debiteur',
        canActivate: [authGuard, profilGuard],
        data: {profil: 'debiteur'},
        loadChildren: () => import('./Profils/debiteur/debiteur.module').then(m => m.DebiteurModule)
      },
      {
        path: 'partenaire',
        canActivate: [authGuard, profilGuard],
        data: {profil: 'partenaire'},
        loadChildren: () => import('./Profils/partenaire/partenaire.module').then(m => m.PartenaireModule)
      },
      {
        path: 'agent',
        canActivate: [authGuard, profilGuard],
        data: {profil: 'agent'},
        loadChildren: () => import('./Profils/agent/agent.module').then(m => m.AgentModule)
      }
    ]
  },
  {
    // Vitrine du template ArchitectUI, conservée telle quelle.
    path: '',
    component: BaseLayoutComponent,
    children: [
      // Dashboards
      {path: 'dashboards/analytics', component: AnalyticsComponent, data: {extraParameter: 'dashboardsMenu'}},

      // Elements
      {path: 'elements/buttons-standard', component: StandardComponent, data: {extraParameter: 'elementsMenu'}},
      {path: 'elements/dropdowns', component: DropdownsComponent, data: {extraParameter: 'elementsMenu'}},
      {path: 'elements/icons', component: IconsComponent, data: {extraParameter: 'elementsMenu'}},
      {path: 'elements/cards', component: CardsComponent, data: {extraParameter: 'elementsMenu'}},
      {path: 'elements/list-group', component: ListGroupsComponent, data: {extraParameter: 'elementsMenu'}},
      {path: 'elements/timeline', component: TimelineComponent, data: {extraParameter: 'elementsMenu'}},

      // Components
      {path: 'components/tabs', component: TabsComponent, data: {extraParameter: 'componentsMenu'}},
      {path: 'components/accordions', component: AccordionsComponent, data: {extraParameter: 'componentsMenu'}},
      {path: 'components/carousel', component: CarouselComponent, data: {extraParameter: 'componentsMenu'}},
      {path: 'components/modals', component: ModalsComponent, data: {extraParameter: 'componentsMenu'}},
      {path: 'components/pagination', component: PaginationComponent, data: {extraParameter: 'componentsMenu'}},
      {path: 'components/progress-bar', component: ProgressBarComponent, data: {extraParameter: 'componentsMenu'}},
      {path: 'components/tooltips-popovers', component: TooltipsPopoversComponent, data: {extraParameter: 'componentsMenu'}},

      // Charts
      {path: 'charts/chartjs', component: ChartjsComponent, data: {extraParameter: 'chartsMenu'}},

      // Forms
      {path: 'forms/controls', component: ControlsComponent, data: {extraParameter: 'formsMenu'}},
      {path: 'forms/layouts', component: LayoutComponent, data: {extraParameter: 'formsMenu'}},

      // Tables
      {path: 'tables/regular', component: RegularComponent, data: {extraParameter: 'tablesMenu'}},
      {path: 'tables/bootstrap', component: TablesMainComponent, data: {extraParameter: 'tablesMenu'}},

      // Widgets
      {path: 'widgets/chart-boxes-3', component: ChartBoxes3Component, data: {extraParameter: 'widgetsMenu'}},
    ]
  },
  {
    path: '',
    component: PagesLayoutComponent,
    children: [
      // Connexion. L'inscription et la récupération de mot de passe ne sont pas
      // routées : aucun endpoint ne les prend en charge côté API. Les
      // composants restent en place, prêts à être rebranchés.
      {path: 'pages/login-boxed', component: LoginBoxedComponent, data: {extraParameter: ''}},
    ]
  },
  {
    // Documentation section — lazy-loaded so it stays out of the initial bundle
    path: 'docs',
    loadChildren: () => import('./docs/docs.module').then(m => m.DocsModule)
  },
  {path: '**', redirectTo: ''}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'enabled',
    anchorScrolling: 'enabled'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule {
}