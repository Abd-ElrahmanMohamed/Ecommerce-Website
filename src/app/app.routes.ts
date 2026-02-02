import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { ProductsComponent } from './features/products/products.component';
import { ProductDetailsComponent } from './features/product-details/product-details.component';
import { CartComponent } from './features/cart/cart.component';
import { CheckoutComponent } from './features/checkout/checkout.component';
import { LoginComponent } from './features/auth/login.component';
import { AccountComponent } from './features/account/account.component';
import { AboutComponent } from './features/about/about.component';
import { ContactComponent } from './features/contact/contact.component';
import { FAQComponent } from './features/faq/faq.component';
import { OrdersComponent } from './features/orders/orders.component';
import { AdminDashboardComponent } from './features/admin/dashboard/admin-dashboard.component';
import { AdminProductsComponent } from './features/admin/products/admin-products.component';
import { AdminCategoriesComponent } from './features/admin/category/admin-categories.component';
import { AdminOrdersComponent } from './features/admin/orders/admin-orders.component';
import { AdminUsersComponent } from './features/admin/users/admin-users.component';
import { AdminReviewsComponent } from './features/admin/reviews/admin-reviews.component';
import { AdminReportsComponent } from './features/admin/reports/admin-reports.component';
import { AdminSettingsComponent } from './features/admin/settings/admin-settings.component';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // Public Pages
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'products', component: ProductsComponent },
  { path: 'products/:slug', component: ProductDetailsComponent },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'faq', component: FAQComponent },

  // Auth Pages
  { path: 'login', component: LoginComponent },
  { path: 'auth', component: LoginComponent },

  // User Pages
  { path: 'account', component: AccountComponent, canActivate: [AuthGuard] },
  { path: 'orders', component: OrdersComponent, canActivate: [AuthGuard] },
  { path: 'cart', component: CartComponent },
  { path: 'checkout', component: CheckoutComponent },

  // Admin Pages (Protected with AdminGuard)
  { path: 'admin', component: AdminDashboardComponent, canActivate: [AdminGuard] },
  { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [AdminGuard] },
  { path: 'admin/products', component: AdminProductsComponent, canActivate: [AdminGuard] },
  { path: 'admin/categories', component: AdminCategoriesComponent, canActivate: [AdminGuard] },
  { path: 'admin/orders', component: AdminOrdersComponent, canActivate: [AdminGuard] },
  { path: 'admin/users', component: AdminUsersComponent, canActivate: [AdminGuard] },
  { path: 'admin/reviews', component: AdminReviewsComponent, canActivate: [AdminGuard] },
  { path: 'admin/reports', component: AdminReportsComponent, canActivate: [AdminGuard] },
  { path: 'admin/settings', component: AdminSettingsComponent, canActivate: [AdminGuard] },

  // Fallback
  { path: '**', redirectTo: '/' },
];
