import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../../core/services/review.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Router } from '@angular/router';
import { Review } from '../../../core/models';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">
      <div class="header">
        <div
          style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;"
        >
          <h2>Reviews Management</h2>
          <button
            (click)="loadReviews(); loadStats()"
            style="background: #007bff; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 600;"
            title="Refresh reviews (Auto-refreshes every 3 seconds)"
          >
            🔄 Refresh
          </button>
        </div>
        <div class="stats">
          <div class="stat-card">
            <span class="stat-label">Total Reviews</span>
            <span class="stat-value">{{ stats.totalReviews }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Pending</span>
            <span class="stat-value pending">{{ stats.pendingReviews }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Approved</span>
            <span class="stat-value approved">{{ stats.approvedReviews }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Avg Rating</span>
            <span class="stat-value">{{ stats.averageRating }} ⭐</span>
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
          Pending Reviews ({{ stats.pendingReviews }})
        </button>
        <button
          [class.active]="activeTab === 'approved'"
          (click)="activeTab = 'approved'"
          class="tab"
        >
          Approved Reviews ({{ stats.approvedReviews }})
        </button>
      </div>

      <!-- Pending Reviews Table -->
      <div *ngIf="activeTab === 'pending'" class="table-wrapper">
        <table class="table" *ngIf="pendingReviews.length > 0">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Rating</th>
              <th>Title</th>
              <th>Comment</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let review of pendingReviews" class="pending-row">
              <td class="customer">{{ review.userName }}</td>
              <td class="rating">
                <span class="stars">{{ getStars(review.rating) }}</span>
              </td>
              <td class="title">{{ review.title }}</td>
              <td class="comment">{{ review.comment }}</td>
              <td class="date">{{ review.createdAt | date: 'short' }}</td>
              <td class="actions">
                <button
                  (click)="approveReview(review)"
                  class="btn btn-approve"
                  title="Approve Review"
                >
                  ✓ Approve
                </button>
                <button (click)="rejectReview(review)" class="btn btn-reject" title="Reject Review">
                  ✕ Reject
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div *ngIf="pendingReviews.length === 0" class="empty-state">
          <p>✓ No pending reviews. All reviews have been moderated!</p>
        </div>
      </div>

      <!-- Approved Reviews Table -->
      <div *ngIf="activeTab === 'approved'" class="table-wrapper">
        <table class="table" *ngIf="approvedReviews.length > 0">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Rating</th>
              <th>Title</th>
              <th>Comment</th>
              <th>Date</th>
              <th>Helpful</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let review of approvedReviews" class="approved-row">
              <td class="customer">{{ review.userName }}</td>
              <td class="rating">
                <span class="stars">{{ getStars(review.rating) }}</span>
              </td>
              <td class="title">{{ review.title }}</td>
              <td class="comment">{{ review.comment }}</td>
              <td class="date">{{ review.createdAt | date: 'short' }}</td>
              <td class="helpful">
                <span class="helpful-count">
                  👍 {{ review.helpful }} / 👎 {{ review.notHelpful }}
                </span>
              </td>
              <td class="actions">
                <button (click)="rejectReview(review)" class="btn btn-remove" title="Remove Review">
                  🗑 Remove
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div *ngIf="approvedReviews.length === 0" class="empty-state">
          <p>No approved reviews yet</p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .admin-container {
        padding: 20px;
        background: #f5f5f5;
        border-radius: 8px;
      }

      .header {
        margin-bottom: 30px;
      }

      .header h2 {
        margin-bottom: 20px;
        color: #333;
        font-size: 24px;
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
      }

      .stat-card {
        background: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      .stat-label {
        color: #666;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .stat-value {
        color: #333;
        font-size: 24px;
        font-weight: bold;
      }

      .stat-value.pending {
        color: #ff9800;
      }

      .stat-value.approved {
        color: #28a745;
      }

      .tabs {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        border-bottom: 2px solid #ddd;
      }

      .tab {
        padding: 10px 20px;
        background: none;
        border: none;
        border-bottom: 3px solid transparent;
        cursor: pointer;
        font-weight: 600;
        color: #666;
        transition: all 0.3s ease;
      }

      .tab.active {
        color: #007bff;
        border-bottom-color: #007bff;
      }

      .tab:hover {
        color: #007bff;
      }

      .table-wrapper {
        overflow-x: auto;
      }

      .table {
        width: 100%;
        background: white;
        border-collapse: collapse;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .table th,
      .table td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #ddd;
      }

      .table th {
        background: #f8f9fa;
        font-weight: 600;
        color: #333;
        position: sticky;
        top: 0;
      }

      .table tr:hover {
        background: #f9f9f9;
      }

      .pending-row {
        border-left: 4px solid #ff9800;
      }

      .approved-row {
        border-left: 4px solid #28a745;
      }

      .customer {
        font-weight: 600;
        color: #333;
      }

      .rating {
        font-weight: bold;
      }

      .stars {
        color: #ff9800;
        font-size: 14px;
      }

      .title {
        font-weight: 600;
        max-width: 200px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .comment {
        max-width: 250px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: #666;
      }

      .date {
        font-size: 12px;
        color: #999;
      }

      .helpful {
        font-size: 12px;
      }

      .helpful-count {
        background: #f0f0f0;
        padding: 4px 8px;
        border-radius: 4px;
        display: inline-block;
      }

      .actions {
        display: flex;
        gap: 5px;
      }

      .btn {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.3s ease;
        white-space: nowrap;
      }

      .btn-approve {
        background: #28a745;
        color: white;
      }

      .btn-approve:hover {
        background: #218838;
      }

      .btn-reject {
        background: #dc3545;
        color: white;
      }

      .btn-reject:hover {
        background: #c82333;
      }

      .btn-remove {
        background: #6c757d;
        color: white;
      }

      .btn-remove:hover {
        background: #5a6268;
      }

      .empty-state {
        text-align: center;
        padding: 40px;
        color: #666;
        background: white;
        border-radius: 8px;
        font-size: 16px;
      }

      @media (max-width: 768px) {
        .stats {
          grid-template-columns: repeat(2, 1fr);
        }

        .table {
          font-size: 12px;
        }

        .table th,
        .table td {
          padding: 8px;
        }

        .comment {
          display: none;
        }

        .title {
          max-width: 100px;
        }

        .btn {
          padding: 4px 8px;
          font-size: 10px;
        }
      }
    `,
  ],
})
export class AdminReviewsComponent implements OnInit {
  reviews: Review[] = [];
  pendingReviews: Review[] = [];
  approvedReviews: Review[] = [];
  activeTab: 'pending' | 'approved' = 'pending';

  stats = {
    totalReviews: 0,
    pendingReviews: 0,
    approvedReviews: 0,
    averageRating: 0,
  };

  constructor(
    private reviewService: ReviewService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
  ) {
    this.checkAdminAccess();
  }

  ngOnInit() {
    this.loadReviews();
    this.loadStats();

    // Auto-refresh reviews every 3 seconds to catch new submissions
    setInterval(() => {
      console.log('🔄 Auto-refreshing reviews...');
      this.loadReviews();
      this.loadStats();
    }, 3000);
  }

  checkAdminAccess() {
    const user = this.authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      this.router.navigate(['/']);
    }
  }

  loadReviews() {
    console.log('🔄 loadReviews() called');
    this.reviewService.getAllReviews().subscribe(
      (reviews: Review[]) => {
        console.log('📥 Loaded reviews from service:', reviews);
        console.log('📊 Total reviews count:', reviews.length);

        this.reviews = reviews;
        this.pendingReviews = reviews.filter((r) => {
          console.log(`🔍 Checking review ${r.id}: isApproved=${r.isApproved}`);
          return !r.isApproved;
        });
        this.approvedReviews = reviews.filter((r) => r.isApproved);

        console.log('✅ Pending reviews:', this.pendingReviews.length);
        console.log('✅ Pending reviews data:', this.pendingReviews);
        console.log('✅ Approved reviews:', this.approvedReviews.length);
      },
      (error: any) => {
        console.error('Failed to load reviews:', error);
        this.notificationService.error('Failed to load reviews', 'Error');
      },
    );
  }

  loadStats() {
    this.reviewService.getReviewStats().subscribe(
      (stats: any) => {
        this.stats = stats;
      },
      (error: any) => {
        console.error('Failed to load stats:', error);
      },
    );
  }

  approveReview(review: Review) {
    this.reviewService.approveReview(review.id).subscribe(
      () => {
        this.notificationService.success(
          `Review from "${review.userName}" approved!`,
          'Review Approved',
        );
        this.loadReviews();
        this.loadStats();
      },
      (error: any) => {
        this.notificationService.error('Failed to approve review', 'Error');
      },
    );
  }

  rejectReview(review: Review) {
    if (confirm(`Are you sure you want to reject this review from "${review.userName}"?`)) {
      this.reviewService.rejectReview(review.id).subscribe(
        () => {
          this.notificationService.success(
            `Review from "${review.userName}" rejected`,
            'Review Rejected',
          );
          this.loadReviews();
          this.loadStats();
        },
        (error: any) => {
          this.notificationService.error('Failed to reject review', 'Error');
        },
      );
    }
  }

  getStars(rating: number): string {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  }
}
