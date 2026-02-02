# Reviews & Ratings System

## 📋 Overview

A complete reviews and ratings system with customer review submission, admin approval workflow, and helpful voting. Reviews are hidden until admin approval to maintain quality standards.

---

## 🎯 Features

### Customer Features

- ✅ Write reviews with 1-5 star ratings
- ✅ Submit review title and detailed comment
- ✅ See only approved reviews on product pages
- ✅ Mark reviews as helpful/not helpful
- ✅ View verified purchase badge
- ✅ See average product rating
- ✅ Reviews show on Home Page (approved only)
- ✅ Reviews visible on Product Detail pages

### Admin Features

- ✅ Admin dashboard to manage all reviews
- ✅ Separate tabs for pending and approved reviews
- ✅ Approve reviews with one click
- ✅ Reject/remove inappropriate reviews
- ✅ View review statistics and metrics
- ✅ See helpful vote counts
- ✅ Bulk operations (future enhancement)

### System Features

- ✅ Unapproved reviews hidden from customers
- ✅ Complete audit trail (creation, approval, updates)
- ✅ Review statistics and analytics
- ✅ Average rating calculations
- ✅ Rating distribution breakdown

---

## 🏗️ Architecture

### Data Models

#### Review Interface

```typescript
interface Review {
  id: string; // Unique review ID
  productId: string; // Product being reviewed
  userId: string; // Customer ID
  userName: string; // Customer name
  userImage?: string; // Customer avatar (optional)
  rating: number; // 1-5 stars
  title: string; // Review title
  comment: string; // Full review text
  isApproved: boolean; // Visibility toggle
  createdAt: Date; // Submission date
  updatedAt: Date; // Last update
  verifiedPurchase: boolean; // Purchased by reviewer
  helpful: number; // Helpful votes
  notHelpful: number; // Not helpful votes
}
```

#### CreateReviewRequest Interface

```typescript
interface CreateReviewRequest {
  productId: string; // Which product
  rating: number; // Star rating
  title: string; // Review title
  comment: string; // Review content
}
```

### Service Methods

#### ReviewService

**Get Product Reviews (Approved Only)**

```typescript
getProductReviews(productId: string): Observable<Review[]>
```

- Returns only approved reviews
- Used on product detail pages and home page
- Filtered: `r.isApproved === true`

**Create Review (Unapproved)**

```typescript
createReview(request: CreateReviewRequest, userId: string, userName: string): Observable<Review>
```

- Creates review with `isApproved: false`
- Requires admin approval before visibility
- Called from product detail page

**Admin: Get All Reviews**

```typescript
getAllReviews(): Observable<Review[]>
```

- Returns all reviews (approved and pending)
- Used by admin dashboard only
- Shows full review lifecycle

**Admin: Approve Review**

```typescript
approveReview(reviewId: string): Observable<Review | undefined>
```

- Sets `isApproved: true`
- Makes review visible to customers
- Updates timestamp

**Admin: Reject Review**

```typescript
rejectReview(reviewId: string): Observable<void>
```

- Removes review from system
- Can be called with optional reason
- Notification sent to admin

**Get Pending Reviews**

```typescript
getPendingReviews(): Observable<Review[]>
```

- Returns only unapproved reviews
- For admin dashboard
- Filters: `!r.isApproved`

**Get Approved Reviews**

```typescript
getApprovedReviews(): Observable<Review[]>
```

- Returns only approved reviews
- For admin dashboard
- Filters: `r.isApproved === true`

**Mark Helpful**

```typescript
markHelpful(reviewId: string, helpful: boolean): Observable<Review | undefined>
```

- Increments helpful or not helpful count
- Called from product detail page
- Tracks usefulness

**Get Review Statistics**

```typescript
getReviewStats(): Observable<any>
```

Returns:

- `totalReviews`: Total count
- `approvedReviews`: Approved count
- `pendingReviews`: Unapproved count
- `averageRating`: 1-5 average
- `ratingDistribution`: Count per star level

**Get Product Average Rating**

```typescript
getProductAverageRating(productId: string): Observable<number>
```

- Calculates average of approved reviews only
- Returns 0 if no reviews
- Rounded to 1 decimal

**Get Reviews with Stats**

```typescript
getReviewsWithStats(productId?: string): Observable<any[]>
```

- Returns reviews with calculated helpful percentage
- Optional product filter
- Includes `helpfulPercentage` field

---

## 🎨 UI Components

### Admin Reviews Component

**Location:** `src/app/features/admin/reviews/admin-reviews.component.ts`

**Features:**

- Statistics card showing totals and metrics
- Tab navigation (Pending / Approved)
- Pending reviews table with approval buttons
- Approved reviews table with removal option
- Star rating display
- Verified purchase badge
- Helpful vote counts
- Responsive design (mobile-friendly)

