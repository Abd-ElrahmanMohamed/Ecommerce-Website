import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header.component';
import { FooterComponent } from '../../shared/components/footer.component';
import { ProductCardComponent } from '../../shared/components/product-card.component';
import { CartService } from '../../core/services/cart.service';
import { NotificationService } from '../../core/services/notification.service';
import { ProductService } from '../../core/services/product.service';
import { CartItem, Cart } from '../../core/models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent, ProductCardComponent],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css',
})
export class ProductsComponent implements OnInit, OnDestroy {
  constructor(
    private cartService: CartService,
    private notificationService: NotificationService,
    private productService: ProductService,
    private router: Router,
  ) {}

  products: any[] = [];
  filteredProducts: any[] = [];
  categories: any[] = [];
  selectedCategory = '';
  selectedSort = 'newest';
  minPrice = 0;
  maxPrice = 10000;
  currentPage = 1;
  itemsPerPage = 12;
  isLoading = false;
  addingProductIds = new Set<string>(); // Track products being added to cart
  private subscription: Subscription | null = null;

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    // Clean up subscription
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadData() {
    this.isLoading = true;
    // Load categories
    this.categories = [
      { id: 'men', name: 'Men' },
      { id: 'women', name: 'Women' },
    ];

    // Subscribe to product updates whenever they change
    this.subscription = this.productService.getProducts().subscribe(
      (products) => {
        this.products = products.map((p: any) => ({
          id: p._id || p.id,
          name: p.name,
          price: p.price,
          description: p.description,
          images: p.images?.map((img: any) => img.url || img) || [],
          categoryId: p.category?.slug || p.category,
          quantity: p.stock || 0,
          rating: p.rating || 4.0,
          reviewCount: p.reviews?.length || 0,
          isBestSeller: p.isBestSeller || false,
          isNewArrival: p.isNewArrival || false,
          slug: p.slug,
        }));
        this.filterProducts();
        this.isLoading = false;
      },
      (error) => {
        console.error('Failed to load products:', error);
        this.notificationService.error('Failed to load products', 'Error');
        this.isLoading = false;
        // Fallback to mock data if API fails
        this.loadMockData();
      },
    );
  }

  loadMockData() {
    this.products = [
      // ============ MEN PRODUCTS ============
      {
        id: '1',
        name: 'Classic White T-Shirt',
        price: 29.99,
        images: [
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop',
        ],
        categoryId: 'men',
        quantity: 50,
        rating: 4.5,
        reviewCount: 123,
        isBestSeller: true,
      },
      {
        id: '2',
        name: 'Blue Denim Jeans',
        price: 59.99,
        images: ['https://images.unsplash.com/photo-1542272604-787c62d465d1?w=300&h=300&fit=crop'],
        categoryId: 'men',
        quantity: 30,
        rating: 4.8,
        reviewCount: 89,
        isBestSeller: true,
      },
      {
        id: '4',
        name: 'Black Polo Shirt',
        price: 34.99,
        images: ['https://images.unsplash.com/photo-1550614908-c2a63a317da8?w=300&h=300&fit=crop'],
        categoryId: 'men',
        quantity: 15,
        rating: 4.3,
        reviewCount: 67,
        isBestSeller: false,
      },
      {
        id: '5',
        name: 'Gray Hoodie Jacket',
        price: 69.99,
        images: ['https://images.unsplash.com/photo-1556821552-a06fbf92c49e?w=300&h=300&fit=crop'],
        categoryId: 'men',
        quantity: 25,
        rating: 4.7,
        reviewCount: 145,
        isBestSeller: true,
      },
      {
        id: '6',
        name: 'Casual Cargo Pants',
        price: 54.99,
        images: [
          'https://images.unsplash.com/photo-1473619151873-1acf1b3b76e0?w=300&h=300&fit=crop',
        ],
        categoryId: 'men',
        quantity: 20,
        rating: 4.4,
        reviewCount: 78,
        isNewArrival: true,
      },
      {
        id: '7',
        name: 'Navy Blue Sweater',
        price: 44.99,
        images: [
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop',
        ],
        categoryId: 'men',
        quantity: 18,
        rating: 4.6,
        reviewCount: 92,
        isBestSeller: false,
      },
      {
        id: '8',
        name: 'Striped Casual Shirt',
        price: 39.99,
        images: [
          'https://images.unsplash.com/photo-1608231387042-ec2e0c0b0407?w=300&h=300&fit=crop',
        ],
        categoryId: 'men',
        quantity: 22,
        rating: 4.5,
        reviewCount: 110,
        isNewArrival: true,
      },

      // ============ WOMEN PRODUCTS ============
      {
        id: '3',
        name: 'Summer Dress',
        price: 49.99,
        images: [
          'https://images.unsplash.com/photo-1595777707802-e4d3a0b6e2c3?w=300&h=300&fit=crop',
        ],
        categoryId: 'women',
        quantity: 20,
        rating: 4.6,
        reviewCount: 156,
        isNewArrival: true,
      },
      {
        id: '9',
        name: 'Black Leather Jacket',
        price: 89.99,
        images: ['https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=300&h=300&fit=crop'],
        categoryId: 'women',
        quantity: 12,
        rating: 4.8,
        reviewCount: 98,
        isBestSeller: true,
      },
      {
        id: '10',
        name: 'Pink Casual Blouse',
        price: 39.99,
        images: [
          'https://images.unsplash.com/photo-1596445125769-a5b5d6b5e9bc?w=300&h=300&fit=crop',
        ],
        categoryId: 'women',
        quantity: 28,
        rating: 4.5,
        reviewCount: 134,
        isNewArrival: true,
      },
      {
        id: '11',
        name: 'White Sneakers',
        price: 59.99,
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop'],
        categoryId: 'women',
        quantity: 35,
        rating: 4.7,
        reviewCount: 189,
        isBestSeller: true,
      },
      {
        id: '12',
        name: 'Floral Print Skirt',
        price: 44.99,
        images: [
          'https://images.unsplash.com/photo-1606691261556-f0773b5356d1?w=300&h=300&fit=crop',
        ],
        categoryId: 'women',
        quantity: 16,
        rating: 4.4,
        reviewCount: 76,
        isNewArrival: false,
      },
      {
        id: '13',
        name: 'Gray Athletic Leggings',
        price: 34.99,
        images: [
          'https://images.unsplash.com/photo-1506629082632-ec3cd1b639a5?w=300&h=300&fit=crop',
        ],
        categoryId: 'women',
        quantity: 24,
        rating: 4.6,
        reviewCount: 125,
        isBestSeller: false,
      },
      {
        id: '14',
        name: 'Denim Jacket',
        price: 64.99,
        images: ['https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=300&h=300&fit=crop'],
        categoryId: 'women',
        quantity: 14,
        rating: 4.7,
        reviewCount: 103,
        isBestSeller: true,
      },
    ];
    this.filterProducts();
  }

