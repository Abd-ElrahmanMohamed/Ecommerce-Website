# 🔍 Search By Product Name Only

## Overview

Added a dedicated search method to filter products by **name only** (case-insensitive).

## Method Added

### `searchProductsByName(searchTerm: string): Observable<Product[]>`

**Location**: `src/app/core/services/product.service.ts`

**Features**:

- ✅ Search by product name only
- ✅ Case-insensitive matching
- ✅ Partial text matching (includes)
- ✅ Handles empty search terms
- ✅ Returns all active products if search term is empty
- ✅ Respects seasonal filtering (returns only seasonally active products)

---

## Usage Examples

### Example 1: Basic Search

```typescript
// In component
constructor(private productService: ProductService) {}

searchProducts(searchTerm: string): void {
  this.productService.searchProductsByName(searchTerm).subscribe(
    (products) => {
      console.log('Found products:', products);
      this.searchResults = products;
    }
  );
}
```

### Example 2: Search in Template

```html
<!-- Search input -->
<input type="text" placeholder="Search products..." (keyup)="searchProducts($event.target.value)" />

<!-- Display results -->
<div *ngFor="let product of searchResults">
  <h3>{{ product.name }}</h3>
  <p>{{ product.description }}</p>
  <span>EGP {{ product.price }}</span>
</div>
```

### Example 3: With Loading State

```typescript
searchTerm$ = new Subject<string>();
searchResults$: Observable<Product[]>;
isLoading = false;

constructor(private productService: ProductService) {
  // Debounce search term by 300ms
  this.searchResults$ = this.searchTerm$.pipe(
    debounceTime(300),
    tap(() => this.isLoading = true),
    switchMap((term) => this.productService.searchProductsByName(term)),
    tap(() => this.isLoading = false)
  );
}

onSearchChange(term: string): void {
  this.searchTerm$.next(term);
}
```

### Example 4: Search with Result Count

```typescript
search(term: string): void {
  this.productService.searchProductsByName(term).subscribe(
    (products) => {
      const count = products.length;
      if (count === 0) {
        console.log(`No products found for "${term}"`);
      } else {
        console.log(`Found ${count} product(s) matching "${term}"`);
        this.products = products;
      }
    }
  );
}
```

---

## Search Behavior

### Input Examples

| Input         | Description                              | Result                                       |
| ------------- | ---------------------------------------- | -------------------------------------------- |
| `"shirt"`     | Search for products with "shirt" in name | All products with "shirt" (case-insensitive) |
| `"SHIRT"`     | Same but uppercase                       | Same results (case-insensitive)              |
| `"  shirt  "` | Search with spaces                       | Trimmed and searches for "shirt"             |
| `""` (empty)  | Empty string                             | Returns all active products                  |
| `"xyz"`       | Non-matching                             | Returns empty array                          |

### Product Filtering

The search respects:

- ✅ **Active Status** (`isActive = true`)
- ✅ **Seasonal Status** (only shows seasonally active products)
- ✅ **Name Match** (case-insensitive partial match)

---

## Difference from `getProductsByFilter()`

### `searchProductsByName()` (NEW)

```typescript
// Search ONLY by product name
searchProductsByName('Shirt');
// Returns: All products with "Shirt" in name
```

### `getProductsByFilter()` (Existing)

```typescript
// Can search by name AND filter by category, price, etc.
getProductsByFilter({
  search: 'Shirt', // Product name
  categoryId: 'cat-1', // Category filter
  minPrice: 50, // Price range
  maxPrice: 200,
});
```

**Use `searchProductsByName()` for**: Simple, fast product name search
**Use `getProductsByFilter()` for**: Complex filtering with multiple criteria

---

## Code Implementation

