# نظام الإرجاع | Returns System

## الخطوة الأولى: فهم النظام

## Step 1: Understanding the System

---

## 🔄 تدفق الإرجاع | Return Flow

```
الزبون يطلب منتج
Customer Orders
        ↓
تم استلام الطلب
Order Received
        ↓
الزبون يمكنه الإرجاع خلال 14 يوم
Customer Can Return Within 14 Days
        ↓
الزبون يطلب إرجاع
Customer Requests Return
        ↓
الأدمن يراجع الطلب
Admin Reviews Request
        ├─ موافقة | Approve
        └─ رفض | Reject
        ↓
يتم إرسال المنتج
Items Sent Back
        ↓
تم استقبال المنتج من الأدمن
Admin Receives Items
        ↓
استرجاع المبلغ | Refund Issued
```

---

## 📋 البيانات المسجلة | Stored Data

### معلومات الإرجاع | Return Information

```
معرّف الإرجاع              ID
رقم الطلب الأصلي           Order Number
الزبون                     Customer
المنتجات المراد إرجاعها    Items to Return
السبب                      Reason
حالة الطلب                Status
مبلغ الاسترجاع            Refund Amount
تاريخ الطلب               Request Date
تاريخ الموافقة            Approval Date
تاريخ الاكتمال            Completion Date
ملاحظات الأدمن             Admin Notes
```

---

## ✅ الشروط | Eligibility Requirements

الطلب يجب أن يكون:
Order must be:

- ✓ تم استلامه | Received
- ✓ خلال 14 يوم من الشراء | Within 14 days
- ✓ في حالة جيدة | In good condition
- ✗ لا يتجاوز 14 يوم | NOT older than 14 days
- ✗ لا يكون تالف من الزبون | NOT damaged by customer

---

## 💰 حساب الاسترجاع | Refund Calculation

```
مبلغ الاسترجاع = السعر المدفوع × الكمية
Refund Amount = Price Paid × Quantity
```

**مثال | Example:**

- السعر الأصلي: 100 جنيه | Original Price: 100 EGP
- الكمية: 2 | Quantity: 2
- مبلغ الاسترجاع: 200 جنيه | Refund: 200 EGP

---

## 🛠️ وظائف النظام | System Functions

### 1. طلب الإرجاع من الزبون | Customer Request Return

```typescript
orderService.requestReturn(
  orderId, // معرّف الطلب | Order ID
  items, // المنتجات | Items
  reason, // السبب | Reason
  description, // التفاصيل | Details
);
```

**النتائج | Results:**

- ✓ تم إنشاء طلب إرجاع | Return request created
- ✓ السعر الاسترجاع محسوب | Refund amount calculated
- ✓ تم إرسال إشعار | Notification sent
- ✓ الحالة: قيد الانتظار | Status: Requested

---

### 2. مراجعة من الأدمن | Admin Review

الأدمن يمكنه:
Admin can:

- ✓ عرض جميع طلبات الإرجاع | View all returns
- ✓ قراءة السبب والتفاصيل | Read reason & details
- ✓ معرفة مبلغ الاسترجاع | See refund amount
- ✓ الموافقة أو الرفض | Approve or Reject

```typescript
orderService.processReturn({
  returnId: 'return-123',
  action: 'approve', // أو reject | or reject
  notes: 'تم فحص المنتج', // Admin notes
});
```

**الحالات | Statuses:**

- ✓ موافقة | approved → الزبون يرسل المنتج
- ✗ رفض | rejected → لا استرجاع

---

### 3. استكمال الإرجاع | Complete Return

بعد استقبال المنتج:
After receiving items:

```typescript
orderService.completeReturn('return-123');
```

**النتائج | Results:**

- ✓ الحالة: مكتمل | Status: Completed
- ✓ تم إصدار الاسترجاع | Refund issued
- ✓ تم إرسال إشعار للزبون | Email sent to customer

---

## 📊 إحصائيات الإرجاع | Return Statistics

```typescript
orderService.getReturnStats();
```

**البيانات | Data:**

```
إجمالي طلبات الإرجاع        Total Requests
قيد الانتظار               Pending
موافقة                    Approved
مرفوض                     Rejected
مكتمل                     Completed
إجمالي مبلغ الاسترجاع      Total Refunded
```

---

## 🔐 صلاحيات الأدمن | Admin Permissions

الأدمن يمكنه:
Admin can:

✓ عرض جميع طلبات الإرجاع
View all return requests

✓ الموافقة على الإرجاع
Approve returns

✓ رفض طلبات الإرجاع
Reject returns

✓ استكمال عملية الإرجاع
Complete returns

✓ إصدار الاسترجاع
Issue refunds

✓ إضافة ملاحظات
Add notes

✓ عرض الإحصائيات
View statistics

---

## 👥 صلاحيات الزبون | Customer Permissions

الزبون يمكنه:
Customer can:

✓ طلب إرجاع (خلال 14 يوم)
Request return (within 14 days)

