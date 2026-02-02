# Seasonal Products System

## 🌍 نظام المنتجات الموسمية

**Status**: ✅ COMPLETE | **Build**: ✅ 0 ERRORS

---

## Overview

منتجات الصيف تتخفى في الشتاء وترجع تتفعل تاني

The Seasonal Products System allows automatic activation/deactivation of products based on:

- 📅 **Current Season** (Spring, Summer, Fall, Winter)
- 📆 **Custom Date Ranges** (Start Date - End Date)
- 🔄 **Automatic Sync** (Changes at midnight daily)
- 💾 **Soft Delete Only** (Using `isActive` flag, no permanent deletion)

---

## Features

### ✅ Seasonal Management

- Mark products as seasonal
- Assign to specific seasons or date ranges
- Automatic activation/deactivation
- Real-time season detection
- Bulk operations support

### ✅ Automatic Updates

- Daily season check at midnight
- Automatic product visibility toggle
- Zero manual intervention needed
- Event-driven updates

### ✅ Admin Control

- View seasonal products by season
- Manually activate/deactivate products
- Bulk set/activate/deactivate operations
- View seasonal statistics
- Manage activation dates

---

## Data Model

### Product Seasonal Fields

```typescript
export interface Product {
  id: string;
  name: string;
  slug: string;
  isActive: boolean; // Main visibility flag

  // Seasonal Fields
  isSeasonal?: boolean; // Mark as seasonal product
  season?: Season; // 'spring' | 'summer' | 'fall' | 'winter' | 'all-year'
  seasonStartDate?: Date; // Optional custom start date
  seasonEndDate?: Date; // Optional custom end date
  isSeasonalActive?: boolean; // Current seasonal status
}

type Season = 'spring' | 'summer' | 'fall' | 'winter' | 'all-year';
```

### Season Dates (Gregorian Calendar)

```
Spring: March 21 - June 20
Summer: June 21 - September 22
Fall:   September 23 - December 20
Winter: December 21 - March 20
```

---

## Services

### SeasonalService

**Purpose**: Core seasonal product management

#### Current Season Detection

```typescript
getCurrentSeason(): Observable<Season>
```

Returns the current season based on today's date.

**Example**:

```typescript
this.seasonalService.getCurrentSeason().subscribe((season) => {
  console.log(`Current season: ${season}`); // 'summer'
});
```

---

#### Check If Product Is Seasonally Active

```typescript
isProductSeasonallyActive(product: any): boolean
```

Synchronous check if a product should be visible for the current season.

**Logic**:

1. If not seasonal (`isSeasonal !== true`), return `true` (always visible)
2. If has custom dates, check if today is within range
3. Otherwise, check if `season` matches current season

**Example**:

```typescript
const shouldShow = this.seasonalService.isProductSeasonallyActive(product);
if (shouldShow) {
  // Display product
}
```

---

#### Set Product as Seasonal

```typescript
setProductSeasonal(
  productId: string,
  season: Season,
  startDate?: Date,
  endDate?: Date
): Observable<any>
```

Mark a product as seasonal with optional custom date range.

**Parameters**:

- `productId`: Product ID to mark as seasonal
- `season`: Season type ('summer', 'winter', etc.)
- `startDate`: (Optional) Custom activation start date
- `endDate`: (Optional) Custom activation end date

**Example**:

```typescript
// Summer clothes (automatic)
this.seasonalService.setProductSeasonal(productId, 'summer').subscribe(() => {
  console.log('Product marked as summer seasonal');
});

// Ramadan products (custom dates)
const ramadanStart = new Date('2024-03-01');
const ramadanEnd = new Date('2024-03-31');
this.seasonalService
  .setProductSeasonal(productId, 'all-year', ramadanStart, ramadanEnd)
  .subscribe(() => {
    console.log('Product marked as Ramadan only');
  });
```

---

#### Activate/Deactivate Seasonal Product

```typescript
activateSeasonalProduct(productId: string): Observable<any>
deactivateSeasonalProduct(productId: string): Observable<any>
```