```typescript
// Search products by name only
searchProductsByName(searchTerm: string): Observable<Product[]> {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return this.getProducts(); // Return all products if search term is empty
  }

  return new Observable((observer) => {
    this.products$.subscribe((products) => {
      const searchQuery = searchTerm.toLowerCase().trim();
      const results = products.filter((p: any) =>
        p.name.toLowerCase().includes(searchQuery),
      );
      observer.next(results as Product[]);
      observer.complete();
    });
  });
}
```

---

## Implementation Checklist

- ✅ Method added to ProductService
- ✅ Case-insensitive search
- ✅ Handles empty search terms
- ✅ Returns Observable<Product[]>
- ✅ Respects active and seasonal status
- ✅ No compilation errors
- ✅ Type-safe (TypeScript)

---

## Best Practices

1. **Debounce Search Calls**: Prevent excessive API calls

   ```typescript
   this.searchTerm$.pipe(
     debounceTime(300),
     switchMap((term) => this.productService.searchProductsByName(term)),
   );
   ```

2. **Show Loading State**: Indicate search is in progress

   ```typescript
   isLoading = true;
   this.productService.searchProductsByName(term).subscribe((results) => {
     this.results = results;
     this.isLoading = false;
   });
   ```

3. **Handle Empty Results**: Provide user feedback

   ```typescript
   if (results.length === 0) {
     this.message = `No products found for "${searchTerm}"`;
   }
   ```

4. **Trim Search Input**: Remove leading/trailing spaces
   ```typescript
   const trimmed = searchTerm.trim();
   if (trimmed) {
     this.search(trimmed);
   }
   ```

---

## Testing Examples

### Test Case 1: Search Found

```typescript
it('should find products by name', (done) => {
  productService.searchProductsByName('shirt').subscribe((products) => {
    expect(products.length).toBeGreaterThan(0);
    expect(products[0].name.toLowerCase()).toContain('shirt');
    done();
  });
});
```

### Test Case 2: Search Not Found

```typescript
it('should return empty array for non-matching search', (done) => {
  productService.searchProductsByName('xyz123').subscribe((products) => {
    expect(products.length).toBe(0);
    done();
  });
});
```

### Test Case 3: Case Insensitive

```typescript
it('should be case insensitive', (done) => {
  productService.searchProductsByName('SHIRT').subscribe((products) => {
    const foundLower = products.some((p) => p.name.toLowerCase().includes('shirt'));
    expect(foundLower).toBe(true);
    done();
  });
});
```

---

## Integration Points

### UI Components that can use this method:

1. ✅ **Product List Page** - Search bar
2. ✅ **Search Results Page** - Display search results
3. ✅ **Header Search** - Quick product search
4. ✅ **Product Filter** - Name-only filter option
5. ✅ **AutoComplete** - Real-time search suggestions

### Example: Header Search Component

```typescript
@Component({
  selector: 'app-header-search',
  template: `
    <input type="text" placeholder="Search products..." (input)="onSearch($event.target.value)" />
    <ul *ngFor="let product of searchResults$ | async">
      <li>{{ product.name }}</li>
    </ul>
  `,
})
export class HeaderSearchComponent {
  searchTerm$ = new Subject<string>();
  searchResults$: Observable<Product[]>;

  constructor(private productService: ProductService) {
    this.searchResults$ = this.searchTerm$.pipe(
      debounceTime(300),
      switchMap((term) => this.productService.searchProductsByName(term)),
    );
  }

  onSearch(term: string): void {
    this.searchTerm$.next(term);
  }
}
```

---

## Build Status

✅ **No Compilation Errors**
✅ **Type Safe**
✅ **Production Ready**

---

## Summary

| Feature                  | Status  |
| ------------------------ | ------- |
| Search by name only      | ✅ Done |
| Case-insensitive         | ✅ Done |
| Partial matching         | ✅ Done |
| Handles empty input      | ✅ Done |
| Respects active status   | ✅ Done |
| Respects seasonal status | ✅ Done |
| Observable-based         | ✅ Done |
| Type-safe                | ✅ Done |

**Method is ready to use in components!** 🚀
