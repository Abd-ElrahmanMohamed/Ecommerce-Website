import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import {
  Order,
  PlaceOrderRequest,
  OrderStatus,
  ReturnRequest,
  ReturnStatus,
  ProcessReturnRequest,
} from '../models';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private apiUrl = 'http://localhost:5000/api/orders';
  private mockOrders: Order[] = [];
  private mockReturns: ReturnRequest[] = [];
  private readonly RETURN_WINDOW_DAYS = 14; // 14 days to request return
  private returnsStorageKey = 'mockReturns_v1';

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private authService: AuthService,
  ) {
    // Load persisted returns on service instantiation
    this.loadReturnsFromStorage();
  }

  // Initialize storage on service creation
  ngOnInit?(): void {
    // not used in services, keep for compatibility
  }

  // Load persisted returns if any
  private loadReturnsFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.returnsStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as any[];
        this.mockReturns = parsed.map((r) => ({
          ...r,
          requestedAt: r.requestedAt ? new Date(r.requestedAt) : new Date(),
          approvedAt: r.approvedAt ? new Date(r.approvedAt) : undefined,
          completedAt: r.completedAt ? new Date(r.completedAt) : undefined,
        }));
        console.log('📥 Loaded returns from localStorage:', this.mockReturns.length);
      }
    } catch (e) {
      console.warn('Could not load returns from localStorage', e);
    }
  }

  private saveReturnsToStorage(): void {
    try {
      localStorage.setItem(this.returnsStorageKey, JSON.stringify(this.mockReturns));
      console.log('💾 Returns saved to localStorage');
    } catch (e) {
      console.warn('Could not save returns to localStorage', e);
    }
  }

  placeOrder(request: PlaceOrderRequest, userId: string): Observable<Order> {
    // Send order to backend API instead of storing locally
    return this.http
      .post<any>(`${this.apiUrl}`, request, {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      })
      .pipe(
        tap((response: any) => {
          console.log('✅ Order created on backend:', response);
          // Show notification when order is created
          const orderNumber = response?.order?.orderNumber || 'Order';
          const total = response?.order?.totalAmount || 0;
          this.notificationService.success(
            `Order #${orderNumber} placed successfully! Total: EGP ${total.toFixed(2)}`,
            '✅ Order Confirmed',
            5000,
          );
        }),
        map((response: any) => {
          // Transform backend order to frontend model
          const order = response.order || response;
          return {
            id: order._id || order.id,
            userId: order.user || userId,
            orderNumber: order.orderNumber,
            items: order.items || [],
            shippingAddress: order.shippingAddress,
            phone: order.phone,
            email: order.email,
            status: order.status,
            subtotal: order.subtotal || order.totalAmount * 0.9,
            tax: order.tax || order.totalAmount * 0.1,
            shipping: order.shipping || 0,
            total: order.totalAmount || order.total,
            paymentMethod: order.paymentMethod || 'COD',
            notes: order.notes,
            createdAt: new Date(order.createdAt),
            updatedAt: new Date(order.updatedAt),
            canCancel: true,
            canReturn: true,
            returnDeadline: new Date(Date.now() + this.RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000),
          } as Order;
        }),
        catchError((error) => {
          console.error('❌ Failed to create order:', error);
          const message = error?.error?.message || 'Failed to place order';
          this.notificationService.error(message, '❌ Order Failed', 5000);
          return throwError(() => error);
        }),
      );
  }

  getOrderById(id: string): Observable<Order | undefined> {
    return of(this.mockOrders.find((o) => o.id === id));
  }

  getUserOrders(): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}`, {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      })
      .pipe(
        tap((response: any) => {
          console.log('✅ Orders loaded:', response);
        }),
        catchError((error) => {
          console.error('❌ Failed to load orders:', error);
          this.notificationService.error('Failed to load orders');
          return of({ success: false, orders: [], data: [] });
        }),
      );
  }

  updateOrderStatus(orderId: string, status: OrderStatus): Observable<Order | undefined> {
    const order = this.mockOrders.find((o) => o.id === orderId);
    if (order) {
      order.status = status;
      order.updatedAt = new Date();

      // Update canCancel based on status
      order.canCancel = status === 'pending' || status === 'processing';

      // Show notification
      const statusMessages: { [key: string]: string } = {
        pending: '⏳ Order is pending',
        processing: '🔄 Order is being processed',
        shipped: '📦 Order has been shipped',
        ready: '✅ Order is ready for pickup',
        refused: '❌ Order has been cancelled',
      };

      this.notificationService.info(
        `Order #${order.orderNumber} - ${statusMessages[status] || `Status: ${status}`}`,
        'Order Status Updated',
        4000,
      );
    }
    return of(order);
  }

  /**
   * User: Cancel their own order
   * Can only cancel pending or processing orders
   */
  cancelOrder(orderId: string, reason?: string): Observable<any> {
    const order = this.mockOrders.find((o) => o.id === orderId);

    if (!order) {
      this.notificationService.error('Order not found');
      return of(null);
    }

    // Only allow canceling pending or processing orders
    if (order.status !== 'pending' && order.status !== 'processing') {
      this.notificationService.error(`Cannot cancel order in ${order.status} status`);
      return of(null);
    }

    order.status = 'canceled';
    order.canCancel = false;

    this.notificationService.success(`Order #${order.orderNumber} has been canceled`);
    return of(order);
  }

  /**
   * Admin: Cancel an order
   * Can only cancel pending or processing orders
   */
  adminCancelOrder(orderId: string, reason?: string): Observable<any> {
    const order = this.mockOrders.find((o) => o.id === orderId);

    if (!order) {
      this.notificationService.error('Order not found');
      return of(null);
    }

    // Only allow canceling pending or processing orders
    if (order.status !== 'pending' && order.status !== 'processing') {
      this.notificationService.error(
        'Cannot cancel ' +
          order.status +
          ' orders. Only pending or processing orders can be canceled.',
      );
      return of(null);
    }

    order.status = 'canceled';
    order.canCancel = false;
    order.updatedAt = new Date();

    this.notificationService.success(
      `Order #${order.orderNumber} has been canceled. Reason: ${reason || 'N/A'}`,
      'Order Canceled',
      5000,
    );

    return of(order);
  }

  /**
   * Admin: Change order status
   * Allowed transitions:
   * pending → processing, refused
   * processing → ready, refused
   * ready → shipped
   * shipped → received
   * received → (final state)
   */

  getAllOrders(): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/admin/all`, {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      })
      .pipe(
        catchError((error) => {
          console.error('Failed to load orders from backend:', error);
          this.notificationService.error('Failed to load orders');
          return of({ data: [] });
        }),
      );
  }

  updateOrderStatusApi(orderId: string, status: string): Observable<any> {
    return this.http
      .put<any>(
        `${this.apiUrl}/${orderId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${this.authService.getToken()}`,
          },
        },
      )
      .pipe(
        tap((response) => {
          this.notificationService.success('Order status updated');
        }),
        catchError((error) => {
          const message = error.error?.message || 'Failed to update order status';
          this.notificationService.error(message);
          throw error;
        }),
      );
  }

  getOrderSummary(): Observable<any> {
    return of({
      totalOrders: this.mockOrders.length,
      totalRevenue: this.mockOrders.reduce((sum, o) => sum + o.total, 0),
      totalProductsSold: this.mockOrders.reduce(
        (sum, o) => sum + o.items.reduce((itemSum, i) => itemSum + i.quantity, 0),
        0,
      ),
      pendingOrders: this.mockOrders.filter((o) => o.status === 'pending').length,
      processingOrders: this.mockOrders.filter((o) => o.status === 'processing').length,
      readyOrders: this.mockOrders.filter((o) => o.status === 'ready').length,
      shippedOrders: this.mockOrders.filter((o) => o.status === 'shipped').length,
    });
  }

  getDashboardStats(): Observable<any> {
    return this.http
      .get<any>('http://localhost:5000/api/admin/dashboard/stats', {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      })
      .pipe(
        catchError((error: any) => {
          console.error('Failed to load dashboard stats:', error);
          this.notificationService.error('Failed to load dashboard stats');
          return of({ success: false, stats: {} });
        }),
      );
  }

  /**
   * Get accurate revenue data based on actual prices paid (from order items)
   * This ensures reports are accurate even if product prices change later
   */
  getAccurateRevenue(): Observable<any> {
    const totalRevenue = this.mockOrders.reduce((sum, order) => {
      // Use order.total which includes exact prices paid for items
      return sum + order.total;
    }, 0);

    const revenueByStatus = this.mockOrders.reduce((acc: any, order) => {
      if (!acc[order.status]) {
        acc[order.status] = 0;
      }
      acc[order.status] += order.total;
      return acc;
    }, {});

    return of({
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      revenueByStatus,
      orderCount: this.mockOrders.length,
    });
  }

  /**
   * Verify order data integrity
   * Ensures prices stored in order items match order totals
   */
  verifyOrderIntegrity(orderId: string): Observable<any> {
    const order = this.mockOrders.find((o) => o.id === orderId);
    if (!order) {
      return of({ valid: false, message: 'Order not found' });
    }

    // Recalculate totals from items to verify integrity
    const calculatedSubtotal = parseFloat(
      order.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2),
    );

    const calculatedTax = parseFloat((calculatedSubtotal * 0.1).toFixed(2));
    const calculatedShipping = calculatedSubtotal > 100 ? 0 : 10;
    const calculatedTotal = parseFloat(
      (calculatedSubtotal + calculatedTax + calculatedShipping).toFixed(2),
    );

    const isValid =
      calculatedSubtotal === order.subtotal &&
      calculatedTax === order.tax &&
      calculatedShipping === order.shipping &&
      calculatedTotal === order.total;

    return of({
      valid: isValid,
      orderId,
      orderNumber: order.orderNumber,
      stored: {
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        total: order.total,
      },
      calculated: {
        subtotal: calculatedSubtotal,
        tax: calculatedTax,
        shipping: calculatedShipping,
        total: calculatedTotal,
      },
      message: isValid ? 'Order data is valid' : 'Order data integrity check failed',
    });
  }

  /**
   * Get order audit information including price history
   * Useful for tracking what prices were paid for items
   */
  getOrderAudit(orderId: string): Observable<any> {
    const order = this.mockOrders.find((o) => o.id === orderId);
    if (!order) {
      return of(null);
    }

    return of({
      orderId: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      status: order.status,
      items: order.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        pricePaid: item.price, // Original price when order was placed
        itemTotal: item.total,
      })),
      pricing: {
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        total: order.total,
      },
      notes: 'Prices recorded here are immutable and represent actual prices paid',
    });
  }

  /**
   * Generate sales report with accurate pricing data
   */
  generateSalesReport(startDate?: Date, endDate?: Date): Observable<any> {
    let filteredOrders = this.mockOrders;

    if (startDate && endDate) {
      filteredOrders = this.mockOrders.filter((o) => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    const report = {
      totalOrders: filteredOrders.length,
      totalRevenue: parseFloat(filteredOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2)),
      totalTax: parseFloat(filteredOrders.reduce((sum, o) => sum + o.tax, 0).toFixed(2)),
      totalShipping: parseFloat(filteredOrders.reduce((sum, o) => sum + o.shipping, 0).toFixed(2)),
      totalProductsSold: filteredOrders.reduce(
        (sum, o) => sum + o.items.reduce((itemSum, i) => itemSum + i.quantity, 0),
        0,
      ),
      averageOrderValue: parseFloat(
        (
          filteredOrders.reduce((sum, o) => sum + o.total, 0) / (filteredOrders.length || 1)
        ).toFixed(2),
      ),
      statusBreakdown: {
        pending: filteredOrders.filter((o) => o.status === 'pending').length,
        processing: filteredOrders.filter((o) => o.status === 'processing').length,
        ready: filteredOrders.filter((o) => o.status === 'ready').length,
        shipped: filteredOrders.filter((o) => o.status === 'shipped').length,
      },
      period: {
        start: startDate?.toISOString() || 'all-time',
        end: endDate?.toISOString() || 'present',
      },
    };

    return of(report);
  }

  /**
   * Check if an order is eligible for return (within 14 days)
   */
  isEligibleForReturn(order: Order): boolean {
    if (!order.returnDeadline) {
      return false;
    }
    const now = new Date();
    const deadline = new Date(order.returnDeadline);
    return now <= deadline && order.status === 'received';
  }

  /**
   * Request a return for an order
   * إمكانية استرجاع المنتج خلال 14 يوم
   */
  requestReturn(
    orderId: string,
    items: any[],
    reason: string,
    description?: string,
  ): Observable<ReturnRequest> {
    const order = this.mockOrders.find((o) => o.id === orderId);

    if (!order) {
      this.notificationService.error('Order not found');
      return of(null as any);
    }

    // Check if order is eligible for return
    if (!this.isEligibleForReturn(order)) {
      this.notificationService.error(
        'Order is not eligible for return. Return window has expired or order not received.',
      );
      return of(null as any);
    }

    // Calculate refund amount
    const refundAmount = items.reduce((sum, item) => {
      const orderItem = order.items.find((oi) => oi.id === item.orderItemId);
      if (orderItem) {
        return sum + orderItem.price * item.quantity;
      }
      return sum;
    }, 0);

    const returnRequest: ReturnRequest = {
      id: 'return-' + Date.now(),
      orderId,
      orderNumber: order.orderNumber,
      userId: order.userId,
      items: items.map((item) => {
        const orderItem = order.items.find((oi) => oi.id === item.orderItemId);
        return {
          orderItemId: item.orderItemId,
          productId: orderItem?.productId || '',
          productName: orderItem?.productName || '',
          quantity: item.quantity,
          pricePaid: orderItem?.price || 0,
          returnReason: item.reason || reason,
        };
      }),
      reason,
      description,
      status: 'requested',
      refundAmount: parseFloat(refundAmount.toFixed(2)),
      requestedAt: new Date(),
    };

    this.mockReturns.push(returnRequest);
    this.saveReturnsToStorage();

    this.notificationService.success(
      `Return request #${returnRequest.id} submitted successfully. Refund amount: EGP ${refundAmount.toFixed(2)}`,
      '✅ Return Requested',
      5000,
    );

    return of(returnRequest);
  }

  /**
   * Get all return requests
   */
  getReturnRequests(userId?: string): Observable<ReturnRequest[]> {
    let returns = this.mockReturns;

    if (userId) {
      returns = returns.filter((r) => r.userId === userId);
    }

    return of(returns);
  }

  /**
   * Get return request by ID
   */
  getReturnById(returnId: string): Observable<ReturnRequest | undefined> {
    return of(this.mockReturns.find((r) => r.id === returnId));
  }

  /**
   * Admin: Process return request (approve or reject)
   * الطلب يتراجع من السيستم من خلال الادمن
   */
  processReturn(request: ProcessReturnRequest): Observable<ReturnRequest> {
    const returnReq = this.mockReturns.find((r) => r.id === request.returnId);

    if (!returnReq) {
      this.notificationService.error('Return request not found');
      return of(null as any);
    }

    if (request.action === 'approve') {
      returnReq.status = 'approved';
      returnReq.approvedAt = new Date();

      this.notificationService.success(
        `Return request approved. Refund: EGP ${returnReq.refundAmount}. Order: ${returnReq.orderNumber}`,
        '✅ Return Approved',
        5000,
      );
    } else if (request.action === 'reject') {
      returnReq.status = 'rejected';

      this.notificationService.info(
        `Return request rejected. Order: ${returnReq.orderNumber}`,
        '❌ Return Rejected',
        4000,
      );
    }

    returnReq.notes = request.notes;
    this.saveReturnsToStorage();

    return of(returnReq);
  }

  /**
   * Complete return process (after items received)
   */
  completeReturn(returnId: string): Observable<ReturnRequest> {
    const returnReq = this.mockReturns.find((r) => r.id === returnId);

    if (!returnReq) {
      this.notificationService.error('Return request not found');
      return of(null as any);
    }

    if (returnReq.status !== 'approved') {
      this.notificationService.error('Can only complete approved returns');
      return of(null as any);
    }

    returnReq.status = 'completed';
    returnReq.completedAt = new Date();

    this.notificationService.success(
      `Return completed. Refund issued: EGP ${returnReq.refundAmount}. Order: ${returnReq.orderNumber}`,
      '✅ Return Completed',
      5000,
    );
    this.saveReturnsToStorage();

    return of(returnReq);
  }

  /**
   * Get return statistics
   */
  getReturnStats(): Observable<any> {
    const stats = {
      totalReturnRequests: this.mockReturns.length,
      requestedReturns: this.mockReturns.filter((r) => r.status === 'requested').length,
      approvedReturns: this.mockReturns.filter((r) => r.status === 'approved').length,
      rejectedReturns: this.mockReturns.filter((r) => r.status === 'rejected').length,
      completedReturns: this.mockReturns.filter((r) => r.status === 'completed').length,
      totalRefundAmount: parseFloat(
        this.mockReturns
          .filter((r) => r.status === 'completed' || r.status === 'approved')
          .reduce((sum, r) => sum + r.refundAmount, 0)
          .toFixed(2),
      ),
    };

    return of(stats);
  }

  /**
   * Admin: Get orders by status
   */
  getOrdersByStatus(status: string): Observable<Order[]> {
    return of(this.mockOrders.filter((o) => o.status === status));
  }

  /**
   * Admin: Get all orders with pagination
   */
  getOrdersWithPagination(page: number = 1, pageSize: number = 10): Observable<any> {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedOrders = this.mockOrders.slice(startIndex, endIndex);

    return of({
      orders: paginatedOrders,
      total: this.mockOrders.length,
      page,
      pageSize,
      totalPages: Math.ceil(this.mockOrders.length / pageSize),
    });
  }

  /**
   * Admin: Search orders
   */
  searchOrders(query: string): Observable<Order[]> {
    const lowerQuery = query.toLowerCase();
    return of(
      this.mockOrders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(lowerQuery) ||
          o.id.toLowerCase().includes(lowerQuery),
      ),
    );
  }

  /**
   * Admin: Get order statistics
   */
  getOrderStatistics(): Observable<any> {
    const totalOrders = this.mockOrders.length;
    const totalRevenue = this.mockOrders.reduce((sum, o) => sum + o.total, 0);
    const statusBreakdown = {
      pending: this.mockOrders.filter((o) => o.status === 'pending').length,
      processing: this.mockOrders.filter((o) => o.status === 'processing').length,
      ready: this.mockOrders.filter((o) => o.status === 'ready').length,
      shipped: this.mockOrders.filter((o) => o.status === 'shipped').length,
      received: this.mockOrders.filter((o) => o.status === 'received').length,
      refused: this.mockOrders.filter((o) => o.status === 'refused').length,
      canceled: this.mockOrders.filter((o) => o.status === 'canceled').length,
    };

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return of({
      totalOrders,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
      statusBreakdown,
      pendingOrders: statusBreakdown.pending,
      totalProductsSold: this.mockOrders.reduce(
        (sum, o) => sum + o.items.reduce((itemSum, i) => itemSum + i.quantity, 0),
        0,
      ),
    });
  }
}
