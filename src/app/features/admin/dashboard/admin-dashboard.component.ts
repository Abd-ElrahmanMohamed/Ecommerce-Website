import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AdminProductsComponent } from '../products/admin-products.component';
import { AdminOrdersComponent } from '../orders/admin-orders.component';
import { AdminUsersComponent } from '../users/admin-users.component';
import { AdminCategoriesComponent } from '../category/admin-categories.component';
import { AdminReviewsComponent } from '../reviews/admin-reviews.component';
import { AdminReportsComponent } from '../reports/admin-reports.component';
import { AdminSettingsComponent } from '../settings/admin-settings.component';
import { AdminReturnsComponent } from '../returns/admin-returns.component';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AdminProductsComponent,
    AdminOrdersComponent,
    AdminUsersComponent,
    AdminCategoriesComponent,
    AdminReviewsComponent,
    AdminReturnsComponent,
    AdminReportsComponent,
    AdminSettingsComponent,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit {
  activeMenu: string = 'dashboard';
  isLoading = true;

  stats = [
    { label: 'Total Sales', value: '0 EGP', icon: 'fas fa-credit-card', color: '#27ae60' },
    { label: 'Total Orders', value: '0', icon: 'fas fa-shopping-cart', color: '#1565c0' },
    { label: 'Total Products', value: '0', icon: 'fas fa-box', color: '#f9a825' },
    { label: 'Total Users', value: '0', icon: 'fas fa-users', color: '#ff6b35' },
  ];

  recentOrders: any[] = [];
  topProducts: any[] = [];

  constructor(
    private authService: AuthService,
    private orderService: OrderService,
    private router: Router,
  ) {
    this.checkAdminAccess();
  }

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isLoading = true;

    // Load stats
    this.orderService.getDashboardStats().subscribe(
      (response: any) => {
        if (response.success && response.stats) {
          const stats = response.stats;
          this.stats[0].value = `${stats.monthlyRevenue?.toLocaleString() || '0'} EGP`;
          this.stats[1].value = stats.totalOrders?.toString() || '0';
          this.stats[2].value = stats.totalProducts?.toString() || '0';
          this.stats[3].value = stats.totalUsers?.toString() || '0';
        }
        this.isLoading = false;
      },
      (error: any) => {
        console.error('Failed to load dashboard stats:', error);
        this.isLoading = false;
      },
    );

    // Load recent orders
    this.orderService.getAllOrders().subscribe(
      (response: any) => {
        if (response.orders) {
          this.recentOrders = response.orders.slice(0, 4).map((order: any) => ({
            id: order.orderNumber,
            customer: order.user?.name || 'Unknown',
            amount: order.totalAmount,
            status: order.status,
            date: new Date(order.createdAt).toLocaleDateString('en-US'),
          }));

          // Load top products by analyzing orders
          this.loadTopProducts(response.orders);
        }
      },
      (error) => console.error('Failed to load recent orders:', error),
    );
  }

  /**
   * Analyze orders to get top selling products
   */
  private loadTopProducts(orders: any[]): void {
    console.log('📊 Loading top products from orders...');

    const productSalesMap = new Map<string, { name: string; unitsSold: number; revenue: number }>();

    // Aggregate product sales from all orders
    orders.forEach((order) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const productName = item.name || item.productName || 'Unknown Product';
          const productId = item._id || item.id || item.productId || productName;
          const quantity = item.quantity || 1;
          const price = item.price || 0;
          const revenue = quantity * price;

          if (productSalesMap.has(productId)) {
            const existing = productSalesMap.get(productId)!;
            existing.unitsSold += quantity;
            existing.revenue += revenue;
          } else {
            productSalesMap.set(productId, {
              name: productName,
              unitsSold: quantity,
              revenue: revenue,
            });
          }
        });
      }
    });

    // Sort by revenue (descending) and take top 5
    this.topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    console.log('✅ Top products loaded:', this.topProducts);
  }

  checkAdminAccess() {
    const user = this.authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      this.router.navigate(['/']);
    }
  }

  setActiveMenu(menu: string) {
    this.activeMenu = menu;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Received':
        return 'status-delivered';
      case 'Shipped':
        return 'status-shipped';
      case 'Processing':
        return 'status-processing';
      case 'Pending':
        return 'status-pending';
      default:
        return '';
    }
  }

  viewAllOrders() {
    this.setActiveMenu('orders');
  }

  viewAllProducts() {
    this.setActiveMenu('products');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