Manually toggle a seasonal product's visibility.

**Example**:

```typescript
// Hide for current season
this.seasonalService.deactivateSeasonalProduct(productId).subscribe(() => {
  console.log('Product hidden for season');
});

// Show for current season
this.seasonalService.activateSeasonalProduct(productId).subscribe(() => {
  console.log('Product visible for season');
});
```

---

#### Bulk Operations

```typescript
bulkSetSeasonal(productIds: string[], season: Season, ...): Observable<any>
bulkActivateSeasonal(productIds: string[]): Observable<any>
bulkDeactivateSeasonal(productIds: string[]): Observable<any>
```

Manage multiple seasonal products at once.

**Example**:

```typescript
// Mark 10 products as summer seasonal
const summerProductIds = ['id1', 'id2', ..., 'id10'];
this.seasonalService.bulkSetSeasonal(summerProductIds, 'summer').subscribe(() => {
  console.log('10 products marked as summer');
});

// Hide all summer products now
this.seasonalService.bulkDeactivateSeasonal(summerProductIds).subscribe(() => {
  console.log('All summer products hidden');
});
```

---

#### Sync Seasonal Products

```typescript
syncSeasonalProducts(): Observable<any>
```

Force manual sync of all seasonal products based on current season.

**Automatic**: Runs at midnight daily
**Manual**: Call this after season changes or for testing

**Example**:

```typescript
// Test seasonal product visibility change
this.seasonalService.syncSeasonalProducts().subscribe((result) => {
  console.log('Seasonal products synced:', result);
});
```

---

#### Get Seasonal Products

```typescript
getSeasonalProducts(): Observable<any[]>
getSeasonalProductsBySeason(season: Season): Observable<any[]>
getActiveSeasonalProducts(): Observable<any[]>
getSeasonalStatistics(): Observable<any>
```

Retrieve seasonal product information.

**Example**:

```typescript
// Get all seasonal products
this.seasonalService.getSeasonalProducts().subscribe((products) => {
  console.log('All seasonal products:', products);
});

// Get summer seasonal products
this.seasonalService.getSeasonalProductsBySeason('summer').subscribe((products) => {
  console.log('Summer products:', products);
});

// Get currently active seasonal products
this.seasonalService.getActiveSeasonalProducts().subscribe((products) => {
  console.log('Active now:', products);
});

// Get stats
this.seasonalService.getSeasonalStatistics().subscribe((stats) => {
  console.log('Total seasonal products:', stats.totalSeasonal);
  console.log('By season:', stats.bySeason);
});
```

---

### ProductService Integration

**ProductService** now includes seasonal checks:

#### Get Products (Customers)

```typescript
getProducts(): Observable<Product[]>
```

**Returns**: Active products ONLY (filters by `isActive !== false` AND seasonal status)

**Automatic Filtering**:

1. Removes soft-deleted products (`isActive === false`)
2. Checks seasonal status via `SeasonalService`
3. Returns only visible products for current season

**Example**:

```typescript
// Customer view - only sees products visible now
this.productService.getProducts().subscribe((products) => {
  // Only summer products if it's summer
  // Only winter products if it's winter
  console.log('Available products:', products);
});
```

---

#### Seasonal Product Methods

```typescript
getSeasonalProducts(): Observable<Product[]>
getProductsBySeason(season: string): Observable<Product[]>
getActiveSeasonalProductsNow(): Observable<Product[]>

setProductSeasonal(productId, season, startDate?, endDate?): Observable<any>
removeSeasonalMarking(productId): Observable<any>
bulkSetSeasonal(productIds, season, ...): Observable<any>

activateSeasonalProduct(productId): Observable<any>
deactivateSeasonalProduct(productId): Observable<any>
bulkActivateSeasonal(productIds): Observable<any>
bulkDeactivateSeasonal(productIds): Observable<any>

syncSeasonalProducts(): Observable<any>
getSeasonalStatistics(): Observable<any>
```

---

## Use Cases

