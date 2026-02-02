import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header.component';
import { FooterComponent } from '../../shared/components/footer.component';
import { CartService } from '../../core/services/cart.service';
import { NotificationService } from '../../core/services/notification.service';
import { Cart, CartItem } from '../../core/models';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
})
export class CartComponent implements OnInit {
  constructor(
    private router: Router,
    private cartService: CartService,
    private notificationService: NotificationService,
  ) {}

  cartItems: any[] = [];
  priceChangedItems: any[] = [];
  subtotal = 0;
  tax = 0;
  shipping = 0;
  total = 0;
  isLoading = true;
  isEmpty = false;

  ngOnInit() {
    this.loadCart();
    // Reload cart every time this component is initialized (when user navigates back)
    this.cartService.reloadCart();
  }

  loadCart(): void {
    // Subscribe to cart$ from CartService to get real-time updates
    this.cartService.cart$.subscribe((cart: Cart) => {
      this.isLoading = false;
      if (!cart || cart.items.length === 0) {
        this.isEmpty = true;
        this.cartItems = [];
        this.priceChangedItems = [];
      } else {
        this.isEmpty = false;
        // Map backend cart items to component format
        const mappedItems = cart.items.map((item: any) => {
          console.log('🔵 Mapping cart item:', item);
          console.log('   Product data:', item.product);
          console.log('   Product image:', item.product?.image);
          console.log('   Product images:', item.product?.images);
          const mapped = {
            id: item.id, // MongoDB _id created by service transformation
            itemId: item.id, // Store the MongoDB item ID (same as id from service)
            productId: item.productId,
            name: item.product?.name || 'Unknown Product',
            image: this.getProductImage(item.product),
            price: item.price,
            total: item.price * item.quantity, // Calculate total for this item
            originalPrice: item.originalPrice,
            newPrice: item.newPrice,
            quantity: item.quantity,
            priceChanged: item.priceChanged || false,
            priceAccepted: item.priceAccepted || false,
          };
          console.log('✅ Mapped item with image:', mapped.image);
          return mapped;
        });

        // Separate price-changed items
        this.priceChangedItems = mappedItems.filter((item) => item.priceChanged);
        this.cartItems = mappedItems.filter((item) => !item.priceChanged);
      }
      this.calculateTotals();
    });
  }

  calculateTotals() {
    this.subtotal = this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    this.tax = 0; // Tax removed
    this.shipping = this.subtotal > 100 ? 0 : 10;
    this.total = this.subtotal + this.shipping;
  }

  // Extract image URL from product object (handles both 'image' and 'images' array formats)
  private getProductImage(product: any): string {
    if (!product) {
      console.warn('⚠️ No product data provided');
      return '';
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
    console.warn('⚠️ No image found for product:', product);
    return 'https://via.placeholder.com/80?text=Product';
  }

  updateQuantity(item: any, quantity: number) {
    console.log('🔵 updateQuantity called with:', { item, quantity });
    console.log('item.itemId:', item.itemId);
    console.log('item.id:', item.id);

    if (quantity <= 0) {
      console.log('❌ Quantity <= 0, removing item');
      this.removeItem(item.id);
    } else {
      console.log('📤 Calling updateCartItemQuantity with itemId:', item.itemId);
      // Use itemId (MongoDB _id) instead of productId
      this.cartService.updateCartItemQuantity(item.itemId, quantity).subscribe(
        () => {
          console.log('✅ Quantity updated');
          // Show success notification
          this.notificationService.success(`${item.name} quantity updated`, 'Updated', 2000);
        },
        (error) => {
          console.error('❌ Failed to update quantity:', error);
          // Show error notification
          this.notificationService.error(
            'Failed to update quantity. Please try again.',
            'Error',
            4000,
          );
        },
      );
    }
  }

  removeItem(itemId: string) {
    // Find the item to get its name for the notification
    const itemToRemove = this.cartItems.find((item) => item.id === itemId);
    const itemName = itemToRemove?.name || 'Product';

    this.cartService.removeFromCart(itemId).subscribe(
      () => {
        console.log('Item removed from cart');
        // Show success notification
        this.notificationService.success(
          `${itemName} has been removed from your cart`,
          'Removed from Cart',
          3000,
        );
      },
      (error) => {
        console.error('Failed to remove item:', error);
        // Show error notification
        this.notificationService.error(
          'Failed to remove item from cart. Please try again.',
          'Error',
          4000,
        );
      },
    );
  }

  acceptPriceChange(item: any) {
    this.cartService.updatePriceAcceptance(item.itemId, true).subscribe(
      () => {
        this.notificationService.success(
          `Price for ${item.name} updated to EGP ${item.newPrice}`,
          'Price Accepted',
          3000,
        );
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
        this.notificationService.error('Failed to remove item. Please try again.', 'Error', 4000);
      },
    );
  }

  continueShopping() {
    // Navigate to products listing
    this.router.navigate(['/products']);
  }

  checkout() {
    // Save cart items to sessionStorage for checkout page
    const checkoutData = {
      items: this.cartItems,
      subtotal: this.subtotal,
      tax: this.tax,
      shipping: this.shipping,
      total: this.total,
    };
    sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));

    // Navigate to checkout page
    this.router.navigate(['/checkout']);
  }
}
