# Review Submission Testing Guide 🧪

## المتطلبات قبل الاختبار

- ✅ كل الـ dependencies محدثة
- ✅ Application جاري (npm start)
- ✅ Admin account موجود
- ✅ Delivered orders موجودة

---

## Scenario 1: كتابة Review جديد ✍️

### الخطوات:

```
1. اذهب إلى: http://localhost:4200/account
2. اختر tab "Reviews"
3. اختر order من قائمة "Select Order"
   (لازم يكون status = "Delivered")
4. اختر rating (1-5 stars)
   مثال: ⭐⭐⭐⭐⭐ (5 stars)
5. اكتب comment (مثلاً: "Great product!")
6. اضغط "Submit Review"
```

### النتائج المتوقعة:

```
✅ رسالة: "Review submitted successfully! ⭐ Awaiting admin approval."
✅ Form اتقفل
✅ Review ظهر في "Your Reviews" section
```

### الـ Console Output:

```
✅ Review submitted successfully: {
  id: "review-1707000000000",
  productId: "1",
  userId: "user1",
  userName: "Ahmed Hassan",
  rating: 5,
  title: "5 Star Review",
  comment: "Great product!",
  isApproved: false,
  createdAt: 2026-02-02T...
}
✅ Filtered 1 user reviews
```

---

## Scenario 2: Check Admin Panel 👨‍💼

### الخطوات:

```
1. فتح نافذة جديدة (أو ولّج كـ admin account)
2. اذهب إلى: http://localhost:4200/admin
3. اختر "Reviews" من الـ sidebar
4. انظر إلى "Pending Reviews" tab
```

### النتائج المتوقعة:

```
✅ الـ review الجديد يظهر في الـ Pending Reviews table
✅ يظهر مع:
   - Customer Name
   - Rating (⭐⭐⭐⭐⭐)
   - Title: "5 Star Review"
   - Comment: "Great product!"
   - Date: اليوم
✅ Pending Reviews count زاد من 0 → 1
```

### مثال الـ Table:

```
┌──────────────┬────────┬──────────────┬──────────────┬────────┬──────────┐
│ Customer     │ Rating │ Title        │ Comment      │ Date   │ Actions  │
├──────────────┼────────┼──────────────┼──────────────┼────────┼──────────┤
│ Ahmed Hassan │ ⭐⭐⭐⭐⭐ │ 5 Star Review│ Great...    │ 2/2/26 │ ✓ Reject │
└──────────────┴────────┴──────────────┴──────────────┴────────┴──────────┘
```

---

## Scenario 3: Admin Approval ✅

### الخطوات:

```
1. في Admin Panel → Reviews
2. في Pending Reviews، اضغط "✓ Approve"
```

### النتائج المتوقعة:

```
✅ رسالة: "Review from Ahmed Hassan approved!"
✅ Review انتقل من "Pending" إلى "Approved" tab
✅ Review اختفى من Pending Reviews list
```

---

## Scenario 4: Back to User Account 👤

### الخطوات:

```
1. الرجوع إلى My Account → Reviews
```

### النتائج المتوقعة:

```
✅ Review ظهر في "Your Reviews" section
✅ Status: "Approved" ✓
✅ الـ review بيظهر للزوار (في product page مثلاً)
```

---

## Scenario 5: Admin Rejection ❌

### للاختبار مع review جديد:

```
1. في Admin Panel → Reviews → Pending
2. اضغط "✕ Reject"
3. تأكيد الحذف
```

### النتائج المتوقعة:

```
✅ رسالة: "Review rejected"
✅ Review اختفى من Pending
✅ Review اختفى من كل الـ lists
✅ Count انخفضت
```

---

## Debugging Commands 🔧

### في Browser Console (F12):

```javascript
// تفقد الـ account component
ng.getComponent(document.querySelector('app-account')).userReviews;

// شيك الـ review service directly
ng.probe(document.querySelector('app-admin-reviews')).injector.get(ReviewService).mockReviews;

// شيك stats
ng.probe(document.querySelector('app-admin-reviews')).componentInstance.stats;
```

---

## Expected Console Logs ✓

### عند submitReview:

```
✅ Review submitted successfully: {... review object ...}
✅ Loaded reviews from service: [... reviews array ...]
✅ Filtered 1 user reviews
```

### عند فتح Admin:

```
✅ Loaded reviews from service: [... all reviews ...]
Total reviews: 1
Pending reviews: 1
Approved reviews: 0
```

---

## Common Issues & Solutions 🔴

### ❌ Review مش بيظهر في Admin

**الحل:**

```
1. شيك F12 Console للـ errors
2. تأكد إن Admin account موجود
3. تأكد إن review status = "pending"
4. جرب refresh الـ page
```

### ❌ "Please select an order"

**الحل:**

```
1. تأكد إن في orders في الـ account
2. تأكد إن order status = "Delivered"
3. تأكد إن ما اخترت order حاليا
```

### ❌ Review disappeared

**الحل:**

```
1. Reviews محفوظة في mockReviews (memory)
2. لما تعمل refresh page، reviews بتختفي
3. للحل الدائم: لازم backend database
```

---

## Performance Expectations ⚡

| العملية        | الوقت المتوقع |
| -------------- | ------------- |
| Submit Review  | < 1 second    |
| Load Reviews   | < 500ms       |
| Approve Review | < 500ms       |
| Reject Review  | < 500ms       |
| Admin Tab Load | < 1 second    |

---

## Success Criteria ✅

```
✅ Review بتظهر فوراً في My Account
✅ Review بتظهر في Admin Panel Pending
✅ Admin يقدر يوافق أو يرفض
✅ Approved reviews بتنتقل للـ Approved tab
✅ لا errors في console
✅ لا timeouts أو delays
```

---

## Data Persistence Note 📝

**التنويه المهم:**

- الـ reviews محفوظة في `mockReviews` array (in-memory)
- لما تعمل page refresh أو F5، reviews بتختفي
- **للإصلاح الكامل:** استخدم Backend Database (MongoDB, etc.)

```typescript
// الحل المستقبلي:
// بدل mockReviews, استخدم API:
this.http.post('/api/reviews', reviewData)
  .subscribe(response => { ... })
```

---

**الاختبار جاهز! 🎉 تفضل جرب الآن**
