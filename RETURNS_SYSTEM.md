# Returns System Implementation

## Overview

A complete returns management system that allows customers to request returns within **14 days** of order placement, and admins to process and approve/reject returns.

---

## 🔄 Return Flow

```
Customer Places Order
      ↓ (14-day return window opens)
Order Received
      ↓ (Customer can request return)
Customer Requests Return
      ↓
Admin Reviews Request
      ├─ Approve → Return Processing
      └─ Reject → Return Denied
      ↓
Items Received & Inspected
      ↓
Refund Issued
      ↓
Return Completed
```

---

## 📋 Data Models

### ReturnRequest Interface

```typescript
interface ReturnRequest {
  id: string; // Unique return ID
  orderId: string; // Original order ID
  orderNumber: string; // Order number for reference
  userId: string; // Customer ID
  items: ReturnItem[]; // Items being returned
  reason: string; // Return reason
  description?: string; // Detailed description
  status: ReturnStatus; // Current return status
  refundAmount: number; // Amount to refund
  requestedAt: Date; // When return was requested
  approvedAt?: Date; // When admin approved
  completedAt?: Date; // When refund was issued
  notes?: string; // Admin notes
}
```

### Return Status Types

```typescript
type ReturnStatus = 'requested' | 'approved' | 'rejected' | 'processing' | 'completed';

// Statuses:
// 'requested'  - Customer submitted return request
// 'approved'   - Admin approved the return
// 'rejected'   - Admin rejected the return
// 'processing' - Return items being processed
// 'completed'  - Refund issued, return complete
```

### ReturnItem Interface

```typescript
interface ReturnItem {
  orderItemId: string; // Item ID from original order
  productId: string; // Product ID
  productName: string; // Product name
  quantity: number; // Quantity to return
  pricePaid: number; // Original price paid
  returnReason: string; // Why this item is being returned
}
```

---

## 🛠️ Service Methods

### 1. Check Return Eligibility

```typescript
isEligibleForReturn(order: Order): boolean
```

**Checks if:**

- Order is within 14-day return window
- Order status is 'received'

**Returns:** `true` if eligible, `false` otherwise

---

### 2. Request Return (Customer)

```typescript
requestReturn(
  orderId: string,
  items: any[],
  reason: string,
  description?: string
): Observable<ReturnRequest>
```

**Parameters:**

- `orderId` - Order ID
- `items` - Array of items to return with quantities
- `reason` - Main return reason
- `description` - Optional detailed description

**What it does:**

- Validates order eligibility
- Calculates refund amount (price paid × quantity)
- Creates return request with 'requested' status
- Stores in mock database

**Example:**

```typescript
const itemsToReturn = [
  {
    orderItemId: 'item-1',
    quantity: 1,
    reason: 'Product defective',
  },
];

this.orderService
  .requestReturn(orderId, itemsToReturn, 'Defective product', 'Item arrived damaged')
  .subscribe((returnReq) => {
    console.log(`Return request: ${returnReq.id}`);
    console.log(`Refund amount: EGP ${returnReq.refundAmount}`);
  });
```

---

### 3. Get Return Requests (Customer)

```typescript
getReturnRequests(userId?: string): Observable<ReturnRequest[]>
```

**Returns:** All return requests for a user

**Example:**

```typescript
this.orderService.getReturnRequests(currentUserId).subscribe((returns) => {
  returns.forEach((ret) => {
    console.log(`${ret.orderNumber}: ${ret.status}`);
  });
});
```

---

### 4. Get Return by ID

```typescript
getReturnById(returnId: string): Observable<ReturnRequest | undefined>
```

**Returns:** Specific return request details

---

### 5. Process Return (Admin)

```typescript
processReturn(request: ProcessReturnRequest): Observable<ReturnRequest>
```

**ProcessReturnRequest:**

```typescript
interface ProcessReturnRequest {
  returnId: string;
  action: 'approve' | 'reject';
  notes?: string;
}
```

**What it does:**

- Sets status to 'approved' or 'rejected'
- Records approval/rejection timestamp
- Stores admin notes

**Example:**

```typescript
// Admin approves return
this.orderService
  .processReturn({
    returnId: 'return-123456',
    action: 'approve',
    notes: 'Item inspection passed. Approve for refund.',
  })
  .subscribe((returnReq) => {
    console.log(`Return approved: EGP ${returnReq.refundAmount}`);
  });

// Admin rejects return
this.orderService
  .processReturn({
    returnId: 'return-123456',
    action: 'reject',
    notes: 'Return window expired.',
  })
  .subscribe((returnReq) => {
    console.log(`Return rejected`);
  });
```

---

### 6. Complete Return (Admin)

```typescript
completeReturn(returnId: string): Observable<ReturnRequest>
```

**What it does:**

- Changes status to 'completed'
- Records completion timestamp
- Marks refund as issued

**Example:**

```typescript
this.orderService.completeReturn('return-123456').subscribe((returnReq) => {
  console.log(`Return completed. Refund issued: EGP ${returnReq.refundAmount}`);
});
```

---

### 7. Get Return Statistics

```typescript
getReturnStats(): Observable<any>
```

**Returns:**

```typescript
{
  totalReturnRequests: number,
  requestedReturns: number,          // Pending review
  approvedReturns: number,           // Approved, awaiting items
  rejectedReturns: number,           // Rejected
  completedReturns: number,          // Refunded
  totalRefundAmount: number          // Total refunded
}
```

**Example:**

```typescript
this.orderService.getReturnStats().subscribe((stats) => {
  console.log(`Pending returns: ${stats.requestedReturns}`);
  console.log(`Total refunded: EGP ${stats.totalRefundAmount}`);
});
```

---

## 🔑 Key Features

### 1. **14-Day Return Window**

