import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const currentUser = this.authService.getCurrentUser();
    // Verify the exact role string mapping your backend provides
    if (currentUser && currentUser.role === 'ADMIN') { 
      return true;
    }
    
    this.router.navigate(['/']);
    return false;
  }
}