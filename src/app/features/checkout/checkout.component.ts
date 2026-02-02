import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { HeaderComponent } from '../../shared/components/header.component';
import { FooterComponent } from '../../shared/components/footer.component';

interface Address {
  id?: string;
  type: 'home' | 'office' | 'other';
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  mobile: string;
  isDefault: boolean;
}

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password?: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
})
export class CheckoutComponent implements OnInit, OnDestroy {
  step: 'userinfo' | 'address' | 'payment' | 'confirmation' = 'userinfo';
  isLoadingOrder = false;
  orderError: string | null = null;
  placedOrder: any = null;
  priceChangedItems: any[] = [];
  hasUnacceptedPriceChanges = false;
  private destroy$ = new Subject<void>();

  // User Data
  currentUser: any = null;
  isLoggedIn = false;
  userInfo: UserData = {
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    password: '',
  };

  // Address Management
  addresses: Address[] = [];
  selectedAddressId = '';
  showAddressForm = false;
  newAddress: Address = {
    type: 'home',
    name: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Egypt',
    mobile: '',
    isDefault: false,
  };

  addressTypes = [
    { value: 'home', label: '🏠 Home' },
    { value: 'office', label: '🏢 Office' },
    { value: 'other', label: '📍 Other' },
  ];

  orderItems: any[] = [];
  subtotal = 0;
  tax = 0;
  shipping = 0;
  total = 0;

