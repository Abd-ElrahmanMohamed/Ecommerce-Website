import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { tap, map, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Season } from '../models';

/**
 * Seasonal Products Service
 * إدارة المنتجات الموسمية
 *
 * منتجات الصيف تتخفى في الشتاء وترجع تتفعل تاني
 */
@Injectable({
  providedIn: 'root',
})
export class SeasonalService {
  private apiUrl = 'http://localhost:5000/api';

  // Track current season
  private currentSeason = new BehaviorSubject<Season>(this.calculateCurrentSeason());
  public currentSeason$ = this.currentSeason.asObservable();

  // Season dates (Islamic calendar neutral)
  private seasonDates: Record<string, { start: string; end: string }> = {
    spring: { start: '03-21', end: '06-20' }, // Spring Equinox to Summer Solstice
    summer: { start: '06-21', end: '09-22' }, // Summer Solstice to Autumn Equinox
    fall: { start: '09-23', end: '12-20' }, // Autumn Equinox to Winter Solstice
    winter: { start: '12-21', end: '03-20' }, // Winter Solstice to Spring Equinox
    'all-year': { start: '01-01', end: '12-31' }, // All year round
  };

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {
    this.startSeasonalCheck();
  }

  /**
   * Calculate current season based on date
   * حساب الموسم الحالي
   */
  private calculateCurrentSeason(): Season {
    const today = new Date();
    const month = today.getMonth() + 1; // 1-12
    const day = today.getDate();
    const dateStr = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (dateStr >= '03-21' && dateStr <= '06-20') return 'spring';
    if (dateStr >= '06-21' && dateStr <= '09-22') return 'summer';
    if (dateStr >= '09-23' && dateStr <= '12-20') return 'fall';
    return 'winter';
  }

  /**
   * Start automatic season checking every day at midnight
   * فحص تلقائي للموسم كل يوم
   */
  private startSeasonalCheck(): void {
    // Check immediately
    this.updateSeason();

    // Check every day at midnight
    interval(24 * 60 * 60 * 1000).subscribe(() => {
      this.updateSeason();
    });
  }

  /**
   * Update current season
   */
  private updateSeason(): void {
    const newSeason = this.calculateCurrentSeason();
    if (newSeason !== this.currentSeason.value) {
      this.currentSeason.next(newSeason);
      console.log(`🌍 Season changed to: ${newSeason}`);
      // Trigger seasonal product updates
      this.syncSeasonalProducts().subscribe();
    }
  }

  /**
   * Get current season
   */
  getCurrentSeason(): Observable<Season> {
    return this.currentSeason$;
  }

  /**
   * Get season dates
   */
  getSeasonDates(season: Season): { start: string; end: string } {
    return (
      this.seasonDates[season] || this.seasonDates['all-year'] || { start: '01-01', end: '12-31' }
    );
  }

  /**
   * Check if product should be active based on season
   * التحقق مما إذا كان المنتج يجب أن يكون نشطاً
   */
  isProductSeasonallyActive(product: any): boolean {
    if (!product.isSeasonal) return true;

    const today = new Date();
    const startDate = product.seasonStartDate ? new Date(product.seasonStartDate) : null;
    const endDate = product.seasonEndDate ? new Date(product.seasonEndDate) : null;

    // If no dates specified, check season
    if (!startDate || !endDate) {
      if (product.season === 'all-year') return true;
      return product.season === this.currentSeason.value;
    }

    // Check if within date range
    return today >= startDate && today <= endDate;
  }

