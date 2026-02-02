import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header.component';
import { FooterComponent } from '../../shared/components/footer.component';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { NotificationService } from '../../core/services/notification.service';
import { ReviewService } from '../../core/services/review.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>

    <div class="product-details-container">
      <div *ngIf="product">
        <div class="breadcrumb"><a routerLink="/products">Products</a> / {{ product.name }}</div>

        <div class="product-details">
          <!-- Product Image -->
          <div class="product-image-section">
            <div class="main-image">
              <img
                *ngIf="getProductImage(product)"
                [src]="getProductImage(product)"
                [alt]="product.name"
              />
              <div *ngIf="!getProductImage(product)" class="no-image">No Image Available</div>
            </div>
          </div>

          <!-- Product Info -->
          <div class="product-info-section">
            <h1>{{ product.name }}</h1>

            <div class="rating">
              <span class="stars">⭐⭐⭐⭐⭐</span>
              <span class="rating-text">({{ product.reviewCount }} reviews)</span>
            </div>

            <div class="price">
              <span class="current-price">EGP {{ product.price | number: '1.2-2' }}</span>
            </div>

            <p class="description">{{ product.description }}</p>

            <!-- Stock Status with Smart Display -->
            <div class="stock-info">
              <div class="status-badge" [ngClass]="getStockStatusClass(product.stock)">
                {{ getStockStatus(product.stock) }}
              </div>
              <div *ngIf="product.stock > 0 && product.stock <= 3" class="low-stock-warning">
                ⚠️ Only {{ product.stock }} left in stock!
              </div>
            </div>

            <div class="quantity-selector">
              <label>Quantity:</label>
              <input
                type="number"
                [(ngModel)]="quantity"
                min="1"
                [max]="product.stock"
                [disabled]="product.stock === 0"
              />
            </div>

            <div class="actions">
              <button
                (click)="addToCart()"
                class="btn btn-primary"
                [disabled]="product.stock === 0 || isAddingToCart"
              >
                {{
                  isAddingToCart
                    ? 'Adding...'
                    : product.stock === 0
                      ? 'Out of Stock'
                      : 'Add to Cart'
                }}
              </button>
              <button class="btn btn-secondary" [disabled]="product.stock === 0">
                Add to Wishlist
              </button>
            </div>

            <div class="product-meta">
              <div class="meta-item">
                <strong>Category:</strong> {{ product.category?.name || 'N/A' }}
              </div>
              <div class="meta-item"><strong>SKU:</strong> {{ product._id }}</div>
              <div class="meta-item">
                <strong>Status:</strong>
                <span [ngClass]="getStockStatusClass(product.stock)">
                  {{ getStockStatus(product.stock) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Reviews Section -->
        <div class="reviews-section">
          <h2>Customer Reviews</h2>

          <!-- Review Submission Form -->
          <div class="review-form-section" *ngIf="isLoggedIn">
            <h3>Write a Review</h3>
            <form (ngSubmit)="submitReview()" class="review-form">
              <div class="form-group">
                <label>Rating:</label>
                <div class="rating-selector">
                  <span
                    *ngFor="let i of [1, 2, 3, 4, 5]"
                    (click)="newReview.rating = i"
                    [class.selected]="newReview.rating >= i"
                    class="star"
                  >
                    ⭐
                  </span>
                </div>
              </div>

              <div class="form-group">
                <label for="title">Review Title:</label>
                <input
                  id="title"
                  type="text"
                  [(ngModel)]="newReview.title"
                  name="title"
                  placeholder="Brief title for your review"
                  required
                  maxlength="100"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="comment">Your Review:</label>
                <textarea
                  id="comment"
                  [(ngModel)]="newReview.comment"
                  name="comment"
                  placeholder="Share your experience with this product"
                  required
                  minlength="20"
                  maxlength="1000"
                  rows="5"
                  class="form-textarea"
                ></textarea>
                <small>{{ newReview.comment.length }}/1000</small>
              </div>

              <button type="submit" class="btn btn-submit" [disabled]="!canSubmitReview()">
                Submit Review for Approval
              </button>
              <p class="review-note">
                ℹ️ Your review will appear after admin approval to maintain quality standards.
              </p>
            </form>
          </div>

          <div *ngIf="!isLoggedIn" class="login-prompt">
            <p>
              <a routerLink="/auth/login">Login</a> to write a review and share your experience!
            </p>
          </div>

          <!-- Reviews List -->
          <div *ngIf="reviews.length > 0" class="reviews-list">
            <h3>Approved Reviews</h3>
            <div *ngFor="let review of reviews" class="review-item">
              <div class="review-header">
                <div class="reviewer-info">
                  <strong>{{ review.userName }}</strong>
                  <span class="verified-badge" *ngIf="review.verifiedPurchase"
                    >✓ Verified Purchase</span
                  >
                </div>
                <span class="rating">{{ getStars(review.rating) }}</span>
              </div>
              <p class="review-title">
                <strong>{{ review.title }}</strong>
              </p>
              <p>{{ review.comment }}</p>
              <div class="review-footer">
                <span class="date">{{ review.createdAt | date: 'short' }}</span>
                <div class="helpful-buttons">
                  <button class="helpful-btn" (click)="markHelpful(review.id, true)">
                    👍 Helpful ({{ review.helpful }})
                  </button>
                  <button class="helpful-btn" (click)="markHelpful(review.id, false)">
                    👎 Not Helpful ({{ review.notHelpful }})
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="reviews.length === 0" class="no-reviews">
            <p>No approved reviews yet. Be the first to review!</p>
          </div>
        </div>
      </div>

      <div *ngIf="!product" class="loading">Loading product details...</div>
    </div>

    <app-footer></app-footer>
  `,
  styles: [
    `
      .product-details-container {
        max-width: 1200px;
        margin: 40px auto;
        padding: 0 20px;
      }

      .breadcrumb {
        margin-bottom: 20px;
        font-size: 14px;
        color: #666;
      }

      .breadcrumb a {
        color: #007bff;
        text-decoration: none;
      }

      .product-details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 40px;
        background: white;
        padding: 30px;
        border-radius: 8px;
        margin-bottom: 40px;
      }

      .product-image-section {
        text-align: center;
      }

      .main-image {
        width: 100%;
        max-width: 500px;
        margin: 0 auto;
      }

      .main-image img {
        width: 100%;
        height: auto;
        border-radius: 8px;
      }

      .no-image {
        width: 100%;
        height: 400px;
        background: #f0f0f0;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        color: #999;
      }

      .product-info-section h1 {
        margin: 0 0 20px 0;
        font-size: 32px;
      }

      .rating {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;
      }

      .stars {
        font-size: 20px;
      }

      .rating-text {
        color: #666;
        font-size: 14px;
      }

      .price {
        font-size: 28px;
        color: #007bff;
        font-weight: bold;
        margin-bottom: 20px;
      }

      .description {
        color: #666;
        line-height: 1.6;
        margin-bottom: 30px;
      }

      .stock-info {
        margin-bottom: 25px;
      }

      .status-badge {
        display: inline-block;
        padding: 10px 20px;
        border-radius: 20px;
        font-weight: bold;
        font-size: 14px;
        margin-bottom: 10px;
      }

      .status-badge.in-stock {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }

      .status-badge.out-of-stock {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }

      .low-stock-warning {
        color: #ff9800;
        font-weight: 600;
        font-size: 14px;
        padding: 10px;
        background-color: #fff3cd;
        border-left: 4px solid #ff9800;
        border-radius: 4px;
      }

      .quantity-selector {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;
      }

      .quantity-selector label {
        font-weight: 600;
      }

      .quantity-selector input {
        width: 70px;
        padding: 10px;
        border: 2px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        transition: border-color 0.3s;
      }

      .quantity-selector input:focus {
        outline: none;
        border-color: #007bff;
      }

      .quantity-selector input:disabled {
        background-color: #f0f0f0;
        cursor: not-allowed;
      }

      .actions {
        display: flex;
        gap: 10px;
        margin-bottom: 30px;
      }

      .btn {
        flex: 1;
        padding: 14px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        transition: all 0.3s ease;
      }

      .btn-primary {
        background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 123, 255, 0.3);
      }

      .btn-primary:disabled {
        background: #ccc;
        cursor: not-allowed;
      }

      .btn-secondary {
        background: #6c757d;
        color: white;
      }

      .btn-secondary:hover:not(:disabled) {
        background: #5a6268;
        transform: translateY(-2px);
      }

      .btn-secondary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .product-meta {
        border-top: 2px solid #eee;
        padding-top: 25px;
        margin-top: 30px;
      }

      .meta-item {
        padding: 12px 0;
        font-size: 14px;
        display: flex;
        justify-content: space-between;
      }

      .meta-item strong {
        color: #333;
      }

      .meta-item .in-stock {
        color: #28a745;
        font-weight: 600;
      }

      .meta-item .out-of-stock {
        color: #dc3545;
        font-weight: 600;
      }

      .reviews-section {
        background: white;
        padding: 30px;
        border-radius: 8px;
      }

      .reviews-section h2 {
        margin: 0 0 30px 0;
        font-size: 24px;
      }

      .reviews-section h3 {
        margin: 30px 0 20px 0;
        font-size: 18px;
      }

      .review-form-section {
        background: #f9f9f9;
        padding: 25px;
        border-radius: 8px;
        border-left: 4px solid #007bff;
        margin-bottom: 40px;
      }

      .review-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .form-group label {
        font-weight: 600;
        color: #333;
      }

      .rating-selector {
        display: flex;
        gap: 10px;
      }

      .star {
        font-size: 32px;
        cursor: pointer;
        opacity: 0.3;
        transition: opacity 0.2s ease;
      }

      .star.selected {
        opacity: 1;
      }

      .star:hover {
        opacity: 0.6;
      }

      .form-input,
      .form-textarea {
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 14px;
        font-family: inherit;
      }

      .form-input:focus,
      .form-textarea:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
      }

      .form-textarea {
        resize: vertical;
      }

      .form-group small {
        color: #999;
        font-size: 12px;
        text-align: right;
      }

      .btn-submit {
        padding: 12px 24px;
        background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
        transition: all 0.3s ease;
      }

      .btn-submit:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 123, 255, 0.3);
      }

      .btn-submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .review-note {
        font-size: 13px;
        color: #666;
        margin: 10px 0 0 0;
        padding: 10px;
        background: #fff3cd;
        border-radius: 4px;
        border-left: 3px solid #ff9800;
      }

      .login-prompt {
        background: #e7f3ff;
        padding: 20px;
        border-radius: 8px;
        border-left: 4px solid #007bff;
        margin-bottom: 30px;
        text-align: center;
      }

      .login-prompt a {
        color: #007bff;
        font-weight: 600;
        text-decoration: none;
      }

      .login-prompt a:hover {
        text-decoration: underline;
      }

      .reviews-list {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .review-item {
        padding: 20px;
        background: #f9f9f9;
        border-radius: 8px;
        border-left: 4px solid #28a745;
      }

      .review-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }

      .reviewer-info {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      .reviewer-info strong {
        color: #333;
      }

      .verified-badge {
        font-size: 12px;
        color: #28a745;
        font-weight: 600;
      }

      .review-header .rating {
        color: #ff9800;
        font-weight: bold;
      }

      .review-title {
        margin: 12px 0 8px 0;
        font-weight: 600;
        color: #333;
      }

      .review-item p {
        margin: 0 0 15px 0;
        color: #666;
        line-height: 1.6;
      }

      .review-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid #ddd;
        padding-top: 12px;
        font-size: 13px;
      }

      .date {
        color: #999;
      }

      .helpful-buttons {
        display: flex;
        gap: 10px;
      }

      .helpful-btn {
        padding: 6px 12px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s ease;
      }

      .helpful-btn:hover {
        background: #f0f0f0;
        border-color: #999;
      }

      .no-reviews {
        text-align: center;
        padding: 40px;
        color: #666;
      }

      .loading {
        text-align: center;
        padding: 40px;
      }

      @media (max-width: 768px) {
        .product-details {
          grid-template-columns: 1fr;
          gap: 20px;
        }
      }
    `,
  ],
})
export class ProductDetailsComponent implements OnInit {
  product: any = null;
  reviews: any[] = [];
  quantity = 1;
  isLoggedIn = false;
  isAddingToCart = false; // Prevent duplicate requests

  newReview = {
    rating: 5,
    title: '',
    comment: '',
  };

  // Product details component for single product view
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private notificationService: NotificationService,
    private reviewService: ReviewService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.checkLoginStatus();
    this.route.params.subscribe((params) => {
      if (params['slug']) {
        this.loadProduct(params['slug']);
        this.loadReviews(params['slug']);
      }
    });
  }

  checkLoginStatus() {
    const user = this.authService.getCurrentUser();
    this.isLoggedIn = !!user;
  }

  loadProduct(slug: string) {
    this.productService.getProductBySlug(slug).subscribe(
      (response: any) => {
        this.product = response.product || response;
      },
      (error: any) => {
        console.error('Failed to load product:', error);
        this.notificationService.error('Product not found', 'Error');
        this.router.navigate(['/products']);
      },
    );
  }

  loadReviews(productId: string) {
    this.reviewService.getProductReviews(productId).subscribe(
      (reviews: any[]) => {
        this.reviews = reviews;
      },
      (error: any) => {
        console.error('Failed to load reviews:', error);
      },
    );
  }

  canSubmitReview(): boolean {
    return (
      this.newReview.rating > 0 &&
      this.newReview.title.trim().length > 0 &&
      this.newReview.comment.trim().length >= 20
    );
  }

  submitReview() {
    if (!this.canSubmitReview()) {
      this.notificationService.error('Please fill all fields correctly', 'Error');
      return;
    }

    const user = this.authService.getCurrentUser();
    if (!user) {
      this.notificationService.error('You must be logged in to write a review', 'Error');
      return;
    }

    const reviewRequest = {
      productId: this.product._id || this.product.id,
      rating: this.newReview.rating,
      title: this.newReview.title,
      comment: this.newReview.comment,
    };

    const userId = user.id || user._id || '';
    const userName = `${user.firstName || user.name || 'Anonymous'} ${user.lastName || ''}`.trim();

    if (!userId) {
      this.notificationService.error('User ID not found', 'Error');
      return;
    }

    this.reviewService.createReview(reviewRequest, userId, userName).subscribe(
      () => {
        this.notificationService.success(
          'Review submitted! It will appear after admin approval.',
          'Review Submitted',
        );
        this.newReview = {
          rating: 5,
          title: '',
          comment: '',
        };
      },
      (error: any) => {
        console.error('Failed to submit review:', error);
        this.notificationService.error('Failed to submit review', 'Error');
      },
    );
  }

  markHelpful(reviewId: string, helpful: boolean) {
    this.reviewService.markHelpful(reviewId, helpful).subscribe(
      () => {
        this.loadReviews(this.product._id || this.product.id);
        const message = helpful ? 'Marked as helpful' : 'Marked as not helpful';
        this.notificationService.success(message, 'Thank You');
      },
      (error: any) => {
        console.error('Failed to mark review:', error);
      },
    );
  }

  getStars(rating: number): string {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  getProductImage(product: any): string | null {
    if (product.images && product.images.length > 0 && product.images[0].url) {
      return product.images[0].url;
    }
    if (product.image) {
      return product.image;
    }
    return null;
  }

  addToCart() {
    // Prevent duplicate requests while adding
    if (this.isAddingToCart) {
      console.warn('Already adding to cart, please wait...');
      return;
    }

    this.isAddingToCart = true;

    const item = {
      id: this.product._id,
      productId: this.product._id,
      quantity: this.quantity,
      price: this.product.price,
      priceChanged: false,
      product: {
        id: this.product._id,
        name: this.product.name,
        image: this.getProductImage(this.product) || '',
        currentPrice: this.product.price,
        slug: this.product.slug,
      },
    };

    this.cartService.addToCart(item).subscribe(
      () => {
        this.notificationService.success(`${this.product.name} added to cart!`, 'Added to Cart');
        this.isAddingToCart = false; // Allow next request
      },
      (error) => {
        console.error('Failed to add to cart:', error);
        const errorMessage = error?.error?.message || 'Failed to add to cart. Please try again.';
        this.notificationService.error(errorMessage, 'Error');
        this.isAddingToCart = false; // Allow retry
      },
    );
  }

  // Get stock status text
  getStockStatus(stock: number): string {
    if (stock === 0) {
      return 'Out of Stock';
    } else if (stock <= 3) {
      return 'Low Stock';
    }
    return 'In Stock';
  }

  // Get CSS class for stock status
  getStockStatusClass(stock: number): string {
    if (stock === 0) {
      return 'out-of-stock';
    } else if (stock <= 3) {
      return 'low-stock';
    }
    return 'in-stock';
  }
}
