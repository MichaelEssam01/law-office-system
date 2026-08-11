import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard that checks if the user has a specific permission
 * @param permission The permission string to check
 */
export const permissionGuard: (permission: string) => CanActivateFn = (permission) => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.hasPermission(permission)) {
      return true;
    }

    // Redirect to a default page or unauthorized page
    router.navigate(['/dashboard']); 
    return false;
  };
};
