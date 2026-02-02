# API Reference - New Endpoints

## Stock & Cart Management Features

### 1. MERGE CART ON LOGIN

**Endpoint**: `POST /api/cart/merge`

**Purpose**: Merge guest cart with user cart after login

**Authentication**: Required (Bearer Token)

**Headers**:

```
Authorization: Bearer <token>
x-session-id: <session-id>
```

**Request Body**:

```json
{}
```

**Response Success (200)**:

```json
{
  "success": true,
  "message": "Cart merged successfully",
  "cart": {
    "_id": "507f1f77bcf86cd799439011",
    "user": "507f1f77bcf86cd799439012",
    "items": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "product": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Product Name",
          "price": 99.99,
          "images": ["image1.jpg"],
          "stock": 5,
          "status": "In Stock"
        },
        "quantity": 2,
        "price": 99.99,
        "priceChanged": false,
        "originalPrice": null,
        "newPrice": null,
        "priceAccepted": false,
        "addedAt": "2026-01-29T17:58:43.957Z"
      }
    ],
    "totalPrice": 199.98,
    "createdAt": "2026-01-29T17:58:43.957Z",
    "updatedAt": "2026-01-29T17:58:43.957Z"
  }
}
```

**Response Error (400)**:

```json
{
  "success": false,
  "message": "No guest cart to merge"
}
```

---

### 2. UPDATE PRICE ACCEPTANCE

**Endpoint**: `POST /api/cart/price-acceptance`

**Purpose**: Accept or reject price changes for cart items

**Authentication**: Required (Bearer Token) OR Session-based

**Headers**:

```
Authorization: Bearer <token>  (if logged in)
x-session-id: <session-id>     (if guest)
```

**Request Body**:

```json
{
  "itemId": "507f1f77bcf86cd799439013",
  "accepted": true
}
```

**Parameters**:

- `itemId` (String, Required): MongoDB ID of cart item
- `accepted` (Boolean, Required):
  - `true` = Accept new price (updates item price to newPrice)
  - `false` = Remove item from cart

**Response Success (200) - When Accepted**:

```json
{
  "success": true,
  "message": "Price accepted",
  "cart": {
    "_id": "507f1f77bcf86cd799439011",
    "items": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "product": "507f1f77bcf86cd799439014",
        "quantity": 2,
        "price": 109.99, // Updated to new price
        "priceChanged": false, // Cleared
        "originalPrice": 99.99, // Stored for reference
        "newPrice": 109.99,
        "priceAccepted": true // Set to true
      }
    ],
    "totalPrice": 219.98
  }
}
```

**Response Success (200) - When Rejected**:

```json
{
  "success": true,
  "message": "Item removed from cart",
  "cart": {
    "_id": "507f1f77bcf86cd799439011",
    "items": [
      // Item removed from here
    ],
    "totalPrice": 199.98
  }
}
```

**Response Error (404)**:

```json
{
  "success": false,
  "message": "Item not found in cart"
}
```

---

### 3. GET CART (MODIFIED)

**Endpoint**: `GET /api/cart`

**Purpose**: Retrieve user cart with automatic price change detection

**Authentication**: Optional (Bearer Token if logged in, sessionId if guest)

**Headers**:

```
Authorization: Bearer <token>      (if logged in)
x-session-id: <session-id>         (if guest, auto-generated if missing)
```

**Response Success (200)**:

```json
{
  "success": true,
  "cart": {
    "_id": "507f1f77bcf86cd799439011",
    "user": "507f1f77bcf86cd799439012",
    "items": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "product": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Classic White T-Shirt",
          "price": 109.99, // Current product price
          "images": ["image1.jpg"],
          "stock": 3,
          "status": "Low Stock"
        },
        "quantity": 2,
        "price": 99.99, // Price when added to cart
        "priceChanged": true, // System detects price mismatch
        "originalPrice": 99.99, // Price in cart
        "newPrice": 109.99, // Current product price
        "priceAccepted": false
      }
    ],
    "totalPrice": 199.98
  }
}
```

**What Changed**:

- ✅ Now automatically detects price changes
- ✅ Populates priceChanged flag if prices differ
- ✅ Sets originalPrice and newPrice for comparison
- ✅ Client can use this to separate and display price-changed items

---

### 4. CREATE ORDER (MODIFIED)

**Endpoint**: `POST /api/order`

**Purpose**: Place order with stock deduction and validation

**Authentication**: Required (Bearer Token)

**Headers**:

```
Authorization: Bearer <token>
```

**Request Body**:

```json
{
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Cairo",
    "state": "Cairo",
    "zipCode": "12345",
    "country": "Egypt"
  }
}
```

**Response Success (201)**:

```json
{
  "success": true,
  "message": "Order placed successfully",
  "order": {
    "_id": "507f1f77bcf86cd799439020",
    "user": "507f1f77bcf86cd799439012",
    "items": [
      {
        "product": "507f1f77bcf86cd799439014",
        "productName": "Classic White T-Shirt",
        "quantity": 2,
        "price": 99.99
      }
    ],
    "totalAmount": 199.98,
    "status": "pending",
    "createdAt": "2026-01-29T17:58:43.957Z"
  }
}
```

