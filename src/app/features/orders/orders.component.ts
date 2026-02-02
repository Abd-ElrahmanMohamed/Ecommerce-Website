import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { NotificationService } from '../../core/services/notification.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  items: any[];
  shippingAddress: any;
  createdAt: string;
  canCancel: boolean;
  paymentStatus: string;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
})
export class OrdersComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  isLoading = false;
  expandedOrderId: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private orderService: OrderService,
    private notificationService: NotificationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadUserOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserOrders(): void {
    this.isLoading = true;
    this.orderService
      .getUserOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.orders = response.data || response.orders || [];
          this.isLoading = false;
        },
        error: (error: any) => {
          this.notificationService.error('Failed to load orders');
          this.isLoading = false;
          console.error(error);
        },
      });
  }

  toggleOrderDetails(orderId: string): void {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  canCancelOrder(order: Order): boolean {
    return order.canCancel && ['Pending', 'Processing'].includes(order.status);
  }

  cancelOrder(order: Order): void {
    if (!this.canCancelOrder(order)) {
      this.notificationService.error('This order cannot be cancelled');
      return;
    }

    if (confirm(`Are you sure you want to cancel order ${order.orderNumber}?`)) {
      this.orderService
        .cancelOrder(order._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            this.notificationService.success('Order cancelled successfully');
            this.loadUserOrders();
          },
          error: (error: any) => {
            const message = error.error?.message || 'Failed to cancel order';
            this.notificationService.error(message);
          },
        });
    }
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      Pending: 'status-pending',
      Processing: 'status-processing',
      Ready: 'status-ready',
      Shipped: 'status-shipped',
      Received: 'status-received',
      Cancelled: 'status-cancelled',
      Refused: 'status-refused',
    };
    return statusClasses[status] || 'status-default';
  }

  getStatusBadgeText(status: string): string {
    const statusTexts: { [key: string]: string } = {
      Pending: '⏳ Pending',
      Processing: '🔄 Processing',
      Ready: '📦 Ready',
      Shipped: '🚚 Shipped',
      Received: '✅ Received',
      Cancelled: '❌ Cancelled',
      Refused: '⛔ Refused',
    };
    return statusTexts[status] || status;
  }

  getPaymentStatusClass(status: string): string {
    const paymentClasses: { [key: string]: string } = {
      Pending: 'payment-pending',
      Paid: 'payment-paid',
      Failed: 'payment-failed',
    };
    return paymentClasses[status] || 'payment-default';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getTotalItems(items: any[]): number {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }
}
