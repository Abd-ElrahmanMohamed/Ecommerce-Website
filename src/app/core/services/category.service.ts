import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Category, SubCategory, CategoryWithSubCategories } from '../models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private apiUrl = 'http://localhost:5000/api/categories';

  // BehaviorSubject for reactive updates
  private categories = new BehaviorSubject<any[]>([]);
  public categories$ = this.categories.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.fetchCategories().subscribe(
      (response: any) => {
        console.log('=== CATEGORIES RESPONSE ===');
        console.log('Response:', response);
        const categoryList = Array.isArray(response) ? response : response.categories || [];
        console.log('Category List:', categoryList);
        console.log('========================');
        this.categories.next(categoryList);
      },
      (error) => {
        console.error('Failed to load categories:', error);
        // Initialize with empty array on error
        this.categories.next([]);
      },
    );
  }

  private fetchCategories(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  /**
   * Public: Get active categories only (customers)
   * Returns categories with isActive !== false
   */
  getCategories(): Observable<any[]> {
    return new Observable((observer) => {
      this.categories$.subscribe((categories) => {
        const active = (categories || []).filter((c: any) => c.isActive !== false);
        observer.next(active);
        observer.complete();
      });
    });
  }

  getCategoryBySlug(slug: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${slug}`);
  }

  createCategory(category: any): Observable<any> {
    return this.http
      .post(this.apiUrl, category, {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      })
      .pipe(
        tap((response: any) => {
          // Add the new category to BehaviorSubject
          const currentCategories = this.categories.value;
          this.categories.next([...currentCategories, response.category || response] as any);
        }),
      );
  }

  updateCategory(id: string, category: any): Observable<any> {
    return this.http
      .put(`${this.apiUrl}/${id}`, category, {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      })
      .pipe(
        tap((response: any) => {
          // Update the category in BehaviorSubject
          const currentCategories = this.categories.value;
          const updatedCategories = currentCategories.map((c: any) =>
            c._id === id || c.id === id ? response.category || response : c,
          );
          this.categories.next(updatedCategories as any);
        }),
      );
  }

  /**
   * Soft Delete - Mark category as inactive
   * الفئة لا تُحذف من قاعدة البيانات، فقط تُخفى
   */
  deleteCategory(id: string): Observable<any> {
    return this.http
      .patch(
        `${this.apiUrl}/${id}/soft-delete`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.authService.getToken()}`,
          },
        },
      )
      .pipe(
        tap(() => {
          // Mark category as inactive
          const currentCategories = this.categories.value;
          const updatedCategories = currentCategories.map((c: any) =>
            c._id === id || c.id === id ? { ...c, isActive: false } : c,
          );
          this.categories.next(updatedCategories as any);
        }),
      );
  }

  /**
   * Hard Delete - Permanently delete category
   * تحذير: هذه العملية لا يمكن التراجع عنها
   */
  hardDeleteCategory(id: string): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}/${id}/hard-delete`, {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      })
      .pipe(
        tap(() => {
          // Remove category permanently
          const currentCategories = this.categories.value;
          const filteredCategories = currentCategories.filter(
            (c: any) => c._id !== id && c.id !== id,
          );
          this.categories.next(filteredCategories as any);
        }),
      );
  }

  /**
   * Restore deleted category
   */
  restoreCategory(id: string): Observable<any> {
    return this.http
      .patch(
        `${this.apiUrl}/${id}/restore`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.authService.getToken()}`,
          },
        },
      )
      .pipe(
        tap((response: any) => {
          // Mark category as active
          const currentCategories = this.categories.value;
          const updatedCategories = currentCategories.map((c: any) =>
            c._id === id || c.id === id ? { ...c, isActive: true } : c,
          );
          this.categories.next(updatedCategories as any);
        }),
      );
  }

  reloadCategories(): void {
    this.loadCategories();
  }

  // Force reload categories (for after add/update/delete operations)
  forceReloadCategories(): Observable<any[]> {
    return this.fetchCategories().pipe(
      tap((response: any) => {
        const categoryList = Array.isArray(response) ? response : response.categories || [];
        this.categories.next(categoryList);
      }),
    );
  }

  getSubCategoriesByCategory(categoryId: string): Observable<SubCategory[]> {
    return this.http.get<SubCategory[]>(`${this.apiUrl}/${categoryId}/subcategories`);
  }

  /**
   * Admin: Create a sub-category
   */
  createSubCategory(categoryId: string, subCategory: any): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/${categoryId}/subcategories`, subCategory, {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      })
      .pipe(
        tap((response: any) => {
          this.forceReloadCategories().subscribe();
        }),
      );
  }

  /**
   * Admin: Update a sub-category
   */
  updateSubCategory(categoryId: string, subCategoryId: string, subCategory: any): Observable<any> {
    return this.http
      .put(`${this.apiUrl}/${categoryId}/subcategories/${subCategoryId}`, subCategory, {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      })
      .pipe(
        tap((response: any) => {
          this.forceReloadCategories().subscribe();
        }),
      );
  }

  /**
   * Admin: Delete a sub-category
   */
  deleteSubCategory(categoryId: string, subCategoryId: string): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}/${categoryId}/subcategories/${subCategoryId}`, {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      })
      .pipe(
        tap((response: any) => {
          this.forceReloadCategories().subscribe();
        }),
      );
  }

  /**
   * Admin: Get category with all sub-categories
   */
  getCategoryWithSubCategories(categoryId: string): Observable<CategoryWithSubCategories> {
    return this.http.get<CategoryWithSubCategories>(
      `${this.apiUrl}/${categoryId}/with-subcategories`,
    );
  }

  /**
   * Admin: Get all categories with product count
   */
  getAdminCategories(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/admin/all`, {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      })
      .pipe(
        tap((response: any) => {
          const categoryList = Array.isArray(response) ? response : response.categories || [];
          this.categories.next(categoryList);
        }),
      );
  }

  /**
   * Admin: Get category statistics
   */
  getCategoryStatistics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/statistics`, {
      headers: {
        Authorization: `Bearer ${this.authService.getToken()}`,
      },
    });
  }

  /**
   * Admin: Bulk delete categories
   */
  /**
   * Admin: Bulk soft-delete categories (mark isActive = false)
   */
  bulkDeleteCategories(ids: string[]): Observable<any> {
    return this.http
      .post(
        `${this.apiUrl}/bulk/soft-delete`,
        { ids },
        {
          headers: {
            Authorization: `Bearer ${this.authService.getToken()}`,
          },
        },
      )
      .pipe(
        tap((response: any) => {
          // Mark as inactive locally
          const currentCategories = this.categories.value;
          const updated = currentCategories.map((c: any) =>
            ids.includes(c._id) || ids.includes(c.id) ? { ...c, isActive: false } : c,
          );
          this.categories.next(updated as any);
        }),
      );
  }

  /**
   * Admin: Get soft-deleted (inactive) categories
   */
  getSoftDeletedCategories(): Observable<Category[]> {
    return new Observable((observer) => {
      this.categories$.subscribe((categories) => {
        const deleted = (categories || []).filter((c: any) => c.isActive === false);
        observer.next(deleted);
        observer.complete();
      });
    });
  }

  /**
   * Admin: Bulk restore categories (set isActive = true)
   */
  bulkRestoreCategories(ids: string[]): Observable<any> {
    return this.http
      .post(
        `${this.apiUrl}/bulk/restore`,
        { ids },
        {
          headers: {
            Authorization: `Bearer ${this.authService.getToken()}`,
          },
        },
      )
      .pipe(
        tap((response: any) => {
          const currentCategories = this.categories.value;
          const updated = currentCategories.map((c: any) =>
            ids.includes(c._id) || ids.includes(c.id) ? { ...c, isActive: true } : c,
          );
          this.categories.next(updated as any);
        }),
      );
  }

  /**
   * Admin: Get all categories including soft-deleted ones
   */
  getAllCategoriesIncludingDeleted(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/all-including-deleted`, {
      headers: {
        Authorization: `Bearer ${this.authService.getToken()}`,
      },
    });
  }

  /**
   * Admin: Search categories
   */
  searchCategories(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/search`, {
      params: { q: query },
      headers: {
        Authorization: `Bearer ${this.authService.getToken()}`,
      },
    });
  }

  /**
   * Admin: Get categories by status
   */
  getCategoriesByStatus(status: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/by-status/${status}`, {
      headers: {
        Authorization: `Bearer ${this.authService.getToken()}`,
      },
    });
  }

  /**
   * Verify category name is unique
   */
  verifyCategoryNameUnique(name: string, excludeId?: string): Observable<any> {
    let url = `${this.apiUrl}/verify-name/${encodeURIComponent(name)}`;
    if (excludeId) {
      url += `?excludeId=${excludeId}`;
    }
    return this.http.get(url);
  }

  /**
   * Get category products count
   */
  getCategoryProductsCount(categoryId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${categoryId}/products-count`, {
      headers: {
        Authorization: `Bearer ${this.authService.getToken()}`,
      },
    });
  }
}
