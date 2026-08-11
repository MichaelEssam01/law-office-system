import { Component, inject } from '@angular/core';
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
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, AvatarModule, InputTextModule, BadgeModule, TranslateModule, MenuModule, IconFieldModule, InputIconModule, PopoverModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  public authService = inject(AuthService);
  public appState = inject(AppStateService);
  public notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private router = inject(Router);

  profileMenuItems: MenuItem[] = [];

  constructor() {
    // Refresh menu items when language changes or on init
    this.translate.onLangChange.subscribe(() => this.updateMenuItems());
    // Initial load
    setTimeout(() => this.updateMenuItems(), 100);
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
        routerLink: '/settings'
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
        command: () => this.authService.logout()
      }
    ];
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

  onNotificationClick(notification: NotificationDto, op: any) {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id);
    }
    if (notification.link) {
      this.router.navigateByUrl(notification.link);
    }
    op.hide();
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead();
  }
}