✓ اختيار المنتجات المراد إرجاعها
Select items to return

✓ إضافة سبب التفصيل
Add reason and description

✓ متابعة حالة الإرجاع
Track return status

✓ استقبال إشعارات
Receive notifications

✗ لا يمكن إرجاع بعد 14 يوم
Cannot return after 14 days

---

## 📅 حساب الـ 14 يوم | 14-Day Calculation

```
تاريخ الاستلام: 1 يناير
Order Received: January 1st

آخر يوم إرجاع: 15 يناير
Last Return Day: January 15th

بعد 15 يناير: لا يمكن إرجاع
After January 15th: Cannot return
```

---

## ⚠️ حالات خاصة | Special Cases

### 1. منتج تالف من الزبون

### Damaged by Customer

```
الأدمن يفحص المنتج
Admin inspects item
        ↓
يرى أن الضرر من الزبون
Sees damage is from customer
        ↓
يرفض الإرجاع
Rejects return
        ↓
لا استرجاع
No refund
```

### 2. انتهاء فترة 14 يوم

### Return Window Expired

```
الزبون يطلب إرجاع بعد 15 يوم
Customer requests after 15 days
        ↓
النظام يرفضها تلقائياً
System automatically rejects
        ↓
ظهور رسالة: فترة الإرجاع انتهت
Message: Return window expired
        ↓
لا استرجاع
No refund
```

### 3. طلب مقبول

### Accepted Return

```
الزبون يطلب خلال 14 يوم ✓
Customer requests within 14 days ✓
        ↓
المنتج في حالة جيدة ✓
Item in good condition ✓
        ↓
الأدمن يوافق ✓
Admin approves ✓
        ↓
الزبون يرسل المنتج
Customer ships item
        ↓
الأدمن يستقبل ويفحص
Admin receives & inspects
        ↓
الأدمن يستكمل الإرجاع
Admin completes return
        ↓
تم إصدار الاسترجاع ✓
Refund issued ✓
```

---

## 📝 أسباب الإرجاع الشائعة | Common Return Reasons

- ✗ المنتج تالف/مكسور
  Product defective/damaged

- ✗ استقبلت منتج خاطئ
  Wrong item received

- ✗ المنتج لا يطابق الوصف
  Not as described

- ✗ غيرت رأيي
  Changed mind

- ✗ لا يناسبني (الحجم/اللون)
  Doesn't fit (size/color)

- ✗ جودة رديئة
  Poor quality

- ✗ لم أتوقع شكله
  Unexpected appearance

---

## 🎯 ملخص سريع | Quick Summary

| المرحلة  | الفاعل   | الإجراء                     |
| -------- | -------- | --------------------------- |
| Stage    | Actor    | Action                      |
| -------- | -------- | --------                    |
| 1        | الزبون   | يطلب شراء                   |
|          | Customer | Places order                |
| -------- | -------- | --------                    |
| 2        | النظام   | يسجل الطلب + 14 يوم         |
|          | System   | Records + 14-day window     |
| -------- | -------- | --------                    |
| 3        | الزبون   | يستقبل المنتج               |
|          | Customer | Receives item               |
| -------- | -------- | --------                    |
| 4        | الزبون   | يطلب إرجاع (خلال 14)        |
|          | Customer | Requests return (within 14) |
| -------- | -------- | --------                    |
| 5        | الأدمن   | يوافق/يرفض                  |
|          | Admin    | Approves/Rejects            |
| -------- | -------- | --------                    |
| 6        | الزبون   | يرسل المنتج                 |
|          | Customer | Ships item back             |
| -------- | -------- | --------                    |
| 7        | الأدمن   | يستقبل ويستكمل              |
|          | Admin    | Receives & completes        |
| -------- | -------- | --------                    |
| 8        | النظام   | يصدر الاسترجاع              |
|          | System   | Issues refund               |
| -------- | -------- | --------                    |

---

## ✅ الميزات المنفذة | Implemented Features

- [x] فترة 14 يوم للإرجاع | 14-day return window
- [x] طلب الإرجاع | Request returns
- [x] موافقة/رفض من الأدمن | Admin approval/rejection
- [x] حساب الاسترجاع التلقائي | Auto refund calculation
- [x] تتبع الحالة | Status tracking
- [x] سجل كامل | Complete audit trail
- [x] إحصائيات | Statistics
- [ ] إرسال رسائل البريد | Email notifications
- [ ] طباعة الملصق | Print labels
- [ ] تقارير | Reports
- [ ] ربط مع البنك | Bank integration

---

## 🚀 الخطوات التالية | Next Steps

1. **واجهة الزبون** | Customer UI
   - صفحة طلب الإرجاع
   - متابعة الإرجاع

2. **لوحة الأدمن** | Admin Dashboard
   - عرض الإرجاعات
   - المعالجة

3. **التكامل** | Integration
   - ربط مع البيانات
   - إرسال الرسائل

4. **التقارير** | Reports
   - إحصائيات الإرجاع
   - تحليل الأسباب
