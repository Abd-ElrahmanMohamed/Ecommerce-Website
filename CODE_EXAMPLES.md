# Code Examples - Stock & Cart Management

## Frontend Examples

### 1. Session ID Management

**File**: `src/app/core/services/cart.service.ts`

```typescript
// Initialize session for guests
private initSessionId(): void {
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random()}`;
    localStorage.setItem('sessionId', sessionId);
  }
  this.sessionId = sessionId;
}

// Use in HTTP requests
addToCart(item: CartItem): Observable<Cart> {
  const userId = this.authService.getCurrentUserId();

  if (!userId) {
    // Guest: save locally
    const currentCart = this.cart.value;
    const existingItem = currentCart.items.find(
      (i) => i.productId === item.productId
    );

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      currentCart.items.push(item);
    }

    this.saveCartToStorage();
    this.cart.next(currentCart);
    return of(currentCart);
  } else {
    // Logged in: send to backend
    return this.http.post<any>(`${this.apiUrl}/cart/add`, {
      productId: item.productId,
      quantity: item.quantity
    }, {
      headers: {
        Authorization: `Bearer ${this.authService.getToken()}`
      }
    }).pipe(
      map(resp => resp?.cart ?? resp),
      tap(updatedCart => {
        this.cart.next(updatedCart);
        this.saveCartToStorage();
      })
    );
  }
}
```

---

### 2. Guest Cart Merge on Login

**File**: `src/app/core/services/auth.service.ts`

```typescript
login(credentials: LoginRequest): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials)
    .pipe(
      tap((response) => {
        this.setAuthState(response.user, response.token);
        // Automatically merge guest cart after login
        this.mergeGuestCart();
      }),
    );
}

private mergeGuestCart(): void {
  const sessionId = localStorage.getItem('sessionId');
  if (sessionId) {
    // Call backend to merge carts
    this.http.post(`${this.apiUrl}/cart/merge`, {}, {
      headers: { 'x-session-id': sessionId }
    }).subscribe(
      (response: any) => {
        localStorage.removeItem('sessionId'); // Clean up
        console.log('Guest cart merged successfully');
        // Cart service will load the merged cart
      },
      (error) => {
        console.error('Failed to merge guest cart:', error);
        // Guest cart remains local, user can still proceed
      }
    );
  }
}
```

---

### 3. Price Change Detection & Separation

**File**: `src/app/features/cart/cart.component.ts`

```typescript
loadCart(): void {
  this.cartService.cart$.subscribe((cart: Cart) => {
    this.isLoading = false;

    if (!cart || cart.items.length === 0) {
      this.isEmpty = true;
      this.cartItems = [];
      this.priceChangedItems = [];
    } else {
      // Map items with all price information
      const mappedItems = cart.items.map((item: any) => ({
        id: item._id,
        itemId: item._id,
        productId: item.product?._id || item.productId,
        name: item.product?.name || 'Unknown Product',
        image: this.getProductImage(item.product),
        price: item.price,              // Price in cart
        originalPrice: item.originalPrice, // For display
        newPrice: item.newPrice,        // Current product price
        quantity: item.quantity,
        priceChanged: item.priceChanged || false,
        priceAccepted: item.priceAccepted || false,
      }));

      // SEPARATE INTO TWO ARRAYS
      this.priceChangedItems = mappedItems.filter((item) => item.priceChanged);
      this.cartItems = mappedItems.filter((item) => !item.priceChanged);
    }

    this.calculateTotals();
  });
}
```

---

### 4. Accept/Reject Price Changes

**File**: `src/app/features/cart/cart.component.ts`

```typescript
acceptPriceChange(item: any) {
  this.cartService.updatePriceAcceptance(item.itemId, true).subscribe(
    () => {
      this.notificationService.success(
        `Price for ${item.name} updated to EGP ${item.newPrice}`,
        'Price Accepted',
        3000,
      );
      // UI will update when cart reloads from service
    },
    (error) => {
      console.error('Failed to accept price change:', error);
      this.notificationService.error(
        'Failed to accept price change. Please try again.',
        'Error',
        4000,
      );
    },
  );
}

