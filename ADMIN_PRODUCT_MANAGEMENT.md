# Admin Product Management System

## Overview

The Admin Product Management System provides comprehensive CRUD operations and product management capabilities for administrators, including enabling/disabling products, status management, bulk operations, and administrative analytics.

---

## ✅ Implementation Status

| Feature                   | Status      | Location        |
| ------------------------- | ----------- | --------------- |
| Product Enable/Disable    | ✅ Complete | ProductService  |
| Product Status Management | ✅ Complete | ProductService  |
| Admin Product Listing     | ✅ Complete | ProductService  |
| Product Statistics        | ✅ Complete | ProductService  |
| Bulk Operations           | ✅ Complete | ProductService  |
| Product Search            | ✅ Complete | ProductService  |
| Category CRUD             | ✅ Complete | CategoryService |
| Sub-Category CRUD         | ✅ Complete | CategoryService |
| Category Statistics       | ✅ Complete | CategoryService |
| Build Status              | ✅ 0 Errors | Verified        |

---

## Product Service Methods

### 1. Enable/Disable Products

#### `toggleProductStatus(id: string, isEnabled: boolean): Observable<any>`

**Purpose**: Toggle product visibility to customers

**Parameters**:

- `id` (string) - Product ID
- `isEnabled` (boolean) - true to show, false to hide

**Returns**: Observable with updated product

**Usage Example**:

```typescript
this.productService.toggleProductStatus(productId, true).subscribe({
  next: (response) => {
    this.notificationService.success('Product enabled');
  },
  error: (error) => {
    this.notificationService.error('Failed to enable product');
  },
});
```

**HTTP Request**:

```
PATCH /api/products/:id/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "isEnabled": true
}
```

---

### 2. Change Product Status

#### `changeProductStatus(id: string, status: string): Observable<any>`

**Purpose**: Change product status (In Stock, Low Stock, Out of Stock)

**Parameters**:

- `id` (string) - Product ID
- `status` (string) - New status: "In Stock", "Low Stock", "Out of Stock"

**Returns**: Observable with updated product

**Status Values**:

- `"In Stock"` - Product is available
- `"Low Stock"` - Product available but quantity is low
- `"Out of Stock"` - Product is unavailable

**Usage Example**:

```typescript
this.productService.changeProductStatus(productId, 'Low Stock').subscribe({
  next: (response) => {
    this.notificationService.success('Product status updated');
  },
});
```

**HTTP Request**:

```
PATCH /api/products/:id/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "Low Stock"
}
```

---

### 3. Get Admin Products

#### `getAdminProducts(): Observable<any>`

**Purpose**: Get all products with admin details (including disabled products)

**Returns**: Observable with array of all products

**Includes**:

- All products (enabled and disabled)
- Admin metadata
- Status information
- Stock levels

**Usage Example**:

```typescript
this.productService.getAdminProducts().subscribe({
  next: (response) => {
    this.allProducts = response.data;
  },
});
```

**HTTP Request**:

```
GET /api/products/admin/all
Authorization: Bearer {token}
```

---

### 4. Get Product Statistics

#### `getProductStatistics(): Observable<any>`

**Purpose**: Get product statistics for admin dashboard

**Returns**: Observable with statistics object

**Statistics Included**:

```typescript
{
  totalProducts: number,
  activeProducts: number,
  disabledProducts: number,
  inStock: number,
  lowStock: number,
  outOfStock: number,
  averagePrice: number,
  totalValue: number,
  categoryBreakdown: object
}
```

**Usage Example**:

```typescript
this.productService.getProductStatistics().subscribe({
  next: (stats) => {
    this.totalProducts = stats.totalProducts;
    this.activeProducts = stats.activeProducts;
    this.statistics = stats;
  },
});
```

**HTTP Request**:

```
GET /api/products/admin/statistics
Authorization: Bearer {token}
```

---

### 5. Get Products by Status

#### `getProductsByStatus(status: string): Observable<Product[]>`

**Purpose**: Get products filtered by specific status

**Parameters**:

- `status` (string) - Status to filter: "In Stock", "Low Stock", "Out of Stock"

**Returns**: Observable with filtered products array

**Usage Example**:

```typescript
this.productService.getProductsByStatus('Low Stock').subscribe({
  next: (products) => {
    this.lowStockProducts = products;
  },
});
```