```typescript
// Automatically calculated when order is placed
returnDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
```

### 2. **Automatic Refund Calculation**

```typescript
refundAmount = items.reduce((sum, item) => {
  return sum + (itemPrice × itemQuantity)
}, 0);
```

### 3. **Order Status Validation**

- Returns only allowed for 'received' orders
- Automatic deadline checking

### 4. **Complete Audit Trail**

```typescript
{
  requestedAt: Date,     // When customer requested
  approvedAt?: Date,     // When admin approved
  completedAt?: Date,    // When refund issued
  notes?: string         // Admin notes
}
```

---

## 📊 Return Reasons

Common return reasons:

- ✗ Product defective/damaged
- ✗ Wrong item received
- ✗ Not as described
- ✗ Changed mind
- ✗ Too small/too large (for clothing)
- ✗ Color not matching
- ✗ Quality issues

---

## 💰 Refund Policy

**Refund Amount:** `quantity × price_paid_at_time_of_order`

**Refund Processing:**

1. Customer requests return (within 14 days)
2. Admin reviews and approves
3. Customer ships items back
4. Admin receives and inspects
5. Admin marks return as 'completed'
6. Refund issued to customer

**Non-Refundable:**

- Shipping costs (standard policy)
- Orders older than 14 days
- Items damaged by customer misuse

---

## 🔐 Admin Controls

### Return Management Dashboard

Admins can:

- ✓ View all pending returns
- ✓ Review return requests with customer reason
- ✓ See item details and refund amounts
- ✓ Approve or reject returns
- ✓ Add notes during processing
- ✓ Complete return and issue refund
- ✓ View return statistics

### Return List View

Shows:

- Order number
- Customer name
- Items being returned
- Return reason
- Status
- Refund amount
- Requested date
- Action buttons

---

## 🛍️ Customer Experience

### In Order History

For each order, customers can see:

- ✓ "Return eligible" badge (if within 14 days)
- ✓ "Request Return" button
- ✓ Return deadline date
- ✓ Link to view return history

### Return Request Form

Customers provide:

- Select items to return
- Choose reason
- Add detailed description
- Submit request

### Return Status Tracking

Customers can see:

- Request status
- Approval/rejection date
- Refund amount
- Admin notes (if relevant)

---

## 🔄 Complete Return Workflow Example

```typescript
// STEP 1: Customer requests return
const returnReq = await orderService
  .requestReturn(
    'order-123',
    [{ orderItemId: 'item-1', quantity: 1, reason: 'Defective' }],
    'Item is defective',
  )
  .toPromise();

// Status: 'requested'
// Email sent to customer and admin

// STEP 2: Admin reviews
const stats = await orderService.getReturnStats().toPromise();
console.log(`Pending: ${stats.requestedReturns}`);

// STEP 3: Admin approves
const approved = await orderService
  .processReturn({
    returnId: returnReq.id,
    action: 'approve',
    notes: 'Approved for return. Issue RMA number.',
  })
  .toPromise();

// Status: 'approved'
// Email sent to customer with return shipping info

// STEP 4: Customer ships items back
// (Offline process)

// STEP 5: Admin receives and inspects items
// (Offline process)

// STEP 6: Admin completes return and issues refund
const completed = await orderService.completeReturn(returnReq.id).toPromise();

// Status: 'completed'
// Refund: EGP [amount]
// Email sent to customer with refund confirmation
```

---

## 📈 Business Logic

### Refund Calculation

```typescript
FOR EACH return item:
  itemRefund = pricePaid × quantityReturned
  totalRefund += itemRefund

totalRefund does NOT include:
  - Shipping costs
  - Original tax (per policy)
```

### Status Transitions

```
requested
  ├─ → approved (admin action)
  └─ → rejected (admin action)

approved
  └─ → completed (after items received)

rejected
  └─ (no further action)
```

### Return Eligibility Rules

✓ Order status is 'received'
✓ Request made within 14 days
✓ Items in original condition
✗ No return for:

- Digital products
- Custom items
- Opened food items
- Items damaged by customer

---

## 🧪 Testing Return Scenarios

### Scenario 1: Happy Path

```
1. Customer orders product
2. Receives order (status = 'received')
3. Requests return (within 14 days)
4. Admin approves
5. Customer ships back
6. Admin marks complete
7. Refund issued ✓
```

### Scenario 2: Rejected Return

```
1. Customer orders product
2. Receives order
3. Requests return (at 15 days - EXPIRED)
4. Request rejected ✗
5. No refund
```

### Scenario 3: Admin Rejects Return

```
1. Customer orders product
2. Receives order
3. Requests return
4. Admin reviews - sees item is damaged by customer
5. Admin rejects return
6. No refund issued ✗
```

---

## 📝 API Endpoints (When Backend is Ready)

```
POST   /api/returns                    - Request return
GET    /api/returns?userId={id}        - Get user's returns
GET    /api/returns/{returnId}         - Get return details
PUT    /api/returns/{returnId}/process - Approve/reject return (Admin)
PUT    /api/returns/{returnId}/complete- Complete return (Admin)
GET    /api/returns/admin/stats        - Return statistics (Admin)
GET    /api/returns/admin/all          - All returns (Admin)
```

---

## ✅ Implementation Checklist

- [x] Return model and interfaces
- [x] Return eligibility checking
- [x] Return request creation
- [x] Admin return processing
- [x] Refund calculation
- [x] Return statistics
- [x] Audit trail tracking
- [ ] Email notifications
- [ ] RMA number generation
- [ ] Return label generation
- [ ] Backend API endpoints
- [ ] Database persistence
- [ ] Customer UI for return requests
- [ ] Admin dashboard for returns
- [ ] Return tracking page
- [ ] Analytics and reporting