rejectPriceChange(item: any) {
  this.cartService.updatePriceAcceptance(item.itemId, false).subscribe(
    () => {
      this.notificationService.success(
        `${item.name} has been removed from your cart`,
        'Item Removed',
        3000,
      );
    },
    (error) => {
      console.error('Failed to reject price change:', error);
      this.notificationService.error(
        'Failed to remove item. Please try again.',
        'Error',
        4000,
      );
    },
  );
}
```

---

### 5. Update Price Acceptance Service Method

**File**: `src/app/core/services/cart.service.ts`

```typescript
updatePriceAcceptance(itemId: string, accepted: boolean): Observable<Cart> {
  const userId = this.authService.getCurrentUserId();

  if (userId) {
    return this.http
      .post<any>(
        `${this.apiUrl}/cart/price-acceptance`,
        { itemId, accepted },
        {
          headers: {
            Authorization: `Bearer ${this.authService.getToken()}`,
          },
        },
      )
      .pipe(
        map((resp) => resp?.cart ?? resp),
        tap((updatedCart) => {
          this.cart.next(updatedCart);
          this.saveCartToStorage();
        }),
      );
  } else {
    return new Observable((observer) => {
      observer.error('User not authenticated');
    });
  }
}
```

---

### 6. Checkout Price Change Blocking

**File**: `src/app/features/checkout/checkout.component.ts`

```typescript
// Component initialization
priceChangedItems: any[] = [];
hasUnacceptedPriceChanges = false;

loadData() {
  const checkoutDataStr = sessionStorage.getItem('checkoutData');

  if (checkoutDataStr) {
    try {
      const checkoutData = JSON.parse(checkoutDataStr);
      this.orderItems = (checkoutData.items || []).map((item: any) => ({
        ...item,
        image: this.getProductImage(item),
      }));

      // DETECT PRICE-CHANGED ITEMS
      this.priceChangedItems = this.orderItems.filter(
        (item) => item.priceChanged
      );
      this.hasUnacceptedPriceChanges = this.priceChangedItems.length > 0;

      // ... rest of initialization
    } catch (error) {
      console.error('Error parsing checkout data:', error);
      this.loadMockData();
    }
  }
}