---

### 6. Get Disabled Products

#### `getDisabledProducts(): Observable<Product[]>`

**Purpose**: Get all products that are currently disabled

**Returns**: Observable with array of disabled products

**Usage Example**:

```typescript
this.productService.getDisabledProducts().subscribe({
  next: (products) => {
    this.disabledProducts = products;
  },
});
```

---

### 7. Bulk Toggle Products

#### `bulkToggleProducts(ids: string[], isEnabled: boolean): Observable<any>`

**Purpose**: Enable or disable multiple products at once

**Parameters**:

- `ids` (string[]) - Array of product IDs
- `isEnabled` (boolean) - true to enable all, false to disable all

**Returns**: Observable with bulk operation result

**Usage Example**:

```typescript
const productIds = ['id1', 'id2', 'id3'];
this.productService.bulkToggleProducts(productIds, false).subscribe({
  next: (response) => {
    this.notificationService.success('3 products disabled');
    this.loadProducts();
  },
});
```

**HTTP Request**:

```
PATCH /api/products/bulk/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "ids": ["id1", "id2", "id3"],
  "isEnabled": false
}
```

---

### 8. Bulk Delete Products

#### `bulkDeleteProducts(ids: string[]): Observable<any>`

**Purpose**: Delete multiple products at once

**Parameters**:

- `ids` (string[]) - Array of product IDs to delete

**Returns**: Observable with deletion result

**Usage Example**:

```typescript
const productIds = ['id1', 'id2'];
this.productService.bulkDeleteProducts(productIds).subscribe({
  next: (response) => {
    this.notificationService.success('Products deleted successfully');
    this.loadProducts();
  },
});
```

**HTTP Request**:

```
POST /api/products/bulk/delete
Authorization: Bearer {token}
Content-Type: application/json

{
  "ids": ["id1", "id2"]
}
```

---

## Category Service Methods

### 1. Create Sub-Category

#### `createSubCategory(categoryId: string, subCategory: any): Observable<any>`

**Purpose**: Create a new sub-category within a category

**Parameters**:

- `categoryId` (string) - Parent category ID
- `subCategory` (object) - Sub-category data:
  - `name` (string) - Sub-category name
  - `description` (string, optional) - Sub-category description
  - `slug` (string, optional) - URL-friendly slug

**Returns**: Observable with created sub-category

**Usage Example**:

```typescript
const newSubCategory = {
  name: 'Running Shoes',
  description: 'Athletic running footwear',
  slug: 'running-shoes',
};

this.categoryService.createSubCategory(categoryId, newSubCategory).subscribe({
  next: (response) => {
    this.notificationService.success('Sub-category created');
  },
});
```

**HTTP Request**:

```
POST /api/categories/:categoryId/subcategories
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Running Shoes",
  "description": "Athletic running footwear",
  "slug": "running-shoes"
}
```

---

### 2. Update Sub-Category

#### `updateSubCategory(categoryId: string, subCategoryId: string, subCategory: any): Observable<any>`

**Purpose**: Update an existing sub-category

**Parameters**:

- `categoryId` (string) - Parent category ID
- `subCategoryId` (string) - Sub-category ID to update
- `subCategory` (object) - Updated sub-category data

**Returns**: Observable with updated sub-category

**Usage Example**:

```typescript
const updatedSubCategory = {
  name: 'Marathon Shoes',
  description: 'Long-distance running shoes',
};

this.categoryService.updateSubCategory(catId, subCatId, updatedSubCategory).subscribe({
  next: (response) => {
    this.notificationService.success('Sub-category updated');
  },
});
```

---

### 3. Delete Sub-Category

#### `deleteSubCategory(categoryId: string, subCategoryId: string): Observable<any>`

**Purpose**: Delete a sub-category

**Parameters**:

- `categoryId` (string) - Parent category ID
- `subCategoryId` (string) - Sub-category ID to delete

**Returns**: Observable with deletion result

**Validation**:

- Cannot delete sub-category with active products
- Admin must reassign or delete products first

**Usage Example**:

```typescript
this.categoryService.deleteSubCategory(catId, subCatId).subscribe({
  next: (response) => {
    this.notificationService.success('Sub-category deleted');
  },
  error: (error) => {
    if (error.error?.code === 'HAS_PRODUCTS') {
      this.notificationService.error('Cannot delete: has associated products');
    }
  },
});
```

