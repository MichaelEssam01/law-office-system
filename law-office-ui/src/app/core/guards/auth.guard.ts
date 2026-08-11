import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If we have a user in localStorage but no permissions yet, validate session with server
  if (authService.isAuthenticated()) {
    if (authService.permissions().length === 0 && authService.currentUser()?.role !== 'Admin') {
      // Permissions not loaded yet — validate session to restore them from /me
      return authService.validateSession().then(valid => {
        if (!valid) {
          router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        }
        return valid;
      });
    }
    return true;
  }

  // No user in memory — redirect to login
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
