import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { LoginPage } from './features/auth/login-page/login-page';
import { DashboardPage } from './features/dashboard/dashboard-page/dashboard-page';
import { ClientsPage } from './features/clients/clients-page/clients-page';
import { CasesPage } from './features/cases/cases-page/cases-page';
import { CaseDetailsPage } from './features/cases/case-details-page/case-details-page';
import { SessionsPage } from './features/sessions/sessions-page/sessions-page';
import { FinancePage } from './features/finance/finance-page/finance-page';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginPage
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardPage },
      { path: 'clients', component: ClientsPage },
      { path: 'cases', component: CasesPage },
      { path: 'cases/:id', component: CaseDetailsPage },
      { path: 'sessions', component: SessionsPage },
      { path: 'finance', component: FinancePage },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