**Response Error (400) - Price Changes**:

```json
{
  "success": false,
  "message": "Some items have unaccepted price changes. Please review them first.",
  "priceChanges": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "product": "507f1f77bcf86cd799439014",
      "originalPrice": 99.99,
      "newPrice": 109.99,
      "quantity": 2
    }
  ]
}
```

**Response Error (400) - Insufficient Stock**:

```json
{
  "success": false,
  "message": "Insufficient stock for Classic White T-Shirt. Only 2 available."
}
```

**What Changed**:

- ✅ Validates no unaccepted price changes exist
- ✅ Checks stock availability before deduction
- ✅ Deducts stock for each product
- ✅ Automatically updates product status:
  - `stock = 0` → `"Out of Stock"`
  - `stock < 10` → `"Low Stock"`
  - Otherwise → `"In Stock"`
- ✅ Clears cart after successful order

---

## Example Request Flow

### Complete Flow: Guest → Login → Order

#### Step 1: Guest Adds to Cart

```bash
POST /api/cart/add
Headers: x-session-id: session-123...

Body:
{
  "productId": "507f1f77bcf86cd799439014",
  "quantity": 2
}

Response:
{
  "success": true,
  "cart": {
    "sessionId": "session-123...",
    "items": [...]
  }
}
```

#### Step 2: Guest Logs In

```bash
POST /api/auth/login

Body:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}

Frontend: Automatically calls merge endpoint
```

#### Step 3: Frontend Merges Cart

```bash
POST /api/cart/merge
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
  x-session-id: session-123...

Response:
{
  "success": true,
  "message": "Cart merged successfully",
  "cart": { ... }
}
```

#### Step 4: User Views Cart

```bash
GET /api/cart
Headers: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Response:
{
  "success": true,
  "cart": {
    "items": [
      {
        "priceChanged": false,  // No price changes yet
        "price": 99.99,
        ...
      }
    ]
  }
}
```

#### Step 5: Admin Changes Price (Simulated)

```
Database: Product.price changed from 99.99 to 109.99
```

#### Step 6: User Reloads Cart

```bash
GET /api/cart
Headers: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Response:
{
  "success": true,
  "cart": {
    "items": [
      {
        "priceChanged": true,        // ✅ Detected!
        "price": 99.99,              // Original price in cart
        "originalPrice": 99.99,
        "newPrice": 109.99,          // Current product price
        ...
      }
    ]
  }
}

Frontend: Displays warning and price-changed section
```

#### Step 7: User Accepts Price

```bash
POST /api/cart/price-acceptance
Headers: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Body:
{
  "itemId": "507f1f77bcf86cd799439013",
  "accepted": true
}

Response:
{
  "success": true,
  "message": "Price accepted",
  "cart": {
    "items": [
      {
        "priceChanged": false,      // ✅ Cleared
        "price": 109.99,            // Updated to new price
        "priceAccepted": true,
        ...
      }
    ]
  }
}

Frontend: Item moves to normal cart
```

#### Step 8: User Places Order

```bash
POST /api/order
Headers: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Body:
{
  "shippingAddress": { ... }
}

Response:
{
  "success": true,
  "message": "Order placed successfully",
  "order": {
    "_id": "507f1f77bcf86cd799439020",
    "items": [
      {
        "quantity": 2,
        "price": 109.99  // New price applied
      }
    ]
  }
}

Backend:
- ✅ Stock deducted (product.stock -= 2)
- ✅ Status updated if stock = 0
- ✅ Cart cleared
```

---

## Status Codes Reference

| Code | Meaning                                         |
| ---- | ----------------------------------------------- |
| 200  | Success - Request processed                     |
| 201  | Success - Resource created                      |
| 400  | Bad Request - Invalid data or validation failed |
| 404  | Not Found - Resource doesn't exist              |
| 500  | Server Error - Internal server error            |

---

## Error Handling Guide

### Frontend Best Practices

```typescript
// Always check for error responses
updatePriceAcceptance(itemId, accepted).subscribe(
  (response) => {
    // Success
    if (response.success) {
      this.cart = response.cart;
    }
  },
  (error) => {
    // Error handling
    const message = error?.error?.message || 'Operation failed';
    this.notificationService.error(message);
  },
);
```

### Common Error Scenarios

1. **Unaccepted Price Changes**
   - Check `response.priceChanges` array
   - Display items that need action
   - Block checkout

2. **Insufficient Stock**
   - Show message to user
   - Suggest quantity reduction
   - Link to similar products

3. **Invalid Item ID**
   - Item might have been removed
   - Reload cart data
   - Show reload button

---

**Last Updated**: January 29, 2026
**API Version**: v1.0
**Status**: Production Ready