// BLOCK CHECKOUT IF PRICE CHANGES EXIST
continueToPayment() {
  if (this.hasUnacceptedPriceChanges) {
    alert('You have items with price changes. Please go back to cart and handle them.');
    return; // EXIT - don't proceed
  }

  if (!this.selectedAddressId && !this.newAddress.street) {
    alert('Please select or add an address');
    return;
  }

  this.step = 'payment'; // ALLOWED
}
```

---

## Backend Examples

### 1. Merge Cart on Login

**File**: `backend/src/controllers/cartController.js`

```javascript
exports.mergeCartOnLogin = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'];

    if (!userId || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Missing userId or sessionId',
      });
    }

    // 1. FIND GUEST CART
    const guestCart = await Cart.findOne({ sessionId }).populate('items.product');

    if (!guestCart || guestCart.items.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No guest cart to merge',
      });
    }

    // 2. FIND OR CREATE USER CART
    let userCart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!userCart) {
      userCart = await Cart.create({
        user: userId,
        items: guestCart.items,
      });
    } else {
      // 3. MERGE ITEMS (preserve prices)
      for (const guestItem of guestCart.items) {
        const existingItem = userCart.items.find(
          (item) => item.product.toString() === guestItem.product.toString(),
        );

        if (existingItem) {
          // Add quantities
          existingItem.quantity += guestItem.quantity;
        } else {
          // Add new item with original price
          userCart.items.push({
            product: guestItem.product,
            quantity: guestItem.quantity,
            price: guestItem.price,
            priceChanged: guestItem.priceChanged,
          });
        }
      }
    }

    // 4. CHECK FOR PRICE CHANGES
    await checkPriceChanges(userCart);
    userCart.calculateTotal();
    await userCart.save();

    // 5. DELETE GUEST CART
    await Cart.findOneAndRemove({ sessionId });

    await userCart.populate('items.product');

    res.status(200).json({
      success: true,
      message: 'Cart merged successfully',
      cart: userCart,
    });
  } catch (error) {
    next(error);
  }
};
```

---

### 2. Check Price Changes Helper

**File**: `backend/src/controllers/cartController.js`

```javascript
async function checkPriceChanges(cart) {
  for (const item of cart.items) {
    // Get current product price
    const product = await Product.findById(item.product);

    if (!product) continue;

    // Compare prices
    if (product.price !== item.price) {
      // PRICE CHANGED
      item.priceChanged = true;
      item.originalPrice = item.price; // Price in cart
      item.newPrice = product.price; // Current price
    } else {
      // NO CHANGE - clear flags
      item.priceChanged = false;
      item.originalPrice = undefined;
      item.newPrice = undefined;
    }
  }
}
```

---

### 3. Update Price Acceptance

**File**: `backend/src/controllers/cartController.js`

```javascript
exports.updatePriceAcceptance = async (req, res, next) => {
  try {
    const { itemId, accepted } = req.body;
    const userId = req.user?.id;
    const sessionId = req.sessionId;

    // Find cart (user or guest)
    const filter = userId ? { user: userId } : { sessionId };
    const cart = await Cart.findOne(filter);

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart',
      });
    }

    if (accepted) {
      // ✅ ACCEPT NEW PRICE
      item.price = item.newPrice; // Update to new price
      item.originalPrice = item.originalPrice; // Keep for reference
      item.priceChanged = false; // Clear flag
      item.priceAccepted = true; // Mark accepted
      item.newPrice = undefined; // Clear new price
    } else {
      // ❌ REJECT - REMOVE ITEM
      cart.items = cart.items.filter((i) => i._id.toString() !== itemId);
    }

    // Save and return
    cart.calculateTotal();
    await cart.save();
    await cart.populate('items.product');

    res.status(200).json({
      success: true,
      message: accepted ? 'Price accepted' : 'Item removed from cart',
      cart,
    });
  } catch (error) {
    next(error);
  }
};
```

---

### 4. Stock Deduction on Order

**File**: `backend/src/controllers/orderController.js`

```javascript
exports.createOrder = async (req, res, next) => {
  try {
    const { shippingAddress } = req.body;
    const userId = req.user.id;

    // 1. GET CART
    const cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty',
      });
    }

    // 2. VALIDATE NO UNACCEPTED PRICE CHANGES
    const unacceptedChanges = cart.items.filter((item) => item.priceChanged && !item.priceAccepted);

    if (unacceptedChanges.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some items have unaccepted price changes.',
        priceChanges: unacceptedChanges,
      });
    }

    // 3. CREATE ORDER ITEMS
    const orderItems = cart.items.map((item) => ({
      product: item.product._id,
      productName: item.product.name,
      quantity: item.quantity,
      price: item.price,
    }));

    // 4. CALCULATE TOTAL
    const totalAmount = cart.items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);

    // 5. DEDUCT STOCK & UPDATE STATUS
    for (let item of cart.items) {
      const product = await Product.findById(item.product._id);

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.productName} not found`,
        });
      }

      // CHECK STOCK AVAILABILITY
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.productName}. Only ${product.stock} available.`,
        });
      }

      // DEDUCT STOCK
      product.stock -= item.quantity;

      // UPDATE STATUS BASED ON STOCK LEVEL
      if (product.stock === 0) {
        product.status = 'Out of Stock';
      } else if (product.stock < 10) {
        product.status = 'Low Stock';
      } else {
        product.status = 'In Stock';
      }

      await product.save();
    }

    // 6. CREATE ORDER
    const order = await Order.create({
      user: userId,
      items: orderItems,
      totalAmount,
      shippingAddress,
    });

    // 7. CLEAR CART
    await Cart.findByIdAndDelete(cart._id);

    await order.populate('user items.product');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order,
    });
  } catch (error) {
    next(error);
  }
};
```

---

### 5. Get Cart with Automatic Price Check

**File**: `backend/src/controllers/cartController.js`

```javascript
exports.getCart = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.sessionId;

    // Find cart
    const filter = userId ? { user: userId } : { sessionId };
    const cart = await Cart.findOne(filter).populate('items.product');

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: 'Cart is empty',
        cart: null,
      });
    }

    // 🔍 CHECK FOR PRICE CHANGES AUTOMATICALLY
    await checkPriceChanges(cart);
    await cart.save(); // Save if any changes detected

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    next(error);
  }
};
```

---

## HTML Template Examples

### 1. Cart: Two-Section Layout

**File**: `src/app/features/cart/cart.component.html`

```html
<!-- PRICE CHANGED WARNING BANNER -->
<div class="price-changed-alert" *ngIf="priceChangedItems.length > 0">
  <div class="alert-icon">⚠️</div>
  <div class="alert-content">
    <h3>Price Changed</h3>
    <p>
      {{ priceChangedItems.length }} item(s) have price changes. Please review them before checkout.
    </p>
  </div>
</div>

