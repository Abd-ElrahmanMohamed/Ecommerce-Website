import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header.component';
import { FooterComponent } from '../../shared/components/footer.component';
import { ProductCardComponent } from '../../shared/components/product-card.component';
import { CartService } from '../../core/services/cart.service';
import { NotificationService } from '../../core/services/notification.service';
import { ProductService } from '../../core/services/product.service';
import { ReviewService } from '../../core/services/review.service';
import { CartItem, Cart } from '../../core/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, FooterComponent, ProductCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  bestSellers: any[] = [];
  newArrivals: any[] = [];
  menNewArrivals: any[] = [];
  menBestSellers: any[] = [];
  womenNewArrivals: any[] = [];
  womenBestSellers: any[] = [];
  reviews: any[] = [];
  addingProductIds = new Set<string>(); // Track products being added to cart
  contactInfo = {
    address: 'Cairo, Egypt 123 Main Street',
    email: 'info@fashionstore.com',
    phone: '+20 1234567890',
    hours: '9 AM - 9 PM Daily',
  };

  constructor(
    private cartService: CartService,
    private notificationService: NotificationService,
    private productService: ProductService,
    private reviewService: ReviewService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadData();
    this.loadReviews();
  }

  loadData() {
    // Load products from API
    this.productService.getProducts().subscribe(
      (products) => {
        const apiProducts = products.map((p: any) => ({
          id: p._id || p.id,
          name: p.name,
          price: p.price,
          description: p.description,
          images: p.images?.map((img: any) => img.url || img) || [],
          categoryId: p.category?._id || p.category?.slug || p.category,
          categoryName: p.category?.name || 'Uncategorized',
          quantity: p.stock || 0,
          rating: p.rating || 4.0,
          reviewCount: p.reviewCount || 0,
          isBestSeller: p.isBestSeller || false,
          isNewArrival: p.isNewArrival || false,
          slug: p.slug,
        }));

        // Filter best sellers and new arrivals
        this.bestSellers = apiProducts.filter((p: any) => p.isBestSeller).slice(0, 4);
        this.newArrivals = apiProducts.filter((p: any) => p.isNewArrival).slice(0, 4);

        // Filter by category (Men/Women)
        const menProducts = apiProducts.filter(
          (p: any) =>
            p.categoryName?.toLowerCase().includes('men') ||
            p.categoryId?.toLowerCase().includes('men'),
        );
        const womenProducts = apiProducts.filter(
          (p: any) =>
            p.categoryName?.toLowerCase().includes('women') ||
            p.categoryId?.toLowerCase().includes('women'),
        );

        this.menNewArrivals = menProducts.filter((p: any) => p.isNewArrival).slice(0, 4);
        this.menBestSellers = menProducts.filter((p: any) => p.isBestSeller).slice(0, 4);
        this.womenNewArrivals = womenProducts.filter((p: any) => p.isNewArrival).slice(0, 4);
        this.womenBestSellers = womenProducts.filter((p: any) => p.isBestSeller).slice(0, 4);

        // If no API data, load mock data
        if (apiProducts.length === 0) {
          this.loadMockData();
        }
      },
      (error) => {
        console.error('Failed to load products:', error);
        this.loadMockData();
      },
    );
  }

  loadReviews() {
    // Load approved reviews only
    this.reviewService.getAllReviews().subscribe(
      (reviews: any[]) => {
        this.reviews = reviews
          .filter((r: any) => r.isApproved)
          .slice(0, 3)
          .map((r: any) => ({
            id: r.id,
            userName: r.userName,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt,
          }));
      },
      (error) => {
        console.error('Failed to load reviews:', error);
      },
    );
  }

  loadMockData() {
    // Mock data with better placeholder images
    this.bestSellers = [
      {
        id: '1',
        name: 'Classic White T-Shirt',
        slug: 'classic-white-tshirt',
        price: 29.99,
        images: [
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop',
        ],
        categoryId: 'men',
        quantity: 50,
        status: 'in-stock',
        rating: 4.5,
        reviewCount: 123,
        isBestSeller: true,
        isNewArrival: false,
      },
      {
        id: '2',
        name: 'Blue Denim Jeans',
        slug: 'blue-denim-jeans',
        price: 59.99,
        images: ['https://images.unsplash.com/photo-1542272604-787c62d465d1?w=300&h=300&fit=crop'],
        categoryId: 'men',
        quantity: 30,
        status: 'in-stock',
        rating: 4.8,
        reviewCount: 89,
        isBestSeller: true,
        isNewArrival: false,
      },
    ];

    this.newArrivals = [
      {
        id: '3',
        name: 'Summer Dress',
        slug: 'summer-dress',
        price: 49.99,
        images: [
          'https://images.unsplash.com/photo-1595777707802-e4d3a0b6e2c3?w=300&h=300&fit=crop',
        ],
        categoryId: 'women',
        categoryName: 'Women',
        quantity: 20,
        status: 'in-stock',
        rating: 4.6,
        reviewCount: 156,
        isBestSeller: false,
        isNewArrival: true,
      },
      {
        id: '4',
        name: 'Casual Blazer',
        slug: 'casual-blazer',
        price: 79.99,
        images: [
          'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=300&h=300&fit=crop',
        ],
        categoryId: 'women',
        categoryName: 'Women',
        quantity: 15,
        status: 'in-stock',
        rating: 4.7,
        reviewCount: 78,
        isBestSeller: true,
        isNewArrival: true,
      },
    ];

    this.menNewArrivals = this.bestSellers
      .filter((p) => p.categoryId === 'men' || p.categoryName?.toLowerCase().includes('men'))
      .slice(0, 4);
    this.menBestSellers = this.bestSellers
      .filter((p) => p.categoryId === 'men' || p.categoryName?.toLowerCase().includes('men'))
      .slice(0, 4);

    this.womenNewArrivals = this.newArrivals
      .filter((p) => p.categoryId === 'women' || p.categoryName?.toLowerCase().includes('women'))
      .slice(0, 4);
    this.womenBestSellers = [
      {
        id: '5',
        name: 'Premium Handbag',
        slug: 'premium-handbag',
        price: 89.99,
        images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=300&fit=crop'],
        categoryId: 'women',
        categoryName: 'Women',
        quantity: 25,
        status: 'in-stock',
        rating: 4.9,
        reviewCount: 234,
        isBestSeller: true,
        isNewArrival: false,
      },
      {
        id: '6',
        name: 'Elegant Heels',
        slug: 'elegant-heels',
        price: 69.99,
        images: ['https://images.unsplash.com/photo-1543163521-9145f2c6a384?w=300&h=300&fit=crop'],
        categoryId: 'women',
        categoryName: 'Women',
        quantity: 18,
        status: 'in-stock',
        rating: 4.8,
        reviewCount: 156,
        isBestSeller: true,
        isNewArrival: false,
      },
    ];

    this.reviews = [
      {
        id: '1',
        userName: 'Ahmed Hassan',
        rating: 5,
        comment: 'Excellent quality and fast delivery!',
      },
      {
        id: '2',
        userName: 'Fatima Mohamed',
        rating: 5,
        comment: 'Great products, highly recommended!',
      },
      {
        id: '3',
        userName: 'Omar Ali',
        rating: 4.5,
        comment: 'Good quality, will buy again.',
      },
    ];
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
      (cart: Cart) => {
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
      (err: any) => {
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
    } else {
      console.warn('Product does not have a slug:', product);
    }
  }
}
