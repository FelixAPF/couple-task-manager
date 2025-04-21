import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, take, map } from 'rxjs';
import { AuthService } from '../../service/auth.service';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<boolean> | Promise<boolean> | boolean => {

  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if the AuthService has a method/property to determine login status.
  // This could be checking for a token, a user object, or an observable state.
  // Let's assume authService.isLoggedIn$ is an Observable<boolean>
  // Or authService.isLoggedIn() returns a boolean directly.

  // --- Option A: If AuthService provides an Observable state (Recommended) ---
  // Replace 'isLoggedIn$' with your actual observable property name in AuthService
  return authService.isLoggedIn$.pipe( // Assuming isLoggedIn$ emits true if logged in, false otherwise
    take(1), // Take the current value and complete
    map(isLoggedIn => {
      if (isLoggedIn) {
        return true; // User is logged in, allow access to the route
      } else {
        // User is not logged in, redirect to login page
        console.warn('AuthGuard: User not logged in, redirecting to /login');
        // Store the attempted URL to redirect back after login (optional but good UX)
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false; // Prevent access to the originally requested route
      }
    })
  );
}