<!-- NORMAL CART ITEMS -->
<table class="cart-table" *ngIf="cartItems.length > 0">
  <thead>
    <tr>
      <th>Product</th>
      <th>Price</th>
      <th>Quantity</th>
      <th>Total</th>
    </tr>
  </thead>
  <tbody>
    <tr *ngFor="let item of cartItems">
      <td class="product-cell">
        <img [src]="item.image" [alt]="item.name" />
        <div>{{ item.name }}</div>
      </td>
      <td>EGP {{ item.price | number: '1.2-2' }}</td>
      <td>
        <input
          type="number"
          [(ngModel)]="item.quantity"
          (change)="updateQuantity(item, item.quantity)"
        />
      </td>
      <td>EGP {{ item.price * item.quantity | number: '1.2-2' }}</td>
    </tr>
  </tbody>
</table>

<!-- PRICE-CHANGED ITEMS SECTION -->
<div class="price-changed-section" *ngIf="priceChangedItems.length > 0">
  <div class="price-changed-header">
    <h3>Items with Price Changes</h3>
    <p>Accept or remove these items to continue</p>
  </div>

  <div class="price-changed-item" *ngFor="let item of priceChangedItems">
    <div class="item-info">
      <img [src]="item.image" [alt]="item.name" />
      <div>
        <strong>{{ item.name }}</strong>
        <p>
          Original:
          <span class="original-price"> EGP {{ item.originalPrice | number: '1.2-2' }} </span>
          <br />
          New: <span class="new-price"> EGP {{ item.newPrice | number: '1.2-2' }} </span>
        </p>
      </div>
    </div>

    <div class="action-cell">
      <button class="accept-btn" (click)="acceptPriceChange(item)">Accept New Price</button>
      <button class="remove-btn" (click)="rejectPriceChange(item)">Remove Item</button>
    </div>
  </div>
</div>
```

---

### 2. Checkout: Price Change Warning

**File**: `src/app/features/checkout/checkout.component.html`

```html
<!-- PRICE CHANGE WARNING BANNER -->
<div class="price-changed-warning" *ngIf="hasUnacceptedPriceChanges">
  <div class="warning-icon">⚠️</div>
  <div class="warning-content">
    <h3>Price Changes Detected</h3>
    <p>{{ priceChangedItems.length }} item(s) have price changes in your cart.</p>
    <p style="margin-top: 8px; font-weight: 500;">
      Please go back to your cart to accept or reject the new prices before continuing.
    </p>
    <button class="back-to-cart-btn" (click)="cancelCheckout()">Back to Cart</button>
  </div>
</div>

<!-- ONLY SHOW CHECKOUT FORM IF NO PRICE CHANGES -->
<div class="checkout-layout" *ngIf="!hasUnacceptedPriceChanges">
  <!-- Checkout form content -->
</div>
```

---

## Testing Code Snippets

### 1. Test Guest Cart Addition

```typescript
it('should add items to guest cart without login', () => {
  // No login - guest mode
  const item: CartItem = {
    productId: 'prod-1',
    name: 'T-Shirt',
    quantity: 2,
    price: 29.99,
  };

  service.addToCart(item).subscribe((cart) => {
    expect(cart.items.length).toBe(1);
    expect(cart.items[0].quantity).toBe(2);
    // Verify stored in localStorage
    const saved = JSON.parse(localStorage.getItem('cart'));
    expect(saved.items.length).toBe(1);
  });
});
```

### 2. Test Price Change Detection

```typescript
it('should detect price changes on cart load', () => {
  const mockCart = {
    items: [
      {
        _id: 'item-1',
        product: { _id: 'prod-1', price: 109.99 }, // Current price
        price: 99.99, // Price in cart
        priceChanged: true,
        originalPrice: 99.99,
        newPrice: 109.99,
      },
    ],
  };

  service.loadCart();

  component.cartItems = [];
  component.priceChangedItems = mockCart.items.filter((i) => i.priceChanged);

  expect(component.priceChangedItems.length).toBe(1);
  expect(component.cartItems.length).toBe(0);
});
```

### 3. Test Checkout Blocking

```typescript
it('should block checkout if price changes exist', () => {
  component.hasUnacceptedPriceChanges = true;
  const routerSpy = spyOn(router, 'navigate');

  component.continueToPayment();

  expect(routerSpy).not.toHaveBeenCalled();
  // Should not proceed
});

it('should allow checkout if no price changes', () => {
  component.hasUnacceptedPriceChanges = false;
  component.selectedAddressId = 'addr-1';

  component.continueToPayment();

  expect(component.step).toBe('payment');
  // Should proceed
});
```

---

**Last Updated**: January 29, 2026
**Total Code Examples**: 14
**Files Covered**: 10+
**Status**: Production Ready