  /**
   * Activate seasonal product
   * تفعيل المنتج الموسمي
   */
  activateSeasonalProduct(productId: string): Observable<any> {
    return this.http
      .patch(
        `${this.apiUrl}/products/${productId}/seasonal/activate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.authService.getToken()}`,
          },
        },
      )
      .pipe(
        tap((response) => {
          console.log(`✅ Product ${productId} activated for season`);
        }),
      );
  }

  /**
   * Deactivate seasonal product (hide for season)
   * إخفاء المنتج الموسمي
   */
  deactivateSeasonalProduct(productId: string): Observable<any> {
    return this.http
      .patch(
        `${this.apiUrl}/products/${productId}/seasonal/deactivate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.authService.getToken()}`,
          },
        },
      )
      .pipe(
        tap((response) => {
          console.log(`❌ Product ${productId} deactivated for season`);
        }),
      );
  }

  /**
   * Set product as seasonal with specific season
   * تعيين المنتج كموسمي
   */
  setProductSeasonal(
    productId: string,
    season: Season,
    startDate?: Date,
    endDate?: Date,
  ): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/products/${productId}/seasonal/set`,
      {
        isSeasonal: true,
        season,
        seasonStartDate: startDate,
        seasonEndDate: endDate,
      },
      {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      },
    );
  }

  /**
   * Remove seasonal marking from product
   * إزالة الطابع الموسمي من المنتج
   */
  removeSeasonalMarking(productId: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/products/${productId}/seasonal/remove`,
      { isSeasonal: false },
      {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      },
    );
  }

  /**
   * Get all seasonal products
   * الحصول على جميع المنتجات الموسمية
   */
  getSeasonalProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/products/seasonal/all`, {
      headers: {
        Authorization: `Bearer ${this.authService.getToken()}`,
      },
    });
  }

  /**
   * Get seasonal products by season
   * الحصول على المنتجات الموسمية حسب الموسم
   */
  getSeasonalProductsBySeason(season: Season): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/products/seasonal/by-season/${season}`, {
      headers: {
        Authorization: `Bearer ${this.authService.getToken()}`,
      },
    });
  }

  /**
   * Get active seasonal products (for current season)
   * الحصول على المنتجات الموسمية النشطة
   */
  getActiveSeasonalProducts(): Observable<any[]> {
    return this.currentSeason$.pipe(
      switchMap((season) => this.getSeasonalProductsBySeason(season)),
    );
  }

  /**
   * Sync seasonal products (activate/deactivate based on current season)
   * مزامنة المنتجات الموسمية
   */
  syncSeasonalProducts(): Observable<any> {
    return this.http
      .post(
        `${this.apiUrl}/products/seasonal/sync`,
        { currentSeason: this.currentSeason.value },
        {
          headers: {
            Authorization: `Bearer ${this.authService.getToken()}`,
          },
        },
      )
      .pipe(
        tap((response: any) => {
          console.log('🔄 Seasonal products synced:', response);
        }),
      );
  }

  /**
   * Get seasonal product statistics
   * إحصائيات المنتجات الموسمية
   */
  getSeasonalStatistics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/products/seasonal/statistics`, {
      headers: {
        Authorization: `Bearer ${this.authService.getToken()}`,
      },
    });
  }

  /**
   * Bulk set products as seasonal
   * تعيين عدة منتجات كموسمية
   */
  bulkSetSeasonal(
    productIds: string[],
    season: Season,
    startDate?: Date,
    endDate?: Date,
  ): Observable<any> {
    return this.http
      .post(
        `${this.apiUrl}/products/seasonal/bulk-set`,
        {
          productIds,
          season,
          seasonStartDate: startDate,
          seasonEndDate: endDate,
        },
        {
          headers: {
            Authorization: `Bearer ${this.authService.getToken()}`,
          },
        },
      )
      .pipe(
        tap((response) => {
          console.log(`✅ ${productIds.length} products set to seasonal: ${season}`);
        }),
      );
  }

  /**
   * Bulk activate seasonal products
   * تفعيل عدة منتجات موسمية
   */
  bulkActivateSeasonal(productIds: string[]): Observable<any> {
    return this.http
      .post(
        `${this.apiUrl}/products/seasonal/bulk-activate`,
        { productIds },
        {
          headers: {
            Authorization: `Bearer ${this.authService.getToken()}`,
          },
        },
      )
      .pipe(
        tap(() => {
          console.log(`✅ ${productIds.length} seasonal products activated`);
        }),
      );
  }

  /**
   * Bulk deactivate seasonal products
   * إخفاء عدة منتجات موسمية
   */
  bulkDeactivateSeasonal(productIds: string[]): Observable<any> {
    return this.http
      .post(
        `${this.apiUrl}/products/seasonal/bulk-deactivate`,
        { productIds },
        {
          headers: {
            Authorization: `Bearer ${this.authService.getToken()}`,
          },
        },
      )
      .pipe(
        tap(() => {
          console.log(`❌ ${productIds.length} seasonal products deactivated`);
        }),
      );
  }
}
