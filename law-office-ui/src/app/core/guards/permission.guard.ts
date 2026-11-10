import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard that checks if the user has a specific permission
 * @param permission The permission string to check
 */
export const permissionGuard: (permission: string) => CanActivateFn = (permission) => {
  return async (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      const valid = await authService.validateSession();
      if (!valid) {
        router.navigate(['/login'], { queryParams: { returnUrl: state.url, reason: 'auth_required' } });
        return false;
      }
    }

    if (authService.hasPermission(permission)) {
      return true;
    }

    router.navigate(['/unauthorized'], { queryParams: { required: permission, attemptedUrl: state.url } });
    return false;
  };
};
