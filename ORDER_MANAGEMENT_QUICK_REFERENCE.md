# Order Management System - Quick Reference

## 🎯 Quick Start

### For Customers

1. Navigate to **My Account** or click the account icon
2. Select **My Orders** from the menu
3. View all your orders with expandable details
4. Click "Cancel Order" to cancel (only available for Pending/Processing orders)

**URL**: `http://localhost:3000/orders`

### For Admins

1. Go to **Admin Panel** → **Orders**
2. View all customer orders with statistics
3. Filter by status using the dropdown
4. Click **Edit** to change order status
5. View full order details by clicking the expand icon

**URL**: `http://localhost:3000/admin/orders`

---

## 📊 Order Status Flow

```
Customer Places Order
        ↓
    PENDING (⏳)
        ↓
  PROCESSING (🔄)
        ↓
    READY (📦)
        ↓
   SHIPPED (🚚)
        ↓
   RECEIVED (✅)
```

### Cancellation Rules

```
✅ CAN CANCEL:     Pending, Processing
❌ CANNOT CANCEL:  Ready, Shipped, Received
```

---

## 🔧 API Endpoints

### User Endpoints

| Method | Endpoint                 | Purpose           | Auth     |
| ------ | ------------------------ | ----------------- | -------- |
| GET    | `/api/orders`            | Get my orders     | Required |
| GET    | `/api/orders/:id`        | Get order details | Required |
| PUT    | `/api/orders/:id/cancel` | Cancel order      | Required |

### Admin Endpoints

| Method | Endpoint                 | Purpose        | Auth  |
| ------ | ------------------------ | -------------- | ----- |
| GET    | `/api/orders/admin/all`  | Get all orders | Admin |
| PUT    | `/api/orders/:id/status` | Update status  | Admin |

---

## 🎨 Status Badges

| Status     | Icon | Color  | When                   |
| ---------- | ---- | ------ | ---------------------- |
| Pending    | ⏳   | Yellow | Just created           |
| Processing | 🔄   | Blue   | Being prepared         |
| Ready      | 📦   | Green  | Packed & ready         |
| Shipped    | 🚚   | Indigo | In transit             |
| Received   | ✅   | Green  | Delivered              |
| Cancelled  | ❌   | Red    | Customer cancelled     |
| Refused    | ⛔   | Red    | Admin refused/returned |

---

## 📱 User Interface

### My Orders Page (`/orders`)

```
┌─────────────────────────────────────┐
│  📦 My Orders                       │
│  Track and manage your orders       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Order #ORD-xxx-1  [⏳ Pending]      │
│ 📅 Jan 20, 2024 at 10:30 AM         │
│ EGP 599.99                          │
│ 3 items                             │
│ ▼ (click to expand)                 │
└─────────────────────────────────────┘
    ↓ [EXPANDED]
    ├─ Order Items
    │  - Product 1: Qty 1 × EGP 199.99
    │  - Product 2: Qty 2 × EGP 99.99
    ├─ Shipping Address
    ├─ Payment Information
    ├─ Order Timeline (visual progress)
    └─ [❌ Cancel Order Button]
```

### Admin Orders Page (`/admin/orders`)

```
┌─────────────────────────────────────┐
│  📊 Orders Management               │
│  Manage and track all orders        │
└─────────────────────────────────────┘

Stats: [Total: 45] [Pending: 5] [Processing: 8] ...

Filter: [All Orders ▼] [🔄 Refresh]

┌──────────────────────────────────────────────────┐
│ Order# │ Customer │ Total │ Status │ Date │ Edit │
├──────────────────────────────────────────────────┤
│ORD-001 │ Ahmed H. │ 599.99│ ⏳     │ 1/20 │ ✏️  │
├──────────────────────────────────────────────────┤
│ORD-002 │ Fatima A.│ 299.99│ 🔄     │ 1/21 │ ✏️  │
└──────────────────────────────────────────────────┘
```

---

## 🔄 Cancellation Flow

### User-Initiated Cancellation

```
User Views Order (Pending/Processing)
        ↓
Click "Cancel Order"
        ↓
Confirmation Dialog
"Are you sure you want to cancel?"
        ↓ YES
Backend:
  - Verify canCancel flag
  - Restore stock for all items
  - Set status to "Cancelled"
  - Disable future cancellations
        ↓
✅ Notification: "Order cancelled successfully"
Update UI: Status changed to "Cancelled"
```

