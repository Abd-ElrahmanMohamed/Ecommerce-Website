import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header.component';
import { FooterComponent } from '../../shared/components/footer.component';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { UserService } from '../../core/services/user.service';
import { OrderService } from '../../core/services/order.service';
import { ReviewService } from '../../core/services/review.service';
import { NotificationService } from '../../core/services/notification.service';
import { User, Cart } from '../../core/models';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css',
})
export class AccountComponent implements OnInit, OnDestroy {
  activeTab: 'overview' | 'orders' | 'addresses' | 'returns' | 'reviews' | 'settings' = 'overview';
  isLoading = true;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  user: User | null = null;
  cart: Cart | null = null;

  userStats: any[] = [];
  orders: any[] = [];
  addresses: any[] = [];
  passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
  settings = { emailNotifications: true, smsNotifications: false, newsletter: true };

  // Edit Address Modal
  editingAddressId: string | null = null;
  editingAddress: any = {
    type: 'home',
    street: '',
    city: '',
    state: '',
    zipCode: '',
  };

  // Delete Confirmation Modal
  deletingAddressId: string | null = null;

  // Order Details Modal
  viewingOrderId: string | null = null;
  viewingOrderDetails: any = null;

  // Returns Management
  userReturns: any[] = [];
  selectedOrderForReturn: any = null;
  returnReason: string = '';
  returnComment: string = '';
  returnSubmitting: boolean = false;

  // Reviews Management
  userReviews: any[] = [];
  selectedOrderForReview: any = null;
  reviewRating: number = 5;
  reviewComment: string = '';
  reviewSubmitting: boolean = false;

  private subscriptions: Subscription[] = [];

  // Getter for eligible orders for return (within 14 days and status = 'Delivered')
  get eligibleOrdersForReturn(): any[] {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    console.log('🔍 Checking returns eligibility:');
    console.log('  Current date:', new Date());
    console.log('  14 days ago:', fourteenDaysAgo);
    console.log('  Total orders:', this.orders.length);

    const eligible = this.orders.filter((order) => {
      const orderDate = new Date(order.date);
      const isWithin14Days = orderDate >= fourteenDaysAgo;
      const statusLower = (order.status || '').toString().toLowerCase();
      const isDelivered = statusLower === 'delivered' || statusLower === 'received';

      console.log(`  Order ${order.id}:`, {
        orderDate: orderDate.toISOString(),
        status: order.status,
        isWithin14Days,
        isDelivered,
        eligible: isWithin14Days && isDelivered,
      });

      return isWithin14Days && isDelivered;
    });

    console.log('✅ Eligible orders for return:', eligible.length);
    return eligible;
  }

  // Getter for reviewable orders (Delivered and not yet reviewed)
  get reviewableOrders(): any[] {
    return this.orders.filter((order) => {
      const statusLower = (order.status || '').toString().toLowerCase();
      const isDelivered = statusLower === 'delivered' || statusLower === 'received';
      return isDelivered && !this.userReviews.some((review) => review.orderId === order.id);
    });
  }

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private userService: UserService,
    private orderService: OrderService,
    private reviewService: ReviewService,
    private notificationService: NotificationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // تحقق من تسجيل الدخول
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadUserData();
    this.loadCart();
    this.loadOrders();
    this.loadReviews();

