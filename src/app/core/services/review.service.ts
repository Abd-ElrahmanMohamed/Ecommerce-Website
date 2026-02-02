import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Review, CreateReviewRequest, ReviewApproval } from '../models';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private mockReviews: Review[] = [];

  private storageKey = 'mockReviews_v1';

  constructor(private notificationService: NotificationService) {
    this.loadFromStorage();
  }

  createReview(request: CreateReviewRequest, userId: string, userName: string): Observable<Review> {
    console.log('🚀 createReview() called with:', { request, userId, userName });

    const review: Review = {
      id: 'review-' + Date.now(),
      productId: request.productId,
      userId,
      userName,
      rating: request.rating,
      title: request.title,
      comment: request.comment,
      isApproved: false, // Requires admin approval
      createdAt: new Date(),
      updatedAt: new Date(),
      verifiedPurchase: true,
      helpful: 0,
      notHelpful: 0,
    };

    console.log('✅ Creating new review:', review);
    this.mockReviews.push(review);
    this.saveToStorage();
    console.log('📊 Total reviews after push:', this.mockReviews.length);
    console.log('📋 mockReviews array:', this.mockReviews);
    console.log('⚠️ isApproved status:', review.isApproved, '(Should be FALSE for pending)');
    return of(review);
  }

  getProductReviews(productId: string): Observable<Review[]> {
    return of(this.mockReviews.filter((r) => r.productId === productId && r.isApproved));
  }

  getAllReviews(): Observable<Review[]> {
    console.log('🔍 getAllReviews() called');
    console.log('📊 Total reviews in mockReviews:', this.mockReviews.length);
    console.log('📋 Reviews data:', this.mockReviews);
    return of(this.mockReviews);
  }

  approveReview(reviewId: string): Observable<Review | undefined> {
    const review = this.mockReviews.find((r) => r.id === reviewId);
    if (review) {
      review.isApproved = true;
      review.updatedAt = new Date();
      this.saveToStorage();
    }
    return of(review);
  }

  rejectReview(reviewId: string): Observable<void> {
    this.mockReviews = this.mockReviews.filter((r) => r.id !== reviewId);
    this.saveToStorage();
    return of();
  }

  markHelpful(reviewId: string, helpful: boolean): Observable<Review | undefined> {
    const review = this.mockReviews.find((r) => r.id === reviewId);
    if (review) {
      if (helpful) {
        review.helpful++;
      } else {
        review.notHelpful++;
      }
      this.saveToStorage();
    }
    return of(review);
  }

  // Admin Methods
  getPendingReviews(): Observable<Review[]> {
    return of(this.mockReviews.filter((r) => !r.isApproved));
  }

  getApprovedReviews(): Observable<Review[]> {
    return of(this.mockReviews.filter((r) => r.isApproved));
  }

  rejectReviewWithReason(reviewId: string, reason: string): Observable<void> {
    this.mockReviews = this.mockReviews.filter((r) => r.id !== reviewId);
    this.saveToStorage();
    this.notificationService.error(`Review rejected: ${reason}`, 'Review Rejected');
    return of();
  }

  getReviewStats(): Observable<any> {
    const totalReviews = this.mockReviews.length;
    const approvedReviews = this.mockReviews.filter((r) => r.isApproved).length;
    const pendingReviews = this.mockReviews.filter((r) => !r.isApproved).length;
    const averageRating =
      this.mockReviews.length > 0
        ? this.mockReviews.reduce((sum, r) => sum + r.rating, 0) / this.mockReviews.length
        : 0;

    const ratingDistribution = {
      5: this.mockReviews.filter((r) => r.rating === 5).length,
      4: this.mockReviews.filter((r) => r.rating === 4).length,
      3: this.mockReviews.filter((r) => r.rating === 3).length,
      2: this.mockReviews.filter((r) => r.rating === 2).length,
      1: this.mockReviews.filter((r) => r.rating === 1).length,
    };

    return of({
      totalReviews,
      approvedReviews,
      pendingReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
    });
  }

  getProductAverageRating(productId: string): Observable<number> {
    const productReviews = this.mockReviews.filter(
      (r) => r.productId === productId && r.isApproved,
    );
    if (productReviews.length === 0) {
      return of(0);
    }
    const average = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
    return of(Math.round(average * 10) / 10);
  }

  getReviewsWithStats(productId?: string): Observable<any[]> {
    let reviews = this.mockReviews;
    if (productId) {
      reviews = reviews.filter((r) => r.productId === productId);
    }

    return of(
      reviews.map((r) => ({
        ...r,
        helpfulPercentage:
          r.helpful + r.notHelpful > 0
            ? Math.round((r.helpful / (r.helpful + r.notHelpful)) * 100)
            : 0,
      })),
    );
  }

  bulkApproveReviews(reviewIds: string[]): Observable<Review[]> {
    const approved: Review[] = [];
    reviewIds.forEach((id) => {
      const review = this.mockReviews.find((r) => r.id === id);
      if (review) {
        review.isApproved = true;
        review.updatedAt = new Date();
        approved.push(review);
      }
    });
    this.saveToStorage();
    return of(approved);
  }

  bulkRejectReviews(reviewIds: string[]): Observable<void> {
    this.mockReviews = this.mockReviews.filter((r) => !reviewIds.includes(r.id));
    this.saveToStorage();
    return of();
  }

  updateReviewVisibility(reviewId: string, isApproved: boolean): Observable<Review | undefined> {
    const review = this.mockReviews.find((r) => r.id === reviewId);
    if (review) {
      review.isApproved = isApproved;
      review.updatedAt = new Date();
      this.saveToStorage();
    }
    return of(review);
  }

  // Persistence helpers so mock data is shared across browser tabs/sessions
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.mockReviews));
      console.log('💾 Reviews saved to localStorage');
    } catch (e) {
      console.warn('Could not save reviews to localStorage', e);
    }
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as any[];
        // Convert date strings back to Date objects
        this.mockReviews = parsed.map((r) => ({
          ...r,
          createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
          updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
        }));
        console.log('📥 Reviews loaded from localStorage:', this.mockReviews.length);
      }
    } catch (e) {
      console.warn('Could not load reviews from localStorage', e);
    }
  }
}