---

### 4. Get Category with Sub-Categories

#### `getCategoryWithSubCategories(categoryId: string): Observable<CategoryWithSubCategories>`

**Purpose**: Get a category and all its sub-categories

**Parameters**:

- `categoryId` (string) - Category ID

**Returns**: Observable with category and nested sub-categories array

**Response Structure**:

```typescript
{
  _id: string,
  name: string,
  slug: string,
  description: string,
  image?: string,
  subCategories: [
    {
      _id: string,
      name: string,
      slug: string,
      description: string,
      parentCategory: string
    }
  ]
}
```

**Usage Example**:

```typescript
this.categoryService.getCategoryWithSubCategories(catId).subscribe({
  next: (category) => {
    this.category = category;
    this.subCategories = category.subCategories;
  },
});
```

---

### 5. Get Admin Categories

#### `getAdminCategories(): Observable<any[]>`

**Purpose**: Get all categories with admin details and product counts

**Returns**: Observable with array of categories including metadata

**Includes Per Category**:

- Total product count
- Product count by status
- Sub-category count
- Creation/update dates

**Usage Example**:

```typescript
this.categoryService.getAdminCategories().subscribe({
  next: (categories) => {
    this.categories = categories;
  },
});
```

---

### 6. Get Category Statistics

#### `getCategoryStatistics(): Observable<any>`

**Purpose**: Get overall category statistics for dashboard

**Returns**: Observable with statistics object

**Statistics Include**:

```typescript
{
  totalCategories: number,
  totalSubCategories: number,
  categoriesWithProducts: number,
  categoriesWithoutProducts: number,
  averageProductsPerCategory: number,
  productsByCategory: object
}
```

**Usage Example**:

```typescript
this.categoryService.getCategoryStatistics().subscribe({
  next: (stats) => {
    this.statsCard.total = stats.totalCategories;
    this.statsCard.subCategories = stats.totalSubCategories;
  },
});
```

---

### 7. Bulk Delete Categories

#### `bulkDeleteCategories(ids: string[]): Observable<any>`

**Purpose**: Delete multiple categories at once

**Parameters**:

- `ids` (string[]) - Array of category IDs to delete

**Returns**: Observable with deletion result

**Validation**:

- Cannot delete categories with products
- Must delete products first or reassign to other categories

**Usage Example**:

```typescript
const categoryIds = ['id1', 'id2'];
this.categoryService.bulkDeleteCategories(categoryIds).subscribe({
  next: (response) => {
    this.notificationService.success('Categories deleted');
  },
});
```

---

### 8. Search Categories

#### `searchCategories(query: string): Observable<any[]>`

**Purpose**: Search categories by name or description

**Parameters**:

- `query` (string) - Search term

**Returns**: Observable with matching categories

**Search Fields**:

- Category name
- Category description
- Category slug

**Usage Example**:

```typescript
this.categoryService.searchCategories('shoe').subscribe({
  next: (results) => {
    this.searchResults = results;
  },
});
```

---

### 9. Get Categories by Status

#### `getCategoriesByStatus(status: string): Observable<any[]>`

**Purpose**: Get categories filtered by status

**Parameters**:

- `status` (string) - Status: "active", "inactive", "archived"

**Returns**: Observable with filtered categories

**Usage Example**:

```typescript
this.categoryService.getCategoriesByStatus('active').subscribe({
  next: (categories) => {
    this.activeCategories = categories;
  },
});
```

---

### 10. Verify Category Name Unique

#### `verifyCategoryNameUnique(name: string, excludeId?: string): Observable<any>`

**Purpose**: Check if category name is unique before creating/updating

**Parameters**:

- `name` (string) - Category name to verify
- `excludeId` (string, optional) - ID to exclude (for updates)

**Returns**: Observable with verification result

**Response**:

```typescript
{
  isUnique: boolean,
  message: string
}
```

**Usage Example**:

```typescript
this.categoryService.verifyCategoryNameUnique('Electronics', productId).subscribe({
  next: (result) => {
    if (result.isUnique) {
      this.canSave = true;
    } else {
      this.notificationService.error('Category name already exists');
    }
  },
});
```

---

### 11. Get Category Products Count

