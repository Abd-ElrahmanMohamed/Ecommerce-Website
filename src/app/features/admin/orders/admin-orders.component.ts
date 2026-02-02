import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  items: any[];
  user: { _id: string; name: string; email: string };
  shippingAddress: {
    name?: string;
    street: string;
    city: string;
    state: string;
    postalCode?: string;
    country: string;
    mobile?: string;
  };
  createdAt: string;
  canCancel: boolean;
}

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-orders.component.html',
  styleUrls: ['./admin-orders.component.css'],
})
export class AdminOrdersComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  isLoading = false;
  selectedStatus: string = 'all';
  expandedOrderId: string | null = null;
  editingOrderId: string | null = null;
  editingStatus: string = '';

  private destroy$ = new Subject<void>();

  statuses = ['Pending', 'Processing', 'Ready', 'Shipped', 'Received', 'Refused', 'Cancelled'];

  constructor(
    private orderService: OrderService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadAllOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllOrders(): void {
    this.isLoading = true;
    this.orderService
      .getAllOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.orders = response.data || response.orders || [];
          this.isLoading = false;
        },
        error: (error: any) => {
          this.notificationService.error('Failed to load orders');
          this.isLoading = false;
        },
      });
  }

  getFilteredOrders(): Order[] {
    if (this.selectedStatus === 'all') {
      return this.orders;
    }
    return this.orders.filter((order) => order.status === this.selectedStatus);
  }

  toggleOrderDetails(orderId: string): void {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  startEditing(order: Order): void {
    this.editingOrderId = order._id;
    this.editingStatus = order.status;
  }

  cancelEdit(): void {
    this.editingOrderId = null;
    this.editingStatus = '';
  }

  saveStatusChange(orderId: string): void {
    if (!this.editingStatus) {
      this.notificationService.error('Please select a status');
      return;
    }

    this.orderService
      .updateOrderStatusApi(orderId, this.editingStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.notificationService.success('Order status updated');
          this.cancelEdit();
          this.loadAllOrders();
        },
        error: (error: any) => {
          const message = error.error?.message || 'Failed to update status';
          this.notificationService.error(message);
        },
      });
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

  getStatusStats() {
    return {
      total: this.orders.length,
      pending: this.orders.filter((o) => o.status === 'Pending').length,
      processing: this.orders.filter((o) => o.status === 'Processing').length,
      ready: this.orders.filter((o) => o.status === 'Ready').length,
      shipped: this.orders.filter((o) => o.status === 'Shipped').length,
      received: this.orders.filter((o) => o.status === 'Received').length,
      cancelled: this.orders.filter((o) => o.status === 'Cancelled' || o.status === 'Refused')
        .length,
    };
  }

  /**
   * Export orders as CSV
   */
  exportAsCSV(): void {
    const filteredOrders = this.getFilteredOrders();
    if (filteredOrders.length === 0) {
      this.notificationService.error('No orders to export');
      return;
    }

    // Prepare CSV data
    const headers = [
      'Order Number',
      'Customer',
      'Email',
      'Total Amount',
      'Items Count',
      'Status',
      'Date',
    ];
    const rows = filteredOrders.map((order) => [
      order.orderNumber,
      order.user.name,
      order.user.email,
      order.totalAmount.toFixed(2),
      this.getTotalItems(order.items),
      order.status,
      this.formatDate(order.createdAt),
    ]);

    // Create CSV content
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `orders_${new Date().getTime()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.notificationService.success(`Exported ${filteredOrders.length} orders as CSV`);
  }

  /**
   * Export orders as PDF
   */
  exportAsPDF(): void {
    const filteredOrders = this.getFilteredOrders();
    if (filteredOrders.length === 0) {
      this.notificationService.error('No orders to export');
      return;
    }

    // Create HTML content for PDF
    let htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Orders Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #27ae60; color: white; padding: 12px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Orders Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Total Amount</th>
                <th>Items</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
    `;

    // Add order rows
    filteredOrders.forEach((order) => {
      htmlContent += `
              <tr>
                <td>${order.orderNumber}</td>
                <td>${order.user.name}</td>
                <td>${order.user.email}</td>
                <td>EGP ${order.totalAmount.toFixed(2)}</td>
                <td>${this.getTotalItems(order.items)}</td>
                <td>${order.status}</td>
                <td>${this.formatDate(order.createdAt)}</td>
              </tr>
      `;
    });

    htmlContent += `
            </tbody>
          </table>
          <div class="footer">
            <p>Total Orders: ${filteredOrders.length}</p>
            <p>Total Revenue: EGP ${filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)}</p>
          </div>
        </body>
      </html>
    `;

    // Open print dialog
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
      this.notificationService.success(`Exporting ${filteredOrders.length} orders as PDF`);
    }
  }
}
