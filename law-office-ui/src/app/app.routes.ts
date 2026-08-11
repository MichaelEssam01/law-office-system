import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { LoginPage } from './features/auth/login-page/login-page';
import { DashboardPage } from './features/dashboard/dashboard-page/dashboard-page';
import { ClientsPage } from './features/clients/clients-page/clients-page';
import { CasesPage } from './features/cases/cases-page/cases-page';
import { CaseDetailsPage } from './features/cases/case-details-page/case-details-page';
import { SessionsPage } from './features/sessions/sessions-page/sessions-page';
import { FinancePage } from './features/finance/finance-page/finance-page';
import { DocumentsPage } from './features/documents/documents-page/documents-page';
import { SettingsPage } from './features/settings/settings-page/settings-page';
import { UsersPage } from './features/users/users-page/users-page';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginPage
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password-page/forgot-password-page').then(m => m.ForgotPasswordPage)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password-page/reset-password-page').then(m => m.ResetPasswordPage)
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
      { path: 'documents', component: DocumentsPage },
      { path: 'settings', component: SettingsPage, canActivate: [permissionGuard('Settings.Manage')] },
      { path: 'profile', loadComponent: () => import('./features/profile/profile-page/profile-page').then(m => m.ProfilePage) },
      { path: 'users', component: UsersPage, canActivate: [permissionGuard('Users.View')] },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