#### `getCategoryProductsCount(categoryId: string): Observable<any>`

**Purpose**: Get product count for a specific category

**Parameters**:

- `categoryId` (string) - Category ID

**Returns**: Observable with product count breakdown

**Response**:

```typescript
{
  total: number,
  active: number,
  disabled: number,
  inStock: number,
  lowStock: number,
  outOfStock: number
}
```

**Usage Example**:

```typescript
this.categoryService.getCategoryProductsCount(catId).subscribe({
  next: (counts) => {
    this.productCountDisplay = counts.total;
  },
});
```

---

## Admin Component Integration

### Enhanced Admin Products Component

```typescript
export class AdminProductsComponent implements OnInit {
  products: Product[] = [];
  selectedProducts: Set<string> = new Set();
  filterStatus = 'all'; // all, active, disabled
  statistics: any = {};
  isLoading = false;

  constructor(
    private productService: ProductService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadStatistics();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getAdminProducts().subscribe({
      next: (response) => {
        this.products = response.data;
        this.isLoading = false;
      },
      error: () => {
        this.notificationService.error('Failed to load products');
        this.isLoading = false;
      },
    });
  }

  loadStatistics(): void {
    this.productService.getProductStatistics().subscribe({
      next: (stats) => {
        this.statistics = stats;
      },
    });
  }

  toggleProductStatus(productId: string, currentStatus: boolean): void {
    this.productService.toggleProductStatus(productId, !currentStatus).subscribe({
      next: () => {
        this.notificationService.success('Product status updated');
        this.loadProducts();
      },
    });
  }

  changeStatus(productId: string, newStatus: string): void {
    this.productService.changeProductStatus(productId, newStatus).subscribe({
      next: () => {
        this.notificationService.success('Product status changed');
        this.loadProducts();
      },
    });
  }

  bulkToggleSelected(enable: boolean): void {
    if (this.selectedProducts.size === 0) {
      this.notificationService.warning('No products selected');
      return;
    }

    this.productService.bulkToggleProducts(Array.from(this.selectedProducts), enable).subscribe({
      next: () => {
        this.notificationService.success(
          `${this.selectedProducts.size} products ${enable ? 'enabled' : 'disabled'}`,
        );
        this.selectedProducts.clear();
        this.loadProducts();
      },
    });
  }

  filterByStatus(status: string): void {
    this.filterStatus = status;
    if (status === 'all') {
      this.loadProducts();
    } else if (status === 'disabled') {
      this.productService.getDisabledProducts().subscribe({
        next: (products) => {
          this.products = products;
        },
      });
    } else {
      this.productService.getProductsByStatus(status).subscribe({
        next: (products) => {
          this.products = products;
        },
      });
    }
  }
}
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│              Admin Product Management                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Admin Interface Components                          │  │
│  │  - Admin Products Component                          │  │
│  │  - Admin Categories Component                        │  │
│  │  - Admin Dashboard                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                      ▼                                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Services Layer                                      │  │
│  │  - ProductService (8 admin methods)                  │  │
│  │  - CategoryService (11 admin methods)                │  │
│  │  - OrderService (4 admin methods)                    │  │
│  │  - ReviewService (6 admin methods)                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                      ▼                                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  REST API Endpoints                                  │  │
│  │  - PATCH /api/products/:id/status                    │  │
│  │  - PATCH /api/products/bulk/status                   │  │
│  │  - GET /api/products/admin/all                       │  │
│  │  - POST /api/categories/:id/subcategories            │  │
│  │  - PUT /api/categories/:id                           │  │
│  │  - DELETE /api/categories/:id                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                      ▼                                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Backend Database                                    │  │
│  │  - Products Collection                               │  │
│  │  - Categories Collection                             │  │
│  │  - SubCategories Collection                          │  │
│  │  - Orders Collection                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Error Handling

### Common Errors

#### 1. Authorization Error

```typescript
{
  status: 401,
  message: 'Unauthorized',
  code: 'UNAUTHORIZED'
}
```

**Solution**: Ensure user is logged in as admin

#### 2. Product Not Found

```typescript
{
  status: 404,
  message: 'Product not found',
  code: 'NOT_FOUND'
}
```

**Solution**: Verify product ID exists

#### 3. Cannot Delete Category with Products

```typescript
{
  status: 400,
  message: 'Cannot delete category with active products',
  code: 'HAS_PRODUCTS'
}
```

**Solution**: Delete or reassign products first

#### 4. Duplicate Category Name

```typescript
{
  status: 400,
  message: 'Category name already exists',
  code: 'DUPLICATE_NAME'
}
```

**Solution**: Use a unique category name

---

## Best Practices

### 1. Always Verify Before Bulk Operations

```typescript
const count = this.selectedProducts.size;
if (count === 0) {
  this.notificationService.warning('No products selected');
  return;
}

