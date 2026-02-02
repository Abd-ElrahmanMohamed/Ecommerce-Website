# 🔐 Authentication Quick Reference

## Quick Start

### 1. Check if User is Admin

```typescript
if (this.authService.isAdmin()) {
  // Show admin features
}
```

### 2. Generate Clean Product URL

```typescript
const url = this.slugService.getProductUrl('Blue Shirt', 'prod-123');
// Output: /products/blue-shirt-prod-123
```

### 3. Extract ID from URL Slug

```typescript
const id = this.slugService.extractIdFromSlug('blue-shirt-prod-123');
// Output: prod-123
```

### 4. Protect Admin Routes

```typescript
// Already done in app.routes.ts
{
  path: 'admin/products',
  component: AdminProductsComponent,
  canActivate: [AdminGuard]  // ✅ Automatic role check
}
```

---

## Service Methods

### AuthService

```typescript
// Authentication
login(credentials);
register(data);
logout();

// User Info
isAuthenticated();
isAdmin(); // ✅ NEW
isCustomer(); // ✅ NEW
getCurrentUser();
getCurrentUserId();
getToken();

// Scaling (Ready)
updateProfile(data); // ✅ NEW
refreshToken(); // ✅ NEW
validateSession(); // ✅ NEW
```

### SlugService

```typescript
// Generate
generateSlug('Summer Shirt');
generateProductSlug('Blue Shirt', 'id-123');
generateCategorySlug('Clothing', 'cat-1');

// Extract
extractIdFromSlug('blue-shirt-123');
extractNameFromSlug('blue-shirt-123');

// Validate & Use
isValidSlug('blue-shirt');
getProductUrl('Blue Shirt', 'id-123');
getCategoryUrl('Clothing', 'cat-1');
sanitizeForSlug(userInput);
```

---

## Examples

### Show Admin Panel Only to Admins

```typescript
// Component
isAdmin$ = this.authService.currentUser$.pipe(
  map(user => user?.role === 'admin')
);

// Template
<div *ngIf="isAdmin$ | async">
  <h1>Admin Panel</h1>
  <a routerLink="/admin/products">Manage Products</a>
</div>
```

### Generate Product Links

```typescript
// Component
getProductLink(product: Product): string {
  return this.slugService.getProductUrl(product.name, product.id);
}

// Template
<a [routerLink]="getProductLink(product)">
  {{ product.name }}
</a>
```

### Handle Login

```typescript
onLogin(): void {
  this.authService.login(credentials).subscribe({
    next: () => {
      if (this.authService.isAdmin()) {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/']);
      }
    },
    error: (err) => console.error('Login failed', err),
  });
}
```

---

## Security Features

| Feature                   | How It Works                                                    |
| ------------------------- | --------------------------------------------------------------- |
| **Admin Guard**           | Checks `isAuthenticated() && role === 'admin'`                  |
| **Auto Token**            | AuthInterceptor adds `Authorization: Bearer {token}`            |
| **Auto Logout**           | 401 error triggers `logout()`                                   |
| **Clean URLs**            | `/products/blue-shirt-prod-123` instead of `/products/prod-123` |
| **No Email Verification** | Simple login/register                                           |
| **Session Ready**         | `validateSession()` and `refreshToken()` available              |

---

## URLs

| Page             | URL                           | Slug              |
| ---------------- | ----------------------------- | ----------------- |
| Product          | `/products/blue-shirt-123`    | `blue-shirt-123`  |
| Category         | `/categories/mens-clothing-1` | `mens-clothing-1` |
| Admin Products   | `/admin/products`             | (no slug)         |
| Admin Categories | `/admin/categories`           | (no slug)         |

---

## Guards

| Guard          | Checks             | Usage                            |
| -------------- | ------------------ | -------------------------------- |
| **AuthGuard**  | Authenticated user | User pages `/account`, `/orders` |
| **AdminGuard** | Admin role         | Admin pages `/admin/*`           |

---

## Build Status

✅ **0 Errors** | ✅ **Production Ready**

---

## Files

| File                  | Purpose                   |
| --------------------- | ------------------------- |
| `admin.guard.ts`      | Protects admin routes     |
| `auth.interceptor.ts` | Adds token to requests    |
| `slug.service.ts`     | Generates clean URLs      |
| `auth.service.ts`     | Enhanced with new methods |
| `app.routes.ts`       | Updated with AdminGuard   |

---

**Ready to use!** 🚀
