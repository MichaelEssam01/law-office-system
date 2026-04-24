import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  private authService = inject(AuthService);

  menuItems = [
    { label: 'الرئيسية', icon: 'pi pi-home', routerLink: '/dashboard', active: true },
    { label: 'العملاء', icon: 'pi pi-users', routerLink: '/clients', active: false },
    { label: 'القضايا', icon: 'pi pi-briefcase', routerLink: '/cases', active: false },
    { label: 'الجلسات', icon: 'pi pi-calendar', routerLink: '/sessions', active: false },
    { label: 'المالية', icon: 'pi pi-wallet', routerLink: '/finance', active: false },
    { label: 'المستندات', icon: 'pi pi-file', routerLink: '/documents', active: false },
  ];

  logout() {
    this.authService.logout();
  }
}
