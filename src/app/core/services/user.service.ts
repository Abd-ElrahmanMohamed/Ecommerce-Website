import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = 'http://localhost:5000/api/admin/users';
  private userProfileUrl = 'http://localhost:5000/api/users';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService,
  ) {}

  getUsers(): Observable<any> {
    const token = this.authService.getToken();
    console.log('🔵 Fetching users with token:', token ? '✅ Present' : '❌ Missing');

    return this.http
      .get<any>(`${this.apiUrl}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .pipe(
        tap((response: any) => {
          console.log('✅ Users loaded successfully:', response);
        }),
        catchError((error: any) => {
          console.error('❌ Failed to load users:', error);
          console.error('   Status:', error.status);
          console.error('   Message:', error.error?.message || error.message);
          this.notificationService.error('Failed to load users');
          return of({ success: false, users: [] });
        }),
      );
  }

  getUserById(userId: string): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/${userId}`, {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      })
      .pipe(
        catchError((error: any) => {
          console.error('Failed to load user:', error);
          this.notificationService.error('Failed to load user');
          return of({ success: false });
        }),
      );
  }

  updateUserRole(userId: string, role: string): Observable<any> {
    return this.http
      .put<any>(
        `${this.apiUrl}/${userId}/role`,
        { role },
        {
          headers: {
            Authorization: `Bearer ${this.authService.getToken()}`,
          },
        },
      )
      .pipe(
        tap((response: any) => {
          if (response.success) {
            this.notificationService.success('User role updated successfully');
          }
        }),
        catchError((error: any) => {
          const message = error.error?.message || 'Failed to update user role';
          this.notificationService.error(message);
          throw error;
        }),
      );
  }

  deleteUser(userId: string): Observable<any> {
    return this.http
      .delete<any>(`${this.apiUrl}/${userId}`, {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      })
      .pipe(
        tap((response: any) => {
          if (response.success) {
            this.notificationService.success('User deleted successfully');
          }
        }),
        catchError((error: any) => {
          const message = error.error?.message || 'Failed to delete user';
          this.notificationService.error(message);
          throw error;
        }),
      );
  }

  banUser(userId: string): Observable<any> {
    return this.http
      .put<any>(
        `${this.apiUrl}/${userId}/ban`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.authService.getToken()}`,
          },
        },
      )
      .pipe(
        tap((response: any) => {
          if (response.success) {
            this.notificationService.success('User banned successfully');
          }
        }),
        catchError((error: any) => {
          const message = error.error?.message || 'Failed to ban user';
          this.notificationService.error(message);
          throw error;
        }),
      );
  }

  // ============ USER PROFILE METHODS ============

  /**
   * Get current user profile
   */
  getUserProfile(): Observable<any> {
    return this.http
      .get<any>(`${this.userProfileUrl}/profile`, {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      })
      .pipe(
        tap((response: any) => {
          console.log('✅ User profile loaded:', response);
        }),
        catchError((error: any) => {
          console.error('❌ Failed to load user profile:', error);
          this.notificationService.error('Failed to load user profile');
          return of({ success: false, user: null });
        }),
      );
  }

  /**
   * Update user password
   */
  updatePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http
      .put<any>(
        `${this.userProfileUrl}/change-password`,
        { currentPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${this.authService.getToken()}`,
          },
        },
      )
      .pipe(
        tap((response: any) => {
          if (response.success) {
            this.notificationService.success('Password updated successfully');
          }
        }),
        catchError((error: any) => {
          const message = error.error?.message || 'Failed to update password';
          this.notificationService.error(message);
          throw error;
        }),
      );
  }

  /**
   * Add a new address
   */
  addAddress(addressData: any): Observable<any> {
    return this.http
      .post<any>(`${this.userProfileUrl}/address`, addressData, {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      })
      .pipe(
        tap((response: any) => {
          console.log('✅ Address added successfully');
        }),
        catchError((error: any) => {
          const message = error.error?.message || 'Failed to add address';
          console.error('❌ Error adding address:', message);
          throw error;
        }),
      );
  }

  /**
   * Update an existing address
   */
  updateAddress(addressId: string, addressData: any): Observable<any> {
    return this.http
      .put<any>(`${this.userProfileUrl}/address/${addressId}`, addressData, {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      })
      .pipe(
        tap((response: any) => {
          console.log('✅ Address updated successfully');
        }),
        catchError((error: any) => {
          const message = error.error?.message || 'Failed to update address';
          console.error('❌ Error updating address:', message);
          throw error;
        }),
      );
  }

  /**
   * Delete an address
   */
  deleteAddress(addressId: string): Observable<any> {
    return this.http
      .delete<any>(`${this.userProfileUrl}/address/${addressId}`, {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      })
      .pipe(
        tap((response: any) => {
          console.log('✅ Address deleted successfully');
        }),
        catchError((error: any) => {
          const message = error.error?.message || 'Failed to delete address';
          console.error('❌ Error deleting address:', message);
          throw error;
        }),
      );
  }
}
