# Order Data Integrity Strategy

## Overview

This document outlines the data integrity mechanisms implemented to ensure accurate order tracking and reporting even when product prices change after purchase.

## Price Storage (السعر بيتسجل في)

### 1. **Order Level** (`Order.total`, `Order.subtotal`, `Order.tax`, `Order.shipping`)

- **Purpose**: Immutable record of what the customer paid
- **Updated**: Only once when order is placed
- **Never Changed**: Even if product prices change later
- **Example**:
  ```typescript
  {
    subtotal: 500.00,      // Sum of all items' exact prices
    tax: 50.00,            // 10% of subtotal
    shipping: 10.00,       // Based on subtotal at time of order
    total: 560.00          // Final amount paid
  }
  ```

### 2. **Order Items Level** (`OrderItem.price`, `OrderItem.total`)

- **Purpose**: Record of individual item prices at time of purchase
- **Stored For Each Item**:
  ```typescript
  {
    productId: "prod-123",
    productName: "T-Shirt",
    quantity: 2,
    price: 99.99,          // Exact price paid per unit
    total: 199.98          // quantity × price
  }
  ```
- **Why**: If product price changes from 99.99 → 149.99, the order still shows what was actually paid

## Data Integrity Verification

### Method: `verifyOrderIntegrity(orderId)`

```typescript
// Recalculates totals from items and compares with stored values
{
  valid: true,
  stored: { subtotal: 500, tax: 50, shipping: 10, total: 560 },
  calculated: { subtotal: 500, tax: 50, shipping: 10, total: 560 },
  message: "Order data is valid"
}
```

## Accurate Reporting (التقارير والحسابات تفضل سليمة)

### Methods for Accurate Reports:

#### 1. **getAccurateRevenue()**

- Returns total revenue based on **actual prices paid**
- Not affected by current product prices
- Breakdown by order status

#### 2. **generateSalesReport(startDate?, endDate?)**

- Comprehensive report with:
  - Total revenue (from order.total)
  - Total tax collected
  - Total shipping costs
  - Product units sold
  - Average order value
  - Status breakdown
  - Optional date range filtering

#### 3. **getOrderAudit(orderId)**

- Complete audit trail of an order
- Shows:
  - All items with prices paid
  - Original pricing information
  - Immutable record

## Implementation Details

### Price Calculation Flow

```
Cart Items (with current prices)
          ↓
Customer Places Order
          ↓
System Records:
  ├─ Each item's price (snapshot)
  ├─ Quantity
  ├─ Item total (quantity × price)
  ├─ Order subtotal
  ├─ Tax (10%)
  ├─ Shipping (free if > 100 EGP)
  └─ Order total
          ↓
Stored Permanently in Database
  (Never changes, even if product prices update)
          ↓
Used for:
  ├─ Accurate revenue calculations
  ├─ Financial reports
  ├─ Customer order history
  └─ Audit trails
```

### Key Features

1. **Immutable Price History**
   - Prices stored at order creation time
   - Can never be retroactively changed
   - Prevents data corruption

2. **Decimal Precision**
   - All prices use `toFixed(2)` for accuracy
   - Prevents floating-point errors
   - Consistent 2-decimal place format

3. **Validation**
   - Input validation (quantity, price as valid numbers)
   - Integrity verification methods
   - Automatic recalculation checks

4. **Audit Trail**
   - Order creation timestamp
   - Order modification timestamp
   - Status history (can be extended)
   - Complete item details

## Usage Examples

### Creating an Order with Data Integrity

```typescript
const request: PlaceOrderRequest = {
  cartItems: [
    {
      productId: 'prod-1',
      productName: 'T-Shirt Blue',
      productImage: 'url...',
      quantity: 2,
      price: 99.99,
    },
  ],
  shippingAddress: {
    /* ... */
  },
  userInfo: {
    /* ... */
  },
};

// Service automatically stores all prices
this.orderService.placeOrder(request, userId).subscribe((order) => {
  // order.items[0].price = 99.99 (immutable)
  // order.total = 209.98 + tax + shipping
});
```

### Verifying Order Integrity

```typescript
this.orderService.verifyOrderIntegrity(orderId).subscribe((result) => {
  if (result.valid) {
    console.log('Order data is correct');
  } else {
    console.error('Data integrity issue detected');
    // Alert admin for investigation
  }
});
```

### Getting Accurate Reports

```typescript
this.orderService.generateSalesReport(startDate, endDate).subscribe((report) => {
  console.log(`Total Revenue: ${report.totalRevenue}`);
  console.log(`Total Tax: ${report.totalTax}`);
  console.log(`Average Order: ${report.averageOrderValue}`);
});
```

## Database Schema Implications

When this is moved to a backend database:

```sql
-- Orders table
CREATE TABLE orders (
  id VARCHAR(50) PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE,
  user_id VARCHAR(50),
  subtotal DECIMAL(10,2) NOT NULL,  -- Immutable
  tax DECIMAL(10,2) NOT NULL,        -- Immutable
  shipping DECIMAL(10,2) NOT NULL,   -- Immutable
  total DECIMAL(10,2) NOT NULL,      -- Immutable
  status VARCHAR(20),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  PRIMARY KEY (id)
);

-- Order items table (immutable record of prices)
CREATE TABLE order_items (
  id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50),
  product_id VARCHAR(50),
  product_name VARCHAR(255),
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,      -- Immutable (price paid)
  total DECIMAL(10,2) NOT NULL,      -- Immutable (qty × price)
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

## Benefits

✅ **Accurate Financial Reporting** - Revenue calculations never affected by price changes
✅ **Data Audit Trail** - Complete history of what customer paid
✅ **Fraud Prevention** - Cannot retroactively change order prices
✅ **Compliance** - Immutable records for accounting/legal
✅ **Customer Trust** - Order details match what they paid
✅ **Analytics** - Historical pricing data for trend analysis

## Next Steps

1. Implement database persistence for orders
2. Add encryption for sensitive order data
3. Create admin audit log viewer
4. Implement automated integrity checks
5. Add archival for old orders
