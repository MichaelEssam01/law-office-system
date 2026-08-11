import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AppStateService } from '../../core/services/app-state.service';
import { TranslateModule } from '@ngx-translate/core';

import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, ConfirmDialogModule],
  providers: [ConfirmationService],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  public authService = inject(AuthService);
  public appState = inject(AppStateService);
  private translate = inject(TranslateService);
  private confirmationService = inject(ConfirmationService);

  menuItems: { label: string, key: string, icon: string, routerLink: string, active: boolean, permission?: string }[] = [
    { label: 'الرئيسية', key: 'DASHBOARD', icon: 'pi pi-home', routerLink: '/dashboard', active: true },
    { label: 'العملاء', key: 'CLIENTS', icon: 'pi pi-users', routerLink: '/clients', active: false },
    { label: 'القضايا', key: 'CASES', icon: 'pi pi-briefcase', routerLink: '/cases', active: false },
    { label: 'الجلسات', key: 'SESSIONS', icon: 'pi pi-calendar', routerLink: '/sessions', active: false },
    { label: 'المالية', key: 'FINANCE', icon: 'pi pi-wallet', routerLink: '/finance', active: false },
    { label: 'المستندات', key: 'DOCUMENTS', icon: 'pi pi-file', routerLink: '/documents', active: false },
    { label: 'إعدادات النظام', key: 'SETTINGS', icon: 'pi pi-cog', routerLink: '/settings', active: false, permission: 'Settings.Manage' },
  ];

  logout() {
    this.confirmationService.confirm({
      header: this.translate.instant('PROFILE.LOGOUT_CONFIRM_TITLE'),
      message: this.translate.instant('PROFILE.LOGOUT_CONFIRM_MESSAGE'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.appState.closeSidebar();
        this.authService.logout();
      }
    });
  }
}