  filterProducts() {
    let results = [...this.products];

    if (this.selectedCategory) {
      results = results.filter((p) => p.categoryId === this.selectedCategory);
    }

    results = results.filter((p) => p.price >= this.minPrice && p.price <= this.maxPrice);

    // Sort
    switch (this.selectedSort) {
      case 'price-low':
        results.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        results.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        results.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
      default:
        break;
    }

    this.filteredProducts = results;
    this.currentPage = 1;
  }

  onAddToCart(product: any) {
    // Prevent duplicate requests for same product
    if (this.addingProductIds.has(product.id)) {
      console.warn(`Already adding product ${product.id} to cart, please wait...`);
      return;
    }

    this.addingProductIds.add(product.id);

    const item: CartItem = {
      id: `${product.id}`,
      productId: product.id,
      quantity: 1,
      price: product.price,
      priceChanged: false,
      product: {
        id: product.id,
        name: product.name,
        image: product.images?.[0] || '',
        currentPrice: product.price,
        slug: product.slug || '',
      },
    };

    this.cartService.addToCart(item).subscribe(
      (cart) => {
        console.log('Cart updated', cart);
        // Show notification with text immediately
        this.notificationService.success(
          `${product.name || 'Product'} has been added to your cart!`,
          'Added to Cart',
          3000,
        );

        // Reload cart data to ensure it's updated
        setTimeout(() => {
          this.cartService.reloadCart();
        }, 200);

        // Remove from adding set
        this.addingProductIds.delete(product.id);
      },
      (err) => {
        console.error('Failed to add to cart', err);
        // Use setTimeout to ensure notification renders with text
        setTimeout(() => {
          this.notificationService.error(
            'Failed to add product to cart. Please try again.',
            'Error',
            4000,
          );
        }, 100);

        // Remove from adding set (allow retry)
        this.addingProductIds.delete(product.id);
      },
    );
  }

  onViewDetails(product: any) {
    // Navigate to product details page using the product slug
    if (product.slug) {
      this.router.navigate(['/products', product.slug]);
    } else if (product.id) {
      // Fallback to ID if slug is not available
      this.router.navigate(['/products', product.id]);
    } else {
      console.warn('Product does not have a slug or ID:', product);
    }
  }

  resetFilters() {
    this.selectedCategory = '';
    this.minPrice = 0;
    this.maxPrice = 10000;
    this.selectedSort = 'newest';
    this.filterProducts();
  }
}