### Use Case 1: Summer Clothes Collection

```typescript
// Admin sets up summer clothes as seasonal
const summerClothesIds = ['tshirt1', 'shorts1', 'swimsuit1', ...];

// Mark as summer seasonal (automatic)
this.productService.bulkSetSeasonal(summerClothesIds, 'summer').subscribe(() => {
  console.log('Summer collection set up');
});

// Result:
// - Visible: June 21 - September 22
// - Hidden: September 23 - June 20
// - Automatic change at midnight on transition dates
```

---

### Use Case 2: Ramadan Special Products

```typescript
// Ramadan 2024: March 1 - March 31 (example)
const ramadanStart = new Date('2024-03-01');
const ramadanEnd = new Date('2024-03-31');

const ramadanProductIds = ['dates1', 'lantern1', 'prayer_mat1', ...];

// Mark with custom date range
this.productService.bulkSetSeasonal(
  ramadanProductIds,
  'all-year',
  ramadanStart,
  ramadanEnd
).subscribe(() => {
  console.log('Ramadan products set');
});

// Result:
// - Visible: March 1 - March 31 only
// - Hidden: April 1 onwards
```

---

### Use Case 3: Manual Override

```typescript
// Admin wants to hide summer products early (heat wave season ended)
const summerClothesIds = ['tshirt1', 'shorts1', ...];

// Manual deactivate
this.productService.bulkDeactivateSeasonal(summerClothesIds).subscribe(() => {
  console.log('Summer products hidden manually');
});

// Later, re-activate manually
this.productService.bulkActivateSeasonal(summerClothesIds).subscribe(() => {
  console.log('Summer products shown again');
});
```

---

### Use Case 4: Holiday Products

```typescript
// New Year products (specific dates)
const newYearStart = new Date('2024-12-20');
const newYearEnd = new Date('2025-01-10');

this.productService
  .setProductSeasonal('newyear_decoration_id', 'all-year', newYearStart, newYearEnd)
  .subscribe(() => {
    console.log('New Year products available Dec 20 - Jan 10');
  });
```

---

## Admin Interface Example

```typescript
export class AdminSeasonalComponent {
  seasons = ['spring', 'summer', 'fall', 'winter', 'all-year'];
  currentSeason$ = this.seasonalService.currentSeason$;
  seasonalProducts$ = this.productService.getSeasonalProducts();
  seasonStats$ = this.productService.getSeasonalStatistics();

  constructor(
    private productService: ProductService,
    private seasonalService: SeasonalService,
  ) {}

  // Set products as seasonal
  markAsSeasonal(productIds: string[], season: string) {
    this.productService.bulkSetSeasonal(productIds, season).subscribe(() => {
      this.notificationService.success(`${productIds.length} products marked as ${season}`);
      this.refresh();
    });
  }

  // Hide seasonal products
  hideSeasonal(productIds: string[]) {
    this.productService.bulkDeactivateSeasonal(productIds).subscribe(() => {
      this.notificationService.success('Seasonal products hidden');
      this.refresh();
    });
  }

  // Show seasonal products
  showSeasonal(productIds: string[]) {
    this.productService.bulkActivateSeasonal(productIds).subscribe(() => {
      this.notificationService.success('Seasonal products shown');
      this.refresh();
    });
  }

  // Manually sync
  manualSync() {
    this.productService.syncSeasonalProducts().subscribe(() => {
      this.notificationService.success('Seasonal products synced');
    });
  }

  refresh() {
    this.seasonalProducts$ = this.productService.getSeasonalProducts();
    this.seasonStats$ = this.productService.getSeasonalStatistics();
  }
}
```

---

## Frontend Integration

### Displaying Seasonal Indicator

```typescript
// Product card component
@Input() product: Product;

get isSeasonalProduct(): boolean {
  return this.product.isSeasonal === true;
}

get currentlyActive(): boolean {
  return this.seasonalService.isProductSeasonallyActive(this.product);
}
```