  ngOnInit() {
    this.loadUserData();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get selectedAddress(): Address | undefined {
    return this.addresses.find((a) => a.id === this.selectedAddressId);
  }

  loadUserData() {
    // Get current user if logged in
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((user: any) => {
      if (user) {
        this.currentUser = user;
        this.isLoggedIn = true;
        this.userInfo.firstName = user.firstName || '';
        this.userInfo.lastName = user.lastName || '';
        this.userInfo.email = user.email || '';
        this.userInfo.mobile = user.mobile || '';

        // Load user's addresses
        if (user.addresses && user.addresses.length > 0) {
          this.addresses = user.addresses.map((addr: any) => ({
            id: addr._id || addr.id,
            type: addr.type,
            name: addr.name,
            street: addr.street,
            city: addr.city,
            state: addr.state,
            postalCode: addr.postalCode,
            country: addr.country,
            mobile: addr.mobile,
            isDefault: addr.isDefault,
          }));
          const defaultAddr = this.addresses.find((a) => a.isDefault);
          this.selectedAddressId = defaultAddr?.id || this.addresses[0]?.id || '';
        }

        // Skip user info step if logged in
        this.step = 'address';
      } else {
        this.isLoggedIn = false;
      }
    });
  }

  loadData() {
    // Try to get checkout data from sessionStorage (from cart)
    const checkoutDataStr = sessionStorage.getItem('checkoutData');

    if (checkoutDataStr) {
      try {
        const checkoutData = JSON.parse(checkoutDataStr);
        console.log('📦 Checkout data from sessionStorage:', checkoutData);

        // Process items to ensure they have correct image property and calculate total
        this.orderItems = (checkoutData.items || []).map((item: any) => {
          console.log('🔵 Processing checkout item:', item);
          const processed = {
            ...item,
            image: this.getProductImage(item),
            total: item.total || item.price * item.quantity, // Calculate total if not provided
          };
          console.log('✅ Processed item image:', processed.image);
          return processed;
        });

        // Check for price-changed items
        this.priceChangedItems = this.orderItems.filter((item) => item.priceChanged);
        this.hasUnacceptedPriceChanges = this.priceChangedItems.length > 0;

        this.subtotal = checkoutData.subtotal || 0;
        this.tax = 0; // Tax removed
        this.shipping = checkoutData.shipping || 0;
        this.total = checkoutData.total || 0;

        console.log('=== CHECKOUT DATA ===');
        console.log('Items:', this.orderItems);
        console.log('Price Changed Items:', this.priceChangedItems);
        console.log('Subtotal:', this.subtotal);
        console.log('Total:', this.total);
        console.log('====================');
      } catch (error) {
        console.error('Error parsing checkout data:', error);
        this.loadMockData();
      }
    } else {
      this.loadMockData();
    }
  }

  private loadMockData() {
    this.orderItems = [
      {
        productId: '1',
        name: 'Classic White T-Shirt',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=80&h=80&fit=crop',
        quantity: 2,
        price: 29.99,
        total: 59.98,
      },
      {
        productId: '2',
        name: 'Blue Denim Jeans',
        image: 'https://images.unsplash.com/photo-1542272604-787c62d465d1?w=80&h=80&fit=crop',
        quantity: 1,
        price: 59.99,
        total: 59.99,
      },
    ];

    this.subtotal = 119.97;
    this.tax = 0; // Tax removed
    this.shipping = 0;
    this.total = 119.97; // No tax added
  }

  addAddress() {
    if (!this.newAddress.name || !this.newAddress.street || !this.newAddress.city) {
      this.notificationService.error('Please fill in all address fields');
      return;
    }

    const address: Address = {
      ...this.newAddress,
      id: 'addr-' + Date.now(),
    };

    this.addresses.push(address);
    this.selectedAddressId = address.id || '';
    this.showAddressForm = false;

    // Reset form
    this.newAddress = {
      type: 'home',
      name: '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Egypt',
      mobile: '',
      isDefault: false,
    };

    this.notificationService.success('Address added successfully');
  }

  deleteAddress(addressId?: string) {
    const id = addressId || this.selectedAddressId;
    if (!id) return;

    this.addresses = this.addresses.filter((a) => a.id !== id);
    if (this.selectedAddressId === id) {
      this.selectedAddressId = this.addresses[0]?.id || '';
    }
    this.notificationService.success('Address deleted');
  }

  setDefaultAddress(addressId: string) {
    this.addresses.forEach((addr) => {
      addr.isDefault = addr.id === addressId;
    });
    this.notificationService.success('Default address updated');
  }

  selectAddress(addressId: string) {
    this.selectedAddressId = addressId;
  }

  toggleAddressForm() {
    this.showAddressForm = !this.showAddressForm;
    if (!this.showAddressForm) {
      // Reset form when closing
      this.newAddress = {
        type: 'home',
        name: '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Egypt',
        mobile: '',
        isDefault: false,
      };
    }
  }

  // ===== CHECKOUT FLOW =====

  // Step 1: Validate User Info
  validateUserInfo(): boolean {
    if (!this.userInfo.firstName.trim()) {
      this.notificationService.error('Please enter first name');
      return false;
    }
    if (!this.userInfo.lastName.trim()) {
      this.notificationService.error('Please enter last name');
      return false;
    }
    if (!this.userInfo.email.trim()) {
      this.notificationService.error('Please enter email');
      return false;
    }
    if (!this.userInfo.mobile.trim()) {
      this.notificationService.error('Please enter mobile number');
      return false;
    }
    if (!this.isLoggedIn && !this.userInfo.password) {
      this.notificationService.error('Please enter password');
      return false;
    }
    return true;
  }

  continueToAddress() {
    if (!this.validateUserInfo()) {
      return;
    }
    this.step = 'address';
  }

  // Step 2: Validate Address
  continueToPayment() {
    if (this.hasUnacceptedPriceChanges) {
      this.notificationService.error('Please resolve price changes in your cart before proceeding');
      return;
    }
    if (!this.selectedAddressId && !this.newAddress.street) {
      this.notificationService.error('Please select or add an address');
      return;
    }
    this.step = 'payment';
  }

  // Step 3: Confirm Order
  confirmOrder() {
    this.step = 'confirmation';
  }

  // Step 4: Place Order
  placeOrder() {
    if (this.isLoadingOrder) return;

    this.isLoadingOrder = true;
    this.orderError = null;

    // Get selected address
    let shippingAddress = this.addresses.find((a) => a.id === this.selectedAddressId);
    if (!shippingAddress && this.newAddress.street) {
      shippingAddress = this.newAddress;
    }

    if (!shippingAddress) {
      this.notificationService.error('Please select a shipping address');
      this.isLoadingOrder = false;
      return;
    }

    // Build cart items from order items
    const cartItems = this.orderItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    }));

    // Build request payload
    const request = {
      cartItems,
      shippingAddress: {
        name: shippingAddress.name,
        mobile: shippingAddress.mobile,
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
      },
      userInfo: {
        firstName: this.userInfo.firstName,
        lastName: this.userInfo.lastName,
        email: this.userInfo.email,
        mobile: this.userInfo.mobile,
        password: this.isLoggedIn ? undefined : this.userInfo.password,
      },
    };

    // Call the order service to place the order
    this.orderService.placeOrder(request, this.currentUser?.id || 'guest').subscribe(
      (response: any) => {
        this.isLoadingOrder = false;
        this.placedOrder = response.order || response;
        this.step = 'confirmation';

        // Store guest session if user is not logged in
        if (!this.isLoggedIn) {
          sessionStorage.setItem(
            'guestCheckout',
            JSON.stringify({
              orderId: this.placedOrder.id,
              orderNumber: this.placedOrder.orderNumber,
              email: this.userInfo.email,
              mobile: this.userInfo.mobile,
            }),
          );
        }

        this.notificationService.success(
          `Order placed successfully! Order Number: ${this.placedOrder.orderNumber}`,
          '✅ Order Confirmed',
        );

        // Clear cart
        sessionStorage.removeItem('checkoutData');

        // Redirect to orders page after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/orders']);
        }, 3000);
      },
      (error: any) => {
        this.isLoadingOrder = false;
        this.orderError = error?.error?.message || error?.message || 'Failed to place order';
        this.notificationService.error(
          this.orderError || 'Failed to place order',
          '❌ Order Failed',
        );
      },
    );
  }

  cancelCheckout() {
    // Navigate back to cart
    this.router.navigate(['/cart']);
  }

  onImageError(event: any) {
    // Set fallback image if the image fails to load
    event.target.src = 'https://via.placeholder.com/80?text=Product';
  }

  // Extract image URL from product object (handles both 'image' and 'images' array formats)
  private getProductImage(item: any): string {
    // If item already has an image property, use it
    if (item.image && typeof item.image === 'string') {
      console.log('✅ Using item.image:', item.image);
      return item.image;
    }

    // Check if product data is nested in item.product
    const product = item.product || item;

    if (!product) {
      console.warn('⚠️ No product data found in item');
      return 'https://via.placeholder.com/80?text=Product';
    }

    // Check if product has direct 'image' property (from mock data)
    if (product.image && typeof product.image === 'string') {
      console.log('✅ Using product.image:', product.image);
      return product.image;
    }

    // Check if product has 'images' array (from database)
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      const firstImage = product.images[0];
      if (typeof firstImage === 'string') {
        console.log('✅ Using images[0] string:', firstImage);
        return firstImage;
      } else if (typeof firstImage === 'object' && firstImage.url) {
        console.log('✅ Using images[0].url:', firstImage.url);
        return firstImage.url;
      }
    }

    // Return placeholder if no image found
    console.warn('⚠️ No image found, using placeholder');
    return 'https://via.placeholder.com/80?text=Product';
  }

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
  ) {}
}
