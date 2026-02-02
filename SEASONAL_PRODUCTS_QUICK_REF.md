# Seasonal Products - Quick Reference

## 🌍 Quick Start

### Mark Products as Seasonal (Admin)

```typescript
// Single product
this.productService.setProductSeasonal(productId, 'summer').subscribe(() => {
  console.log('✅ Product marked as summer');
});

// Bulk products
this.productService.bulkSetSeasonal(productIds, 'winter').subscribe(() => {
  console.log('✅ 10 products marked as winter');
});

// Custom date range (Ramadan, holidays)
this.productService
  .setProductSeasonal(productId, 'all-year', new Date('2024-03-01'), new Date('2024-03-31'))
  .subscribe();
```

---

### Show/Hide Seasonal Products

```typescript
// Show products
this.productService.bulkActivateSeasonal(productIds).subscribe(() => {
  console.log('✅ Products shown');
});

// Hide products
this.productService.bulkDeactivateSeasonal(productIds).subscribe(() => {
  console.log('❌ Products hidden');
});
```

---

### Get Seasonal Products

```typescript
// Customer view (only visible products)
this.productService.getProducts().subscribe((products) => {
  // Already filters seasonal status automatically
});

// Admin: All seasonal products
this.productService.getSeasonalProducts().subscribe((products) => {
  console.log('All seasonal products');
});

// Admin: Summer products only
this.productService.getProductsBySeason('summer').subscribe((products) => {
  console.log('Summer products');
});

// Admin: Currently active seasonal
this.productService.getActiveSeasonalProductsNow().subscribe((products) => {
  console.log('Active right now');
});
```

---

## 📊 Seasons

```
Spring: March 21 - June 20 (🌸)
Summer: June 21 - September 22 (☀️)
Fall:   September 23 - December 20 (🍂)
Winter: December 21 - March 20 (❄️)
All-Year: Full year (custom dates override this)
```

---

## 🤖 Automatic Behavior

✅ Daily sync at midnight
✅ Season detection automatic
✅ Products hide/show automatically
✅ Zero manual intervention needed

---

## 📋 Common Tasks

| Task             | Code                                             |
| ---------------- | ------------------------------------------------ |
| Mark as summer   | `bulkSetSeasonal(ids, 'summer')`                 |
| Mark as winter   | `bulkSetSeasonal(ids, 'winter')`                 |
| Mark for Ramadan | `setProductSeasonal(id, 'all-year', start, end)` |
| Show products    | `bulkActivateSeasonal(ids)`                      |
| Hide products    | `bulkDeactivateSeasonal(ids)`                    |
| Get by season    | `getProductsBySeason('summer')`                  |
| Manual sync      | `syncSeasonalProducts()`                         |
| Stats            | `getSeasonalStatistics()`                        |

---

## ✅ Complete Example

```typescript
// Admin dashboard
export class AdminSeasonalComponent {
  constructor(
    private productService: ProductService,
    private notification: NotificationService,
  ) {}

  // Setup summer collection
  setupSummer() {
    const summerIds = ['tshirt', 'shorts', 'sunglasses', ...];

    this.productService.bulkSetSeasonal(summerIds, 'summer')
      .subscribe({
        next: () => {
          this.notification.success('Summer collection set');
          this.refresh();
        },
        error: (err) => {
          this.notification.error('Failed to set summer');
        }
      });
  }

  // Hide off-season products
  hideWinterProducts() {
    const winterIds = ['coats', 'boots', 'scarves', ...];

    this.productService.bulkDeactivateSeasonal(winterIds)
      .subscribe({
        next: () => {
          this.notification.success('Winter products hidden');
        }
      });
  }

  // Ramadan special
  setupRamadan() {
    const ramadanIds = ['dates', 'lantern', ...];
    const start = new Date('2024-03-01');
    const end = new Date('2024-03-31');

    this.productService.bulkSetSeasonal(
      ramadanIds,
      'all-year',
      start,
      end
    ).subscribe();
  }

  refresh() {
    // Reload view
  }
}
```

---

## 🔍 Check Current Season

```typescript
this.seasonalService.getCurrentSeason().subscribe((season) => {
  console.log(`Current season: ${season}`);
  // summer, winter, spring, fall
});
```

---

## 📱 Product Card Display

```html
<!-- Only show if in season -->
<ng-container *ngIf="productService.getProducts() | async as products">
  <div *ngFor="let product of products" class="product-card">
    <img [src]="product.images[0]" />
    <h3>{{ product.name }}</h3>

    <!-- Show seasonal badge -->
    <span *ngIf="product.isSeasonal" class="badge"> {{ product.season }} Collection </span>
  </div>
</ng-container>
```

---

## 🚨 Important Notes

✅ Products use soft delete (`isActive` flag)
✅ Never permanently delete seasonal products
✅ Use `bulkSetSeasonal` not individual calls
✅ Custom dates override season detection
✅ Automatic sync happens at midnight UTC

---

## API Endpoints (Backend)

```
PATCH  /api/products/:id/seasonal/set
POST   /api/products/seasonal/bulk-set
POST   /api/products/seasonal/bulk-activate
POST   /api/products/seasonal/bulk-deactivate
POST   /api/products/seasonal/sync
GET    /api/products/seasonal/all
GET    /api/products/seasonal/by-season/:season
GET    /api/products/seasonal/statistics
```

---

**Status**: ✅ Production Ready
**Build**: ✅ 0 Errors
