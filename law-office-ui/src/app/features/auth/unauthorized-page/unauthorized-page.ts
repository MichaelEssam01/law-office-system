import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { AppStateService } from '../../../core/services/app-state.service';

@Component({
  selector: 'app-unauthorized-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TranslateModule],
  templateUrl: './unauthorized-page.html'
})
export class UnauthorizedPage {
  public authService = inject(AuthService);
  public appState = inject(AppStateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);

  requiredPermission = computed(() => this.route.snapshot.queryParamMap.get('required'));

  userRolesLabel = computed(() => {
    const user = this.authService.currentUser();
    const roles = user?.roles && user.roles.length > 0 ? user.roles : (user?.role ? [user.role] : []);
    const keyMap: Record<string, string> = {
      'Admin': 'USERS.ROLES.ADMIN',
      'Lawyer': 'USERS.ROLES.LAWYER',
      'Receptionist': 'USERS.ROLES.RECEPTIONIST',
      'Accountant': 'USERS.ROLES.ACCOUNTANT'
    };
    return roles.map(r => keyMap[r] ? this.translate.instant(keyMap[r]) : r).join(' • ');
  });

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  switchAccount() {
    this.authService.logout();
  }
}

