import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, map, retry, catchError, timeout } from 'rxjs/operators';
import { Cart, CartItem, CartSummary } from '../models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private apiUrl = 'http://localhost:5000/api'; // تغيير حسب backend URL

  private cart = new BehaviorSubject<Cart>({
    id: '',
    userId: '',
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  public cart$ = this.cart.asObservable();
  private sessionId: string = '';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {
    this.initSessionId();
    // Clear old cart data if storage is getting full before loading
    this.cleanupOldStorageData();
    this.loadCart();
  }

  private cleanupOldStorageData(): void {
    try {
      const stored = localStorage.getItem('cart');
      if (stored) {
        const sizeInKB = new Blob([stored]).size / 1024;
        // If cart is already > 500KB, it's risky. Clear it now.
        if (sizeInKB > 500) {
          console.warn(
            `⚠️ Cart data is large (${sizeInKB.toFixed(2)}KB). Clearing to prevent quota errors.`,
          );
          localStorage.removeItem('cart');
        }
      }
    } catch (e) {
      console.warn('Could not check storage size', e);
    }
  }

  private initSessionId(): void {
    let sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random()}`;
      localStorage.setItem('sessionId', sessionId);
    }
    this.sessionId = sessionId;
  }

  private loadCart(): void {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.getCartFromServer(userId).subscribe(
        (cart) => this.cart.next(cart),
        (error) => {
          console.error('Failed to load cart from server:', error);
          this.loadCartFromStorage();
        },
      );
    } else {
      this.loadCartFromStorage();
    }
  }

  // Public method to reload cart (call this after login or when navigating back to cart)
  public reloadCart(): void {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      // Fetch fresh cart data from server
      this.getCartFromServer(userId).subscribe(
        (cart) => {
          this.cart.next(cart);
          this.saveCartToStorage();
        },
        (error) => {
          console.error('Failed to reload cart from server:', error);
          // Fall back to local storage if server fails
          this.loadCartFromStorage();
        },
      );
    } else {
      // If no user, try to load from storage
      this.loadCartFromStorage();
    }
  }

  private loadCartFromStorage(): void {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        this.cart.next(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load cart from storage');
      }
    }
  }

  private saveCartToStorage(): void {
    try {
      // Store only essential data to save space
      // Don't store full product objects with all images/urls
      const cartToStore = {
        id: this.cart.value.id,
        userId: this.cart.value.userId,
        items: this.cart.value.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          priceChanged: item.priceChanged,
          previousPrice: item.previousPrice,
          // Store only minimal product info
          product: item.product
            ? {
                id: item.product.id,
                name: item.product.name,
                currentPrice: item.product.currentPrice,
                slug: item.product.slug,
                // Skip images array to save space
              }
            : undefined,
        })),
        createdAt: this.cart.value.createdAt,
        updatedAt: this.cart.value.updatedAt,
      };

      const serialized = JSON.stringify(cartToStore);
      // Estimate size in bytes (rough)
      const sizeInKB = new Blob([serialized]).size / 1024;

      // If cart exceeds 1MB, clear it to prevent quota errors
      if (sizeInKB > 1024) {
        console.warn(`⚠️ Cart data too large (${sizeInKB.toFixed(2)}KB). Clearing old cart data.`);
        localStorage.removeItem('cart');
        // Store only the latest item to keep some data
        const minimalCart = {
          id: this.cart.value.id,
          userId: this.cart.value.userId,
          items: this.cart.value.items.slice(0, 5), // Keep only last 5 items
          createdAt: this.cart.value.createdAt,
          updatedAt: this.cart.value.updatedAt,
        };
        localStorage.setItem('cart', JSON.stringify(minimalCart));
        return;
      }

      localStorage.setItem('cart', serialized);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.error(
          '❌ localStorage quota exceeded. Cart will not persist. Clear browser storage to continue.',
        );
        // Optionally clear cart from storage to free up space
        try {
          localStorage.removeItem('cart');
          localStorage.removeItem('sessionId');
          console.log('✅ Cleared localStorage. Please refresh the page.');
        } catch (e) {
          console.error('Failed to clear localStorage', e);
        }
      } else {
        console.error('Error saving cart to storage:', error);
      }
    }
  }

  // Transform backend MongoDB cart format to frontend model
  private transformBackendCart(backendCart: any): Cart {
    if (!backendCart) {
      throw new Error('Invalid cart response from server');
    }

    const getProductImage = (product: any): string => {
      if (!product) return '';
      // Check if product has direct 'image' property
      if (product.image && typeof product.image === 'string') {
        return product.image;
      }
      // Check if product has 'images' array
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        const firstImage = product.images[0];
        if (typeof firstImage === 'string') {
          return firstImage;
        } else if (typeof firstImage === 'object' && firstImage.url) {
          return firstImage.url;
        }
      }
      return '';
    };

    return {
      id: backendCart?._id || backendCart?.id || '',
      userId: backendCart?.user?._id || backendCart?.user || '',
      items: (backendCart?.items || []).map((item: any) => ({
        id: item?._id || item?.product?._id || '',
        productId: item?.product?._id || item?.productId || '',
        quantity: item?.quantity || 0,
        price: item?.price || 0,
        priceChanged: item?.priceChanged || false,
        previousPrice: item?.originalPrice,
        product: item?.product
          ? {
              id: item.product._id,
              name: item.product.name,
              image: getProductImage(item.product),
              currentPrice: item.product.price,
              slug: item.product.slug,
              images: item.product.images,
            }
          : undefined,
      })),
      createdAt: new Date(backendCart?.createdAt || new Date()),
      updatedAt: new Date(backendCart?.updatedAt || new Date()),
    };
  }

  private getCartFromServer(userId: string): Observable<Cart> {
    return this.http
      .get<any>(`${this.apiUrl}/cart`, {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      })
      .pipe(
        // backend returns { success, cart } in many endpoints — unwrap if present
        map((resp) => resp?.cart ?? resp),
        map((backendCart) => this.transformBackendCart(backendCart)),
      );
  }

  addToCart(item: CartItem): Observable<Cart> {
    const userId = this.authService.getCurrentUserId();
    const currentCart = this.cart.value;

    // If this is a guest user and the productId doesn't look like a Mongo ObjectId
    // (e.g. mock data with ids like '1', '2', etc.), don't call the backend because
    // the server will attempt to cast to ObjectId and return an error. Instead,
    // update the local cart in-memory and persist to localStorage so the UI works
    // while using mock frontend data.
    const looksLikeObjectId = (id?: string) =>
      typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
    if (!userId && !looksLikeObjectId(item.productId)) {
      // Create a local item id to identify it in the frontend cart
      const localItemId = `local-${Date.now()}-${Math.round(Math.random() * 100000)}`;
      const localItem: CartItem = {
        ...item,
        id: localItemId,
      };

      // Merge into current cart (aggregate quantity if same productId exists)
      const existing = currentCart.items.find((i) => i.productId === item.productId);
      if (existing) {
        existing.quantity = (existing.quantity || 0) + item.quantity;
      } else {
        currentCart.items.push(localItem);
      }

      this.cart.next(currentCart);
      this.saveCartToStorage();

      return new Observable((observer) => {
        observer.next(currentCart);
        observer.complete();
      });
    }

    if (userId) {
      // إرسال للـ Server - استخدم endpoint /api/cart/add
      // تأكد من إرسال productId و quantity فقط كما يتوقع Backend
      const payload = {
        productId: item.productId,
        quantity: item.quantity,
      };

      return this.http
        .post<any>(`${this.apiUrl}/cart/add`, payload, {
          headers: {
            Authorization: `Bearer ${this.authService.getToken()}`,
            'X-Session-ID': this.sessionId,
          },
        })
        .pipe(
          timeout(10000), // 10 second timeout
          retry({
            count: 2,
            delay: 1000, // Wait 1 second before retry
          }),
          // unwrap wrapper { success, message, cart }
          map((resp) => {
            console.log('🔵 Add to cart response from backend:', resp);
            const backendCart = resp?.cart ?? resp;
            const transformedCart = this.transformBackendCart(backendCart);
            console.log('✅ Transformed cart:', transformedCart);
            return transformedCart;
          }),
          tap((updatedCart) => {
            console.log('📦 Updating cart BehaviorSubject with:', updatedCart);
            this.cart.next(updatedCart);
            this.saveCartToStorage();
          }),
          catchError((error) => {
            console.error('❌ Add to cart error after retries:', error);
            // Don't update cart on error!
            return throwError(() => error);
          }),
        );
    } else {
      // إرسال للـ Server كـ guest user مع sessionId
      const payload = {
        productId: item.productId,
        quantity: item.quantity,
      };

      return this.http
        .post<any>(`${this.apiUrl}/cart/add`, payload, {
          headers: {
            'X-Session-ID': this.sessionId,
          },
        })
        .pipe(
          timeout(10000), // 10 second timeout
          retry({
            count: 2,
            delay: 1000, // Wait 1 second before retry
          }),
          // unwrap wrapper { success, message, cart }
          map((resp) => {
            console.log('🔵 Add to cart response from backend (guest):', resp);
            const backendCart = resp?.cart ?? resp;
            const transformedCart = this.transformBackendCart(backendCart);
            console.log('✅ Transformed cart (guest):', transformedCart);
            return transformedCart;
          }),
          tap((updatedCart) => {
            console.log('📦 Updating cart BehaviorSubject with (guest):', updatedCart);
            this.cart.next(updatedCart);
            this.saveCartToStorage();
          }),
          catchError((error) => {
            console.error('❌ Add to cart error after retries (guest):', error);
            // Don't update cart on error!
            return throwError(() => error);
          }),
        );
    }
  }

  removeFromCart(itemId: string): Observable<Cart> {
    const userId = this.authService.getCurrentUserId();
    const currentCart = this.cart.value;

    if (userId) {
      return this.http
        .delete<any>(`${this.apiUrl}/cart/${itemId}`, {
          headers: {
            Authorization: `Bearer ${this.authService.getToken()}`,
          },
        })
        .pipe(
          timeout(10000),
          retry({ count: 1, delay: 500 }),
          map((resp) => {
            console.log('🔵 Remove from cart response:', resp);
            const backendCart = resp?.cart ?? resp;
            const transformedCart = this.transformBackendCart(backendCart);
            console.log('✅ Transformed cart after remove:', transformedCart);
            return transformedCart;
          }),
          tap((updatedCart) => {
            console.log('📦 Updating cart after remove:', updatedCart);
            this.cart.next(updatedCart);
            this.saveCartToStorage();
          }),
          catchError((error) => {
            console.error('❌ Remove from cart error:', error);
            return throwError(() => error);
          }),
        );
    } else {
      // For guest users, remove by item ID
      currentCart.items = currentCart.items.filter((i) => i.id !== itemId);
      this.saveCartToStorage();
      this.cart.next(currentCart);
      return new Observable((observer) => {
        observer.next(currentCart);
        observer.complete();
      });
    }
  }

  updateCartItemQuantity(itemId: string, quantity: number): Observable<Cart> {
    console.log('📤 updateCartItemQuantity called:', { itemId, quantity });
    const userId = this.authService.getCurrentUserId();
    const currentCart = this.cart.value;

    if (quantity <= 0) {
      console.log('❌ Quantity <= 0, calling removeFromCart');
      return this.removeFromCart(itemId);
    }

    if (userId) {
      console.log(
        '🔵 Authenticated user, sending PUT request to:',
        `${this.apiUrl}/cart/${itemId}`,
      );
      return this.http
        .put<any>(
          `${this.apiUrl}/cart/${itemId}`,
          { quantity },
          {
            headers: {
              Authorization: `Bearer ${this.authService.getToken()}`,
            },
          },
        )
        .pipe(
          timeout(10000),
          retry({ count: 2, delay: 1000 }),
          map((resp) => {
            console.log('🔵 Update quantity response:', resp);
            const backendCart = resp?.cart ?? resp;
            const transformedCart = this.transformBackendCart(backendCart);
            console.log('✅ Transformed cart:', transformedCart);
            return transformedCart;
          }),
          tap((updatedCart) => {
            console.log('📦 Updating cart BehaviorSubject:', updatedCart);
            this.cart.next(updatedCart);
            this.saveCartToStorage();
          }),
          catchError((error) => {
            console.error('❌ Update quantity error:', error);
            return throwError(() => error);
          }),
        );
    } else {
      console.log('👤 Guest user, updating local cart');
      // For guest users, find by product ID
      const item = currentCart.items.find((i) => i.id === itemId);
      console.log('Found item:', item);
      if (item) {
        item.quantity = quantity;
        this.saveCartToStorage();
        this.cart.next(currentCart);
      } else {
        console.warn('⚠️ Item not found in local cart:', itemId);
      }
      return new Observable((observer) => {
        observer.next(currentCart);
        observer.complete();
      });
    }
  }

  getCart(): Cart {
    return this.cart.value;
  }

  getCartSummary(): CartSummary {
    const cart = this.cart.value;
    let subtotal = 0;
    const priceChangedItems: CartItem[] = [];

    cart.items.forEach((item) => {
      subtotal += item.price * item.quantity;
      if (item.priceChanged) {
        priceChangedItems.push(item);
      }
    });

    const tax = subtotal * 0.1; // 10% tax
    const shipping = subtotal > 0 ? (subtotal > 100 ? 0 : 10) : 0; // Free shipping over 100
    const total = subtotal + tax + shipping;

    return {
      subtotal,
      tax,
      shipping,
      total,
      itemCount: cart.items.length,
      priceChangedItems,
    };
  }

  clearCart(): Observable<Cart> {
    const userId = this.authService.getCurrentUserId();
    const emptyCart: Cart = {
      id: '',
      userId: userId || '',
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (userId) {
      return this.http
        .delete<any>(`${this.apiUrl}/cart`, {
          headers: {
            Authorization: `Bearer ${this.authService.getToken()}`,
          },
        })
        .pipe(
          map((resp) => resp?.cart ?? resp),
          tap((cart) => {
            // backend sometimes returns wrapper without cart; ensure empty cart when needed
            if (!cart || !cart.items) {
              this.cart.next(emptyCart);
            } else {
              this.cart.next(cart);
            }
            localStorage.removeItem('cart');
          }),
        );
    } else {
      this.cart.next(emptyCart);
      localStorage.removeItem('cart');
      return new Observable((observer) => {
        observer.next(emptyCart);
        observer.complete();
      });
    }
  }

  getCartItemCount(): number {
    return this.cart.value.items.length;
  }

  mergeCartAfterLogin(userId: string): Observable<Cart> {
    const localCart = this.getCart();
    return this.http
      .post<Cart>(
        `${this.apiUrl}/cart/merge`,
        { items: localCart.items },
        {
          headers: {
            Authorization: `Bearer ${this.authService.getToken()}`,
          },
        },
      )
      .pipe(
        tap((mergedCart) => {
          this.cart.next(mergedCart);
          this.saveCartToStorage();
        }),
      );
  }

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
}