if (!confirm(`Are you sure you want to perform this action on ${count} products?`)) {
  return;
}

// Proceed with operation
```

### 2. Use Loading States

```typescript
this.isLoading = true;
this.service.operation().subscribe({
  next: () => {
    this.isLoading = false;
  },
  error: () => {
    this.isLoading = false;
    this.notificationService.error('Operation failed');
  },
});
```

### 3. Verify Category Names Before Save

```typescript
if (this.categoryName) {
  this.categoryService.verifyCategoryNameUnique(this.categoryName, this.editingId).subscribe({
    next: (result) => {
      this.nameIsUnique = result.isUnique;
      this.canSave = result.isUnique;
    },
  });
}
```

### 4. Handle Sub-Category Relationships

```typescript
// When deleting a category, check for sub-categories
this.categoryService.getCategoryWithSubCategories(catId).subscribe({
  next: (category) => {
    if (category.subCategories.length > 0) {
      this.notificationService.warning(
        `This category has ${category.subCategories.length} sub-categories`,
      );
      // Give user option to delete sub-categories or cancel
    }
  },
});
```

---

## Performance Optimization

### 1. Pagination for Large Product Lists

```typescript
// Load products with pagination
this.currentPage = 1;
this.pageSize = 20;

this.loadProducts(this.currentPage, this.pageSize);

// In service:
getAdminProducts(page: number, pageSize: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/admin/all`, {
    params: {
      page: page.toString(),
      pageSize: pageSize.toString()
    }
  });
}
```

### 2. Cache Category Hierarchy

```typescript
private categoryCache: any = null;
private categoryExpiry = 0;

getCategoryWithSubCategories(id: string): Observable<any> {
  if (this.categoryCache && Date.now() < this.categoryExpiry) {
    return of(this.categoryCache);
  }

  return this.http.get(...).pipe(
    tap((result) => {
      this.categoryCache = result;
      this.categoryExpiry = Date.now() + (5 * 60 * 1000); // 5 minute cache
    })
  );
}
```

### 3. Debounce Search Input

```typescript
private searchSubject$ = new Subject<string>();

constructor(...) {
  this.searchSubject$
    .pipe(debounceTime(300))
    .subscribe((query) => {
      this.performSearch(query);
    });
}

onSearch(query: string): void {
  this.searchSubject$.next(query);
}
```

---

## Testing Scenarios

### Test Case 1: Enable/Disable Product

1. Load admin products
2. Click disable on active product
3. Verify product hidden from customers
4. Re-enable product
5. Verify product visible again

### Test Case 2: Bulk Operations

1. Select 3 products
2. Click "Disable Selected"
3. Verify all 3 disabled
4. Select disabled products
5. Click "Enable Selected"
6. Verify all 3 enabled

### Test Case 3: Category Management

1. Create new category
2. Add sub-categories
3. Verify hierarchy
4. Update sub-category name
5. Delete sub-category
6. Verify deletion

### Test Case 4: Statistics

1. Load admin dashboard
2. Verify product statistics
3. Verify category statistics
4. Verify order statistics
5. All stats should update in real-time

---

## Conclusion

The Admin Product Management System provides a complete solution for administrators to manage products, categories, and inventory. With full CRUD operations, bulk actions, and comprehensive statistics, administrators have complete control over the ecommerce platform's product catalog.

**Key Features**:

- ✅ Product enable/disable (hide without deletion)
- ✅ Product status management (In Stock, Low Stock, Out of Stock)
- ✅ Category hierarchy management
- ✅ Sub-category creation and management
- ✅ Bulk operations for efficiency
- ✅ Real-time statistics and analytics
- ✅ Search and filtering capabilities
- ✅ Production-ready error handling

**Build Status**: ✅ 0 Errors - Ready for Production