```html
<!-- Product card template -->
<div class="product-card" [class.seasonal]="isSeasonalProduct">
  <img [src]="product.images[0]" alt="" />
  <h3>{{ product.name }}</h3>

  <!-- Seasonal badge -->
  <span *ngIf="isSeasonalProduct" class="seasonal-badge"> {{ product.season }} Collection </span>

  <!-- Stock availability -->
  <div *ngIf="isSeasonalProduct && !currentlyActive" class="coming-soon">
    ⏰ Coming in {{ product.season }}
  </div>
</div>
```

---

## Backend Requirements

### API Endpoints Expected

```
PATCH  /api/products/:id/seasonal/set
PATCH  /api/products/:id/seasonal/activate
PATCH  /api/products/:id/seasonal/deactivate
DELETE /api/products/:id/seasonal/remove

POST   /api/products/seasonal/bulk-set
POST   /api/products/seasonal/bulk-activate
POST   /api/products/seasonal/bulk-deactivate

POST   /api/products/seasonal/sync
GET    /api/products/seasonal/all
GET    /api/products/seasonal/by-season/:season
GET    /api/products/seasonal/statistics
```

---

## Automatic Behavior

### Daily Sync (Midnight)

1. **System Check**: Every day at 00:00, system checks if season changed
2. **Comparison**: Current season vs previous season
3. **Sync**: If changed, calls `/api/products/seasonal/sync` to update all products
4. **Notification**: Console log indicates season change

**Example Log**:

```
🌍 Season changed to: summer
🔄 Seasonal products synced: { updated: 145, activated: 89, deactivated: 56 }
```

---

## Best Practices

### 1. Use Season Names Consistently

```typescript
// ✅ Good
const season = 'summer';

// ❌ Bad
const season = 'SUMMER';
const season = 'Summer';
```

---

### 2. Set Custom Dates for Special Events

```typescript
// Ramadan, holidays, special occasions
this.productService.setProductSeasonal(productId, 'all-year', startDate, endDate);
```

---

### 3. Bulk Operations for Efficiency

```typescript
// ✅ Good - one API call for 100 products
this.productService.bulkSetSeasonal(productIds, 'summer');

// ❌ Bad - 100 API calls
for (let id of productIds) {
  this.productService.setProductSeasonal(id, 'summer').subscribe();
}
```

---

### 4. Don't Delete Seasonal Products

```typescript
// ✅ Good - use soft delete (isActive = false)
this.productService.deactivateSeasonalProduct(productId);

// ❌ Bad - removes permanently
this.productService.hardDeleteProduct(productId);
```

---

## Troubleshooting

### Products Not Showing/Hiding on Season Change

**Issue**: Seasonal products not updating at midnight

**Solution**:

1. Check if `isSeasonal === true` in database
2. Verify `seasonStartDate` and `seasonEndDate` if using custom dates
3. Call `syncSeasonalProducts()` manually:

```typescript
this.productService.syncSeasonalProducts().subscribe(() => {
  console.log('Manual sync complete');
});
```

---

### Wrong Season Detected

**Issue**: Season detection incorrect for your location

**Solution**: Season dates are based on Gregorian calendar (international standard). If you need Islamic calendar or custom dates, use `seasonStartDate` and `seasonEndDate`:

```typescript
this.productService.setProductSeasonal(productId, 'all-year', customStartDate, customEndDate);
```

---

## Summary

| Feature          | Details                                   |
| ---------------- | ----------------------------------------- |
| **Automatic**    | Daily sync at midnight                    |
| **Manual**       | Call `syncSeasonalProducts()`             |
| **Visibility**   | Controlled by `isActive` + seasonal check |
| **Deletion**     | No hard delete (soft delete only)         |
| **Custom Dates** | Support for special events                |
| **Bulk Ops**     | Efficient multi-product operations        |
| **Status**       | ✅ Production Ready                       |

---

**منتجات الصيف تتخفى في الشتاء وترجع تتفعل تاني** ✅

**Production Ready**: ✅ YES | **Build Status**: ✅ 0 ERRORS