### Stock Restoration Example

```
Original Order:
  - Product A: 2 units (stock was 10 → becomes 8)
  - Product B: 1 unit (stock was 5 → becomes 4)

When Cancelled:
  - Product A: stock becomes 10 (8 + 2)
  - Product B: stock becomes 5 (4 + 1)
```

---

## 🛡️ Security Features

### Authorization

- ✅ Users can only view/cancel their own orders
- ✅ Only admins can update order statuses
- ✅ JWT token required for all endpoints
- ✅ Role-based access control

### Validation

- ✅ Status must be valid enum value
- ✅ Only certain statuses allow cancellation
- ✅ Stock restoration atomic operation
- ✅ Order ownership verified before operations

---

## 💾 Data Structure

### Order Document

```json
{
  "_id": "ObjectId",
  "orderNumber": "ORD-1705747800000-1",
  "user": "ObjectId (ref to User)",
  "items": [
    {
      "product": "ObjectId (ref to Product)",
      "quantity": 2,
      "price": 199.99,
      "productName": "T-Shirt"
    }
  ],
  "totalAmount": 599.99,
  "status": "Pending",
  "paymentStatus": "Pending",
  "paymentMethod": "COD",
  "shippingAddress": {
    "name": "Ahmed Hassan",
    "mobile": "+20123456789",
    "street": "123 Main St",
    "city": "Cairo",
    "state": "Cairo",
    "postalCode": "12345",
    "country": "Egypt"
  },
  "canCancel": true,
  "returnRequested": false,
  "createdAt": "2024-01-20T10:30:00Z",
  "updatedAt": "2024-01-20T10:30:00Z"
}
```

---

## 🐛 Troubleshooting

### Issue: "This order cannot be cancelled"

**Cause**: Order is in Ready, Shipped, or Received status
**Solution**: Contact customer support for special requests

### Issue: Stock not restored after cancellation

**Cause**: Backend error during cancellation process
**Solution**: Check server logs and retry cancellation

### Issue: Cannot see Cancel button

**Cause**:

- Not logged in
- Order not in cancellable status
- Not the order owner
  **Solution**: Check authentication and order status

### Issue: Admin orders page shows no orders

**Cause**:

- API endpoint not responding
- Incorrect permissions
- No orders in database
  **Solution**: Refresh page, check backend status

---

## 📈 Key Metrics (Admin Dashboard)

### Statistics Tracked

- **Total Orders**: All orders ever created
- **Pending**: New orders awaiting processing
- **Processing**: Orders being prepared
- **Ready**: Orders ready for shipment
- **Shipped**: Orders in transit
- **Received**: Successfully delivered
- **Cancelled/Refused**: Failed/cancelled orders

### Revenue Tracking

- Order total amount (EGP)
- Per-status revenue (future enhancement)
- Refund amounts on cancellation (future)

---

## 🎓 Learning Points

### What Makes This System Robust?

1. **Status Enum**: Prevents invalid statuses
2. **Pre-save Hooks**: Auto-update canCancel based on status
3. **Stock Restoration**: Atomic operation on cancellation
4. **Authorization**: Role-based endpoint access
5. **Error Handling**: Clear error messages to users

### Design Patterns Used

- **Observable Pattern**: RxJS for async operations
- **Lifecycle Hooks**: OnDestroy for cleanup
- **Template-driven Forms**: ngModel for status select
- **Defensive Programming**: Null checks and validation
- **Component Composition**: Reusable service methods

---

## 🚀 Next Steps (Future Enhancements)

1. **Email Notifications** when status changes
2. **Return Request System** (14-day window)
3. **Order Tracking** with live location
4. **Invoice Generation** PDF/Print
5. **Partial Refunds** for partial cancellations
6. **Analytics Dashboard** with charts
7. **Bulk Operations** for admins
8. **Customer Support Chat** linked to orders

---

## 📞 Support

For issues or questions:

1. Check the troubleshooting section above
2. Review backend logs: `backend/` directory
3. Check browser console for frontend errors
4. Verify database connection
5. Ensure all services are running

---

**Last Updated**: January 2024
**Version**: 1.0 - Initial Release
