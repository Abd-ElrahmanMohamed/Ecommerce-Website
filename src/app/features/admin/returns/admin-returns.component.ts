import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { OrderService } from '../../../core/services/order.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-returns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">
      <div class="header">
        <h2>📦 Returns Management</h2>
        <div class="stats">
          <div class="stat-card">
            <span class="stat-label">Total Returns</span>
            <span class="stat-value">{{ stats.totalReturns }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Pending</span>
            <span class="stat-value pending">{{ stats.pendingReturns }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Approved</span>
            <span class="stat-value approved">{{ stats.approvedReturns }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Rejected</span>
            <span class="stat-value rejected">{{ stats.rejectedReturns }}</span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button
          [class.active]="activeTab === 'pending'"
          (click)="activeTab = 'pending'"
          class="tab"
        >
          Pending ({{ stats.pendingReturns }})
        </button>
        <button
          [class.active]="activeTab === 'approved'"
          (click)="activeTab = 'approved'"
          class="tab"
        >
          Approved ({{ stats.approvedReturns }})
        </button>
        <button
          [class.active]="activeTab === 'rejected'"
          (click)="activeTab = 'rejected'"
          class="tab"
        >
          Rejected ({{ stats.rejectedReturns }})
        </button>
        <button
          [class.active]="activeTab === 'processed'"
          (click)="activeTab = 'processed'"
          class="tab"
        >
          Processed ({{ stats.processedReturns }})
        </button>
      </div>

      <!-- Returns Table -->
      <div class="table-wrapper">
        <table class="table" *ngIf="filteredReturns.length > 0">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let ret of filteredReturns" [class]="'status-' + ret.status">
              <td class="order-id">
                <strong>{{ ret.orderNumber }}</strong>
              </td>
              <td class="customer">{{ ret.customerName }}</td>
              <td class="date">{{ ret.createdAt | date: 'short' }}</td>
              <td class="reason">
                <span class="reason-badge">{{ ret.reason }}</span>
                <div *ngIf="ret.notes" style="margin-top:6px; font-size:12px; color:#666;">
                  Reason: {{ ret.notes }}
                </div>
              </td>
              <td class="status">
                <span [ngClass]="'badge-' + ret.status">{{ ret.status | uppercase }}</span>
              </td>
              <td class="actions">
                <select
                  [(ngModel)]="ret.status"
                  class="status-select"
                  *ngIf="ret.status === 'pending'"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approve</option>
                  <option value="rejected">Reject</option>
                </select>

                <!-- If admin chose to reject, allow entering a rejection reason before updating -->
                <div *ngIf="ret.status === 'rejected'" style="margin-top:8px">
                  <textarea
                    [(ngModel)]="ret.rejectionReason"
                    placeholder="Add rejection reason (visible to customer)"
                    rows="2"
                    style="width:100%; padding:6px; border:1px solid #ddd; border-radius:4px; font-size:12px"
                  ></textarea>
                </div>

                <button
                  (click)="updateReturnStatus(ret)"
                  class="btn btn-update"
                  *ngIf="ret.status === 'pending' || ret.status === 'rejected'"
                >
                  Update
                </button>
                <button
                  (click)="markAsProcessed(ret)"
                  class="btn btn-process"
                  *ngIf="ret.status === 'approved'"
                >
                  Mark Processed
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div *ngIf="filteredReturns.length === 0" class="empty-state">
          <p>No returns in this category</p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .admin-container {
        padding: 20px;
        background: #f5f5f5;
      }

      .header {
        margin-bottom: 30px;
      }

      .header h2 {
        margin-bottom: 20px;
        color: #333;
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 15px;
      }

      .stat-card {
        background: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        text-align: center;
      }

      .stat-label {
        display: block;
        color: #666;
        font-size: 12px;
        font-weight: bold;
        margin-bottom: 8px;
        text-transform: uppercase;
      }

      .stat-value {
        display: block;
        font-size: 24px;
        font-weight: bold;
        color: #007bff;
      }

      .stat-value.pending {
        color: #ff9800;
      }

      .stat-value.approved {
        color: #4caf50;
      }

      .stat-value.rejected {
        color: #f44336;
      }

      .tabs {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        border-bottom: 1px solid #ddd;
      }

      .tab {
        padding: 12px 20px;
        border: none;
        background: transparent;
        cursor: pointer;
        color: #666;
        font-weight: 600;
        border-bottom: 3px solid transparent;
        transition: all 0.3s ease;
      }

      .tab.active {
        border-bottom-color: #007bff;
        color: #007bff;
      }

      .table-wrapper {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        overflow-x: auto;
      }

      .table {
        width: 100%;
        border-collapse: collapse;
      }

      .table th {
        background: #f8f9fa;
        padding: 12px;
        text-align: left;
        font-weight: bold;
        border-bottom: 2px solid #ddd;
      }

      .table td {
        padding: 12px;
        border-bottom: 1px solid #ddd;
      }

      .table tr:hover {
        background: #f9f9f9;
      }

      .reason-badge {
        display: inline-block;
        background: #e3f2fd;
        color: #1976d2;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
      }

      .badge-pending {
        background: #fff3e0;
        color: #f57c00;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
      }

      .badge-approved {
        background: #e8f5e9;
        color: #2e7d32;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
      }

      .badge-rejected {
        background: #ffebee;
        color: #c62828;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
      }

      .badge-processed {
        background: #f3e5f5;
        color: #6a1b9a;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
      }

      .status-select {
        padding: 6px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 12px;
        margin-right: 8px;
      }

      .btn {
        padding: 8px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.3s ease;
        margin-right: 5px;
      }

      .btn-update {
        background: #2196f3;
        color: white;
      }

      .btn-update:hover {
        background: #1976d2;
      }

      .btn-process {
        background: #4caf50;
        color: white;
      }

      .btn-process:hover {
        background: #45a049;
      }

      .empty-state {
        padding: 40px;
        text-align: center;
        color: #666;
      }

      .status-pending {
        background: #fffde7;
      }

      .status-approved {
        background: #f0f4c3;
      }

      .status-rejected {
        background: #ffcdd2;
      }

      .status-processed {
        background: #c8e6c9;
      }
    `,
  ],
})
export class AdminReturnsComponent implements OnInit {
  activeTab = 'pending';
  returns: any[] = [];
  stats = {
    totalReturns: 0,
    pendingReturns: 0,
    approvedReturns: 0,
    rejectedReturns: 0,
    processedReturns: 0,
  };

  get filteredReturns(): any[] {
    return this.returns.filter((r) => r.status === this.activeTab);
  }

  private storageListener: any;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private orderService: OrderService,
  ) {
    this.checkAdminAccess();
    // Listen to storage changes so admin view refreshes when returns are created in another tab
    this.storageListener = (e: StorageEvent) => {
      if (e.key === 'mockReturns_v1') {
        console.log('🔁 Returns storage changed, reloading returns...');
        this.loadReturns();
      }
    };
    window.addEventListener('storage', this.storageListener);
  }

  ngOnInit(): void {
    this.loadReturns();
  }

  checkAdminAccess(): void {
    const user = this.authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      this.router.navigate(['/']);
    }
  }

  loadReturns(): void {
    // Load returns from OrderService (persistent mock or backend)
    this.orderService.getReturnRequests().subscribe(
      (returns: any[]) => {
        // Normalize fields for UI (backwards-compatible with earlier mock shape)
        this.returns = returns.map((r) => {
          // Normalize status values between service and UI
          const rawStatus = (r.status || '').toString().toLowerCase();
          let normalizedStatus = rawStatus;
          if (rawStatus === 'requested') normalizedStatus = 'pending';
          if (rawStatus === 'completed') normalizedStatus = 'processed';

          return {
            _id: r.id || r._id,
            orderNumber: r.orderNumber || r.orderNumber,
            customerName: r.customerName || r.userId || 'Customer',
            reason: r.reason,
            status: normalizedStatus || 'pending',
            createdAt: r.requestedAt || r.createdAt || new Date(),
            notes: r.notes || r.description || undefined,
          };
        });

        // Load stats separately
        this.orderService.getReturnStats().subscribe(
          (s: any) => {
            this.stats.totalReturns = s.totalReturnRequests || 0;
            this.stats.pendingReturns = s.requestedReturns || 0;
            this.stats.approvedReturns = s.approvedReturns || 0;
            this.stats.rejectedReturns = s.rejectedReturns || 0;
            this.stats.processedReturns = s.completedReturns || 0;
          },
          (err) => {
            console.warn('Failed to load return stats', err);
            this.calculateStats();
          },
        );
      },
      (error) => {
        console.error('Failed to load returns from service', error);
        this.returns = [];
        this.calculateStats();
      },
    );
  }

  calculateStats(): void {
    this.stats.totalReturns = this.returns.length;
    this.stats.pendingReturns = this.returns.filter((r) => r.status === 'pending').length;
    this.stats.approvedReturns = this.returns.filter((r) => r.status === 'approved').length;
    this.stats.rejectedReturns = this.returns.filter((r) => r.status === 'rejected').length;
    this.stats.processedReturns = this.returns.filter((r) => r.status === 'processed').length;
  }

  updateReturnStatus(returnItem: any): void {
    // Approve or reject via OrderService
    if (!returnItem || !returnItem._id) {
      this.notificationService.error('Invalid return item', 'Error');
      return;
    }

    const action = returnItem.status === 'approved' ? 'approve' : 'reject';

    const notes = returnItem.rejectionReason || returnItem.notes || undefined;

    this.orderService
      .processReturn({ returnId: returnItem._id, action: action as any, notes })
      .subscribe(
        (res: any) => {
          this.notificationService.success(`Return ${action}d successfully`, 'Success');
          this.loadReturns();
        },
        (err) => {
          console.error('Failed to process return', err);
          this.notificationService.error('Failed to update return', 'Error');
        },
      );
  }

  markAsProcessed(returnItem: any): void {
    if (!returnItem || !returnItem._id) {
      this.notificationService.error('Invalid return item', 'Error');
      return;
    }

    this.orderService.completeReturn(returnItem._id).subscribe(
      (res: any) => {
        this.notificationService.success('Return marked as processed', 'Success');
        this.loadReturns();
      },
      (err) => {
        console.error('Failed to complete return', err);
        this.notificationService.error('Failed to mark return as processed', 'Error');
      },
    );
  }

  ngOnDestroy(): void {
    if (this.storageListener) {
      window.removeEventListener('storage', this.storageListener);
    }
  }
}
