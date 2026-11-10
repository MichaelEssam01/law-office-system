import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Try restoring session from HttpOnly cookie if not yet in memory
  const restored = await authService.validateSession();
  if (restored) {
    return true;
  }

  router.navigate(['/login'], { queryParams: { returnUrl: state.url, reason: 'auth_required' } });
  return false;
};
