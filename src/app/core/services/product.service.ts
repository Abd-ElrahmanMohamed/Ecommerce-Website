import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable, of, tap, catchError } from 'rxjs';
import { Product, ProductFilter, ProductSearchResult } from '../models';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { SeasonalService } from './seasonal.service';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'http://localhost:5000/api';

  // BehaviorSubject for reactive updates
  private products = new BehaviorSubject<Product[]>([]);
  public products$ = this.products.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private seasonalService: SeasonalService,
  ) {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.fetchProducts().subscribe(
      (response: any) => {
        console.log('=== PRODUCTS RESPONSE ===');
        console.log('Response:', response);
        const productList = Array.isArray(response) ? response : response.products || [];
        console.log('Product List:', productList);
        console.log('========================');
        this.products.next(productList);
      },
      (error) => {
        console.error('Failed to load products:', error);
      },
    );
  }

  // Fetch products from API
  private fetchProducts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/products`);
  }

  // Get all active products (customers)
  public getProducts(): Observable<Product[]> {
    return new Observable((observer) => {
      this.products$.subscribe((products) => {
        let active = (products || []).filter((p: any) => p.isActive !== false);

        // Filter by seasonal status
        active = active.filter((p: any) => {
          if (!p.isSeasonal) return true;
          return this.seasonalService.isProductSeasonallyActive(p);
        });

        observer.next(active as Product[]);
        observer.complete();
      });
    });
  }

  // Get product by ID
  getProductById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/products/${id}`);
  }

  // Get product by slug
  getProductBySlug(slug: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/products/${slug}`);
  }

  // Create new product (Admin)
  createProduct(product: Product): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/products`, product, {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      })
      .pipe(
        tap((response: any) => {
          // Immediately add the new product to the BehaviorSubject
          const currentProducts = this.products.value;
          this.products.next([...currentProducts, response] as any);
        }),
      );
  }

  // Create new product with image (Admin)
  createProductWithImage(formData: FormData): Observable<any> {
    // Log FormData for debugging
    console.log('=== CREATE PRODUCT WITH IMAGE ===');
    formData.forEach((value, key) => {
      console.log(`${key}:`, value);
    });
    console.log('==================================');

    return this.http
      .post(`${this.apiUrl}/products`, formData, {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
          // Let the browser set Content-Type for FormData with files
        },
      })
      .pipe(
        tap((response: any) => {
          // Immediately add the new product to the BehaviorSubject
          const currentProducts = this.products.value;
          this.products.next([...currentProducts, response] as any);
        }),
      );
  }

  // Update product (Admin)
  updateProduct(id: string, product: Product): Observable<any> {
    return this.http
      .put(`${this.apiUrl}/products/${id}`, product, {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      })
      .pipe(
        tap((response: any) => {
          // Update the product in the BehaviorSubject
          const currentProducts = this.products.value;
          const updatedProducts = currentProducts.map((p: any) =>
            p._id === id || p.id === id ? response : p,
          );
          this.products.next(updatedProducts as any);
        }),
      );
  }

  // Update product with image (Admin)
  updateProductWithImage(id: string, formData: FormData): Observable<any> {
    // Log FormData for debugging
    console.log('=== UPDATE PRODUCT WITH IMAGE ===');
    formData.forEach((value, key) => {
      console.log(`${key}:`, value);
    });
    console.log('==================================');

    return this.http
      .put(`${this.apiUrl}/products/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
          // Let the browser set Content-Type for FormData with files
        },
      })
      .pipe(
        tap((response: any) => {
          // Update the product in the BehaviorSubject
          const currentProducts = this.products.value;
          const updatedProducts = currentProducts.map((p: any) =>
            p._id === id || p.id === id ? response : p,
          );
          this.products.next(updatedProducts as any);
        }),
      );
  }

  /**
   * Soft Delete - Mark product as inactive (isActive = false)
   * المنتج لا يُحذف من قاعدة البيانات، فقط يُخفى عن العملاء
   */
  deleteProduct(id: string): Observable<any> {
    const token = this.authService.getToken();
    console.log('🔵 Deleting product:', id);
    console.log('🔐 Token present:', !!token);
    console.log('📍 Endpoint:', `${this.apiUrl}/products/${id}`);

    if (!token) {
      console.error('❌ No authentication token found!');
      throw new Error('Authentication required');
    }

    // Use DELETE endpoint which backend implements
    return this.http
      .delete(`${this.apiUrl}/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .pipe(
        tap((response: any) => {
          console.log('✅ Product deleted successfully:', response);
          // Update the product in the BehaviorSubject (mark as inactive)
          const currentProducts = this.products.value;
          const updatedProducts = currentProducts.map((p: any) =>
            p._id === id || p.id === id ? { ...p, isActive: false } : p,
          );
          this.products.next(updatedProducts as any);
        }),
        catchError((error: any) => {
          console.error('❌ Failed to delete product:', error);
          console.error('Status:', error.status);
          console.error('Message:', error.message);
          console.error('Response:', error.error);
          throw error;
        }),
      );
  }

  /**
   * Restore deleted product (set isActive back to true)
   */
  restoreProduct(id: string): Observable<any> {
    return this.http
      .patch(
        `${this.apiUrl}/products/${id}/restore`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.authService.getToken()}`,
          },
        },
      )
      .pipe(
        tap((response: any) => {
          // Update the product in the BehaviorSubject
          const currentProducts = this.products.value;
          const updatedProducts = currentProducts.map((p: any) =>
            p._id === id || p.id === id ? { ...p, isActive: true } : p,
          );
          this.products.next(updatedProducts as any);
        }),
      );
  }

  // Reload products
  public reloadProducts(): void {
    this.loadProducts();
  }

  // Force reload products (for after add/update/delete operations)
  public forceReloadProducts(): Observable<Product[]> {
    return this.fetchProducts().pipe(
      tap((response: any) => {
        const productList = Array.isArray(response) ? response : response.products || [];
        this.products.next(productList);
      }),
    );
  }

  // Legacy methods for compatibility
  getProductsByFilter(filter?: ProductFilter): Observable<ProductSearchResult> {
    return new Observable((observer) => {
      this.products$.subscribe((products) => {
        let results = [...products];

        if (filter) {
          if (filter.categoryId) {
            results = results.filter((p: any) => p.categoryId === filter.categoryId);
          }
          if (filter.search) {
            results = results.filter((p: any) =>
              p.name.toLowerCase().includes(filter.search!.toLowerCase()),
            );
          }
          if (filter.minPrice) {
            results = results.filter((p: any) => p.price >= filter.minPrice!);
          }
          if (filter.maxPrice) {
            results = results.filter((p: any) => p.price <= filter.maxPrice!);
          }
        }

        const page = filter?.page || 1;
        const limit = filter?.limit || 12;
        const start = (page - 1) * limit;
        const paginatedResults = results.slice(start, start + limit);
        const totalPages = Math.ceil(results.length / limit);

        observer.next({
          products: paginatedResults,
          total: results.length,
          page,
          limit,
          totalPages,
        });
        observer.complete();
      });
    });
  }

  // Search products by name only
  searchProductsByName(searchTerm: string): Observable<Product[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return this.getProducts(); // Return all products if search term is empty
    }

    return new Observable((observer) => {
      this.products$.subscribe((products) => {
        const searchQuery = searchTerm.toLowerCase().trim();
        const results = products.filter((p: any) => p.name.toLowerCase().includes(searchQuery));
        observer.next(results as Product[]);
        observer.complete();
      });
    });
  }

  getBestSellers(): Observable<Product[]> {
    return new Observable((observer) => {
      this.products$.subscribe((products) => {
        const bestSellers = products.filter((p: any) => p.isBestSeller);
        observer.next(bestSellers);
        observer.complete();
      });
    });
  }

  getNewArrivals(): Observable<Product[]> {
    return new Observable((observer) => {
      this.products$.subscribe((products) => {
        const newArrivals = products.filter((p: any) => p.isNewArrival);
        observer.next(newArrivals);
        observer.complete();
      });
    });
  }

  searchProducts(query: string): Observable<Product[]> {
    return new Observable((observer) => {
      this.products$.subscribe((products) => {
        const results = products.filter((p: any) =>
          p.name.toLowerCase().includes(query.toLowerCase()),
        );
        observer.next(results);
        observer.complete();
      });
    });
  }

  /**
   * Admin: Enable/Disable a product
   * isEnabled = true: visible to customers
   * isEnabled = false: hidden from customers
   */
  toggleProductStatus(id: string, isEnabled: boolean): Observable<any> {
    const updateData = { isEnabled };
    return this.http
      .patch(`${this.apiUrl}/products/${id}/status`, updateData, {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      })
      .pipe(
        tap((response: any) => {
          // Update the product in the BehaviorSubject
          const currentProducts = this.products.value;
          const updatedProducts = currentProducts.map((p: any) =>
            p._id === id || p.id === id ? { ...p, isEnabled } : p,
          );
          this.products.next(updatedProducts as any);
        }),
      );
  }

  /**
   * Admin: Change product status (In Stock, Low Stock, Out of Stock)
   */
  changeProductStatus(id: string, status: string): Observable<any> {
    const updateData = { status };
    return this.http
      .patch(`${this.apiUrl}/products/${id}/status`, updateData, {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      })
      .pipe(
        tap((response: any) => {
          // Update the product in the BehaviorSubject
          const currentProducts = this.products.value;
          const updatedProducts = currentProducts.map((p: any) =>
            p._id === id || p.id === id ? { ...p, status } : p,
          );
          this.products.next(updatedProducts as any);
        }),
      );
  }

  /**
   * Admin: Get all products with admin details
   */
  getAdminProducts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/products/admin/all`, {
      headers: {
        Authorization: `Bearer ${this.authService.getToken()}`,
      },
    });
  }

  /**
   * Admin: Get product statistics
   */
  getProductStatistics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/products/admin/statistics`, {
      headers: {
        Authorization: `Bearer ${this.authService.getToken()}`,
      },
    });
  }

  /**
   * Admin: Get products by status
   */
  getProductsByStatus(status: string): Observable<Product[]> {
    return new Observable((observer) => {
      this.products$.subscribe((products) => {
        const results = products.filter((p: any) => p.status === status);
        observer.next(results);
        observer.complete();
      });
    });
  }

  /**
   * Admin: Get disabled products
   */
  getDisabledProducts(): Observable<Product[]> {
    return new Observable((observer) => {
      this.products$.subscribe((products) => {
        const results = products.filter((p: any) => !p.isEnabled);
        observer.next(results);
        observer.complete();
      });
    });
  }

  /**
   * Admin: Bulk toggle products
   */
  bulkToggleProducts(ids: string[], isEnabled: boolean): Observable<any> {
    const updateData = { ids, isEnabled };
    return this.http
      .patch(`${this.apiUrl}/products/bulk/status`, updateData, {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      })
      .pipe(
        tap((response: any) => {
          // Reload products after bulk operation
          this.forceReloadProducts().subscribe();
        }),
      );
  }

  /**
   * Admin: Bulk delete products (soft delete)
   * يخفي المنتجات دون حذفها نهائياً
   */
  bulkDeleteProducts(ids: string[]): Observable<any> {
    return this.http
      .post(
        `${this.apiUrl}/products/bulk/soft-delete`,
        { ids },
        {
          headers: {
            Authorization: `Bearer ${this.authService.getToken()}`,
          },
        },
      )
      .pipe(
        tap((response: any) => {
          // Mark deleted products as inactive
          const currentProducts = this.products.value;
          const updatedProducts = currentProducts.map((p: any) =>
            ids.includes(p._id) || ids.includes(p.id) ? { ...p, isActive: false } : p,
          );
          this.products.next(updatedProducts as any);
        }),
      );
  }

  /**
   * Admin: Get soft-deleted (inactive) products
   * يعرض المنتجات المخفية فقط
   */
  getSoftDeletedProducts(): Observable<Product[]> {
    return new Observable((observer) => {
      this.products$.subscribe((products) => {
        const deleted = products.filter((p: any) => p.isActive === false);
        observer.next(deleted);
        observer.complete();
      });
    });
  }

  /**
   * Admin: Bulk restore products
   * استرجاع المنتجات المخفية
   */
  bulkRestoreProducts(ids: string[]): Observable<any> {
    return this.http
      .post(
        `${this.apiUrl}/products/bulk/restore`,
        { ids },
        {
          headers: {
            Authorization: `Bearer ${this.authService.getToken()}`,
          },
        },
      )
      .pipe(
        tap((response: any) => {
          // Restore products (set isActive to true)
          const currentProducts = this.products.value;
          const updatedProducts = currentProducts.map((p: any) =>
            ids.includes(p._id) || ids.includes(p.id) ? { ...p, isActive: true } : p,
          );
          this.products.next(updatedProducts as any);
        }),
      );
  }

  /**
   * Admin: Get all products including deleted ones
   * يعرض جميع المنتجات (النشطة والمخفية)
   */
  getAllProductsIncludingDeleted(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products/admin/all-including-deleted`, {
      headers: {
        Authorization: `Bearer ${this.authService.getToken()}`,
      },
    });
  }

  /**
   * Get active products only (for customers)
   * يعرض المنتجات النشطة فقط
   */
  getActiveProducts(): Observable<Product[]> {
    return new Observable((observer) => {
      this.products$.subscribe((products) => {
        const active = products.filter((p: any) => p.isActive !== false);
        observer.next(active);
        observer.complete();
      });
    });
  }

  /**
   * Get product by slug (only active)
   */
  getActiveProductBySlug(slug: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/products/by-slug/${slug}`);
  }

  // ==================== SEASONAL PRODUCTS ====================

  /**
   * Get seasonal products (for admin)
   * الحصول على المنتجات الموسمية
   */
  getSeasonalProducts(): Observable<Product[]> {
    return new Observable((observer) => {
      this.products$.subscribe((products) => {
        const seasonal = products.filter((p: any) => p.isSeasonal === true);
        observer.next(seasonal);
        observer.complete();
      });
    });
  }

  /**
   * Get products by season
   * الحصول على المنتجات حسب الموسم
   */
  getProductsBySeason(season: string): Observable<Product[]> {
    return new Observable((observer) => {
      this.products$.subscribe((products) => {
        const byseason = products.filter((p: any) => p.isSeasonal === true && p.season === season);
        observer.next(byseason);
        observer.complete();
      });
    });
  }

  /**
   * Get active seasonal products (current season only)
   * الحصول على المنتجات الموسمية النشطة الآن
   */
  getActiveSeasonalProductsNow(): Observable<Product[]> {
    return new Observable((observer) => {
      this.products$.subscribe((products) => {
        const activeSeasonal = products.filter((p: any) => {
          if (!p.isSeasonal) return false;
          return this.seasonalService.isProductSeasonallyActive(p);
        });
        observer.next(activeSeasonal);
        observer.complete();
      });
    });
  }

  /**
   * Set product as seasonal with specific season
   * تعيين المنتج كموسمي
   */
  setProductSeasonal(
    productId: string,
    season: string,
    startDate?: Date,
    endDate?: Date,
  ): Observable<any> {
    return this.seasonalService.setProductSeasonal(productId, season as any, startDate, endDate);
  }

  /**
   * Remove seasonal marking
   * إزالة الطابع الموسمي
   */
  removeSeasonalMarking(productId: string): Observable<any> {
    return this.seasonalService.removeSeasonalMarking(productId);
  }

  /**
   * Bulk set products as seasonal
   * تعيين عدة منتجات كموسمية
   */
  bulkSetSeasonal(
    productIds: string[],
    season: string,
    startDate?: Date,
    endDate?: Date,
  ): Observable<any> {
    return this.seasonalService.bulkSetSeasonal(productIds, season as any, startDate, endDate);
  }

  /**
   * Activate seasonal product
   * تفعيل المنتج الموسمي
   */
  activateSeasonalProduct(productId: string): Observable<any> {
    return this.seasonalService.activateSeasonalProduct(productId);
  }

  /**
   * Deactivate seasonal product
   * إخفاء المنتج الموسمي
   */
  deactivateSeasonalProduct(productId: string): Observable<any> {
    return this.seasonalService.deactivateSeasonalProduct(productId);
  }

  /**
   * Bulk activate seasonal products
   * تفعيل عدة منتجات موسمية
   */
  bulkActivateSeasonal(productIds: string[]): Observable<any> {
    return this.seasonalService.bulkActivateSeasonal(productIds);
  }

  /**
   * Bulk deactivate seasonal products
   * إخفاء عدة منتجات موسمية
   */
  bulkDeactivateSeasonal(productIds: string[]): Observable<any> {
    return this.seasonalService.bulkDeactivateSeasonal(productIds);
  }

  /**
   * Sync seasonal products
   * مزامنة المنتجات الموسمية
   */
  syncSeasonalProducts(): Observable<any> {
    return this.seasonalService.syncSeasonalProducts();
  }

  /**
   * Get seasonal statistics
   * إحصائيات المنتجات الموسمية
   */
  getSeasonalStatistics(): Observable<any> {
    return this.seasonalService.getSeasonalStatistics();
  }
}
