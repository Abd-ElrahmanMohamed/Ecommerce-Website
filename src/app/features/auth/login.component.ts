import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header.component';
import { FooterComponent } from '../../shared/components/footer.component';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  isLogin = true;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  loginForm = {
    email: '',
    password: '',
  };

  registerForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  };

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // إذا كان المستخدم مسجل دخول بالفعل، أعيد التوجيه للـ Home
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  onLogin(): void {
    if (!this.loginForm.email || !this.loginForm.password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    if (!this.validateEmail(this.loginForm.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.authService
      .login({
        email: this.loginForm.email,
        password: this.loginForm.password,
      })
      .subscribe(
        (response) => {
          this.isLoading = false;
          this.successMessage = `Welcome back, ${response.user.firstName}!`;

          // Reload user's cart from server
          this.cartService.reloadCart();

          // دمج السلة المحلية مع سلة المستخدم
          if (this.cartService.getCartItemCount() > 0) {
            const userId = response.user.id || response.user._id;
            if (userId) {
              this.cartService.mergeCartAfterLogin(userId).subscribe(
                () => {
                  setTimeout(() => {
                    this.router.navigate(['/account']);
                  }, 1500);
                },
                (error: any) => {
                  console.error('Failed to merge cart:', error);
                  this.router.navigate(['/account']);
                },
              );
            } else {
              setTimeout(() => {
                this.router.navigate(['/account']);
              }, 1500);
            }
          } else {
            setTimeout(() => {
              this.router.navigate(['/account']);
            }, 1500);
          }
        },
        (error: any) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Login failed. Please try again.';
          console.error('Login error:', error);
        },
      );
  }

  onRegister(): void {
    // تحقق من جميع الحقول
    if (
      !this.registerForm.firstName ||
      !this.registerForm.lastName ||
      !this.registerForm.email ||
      !this.registerForm.phone ||
      !this.registerForm.password ||
      !this.registerForm.confirmPassword
    ) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    if (!this.validateEmail(this.registerForm.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return;
    }

    if (this.registerForm.password !== this.registerForm.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    if (this.registerForm.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters';
      return;
    }

    if (!this.validatePhone(this.registerForm.phone)) {
      this.errorMessage = 'Please enter a valid phone number';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.authService
      .register({
        firstName: this.registerForm.firstName,
        lastName: this.registerForm.lastName,
        email: this.registerForm.email,
        phone: this.registerForm.phone,
        password: this.registerForm.password,
      })
      .subscribe(
        (response) => {
          this.isLoading = false;
          this.successMessage = `Welcome, ${response.user.firstName}! Your account has been created.`;

          // تحضير السلة للمستخدم الجديد
          const userId = response.user.id || response.user._id;
          if (userId) {
            this.cartService.mergeCartAfterLogin(userId).subscribe(
              () => {
                setTimeout(() => {
                  this.router.navigate(['/account']);
                }, 1500);
              },
              (error: any) => {
                console.error('Failed to merge cart:', error);
                this.router.navigate(['/account']);
              },
            );
          } else {
            setTimeout(() => {
              this.router.navigate(['/account']);
            }, 1500);
          }
        },
        (error: any) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
          console.error('Registration error:', error);
        },
      );
  }

  toggleForm(): void {
    this.isLogin = !this.isLogin;
    this.errorMessage = null;
    this.successMessage = null;
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validatePhone(phone: string): boolean {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 9;
  }
}
