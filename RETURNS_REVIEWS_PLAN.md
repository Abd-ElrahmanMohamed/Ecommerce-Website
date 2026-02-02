# Returns System & Reviews Management - Implementation Plan

## 📋 المتطلبات

### 1️⃣ Returns System

- ✅ استرجاع المنتج خلال 14 يوم
- ✅ الطلب يتراجع من السيستم
- ✅ إدارة المرتجعات من الأدمن
- ✅ كتابة سبب الاسترجاع

### 2️⃣ Reviews & Ratings System

- ✅ أي User يقدر يكتب Review
- ✅ مش بتظهر على الموقع غير بعد موافقة الأدمن
- ✅ سيكشن للمرتجعات في الأدمن
- ✅ Reviews تظهر في Home Page
- ✅ التحكم الكامل في المراجعات من الأدمن

---

## 🏗️ Architecture

### Backend (Node.js):

```
Routes:
├─ POST /api/reviews - Create review (pending)
├─ GET /api/reviews/pending - Get pending reviews (Admin)
├─ PUT /api/reviews/:id/approve - Approve review (Admin)
├─ DELETE /api/reviews/:id - Delete review (Admin)
├─ GET /api/reviews/approved - Get approved reviews
├─ POST /api/returns - Create return request
├─ GET /api/returns - Get returns (Admin)
├─ PUT /api/returns/:id/status - Update return status (Admin)
└─ DELETE /api/orders/:id - Cancel order (soft delete)

Models:
├─ Review
│  ├─ orderId
│  ├─ productId
│  ├─ userId
│  ├─ rating (1-5)
│  ├─ comment
│  ├─ status (pending/approved/rejected)
│  ├─ createdAt
│  └─ updatedAt
│
└─ Return
   ├─ orderId
   ├─ userId
   ├─ reason
   ├─ status (pending/approved/rejected/processed)
   ├─ createdAt
   └─ updatedAt
```

### Frontend (Angular):

```
Components:
├─ ReviewForm (in ProductDetails)
│  ├─ Rating selector (1-5 stars)
│  ├─ Comment textarea
│  ├─ Submit button
│  └─ Notification on success
│
├─ ReviewsList (in Home & ProductDetails)
│  ├─ Display approved reviews
│  ├─ Show rating, comment, user name
│  └─ Pagination/scroll
│
├─ AdminReviews
│  ├─ Pending reviews table
│  ├─ Approve/Reject buttons
│  ├─ Delete button
│  └─ Filters
│
├─ AdminReturns
│  ├─ Returns table
│  ├─ Status update dropdown
│  ├─ Reason display
│  └─ Filters
│
└─ ReturnForm (in Account)
   ├─ Select order to return
   ├─ Select reason
   ├─ Submit button
   └─ Confirmation
```

---

## 📊 Database Schema

### Reviews Collection:

```json
{
  "_id": "ObjectId",
  "orderId": "ObjectId (ref: Order)",
  "productId": "ObjectId (ref: Product)",
  "userId": "ObjectId (ref: User)",
  "userName": "string",
  "rating": 4,
  "comment": "Great product!",
  "status": "pending" | "approved" | "rejected",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Returns Collection:

```json
{
  "_id": "ObjectId",
  "orderId": "ObjectId (ref: Order)",
  "userId": "ObjectId (ref: User)",
  "items": [
    {
      "productId": "ObjectId",
      "productName": "string",
      "quantity": 1,
      "price": 100
    }
  ],
  "reason": "Product defective / Changed mind / Wrong size",
  "status": "pending" | "approved" | "rejected" | "processed",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

## 🔄 User Flows

### Reviews Flow:

```
1. User views product or after order
2. Clicks "Write Review"
3. Opens form (star rating + comment)
4. Submits review
5. Review saved as "pending"
6. Admin sees in "Pending Reviews"
7. Admin approves/rejects
8. If approved → shows on product page & home
```

### Returns Flow:

```
1. User goes to My Orders
2. Order within 14 days?
3. Click "Return Order"
4. Select reason
5. Submit return
6. Return status: "pending"
7. Admin sees in "Returns"
8. Admin approves/rejects
9. If approved → order status changes to "Returned"
10. Items removed from inventory
```

---

## 📝 Implementation Phases

### Phase 1: Backend Setup

- [ ] Create Review model
- [ ] Create Return model
- [ ] Create review routes
- [ ] Create return routes
- [ ] Add review validations

### Phase 2: Frontend - User Side

- [ ] Add review form to product page
- [ ] Add reviews list to home page
- [ ] Add return form to account page
- [ ] Add return history to account page

### Phase 3: Frontend - Admin Side

- [ ] Admin reviews management page
- [ ] Admin returns management page
- [ ] Approve/reject actions
- [ ] Delete actions

### Phase 4: Integration & Styling

- [ ] Connect all APIs
- [ ] Add notifications
- [ ] Add validations
- [ ] Polish UI/UX

---

## 🎯 Key Features

### Reviews:

✅ Rating system (1-5 stars)  
✅ Comment field  
✅ Pending approval  
✅ Admin management  
✅ Display on product page  
✅ Display on home page

### Returns:

✅ 14-day window check  
✅ Reason selection  
✅ Admin approval  
✅ Status tracking  
✅ Automatic order cancellation

---

## 🚀 Next Steps

1. Create backend models and routes
2. Create Angular services
3. Create user-facing components
4. Create admin components
5. Test and integrate
6. Style and optimize
