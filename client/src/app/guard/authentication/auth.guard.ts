import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check the secure in-memory token instead of localStorage
  if (authService.getToken()) {
    return true;
  }

  // If no token is found in memory, redirect back to login
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};