    // Listen for navigation events to refresh orders when returning to account
    const navSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.urlAfterRedirects === '/account') {
          console.log('🔄 Account page loaded, refreshing orders...');
          this.loadOrders();
          this.loadReviews();
        }
      });
    this.subscriptions.push(navSub);
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private loadUserData(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.user = currentUser;
      this.updateStats();
      this.loadAddresses();
      this.isLoading = false;
    } else {
      // If no cached user, fetch from server
      const sub = this.userService.getUserProfile().subscribe(
        (response: any) => {
          if (response?.success && response?.user) {
            this.user = response.user;
            this.updateStats();
            this.loadAddresses();
            this.isLoading = false;
          } else {
            this.errorMessage = 'Failed to load user data';
            this.isLoading = false;
          }
        },
        (error) => {
          console.error('Error loading user profile:', error);
          this.errorMessage = 'Failed to load user data';
          this.isLoading = false;
        },
      );
      this.subscriptions.push(sub);
    }
  }

  private loadCart(): void {
    const sub = this.cartService.cart$.subscribe((cart) => {
      this.cart = cart;
    });
    this.subscriptions.push(sub);
  }

  private loadOrders(): void {
    const sub = this.orderService.getUserOrders().subscribe(
      (response: any) => {
        console.log('📦 Raw response from API:', response);

        let ordersArray: any[] = [];

        // Try multiple response formats
        if (response?.success && Array.isArray(response?.orders)) {
          console.log('✅ Format 1: success + orders array');
          ordersArray = response.orders;
        } else if (Array.isArray(response?.data)) {
          console.log('✅ Format 2: data array');
          ordersArray = response.data;
        } else if (Array.isArray(response)) {
          console.log('✅ Format 3: direct array');
          ordersArray = response;
        } else if (response?.orders && Array.isArray(response.orders)) {
          console.log('✅ Format 4: orders property');
          ordersArray = response.orders;
        } else {
          console.warn('⚠️ No orders found in response:', response);
          ordersArray = [];
        }

        // Map orders to component model
        if (ordersArray.length > 0) {
          this.orders = ordersArray.map((order: any) => {
            console.log('🔄 Mapping order:', order);
            return {
              id: order._id || order.id,
              date: new Date(order.createdAt || order.date),
              total: order.total || order.totalAmount || 0,
              status: order.status || 'pending',
              items: order.items && Array.isArray(order.items) ? order.items : [],
              itemsCount: order.items?.length || 0,
              orderNumber: order.orderNumber,
              shippingAddress: order.shippingAddress || {
                street: '',
                city: '',
                state: '',
                zipCode: '',
              },
            };
          });
          console.log('✅ Loaded ' + this.orders.length + ' orders');
        } else {
          this.orders = [];
          console.log('ℹ️ No orders available');
        }

        this.isLoading = false;
        this.updateStats(); // Recalculate stats with new orders
      },
      (error) => {
        console.error('❌ Error loading orders:', error);
        this.orders = [];
        this.isLoading = false;
      },
    );
    this.subscriptions.push(sub);
  }

  // Public method to refresh orders (can be called from other components)
  refreshOrders(): void {
    console.log('🔄 Refreshing orders...');
    this.isLoading = true;
    this.loadOrders();
  }

  // Public method to refresh addresses
  refreshAddresses(): void {
    console.log('🔄 Refreshing addresses...');
    this.loadAddresses();
  }

  /**
   * Load user reviews from the ReviewService
   */
  private loadReviews(): void {
    console.log('⭐ Loading reviews...');

    const sub = this.reviewService.getAllReviews().subscribe(
      (reviews: any[]) => {
        console.log('✅ Loaded reviews from service:', reviews);

        // Filter reviews that belong to current user
        const userId = this.user?.id || this.authService.getCurrentUserId();
        this.userReviews = reviews.filter(
          (review) => review.userId === userId || review.userName === this.user?.name,
        );

        console.log('✅ Filtered ' + this.userReviews.length + ' user reviews');
      },
      (error) => {
        console.error('❌ Error loading reviews:', error);
        this.userReviews = [];
      },
    );
    this.subscriptions.push(sub);
  }

  private loadAddresses(): void {
    console.log('📍 Loading addresses...');
    console.log('Current user:', this.user);

    // Try to get addresses from user object first
    if (
      this.user?.addresses &&
      Array.isArray(this.user.addresses) &&
      this.user.addresses.length > 0
    ) {
      console.log('✅ Addresses found in user object:', this.user.addresses);
      this.addresses = this.user.addresses.map((addr: any) => ({
        id: addr._id || addr.id,
        type: addr.type || 'home',
        street: addr.street || '',
        city: addr.city || '',
        state: addr.state || '',
        zipCode: addr.zipCode || addr.postalCode || '',
        isDefault: addr.isDefault || false,
      }));
    } else {
      console.log('⚠️ No addresses in user object, fetching from API...');
      // If no addresses in user object, fetch separately from API
      const sub = this.userService.getUserProfile().subscribe(
        (response: any) => {
          console.log('📍 API Response:', response);

          let addressesArray: any[] = [];

          // Try to extract addresses from various response formats
          if (response?.user?.addresses && Array.isArray(response.user.addresses)) {
            console.log('✅ Addresses from response.user.addresses');
            addressesArray = response.user.addresses;
          } else if (response?.data?.addresses && Array.isArray(response.data.addresses)) {
            console.log('✅ Addresses from response.data.addresses');
            addressesArray = response.data.addresses;
          } else if (response?.addresses && Array.isArray(response.addresses)) {
            console.log('✅ Addresses from response.addresses');
            addressesArray = response.addresses;
          }

          if (addressesArray.length > 0) {
            console.log('✅ Loaded ' + addressesArray.length + ' addresses');
            this.addresses = addressesArray.map((addr: any) => ({
              id: addr._id || addr.id,
              type: addr.type || 'home',
              street: addr.street || '',
              city: addr.city || '',
              state: addr.state || '',
              zipCode: addr.zipCode || addr.postalCode || '',
              isDefault: addr.isDefault || false,
            }));

            // Also update user object with addresses
            if (this.user) {
              this.user.addresses = addressesArray;
            }
          } else {
            console.log('ℹ️ No addresses found');
            this.addresses = [];
          }
        },
        (error) => {
          console.error('❌ Error loading addresses:', error);
          this.addresses = [];
        },
      );
      this.subscriptions.push(sub);
    }
  }

  private updateStats(): void {
    if (this.user) {
      this.userStats = [
        { label: 'Total Orders', value: this.orders.length, icon: 'fas fa-box' },
        {
          label: 'Total Spent',
          value: this.calculateTotalSpent() + ' EGP',
          icon: 'fas fa-credit-card',
        },
        {
          label: 'Member Since',
          value: this.formatDate(this.user?.createdAt || new Date()),
          icon: 'fas fa-calendar',
        },
        { label: 'Loyalty Points', value: '250', icon: 'fas fa-star' },
      ];
    }
  }

  private calculateTotalSpent(): number {
    return this.orders.reduce((sum, order) => sum + order.total, 0);
  }

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
      this.router.navigate(['/']);
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Delivered':
        return 'status-delivered';
      case 'Shipped':
        return 'status-shipped';
      case 'Processing':
        return 'status-processing';
      default:
        return 'status-pending';
    }
  }

  /**
   * View order details - show in modal
   */
  viewOrder(orderId: string): void {
    if (!orderId) {
      this.notificationService.error('Order ID not found', '❌ Error');
      return;
    }

    console.log('👀 Viewing order:', orderId);

    // Find the order from the orders list
    const orderToView = this.orders.find((o) => o.id === orderId);
    if (orderToView) {
      this.viewingOrderId = orderId;
      this.viewingOrderDetails = orderToView;
    } else {
      this.notificationService.error('Order not found', '❌ Error');
    }
  }

  /**
   * Close order details modal
   */
  closeOrderModal(): void {
    this.viewingOrderId = null;
    this.viewingOrderDetails = null;
  }

  /**
   * Print order invoice
   */
  printInvoice(): void {
    if (!this.viewingOrderDetails) {
      this.notificationService.error('No order details available', '❌ Error');
      return;
    }

    console.log('🖨️ Printing invoice for order:', this.viewingOrderDetails.orderNumber);

    // Create a new window for printing
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      this.notificationService.error('Failed to open print window', '❌ Error');
      return;
    }

    const order = this.viewingOrderDetails;
    const invoiceHTML = this.generateInvoiceHTML(order);

    // Write HTML to the new window
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
    }, 250);

    this.notificationService.success('Invoice opened for printing', '✅ Success');
  }

  /**
   * Mark an order as Delivered so it becomes eligible for return (demo helper)
   */
  markOrderAsDelivered(orderId: string): void {
    if (!orderId) {
      this.notificationService.error('Order ID not found', '❌ Error');
      return;
    }

    this.orderService.updateOrderStatus(orderId, 'received').subscribe(
      (updated: any) => {
        if (updated) {
          // Update local orders array
          const idx = this.orders.findIndex((o) => o.id === orderId);
          if (idx !== -1) {
            this.orders[idx].status = 'Delivered';
          }

          // If viewing the same order, update modal data
          if (this.viewingOrderId === orderId && this.viewingOrderDetails) {
            this.viewingOrderDetails.status = 'Delivered';
          }

          this.notificationService.success('Order marked as Delivered', '✅ Updated');
          this.updateStats();
        } else {
          this.notificationService.error('Failed to update order status', '❌ Error');
        }
      },
      (error) => {
        console.error('Failed to mark order delivered:', error);
        this.notificationService.error('Failed to update order status', '❌ Error');
      },
    );
  }

  /**
   * Generate invoice HTML
   */
  private generateInvoiceHTML(order: any): string {
    const itemsHTML = order.items
      .map(
        (item: any) => `
      <tr>
        <td>${item.name || item.productName}</td>
        <td style="text-align: center;">${item.quantity || 1}</td>
        <td style="text-align: right;">EGP ${(item.price || 0).toFixed(2)}</td>
        <td style="text-align: right;">EGP ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
      </tr>
    `,
      )
      .join('');

    const subtotal = order.total * 0.9;
    const tax = order.total * 0.1;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice #${order.orderNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
          background: white;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 30px;
          border: 1px solid #ddd;
        }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          border-bottom: 2px solid #007bff;
          padding-bottom: 20px;
        }
        .company-info h1 {
          margin: 0;
          color: #007bff;
          font-size: 24px;
        }
        .invoice-info {
          text-align: right;
        }
        .invoice-info p {
          margin: 5px 0;
          font-size: 14px;
        }
        .invoice-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }
        .detail-section h3 {
          margin-top: 0;
          margin-bottom: 10px;
          color: #333;
          font-size: 14px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .detail-section p {
          margin: 5px 0;
          font-size: 13px;
          line-height: 1.6;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th {
          background: #f5f5f5;
          padding: 12px;
          text-align: left;
          font-weight: bold;
          border-bottom: 2px solid #ddd;
          font-size: 13px;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #ddd;
          font-size: 13px;
        }
        tr:last-child td {
          border-bottom: 2px solid #ddd;
        }
        .summary {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 30px;
        }
        .summary-details {
          width: 300px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 13px;
        }
        .summary-row.total {
          border-top: 2px solid #ddd;
          border-bottom: 2px solid #ddd;
          padding: 12px 0;
          font-size: 16px;
          font-weight: bold;
          color: #007bff;
        }
        .status-badge {
          display: inline-block;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .status-delivered {
          background: #d4edda;
          color: #155724;
        }
        .status-shipped {
          background: #d1ecf1;
          color: #0c5460;
        }
        .status-processing {
          background: #fff3cd;
          color: #856404;
        }
        .status-pending {
          background: #f8d7da;
          color: #721c24;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .invoice-container {
            border: none;
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="invoice-header">
          <div class="company-info">
            <h1>🛍️ eShop</h1>
            <p>Your trusted online store</p>
          </div>
          <div class="invoice-info">
            <p><strong>Invoice #</strong> ${order.orderNumber}</p>
            <p><strong>Date:</strong> ${new Date(order.date).toLocaleDateString('en-US')}</p>
            <p><strong>Status:</strong> <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></p>
          </div>
        </div>

        <div class="invoice-details">
          <div class="detail-section">
            <h3>Billing Information</h3>
            <p>${this.user?.name || 'Customer Name'}</p>
            <p>${this.user?.email || 'email@example.com'}</p>
            <p>${this.user?.mobile || 'Phone'}</p>
          </div>
          <div class="detail-section">
            <h3>Shipping Address</h3>
            <p>${order.shippingAddress?.street || 'Address not provided'}</p>
            <p>${order.shippingAddress?.city || ''} ${order.shippingAddress?.state || ''}</p>
            <p>${order.shippingAddress?.zipCode || ''}</p>
          </div>
        </div>

        <h3 style="margin-bottom: 15px;">Order Items</h3>
        <table>
          <thead>
            <tr>
              <th>Product Name</th>
              <th style="text-align: center;">Quantity</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-details">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>EGP ${subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span>Shipping:</span>
              <span>EGP 25.00</span>
            </div>
            <div class="summary-row">
              <span>Tax (10%):</span>
              <span>EGP ${tax.toFixed(2)}</span>
            </div>
            <div class="summary-row total">
              <span>Total Amount:</span>
              <span>EGP ${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your purchase! This is an automatically generated invoice.</p>
          <p>For support, please visit our website or contact our customer service.</p>
          <p style="margin-top: 20px; color: #999;">© 2026 eShop. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  updatePassword(): void {
    if (
      !this.passwordForm.currentPassword ||
      !this.passwordForm.newPassword ||
      !this.passwordForm.confirmPassword
    ) {
      this.errorMessage = 'Please fill in all password fields';
      return;
    }

    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.errorMessage = 'New passwords do not match';
      return;
    }

    if (this.passwordForm.newPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters';
      return;
    }

    // Call service to update password
    const sub = this.userService
      .updatePassword(this.passwordForm.currentPassword, this.passwordForm.newPassword)
      .subscribe(
        (response: any) => {
          this.successMessage = 'Password updated successfully!';
          this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
          this.errorMessage = null;
          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        },
        (error) => {
          console.error('Error updating password:', error);
          this.errorMessage = error.error?.message || 'Failed to update password';
        },
      );
    this.subscriptions.push(sub);
  }

  updateSettings(): void {
    // TODO: استدعاء service لتحديث الإعدادات
    this.successMessage = 'Settings updated successfully!';
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }

  addAddress(): void {
    // Navigate to or show modal for adding new address
    const newAddress = {
      type: 'home',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      isDefault: false,
    };

    const sub = this.userService.addAddress(newAddress).subscribe(
      (response: any) => {
        console.log('Response from addAddress:', response);
        if (response?.user && response?.user?.addresses) {
          // Update user data with fresh data from server
          this.user = response.user;
          // Reload addresses from the fresh user data
          this.loadAddresses();
          this.notificationService.success('Address added successfully!', '✅ Success');
        } else {
          this.notificationService.error('Failed to add address', '❌ Error');
        }
      },
      (error) => {
        console.error('Error adding address:', error);
        const errorMsg = error.error?.message || 'Failed to add address';
        this.notificationService.error(errorMsg, '❌ Error');
      },
    );
    this.subscriptions.push(sub);
  }

  deleteAddress(id: string): void {
    if (!id) {
      this.notificationService.error('Address ID not found', '❌ Error');
      return;
    }

    // Open delete confirmation modal
    this.deletingAddressId = id;
  }

  /**
   * Confirm delete address
   */
  confirmDeleteAddress(): void {
    if (!this.deletingAddressId) {
      this.notificationService.error('Address ID not found', '❌ Error');
      return;
    }

    const addressId = this.deletingAddressId;
    const sub = this.userService.deleteAddress(addressId).subscribe(
      (response: any) => {
        if (response?.user && response?.user?.addresses) {
          this.user = response.user;
          this.loadAddresses();
          this.deletingAddressId = null;
          this.notificationService.success('Address deleted successfully!', '✅ Success');
        } else {
          this.notificationService.error('Failed to delete address', '❌ Error');
        }
      },
      (error) => {
        console.error('Error deleting address:', error);
        const errorMsg = error.error?.message || 'Failed to delete address';
        this.notificationService.error(errorMsg, '❌ Error');
        this.deletingAddressId = null;
      },
    );
    this.subscriptions.push(sub);
  }

  /**
   * Cancel delete operation
   */
  cancelDeleteAddress(): void {
    this.deletingAddressId = null;
  }

  /**
   * Set an address as default
   * Updates the address and removes default from others
   */
  setAddressAsDefault(id: string): void {
    if (!id) {
      this.notificationService.error('Address ID not found', '❌ Error');
      return;
    }

    const addressToUpdate = this.addresses.find((a) => a.id === id);
    if (!addressToUpdate) {
      console.error('Address not found with id:', id);
      this.notificationService.error('Address not found', '❌ Error');
      return;
    }

    // Create updated address with isDefault set to true
    const updatedAddress = {
      ...addressToUpdate,
      isDefault: true,
    };

    const sub = this.userService.updateAddress(id, updatedAddress).subscribe(
      (response: any) => {
        if (response?.user && response?.user?.addresses) {
          this.user = response.user;
          this.loadAddresses();
          this.notificationService.success('Default address updated successfully!', '✅ Success');
        } else {
          this.notificationService.error('Failed to set default address', '❌ Error');
        }
      },
      (error) => {
        console.error('Error setting default address:', error);
        const errorMsg = error.error?.message || 'Failed to set default address';
        this.notificationService.error(errorMsg, '❌ Error');
      },
    );
    this.subscriptions.push(sub);
  }

  /**
   * Open edit modal for a specific address
   */
  editAddress(id: string): void {
    if (!id) {
      this.notificationService.error('Address ID not found', '❌ Error');
      return;
    }

    const addressToEdit = this.addresses.find((a) => a.id === id);
    if (!addressToEdit) {
      this.notificationService.error('Address not found', '❌ Error');
      return;
    }

    // Deep copy to avoid modifying original while editing
    this.editingAddress = {
      type: addressToEdit.type,
      street: addressToEdit.street,
      city: addressToEdit.city,
      state: addressToEdit.state,
      zipCode: addressToEdit.zipCode,
    };
    this.editingAddressId = id;
    console.log('📝 Editing address:', id, this.editingAddress);
  }

  /**
   * Close edit modal without saving
   */
  closeEditModal(): void {
    this.editingAddressId = null;
    this.editingAddress = {
      type: 'home',
      street: '',
      city: '',
      state: '',
      zipCode: '',
    };
  }

  /**
   * Submit edited address
   */
  submitAddressEdit(): void {
    if (!this.editingAddressId) {
      this.notificationService.error('Address ID not found', '❌ Error');
      return;
    }

    // Validate form
    if (
      !this.editingAddress.street ||
      !this.editingAddress.city ||
      !this.editingAddress.state ||
      !this.editingAddress.zipCode
    ) {
      this.notificationService.error('Please fill in all fields', '❌ Error');
      return;
    }

    const updatePayload = {
      type: this.editingAddress.type,
      street: this.editingAddress.street,
      city: this.editingAddress.city,
      state: this.editingAddress.state,
      zipCode: this.editingAddress.zipCode,
    };

    const sub = this.userService.updateAddress(this.editingAddressId, updatePayload).subscribe(
      (response: any) => {
        if (response?.user && response?.user?.addresses) {
          this.user = response.user;
          this.loadAddresses();
          this.closeEditModal();
          this.notificationService.success('Address updated successfully!', '✅ Success');
        } else {
          this.notificationService.error('Failed to update address', '❌ Error');
        }
      },
      (error) => {
        console.error('Error updating address:', error);
        const errorMsg = error.error?.message || 'Failed to update address';
        this.notificationService.error(errorMsg, '❌ Error');
      },
    );
    this.subscriptions.push(sub);
  }

  getAddressIcon(type: string): { [key: string]: boolean } {
    const iconMap: { [key: string]: string } = {
      home: 'fa-house',
      office: 'fa-building',
      other: 'fa-location-dot',
    };
    const iconClass = iconMap[type] || 'fa-location-dot';
    return { [iconClass]: true };
  }

  getCartTotal(): number {
    if (this.cart) {
      return this.cartService.getCartSummary().total;
    }
    return 0;
  }

  /**
   * Debug method to check orders data (call from console)
   */
  debugOrders(): void {
    console.log('=== ORDERS DEBUG ===');
    console.log('Total orders:', this.orders.length);
    console.log('Orders array:', this.orders);
    console.log('isLoading:', this.isLoading);
    console.log('User:', this.user);
    this.orders.forEach((order, index) => {
      console.log(`Order ${index}:`, {
        id: order.id,
        orderNumber: order.orderNumber,
        date: order.date,
        total: order.total,
        status: order.status,
        itemsCount: order.itemsCount,
        items: order.items,
      });
    });
  }

  /**
   * Debug method to check addresses data
   */
  debugAddresses(): void {
    console.log('=== ADDRESSES DEBUG ===');
    console.log('Total addresses:', this.addresses.length);
    console.log('Addresses array:', this.addresses);
    console.log('isLoading:', this.isLoading);
    console.log('User object:', this.user);
    console.log('User addresses property:', this.user?.addresses);
    this.addresses.forEach((addr, index) => {
      console.log(`Address ${index}:`, {
        id: addr.id,
        type: addr.type,
        street: addr.street,
        city: addr.city,
        state: addr.state,
        zipCode: addr.zipCode,
        isDefault: addr.isDefault,
      });
    });
  }

  /**
   * ==================== RETURNS MANAGEMENT ====================
   */

  /**
   * Submit a return request for a selected order
   */
  submitReturnRequest(): void {
    if (!this.selectedOrderForReturn) {
      this.notificationService.error('Please select an order', '❌ Error');
      return;
    }

    if (!this.returnReason) {
      this.notificationService.error('Please select a return reason', '❌ Error');
      return;
    }

    this.returnSubmitting = true;

    // Build items payload from selected order items (return whole order by default)
    const itemsPayload = (this.selectedOrderForReturn.items || []).map((it: any) => ({
      orderItemId: it.id || it._id || it.productId || Math.random().toString(36).substr(2, 9),
      quantity: it.quantity || 1,
    }));

    // Call OrderService to request a return
    const sub = this.orderService
      .requestReturn(
        this.selectedOrderForReturn.id,
        itemsPayload,
        this.returnReason,
        this.returnComment,
      )
      .subscribe(
        (ret: any) => {
          if (!ret) {
            // Service returned null when not eligible or failed
            this.notificationService.error(
              'Return request could not be created. The order may not be eligible.',
              '❌ Return Failed',
            );
            this.returnSubmitting = false;
            return;
          }

          // Add to local return history for immediate feedback
          this.userReturns.push({
            ...ret,
            createdAt: ret.requestedAt || new Date(),
          });

          this.notificationService.success('Return request submitted successfully!', '✅ Success');
          this.cancelReturnRequest();
          this.returnSubmitting = false;
        },
        (error) => {
          console.error('❌ Error submitting return request:', error);
          this.notificationService.error('Failed to submit return. Please try again.', '❌ Error');
          this.returnSubmitting = false;
        },
      );

    this.subscriptions.push(sub);
  }

  /**
   * Cancel return request form
   */
  cancelReturnRequest(): void {
    this.selectedOrderForReturn = null;
    this.returnReason = '';
    this.returnComment = '';
  }

  /**
   * Get return status class for styling
   */
  getReturnStatusClass(status: string): string {
    switch (status) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      case 'processed':
        return 'status-processed';
      case 'pending':
      default:
        return 'status-pending';
    }
  }

  /**
   * ==================== REVIEWS MANAGEMENT ====================
   */

  /**
   * Submit a review for a selected order
   */
  submitReview(): void {
    if (!this.selectedOrderForReview) {
      this.notificationService.error('Please select an order', '❌ Error');
      return;
    }

    if (!this.reviewRating || this.reviewRating < 1 || this.reviewRating > 5) {
      this.notificationService.error('Please select a rating', '❌ Error');
      return;
    }

    if (!this.reviewComment || this.reviewComment.trim().length === 0) {
      this.notificationService.error('Please write a review', '❌ Error');
      return;
    }

    this.reviewSubmitting = true;

    // Prepare review data to send to service
    const reviewData = {
      productId:
        this.selectedOrderForReview?.items?.[0]?.productId || this.selectedOrderForReview?.id,
      rating: this.reviewRating,
      title: `${this.reviewRating} Star Review`,
      comment: this.reviewComment,
    };

    // Get user info for review
    const userId = this.user?.id || this.authService.getCurrentUserId() || 'anonymous';
    const userName = this.user?.name || 'Anonymous User';

    // Call ReviewService to submit review
    const sub = this.reviewService.createReview(reviewData, userId, userName).subscribe(
      (response: any) => {
        console.log('✅ Review submitted successfully:', response);

        // Store review locally for display
        this.userReviews.push({
          ...reviewData,
          orderId: this.selectedOrderForReview?.id,
          userId,
          userName,
          _id: response.id || Math.random().toString(36).substr(2, 9),
          createdAt: new Date(),
          approved: false, // Awaiting approval
        });

        this.notificationService.success(
          'Review submitted successfully! ⭐ Awaiting admin approval.',
          '✅ Success',
        );
        this.cancelReviewRequest();
        this.reviewSubmitting = false;
      },
      (error) => {
        console.error('❌ Error submitting review:', error);
        this.notificationService.error('Failed to submit review. Please try again.', '❌ Error');
        this.reviewSubmitting = false;
      },
    );
    this.subscriptions.push(sub);
  }

  /**
   * Cancel review form
   */
  cancelReviewRequest(): void {
    this.selectedOrderForReview = null;
    this.reviewRating = 5;
    this.reviewComment = '';
  }

  /**
   * Debug method to check returns eligibility
   */
  debugReturns(): void {
    console.log('=== RETURNS DEBUG ===');
    console.log('Total orders:', this.orders.length);
    console.log('Eligible for return:', this.eligibleOrdersForReturn.length);

    const now = new Date();
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    console.log('Current date:', now.toISOString());
    console.log('14 days ago:', fourteenDaysAgo.toISOString());
    console.log('\nAll orders:');

    this.orders.forEach((order, index) => {
      const orderDate = new Date(order.date);
      const isWithin14Days = orderDate >= fourteenDaysAgo;
      const statusLower = order.status ? order.status.toLowerCase() : '';
      const isDelivered = statusLower === 'delivered';

      console.log(`  [${index}] Order #${order.id}:`, {
        date: orderDate.toISOString(),
        status: order.status,
        statusLower: statusLower,
        isWithin14Days,
        isDelivered,
        eligible: isWithin14Days && isDelivered,
      });
    });

    console.log('\nEligible orders:', this.eligibleOrdersForReturn);
  }
}