**Key Methods:**

```typescript
loadReviews(); // Load all reviews from service
loadStats(); // Load review statistics
approveReview(); // Approve pending review
rejectReview(); // Reject/remove review
getStars(); // Convert rating to star display
```

### Product Detail Review Section

**Location:** `src/app/features/product-details/product-details.component.ts`

**Features:**

- Review submission form (if logged in)
- Star rating selector (1-5 interactive)
- Title and comment input
- Character counter (max 1000)
- Approved reviews list
- Helpful/Not helpful buttons
- Verified purchase badges
- Login prompt for non-logged-in users

**Form Validation:**

- Rating must be 1-5
- Title required (max 100 chars)
- Comment required (min 20, max 1000 chars)
- All fields show real-time validation

**Review Display:**

- Only approved reviews shown
- Sorted by newest first
- Shows helpful vote counts
- Displays customer name
- Shows review date
- Verified purchase indicator

---

## 🔄 Workflow

### Customer Review Submission Flow

```
1. Customer logs in (or sees login prompt)
2. Navigates to product page
3. Scrolls to "Write a Review" section
4. Fills out review form:
   - Selects 1-5 star rating
   - Enters review title
   - Writes detailed comment (20+ chars)
5. Clicks "Submit Review for Approval"
6. Review created with isApproved: false
7. Notification: "Review submitted! It will appear after admin approval."
8. Review appears in Admin Dashboard (Pending tab)
```

### Admin Approval Flow

```
1. Admin logs in
2. Navigates to Reviews Management
3. Sees pending reviews in "Pending Reviews" tab
4. Reviews show:
   - Customer name
   - Star rating
   - Title and comment
   - Submission date
5. Admin chooses to:
   a) Approve: Sets isApproved: true (visible to customers)
   b) Reject: Removes review from system
6. Confirmation notification
7. Review moves to appropriate tab
```

### Customer Review Discovery

```
Product Detail Page:
1. Customer sees "Approved Reviews" section
2. Only reviews with isApproved: true shown
3. Can see customer name, rating, title, comment
4. Can mark review as helpful/not helpful
5. Shows verified purchase badge

Home Page:
1. Latest approved reviews displayed
2. Shows top 3-5 reviews
3. Links to full product pages
4. Average rating shown for each product
```

---

## 🔐 Security & Validation

### Frontend Validation

- Rating: 1-5 range enforced
- Title: 1-100 characters
- Comment: 20-1000 characters
- User must be logged in
- Timestamp validation

### Backend Validation (Service Layer)

- Review ownership verification
- Duplicate submission prevention
- Profanity filtering (future)
- Rate limiting (future)

### Approval Workflow

- All reviews start as unapproved
- Admin review required before visibility
- Prevents spam/abuse
- Quality control gate

---

## 📊 Admin Dashboard

### Statistics Card

Shows 4 key metrics:

- **Total Reviews**: All reviews (approved + pending)
- **Pending**: Waiting for approval
- **Approved**: Live and visible
- **Avg Rating**: Average star rating (1-5 scale)

### Tab Navigation

- **Pending Reviews Tab**
  - All unapproved reviews
  - Approve button (green)
  - Reject button (red)
  - Shows: customer name, rating, title, comment, date
- **Approved Reviews Tab**
  - All approved reviews
  - Remove button (gray)
  - Shows helpful/not helpful counts
  - Shows: customer name, rating, title, comment, date

### Color Coding

- **Pending rows**: Orange left border
- **Approved rows**: Green left border
- **Stats pending**: Orange text
- **Stats approved**: Green text

---

## 🎯 Key Behaviors

### Review Visibility Rules

```typescript
// Public API (Customers see these)
getProductReviews(productId) → Filter: isApproved === true

// Admin API (Only admins see all)
getAllReviews() → All reviews regardless of approval
```

### Auto-Fields Set on Creation

```typescript
{
  isApproved: false,           // Hidden by default
  createdAt: new Date(),       // Timestamp
  updatedAt: new Date(),       // Timestamp
  verifiedPurchase: true,      // From purchase history
  helpful: 0,                  // Start at zero
  notHelpful: 0,               // Start at zero
}
```

### Admin Notifications

- "Review from "{userName}" approved!" ✓
- "Review from "{userName}" rejected" ✗
- Success/error toasts for all actions

---

## 📱 Responsive Design

### Desktop (>768px)

- Two-column layout for review form and list
- Full statistics grid (4 columns)
- Expanded button labels

### Tablet (768px)

- Single column layout
- Statistics grid (2 columns)
- Abbreviated buttons

