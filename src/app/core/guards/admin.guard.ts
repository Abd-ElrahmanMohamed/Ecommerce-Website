import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const user = this.authService.getCurrentUser();

    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.notificationService.error('Please login first', '🔒 Access Denied');
      this.router.navigate(['/login']);
      return false;
    }

    // Check if user is admin
    if (!user || user.role !== 'admin') {
      this.notificationService.error('You do not have admin access', '⛔ Access Denied');
      this.router.navigate(['/']);
      return false;
    }

    return true;
  }
}
