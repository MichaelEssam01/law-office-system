import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { InputTextModule } from 'primeng/inputtext';
import { BadgeModule } from 'primeng/badge';
import { AuthService } from '../../core/services/auth.service';
import { AppStateService } from '../../core/services/app-state.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { Subscription, map } from 'rxjs';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { NotificationService, NotificationDto } from '../../core/services/notification.service';
import { PopoverModule } from 'primeng/popover';
import { Router, RouterModule } from '@angular/router';

import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    AvatarModule, 
    InputTextModule, 
    BadgeModule, 
    TranslateModule, 
    MenuModule, 
    IconFieldModule, 
    InputIconModule, 
    PopoverModule,
    ConfirmDialogModule
  ],
  providers: [ConfirmationService],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  public authService = inject(AuthService);
  public appState = inject(AppStateService);
  public notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  profileMenuItems: MenuItem[] = [];

  constructor() {
    // Refresh menu items when language changes or user logs in/changes role
    this.translate.onLangChange.subscribe(() => this.updateMenuItems());
    effect(() => {
      const user = this.authService.currentUser();
      this.updateMenuItems();
    });
  }

  updateMenuItems() {
    this.profileMenuItems = [
      {
        label: this.translate.instant('PROFILE.VIEW_PROFILE'),
        icon: 'pi pi-user',
        routerLink: '/profile'
      },
      {
        label: this.translate.instant('PROFILE.ACCOUNT_SETTINGS'),
        icon: 'pi pi-cog',
        routerLink: '/settings',
        visible: this.authService.hasPermission('Settings.Manage')
      },
      {
        label: this.translate.instant('USERS.TITLE'),
        icon: 'pi pi-user-plus',
        routerLink: '/users',
        visible: this.authService.hasPermission('Users.View')
      },
      {
        separator: true
      },
      {
        label: this.translate.instant('PROFILE.LOGOUT'),
        icon: 'pi pi-sign-out',
        command: () => this.confirmLogout()
      }
    ];
  }

  confirmLogout() {
    this.confirmationService.confirm({
      header: this.translate.instant('PROFILE.LOGOUT_CONFIRM_TITLE'),
      message: this.translate.instant('PROFILE.LOGOUT_CONFIRM_MESSAGE'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.authService.logout();
      }
    });
  }

  getInitials(): string {
    const user = this.authService.currentUser();
    if (!user || !user.fullName) return 'U';
    
    const parts = user.fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return parts[0].charAt(0).toUpperCase();
  }

  getRoleLabel(role?: string): string {
    const defaultRole = role || 'Lawyer';
    const keyMap: { [key: string]: string } = {
      'Admin': 'USERS.ROLES.ADMIN',
      'Lawyer': 'USERS.ROLES.LAWYER',
      'Receptionist': 'USERS.ROLES.RECEPTIONIST',
      'Accountant': 'USERS.ROLES.ACCOUNTANT'
    };
    return keyMap[defaultRole] ? this.translate.instant(keyMap[defaultRole]) : defaultRole;
  }

  onNotificationClick(notification: NotificationDto, op: any) {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id);
    }
    op.hide();
    const targetUrl = notification.link ? notification.link : '/cases';
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigateByUrl(targetUrl);
    });
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead();
  }
}