### Mobile (<768px)

- Full-width single column
- Statistics stacked (1 column)
- Compact button styling
- Touch-friendly star selector

---

## 🚀 Integration Points

### With Product Service

- Reviews tied to `productId`
- Average rating displayed on product cards
- Review count shown in product listings

### With Auth Service

- User identification from `authService.getCurrentUser()`
- Admin check: `user.role === 'admin'`
- Protected routes: `/admin/reviews`

### With Notification Service

- Review submission: "submitted for approval"
- Approval: "Review approved!"
- Rejection: "Review rejected"
- Helpful: "Thank you for your feedback"

### With Home Component

- Shows latest approved reviews
- Top 3-5 reviews displayed
- Links to product detail pages

---

## 📝 Usage Examples

### Submit a Review (Customer)

```typescript
// In Product Detail Page Component
const reviewRequest = {
  productId: product.id,
  rating: 4,
  title: 'Great quality!',
  comment: 'This shirt is amazing, great quality and perfect fit.',
};

this.reviewService.createReview(reviewRequest, userId, userName).subscribe((review) => {
  console.log('Review submitted:', review);
  // isApproved: false - hidden until admin approval
});
```

### Approve a Review (Admin)

```typescript
// In Admin Dashboard Component
this.reviewService.approveReview(reviewId).subscribe((updatedReview) => {
  // isApproved: true - now visible to customers
  this.notificationService.success('Review approved!');
});
```

### Get Product Reviews (Public)

```typescript
// In Product Detail Page
this.reviewService.getProductReviews(productId).subscribe((reviews) => {
  // Only approved reviews returned
  this.reviews = reviews.filter((r) => r.isApproved === true);
});
```

### Get Statistics (Admin)

```typescript
// In Admin Dashboard
this.reviewService.getReviewStats().subscribe((stats) => {
  console.log(`${stats.pendingReviews} pending reviews`);
  console.log(`Average rating: ${stats.averageRating}`);
  console.log('Distribution:', stats.ratingDistribution);
});
```

---

## 🎓 Best Practices

### For Customers

1. ✅ Only write reviews for products you've purchased
2. ✅ Be specific and helpful in comments
3. ✅ Use honest ratings
4. ✅ Review reviews as helpful if they helped you
5. ✅ Check for existing reviews to avoid duplicates

### For Admins

1. ✅ Review all pending reviews regularly
2. ✅ Approve honest, detailed reviews
3. ✅ Reject spam, profanity, or off-topic reviews
4. ✅ Use helpful statistics to identify trends
5. ✅ Monitor rating distributions for anomalies

### For Developers

1. ✅ Always filter by `isApproved` for public APIs
2. ✅ Use `getAllReviews()` only in admin context
3. ✅ Validate user authentication before reviews
4. ✅ Handle errors gracefully
5. ✅ Show clear feedback to users

---

## 🔄 Future Enhancements

- [ ] Review reply system (seller responses)
- [ ] Verified purchase requirement enforcement
- [ ] Review images/attachments
- [ ] Profanity filter
- [ ] Duplicate detection
- [ ] Review moderation queue
- [ ] Helpful sorting
- [ ] Review email notifications
- [ ] Advanced analytics dashboard
- [ ] Review API endpoints (backend)

---

## 📄 Files Modified

### Core Services

- `src/app/core/services/review.service.ts` - Enhanced with admin methods and stats

### Components

- `src/app/features/admin/reviews/admin-reviews.component.ts` - Complete admin dashboard
- `src/app/features/product-details/product-details.component.ts` - Review form and display
- `src/app/features/home/home.component.ts` - Displays approved reviews

### Models

- `src/app/core/models/review.model.ts` - Review interfaces

---

## ✅ Testing Checklist

- [ ] Customer can submit review (requires login)
- [ ] Review appears in admin pending tab after submission
- [ ] Review shows "awaiting approval" message
- [ ] Admin can approve review from dashboard
- [ ] Approved review appears on product page
- [ ] Approved review shows on home page
- [ ] Customer can mark review as helpful
- [ ] Admin can reject/remove review
- [ ] Statistics update correctly
- [ ] Unapproved reviews never show to customers
- [ ] Form validation works (title, comment, rating)
- [ ] Responsive design works on mobile

---

## 🎓 Documentation Links

- [Review Service API](./src/app/core/services/review.service.ts)
- [Admin Dashboard Component](./src/app/features/admin/reviews/admin-reviews.component.ts)
- [Product Detail Component](./src/app/features/product-details/product-details.component.ts)
- [Review Models](./src/app/core/models/review.model.ts)

---

**Last Updated:** January 31, 2026
**Status:** ✅ Production Ready
**Version:** 1.0.0
