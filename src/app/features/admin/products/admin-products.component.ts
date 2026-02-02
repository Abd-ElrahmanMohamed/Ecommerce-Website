import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';
import { CategoryService } from '../../../core/services/category.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog.component';
import { Router } from '@angular/router';

interface Category {
  _id: string;
  name: string;
  slug: string;
}

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  template: `
    <div class="admin-container">
      <h2>Products Management</h2>

      <!-- Add/Edit Product Button -->
      <button (click)="toggleAddForm()" class="btn btn-primary mb-3">
        {{ showAddForm ? 'Cancel' : '+ Add New Product' }}
      </button>

      <!-- Add/Edit Product Form -->
      <div *ngIf="showAddForm" class="form-container mb-4">
        <h3>{{ isEditMode ? 'Edit Product' : 'Add New Product' }}</h3>
        <form (ngSubmit)="isEditMode ? onUpdateProduct() : onAddProduct()">
          <div class="form-group">
            <label>Product Name *</label>
            <input
              [(ngModel)]="newProduct.name"
              name="name"
              placeholder="Enter product name"
              required
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>Description *</label>
            <textarea
              [(ngModel)]="newProduct.description"
              name="description"
              placeholder="Enter product description (minimum 10 characters)"
              required
              minlength="10"
              class="form-input"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Price (EGP) *</label>
              <input
                [(ngModel)]="newProduct.price"
                name="price"
                type="number"
                placeholder="Enter price"
                required
                min="0"
                step="0.01"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>Stock Quantity *</label>
              <input
                [(ngModel)]="newProduct.stock"
                name="stock"
                type="number"
                placeholder="Enter quantity"
                required
                min="0"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>Product Status</label>
              <select [(ngModel)]="newProduct.status" name="status" class="form-input">
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Category *</label>
            <select [(ngModel)]="newProduct.category" name="category" required class="form-input">
              <option value="">-- Select a category --</option>
              <option *ngFor="let cat of categories" [value]="cat._id">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Product Image</label>
            <input
              #fileInput
              type="file"
              accept="image/*"
              (change)="onImageSelected($event)"
              class="form-input"
            />
            <div *ngIf="imagePreview" class="image-preview">
              <img [src]="imagePreview" alt="Preview" />
              <button type="button" (click)="removeImage()" class="btn btn-sm btn-danger mt-2">
                Remove Image
              </button>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-success">
              {{ isEditMode ? 'Update Product' : 'Add Product' }}
            </button>
            <button type="button" (click)="toggleAddForm()" class="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>

      <!-- Products Table -->
      <table class="table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let product of products$ | async">
            <td class="image-cell">
              <img
                *ngIf="getProductImage(product)"
                [src]="getProductImage(product)"
                alt="{{ product.name }}"
                class="product-image"
                (error)="onImageError($event)"
              />
              <span *ngIf="!getProductImage(product)" class="no-image">No Image</span>
            </td>
            <td>{{ product.name }}</td>
            <td>EGP {{ product.price | number: '1.2-2' }}</td>
            <td>{{ product.stock }}</td>
            <td>
              <span class="status-badge" [ngClass]="getStatusClass(product.status)">
                {{ product.status || 'In Stock' }}
              </span>
            </td>
            <td>{{ getCategoryName(product.category) }}</td>
            <td>
              <button (click)="editProduct(product)" class="btn btn-sm btn-warning">Edit</button>
              <button (click)="deleteProduct(product)" class="btn btn-sm btn-danger">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Confirm Delete Dialog -->
      <app-confirm-dialog
        [isOpen]="showDeleteConfirm"
        title="Delete Product"
        [message]="'Are you sure you want to delete &quot;' + productToDelete?.name + '&quot;?'"
        confirmText="Delete"
        cancelText="Cancel"
        (confirmed)="confirmDelete()"
        (cancelled)="cancelDelete()"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [
    `
      .admin-container {
        padding: 20px;
        background: #f5f5f5;
        border-radius: 8px;
      }

      .form-container {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .form-group {
        margin-bottom: 15px;
      }

      .form-group label {
        display: block;
        margin-bottom: 6px;
        font-weight: 600;
        color: #333;
        font-size: 14px;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
      }

      .form-input {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        transition: border-color 0.3s;
      }

      .form-input:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
      }

      .form-actions {
        display: flex;
        gap: 10px;
        margin-top: 20px;
        padding-top: 15px;
        border-top: 1px solid #eee;
      }

      .form-actions .btn {
        flex: 1;
        padding: 10px 16px;
      }

      .table {
        width: 100%;
        background: white;
        border-collapse: collapse;
        border-radius: 8px;
        overflow: hidden;
      }

      .table th,
      .table td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #ddd;
      }

      .table th {
        background: #f8f9fa;
        font-weight: bold;
        color: #333;
      }

      .btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        margin-right: 5px;
      }

      .btn-primary {
        background: #007bff;
        color: white;
      }

      .btn-success {
        background: #28a745;
        color: white;
      }

      .btn-secondary {
        background: #6c757d;
        color: white;
      }

      .btn-warning {
        background: #ffc107;
        color: black;
      }

      .btn-danger {
        background: #dc3545;
        color: white;
      }

      .btn-sm {
        padding: 5px 10px;
        font-size: 12px;
      }

      .mb-3 {
        margin-bottom: 20px;
      }

      .image-preview {
        margin-top: 15px;
        padding: 15px;
        border: 2px dashed #ddd;
        border-radius: 4px;
        text-align: center;
      }

      .image-preview img {
        max-width: 300px;
        max-height: 300px;
        border-radius: 4px;
        margin-bottom: 10px;
      }

      .mt-2 {
        margin-top: 10px;
      }

      .mb-4 {
        margin-bottom: 30px;
      }

      .image-cell {
        padding: 8px 12px;
        text-align: center;
      }

      .product-image {
        max-width: 80px;
        max-height: 80px;
        border-radius: 4px;
        object-fit: cover;
        border: 1px solid #ddd;
        cursor: pointer;
        transition: transform 0.2s;
      }

      .product-image:hover {
        transform: scale(1.1);
      }

      .no-image {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 80px;
        height: 80px;
        padding: 8px;
        background: #e8e8e8;
        border: 2px dashed #ccc;
        border-radius: 4px;
        font-size: 13px;
        font-weight: 500;
        color: #666;
        text-align: center;
        line-height: 1.2;
        box-sizing: border-box;
      }
    `,
  ],
})
export class AdminProductsComponent implements OnInit {
  products$: any;
  categories: Category[] = [];
  showAddForm = false;
  isEditMode = false;
  editingProductId: string | null = null;
  imagePreview: string | null = null;
  selectedFile: File | null = null;
  showDeleteConfirm = false;
  productToDelete: any = null;
  newProduct: any = {
    name: '',
    description: '',
    price: null,
    category: '',
    stock: null,
    status: 'In Stock',
  };

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private categoryService: CategoryService,
    private notificationService: NotificationService,
    private router: Router,
  ) {
    this.checkAdminAccess();
  }

  ngOnInit() {
    this.products$ = this.productService.products$;
    this.productService.reloadProducts();
    this.loadCategories();
  }

  checkAdminAccess() {
    const user = this.authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      this.router.navigate(['/']);
    }
  }

  loadCategories() {
    // Load categories from the API via CategoryService
    this.categoryService.getCategories().subscribe(
      (categories: any[]) => {
        console.log('Loaded categories from API:', categories);
        this.categories = categories;
      },
      (error) => {
        console.error('Failed to load categories:', error);
        this.notificationService.error('Failed to load categories', 'Error');
      },
    );
  }

  getCategoryName(categoryId: string | any): string {
    if (typeof categoryId === 'object' && categoryId?.name) {
      return categoryId.name;
    }
    const category = this.categories.find((c) => c._id === categoryId);
    return category?.name || 'Unknown';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'In Stock':
        return 'status-in-stock';
      case 'Low Stock':
        return 'status-low-stock';
      case 'Out of Stock':
        return 'status-out-of-stock';
      default:
        return 'status-in-stock';
    }
  }

  getProductImage(product: any): string | null {
    // Check for images array (backend format)
    if (product.images && product.images.length > 0 && product.images[0].url) {
      return product.images[0].url;
    }
    // Fallback to image property (frontend format)
    if (product.image) {
      return product.image;
    }
    return null;
  }

  onImageSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.notificationService.error('Please select a valid image file', 'Invalid File');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.notificationService.error('Image size must be less than 5MB', 'File Too Large');
        return;
      }

      this.selectedFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedFile = null;
    this.imagePreview = null;
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.resetForm();
    }
  }

  onAddProduct() {
    if (
      !this.newProduct.name ||
      !this.newProduct.price ||
      !this.newProduct.category ||
      !this.newProduct.stock ||
      !this.newProduct.description
    ) {
      this.notificationService.error('Please fill in all required fields', 'Validation Error');
      return;
    }

    // Validate description length
    if (this.newProduct.description.trim().length < 10) {
      this.notificationService.error(
        'Description must be at least 10 characters long',
        'Validation Error',
      );
      return;
    }

    // Validate price
    if (parseFloat(this.newProduct.price) <= 0) {
      this.notificationService.error('Price must be greater than 0', 'Validation Error');
      return;
    }

    // Validate stock
    if (parseInt(this.newProduct.stock) < 0) {
      this.notificationService.error('Stock must be a non-negative number', 'Validation Error');
      return;
    }

    // Create FormData to support file upload
    const formData = new FormData();
    formData.append('name', this.newProduct.name);
    formData.append('description', this.newProduct.description.trim());
    formData.append('price', parseFloat(this.newProduct.price).toString());
    formData.append('category', this.newProduct.category);
    formData.append('stock', (parseInt(this.newProduct.stock) || 0).toString());
    formData.append('status', this.newProduct.status || 'In Stock');

    // Add image if selected
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.productService.createProductWithImage(formData).subscribe(
      (result: any) => {
        this.notificationService.success(
          `Product "${this.newProduct.name}" created successfully!`,
          'Product Added',
        );
        this.resetForm();
        // Force reload products to ensure the list is updated
        this.productService.forceReloadProducts().subscribe(
          () => {
            console.log('Products list refreshed');
          },
          (error) => {
            console.error('Failed to refresh products:', error);
          },
        );
      },
      (error: any) => {
        console.error('Error:', error);
        const errorMessage = error.error?.message || 'Failed to add product. Please try again.';
        this.notificationService.error(errorMessage, 'Error');
      },
    );
  }

  editProduct(product: any) {
    // Populate form with product data
    this.newProduct = {
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category._id || product.category,
      stock: product.stock,
      status: product.status || 'In Stock',
    };

    // Set image preview if product has image
    if (product.image) {
      this.imagePreview = product.image;
    }

    // Set edit mode
    this.isEditMode = true;
    this.editingProductId = product._id;
    this.showAddForm = true;
  }

  onUpdateProduct() {
    if (
      !this.newProduct.name ||
      !this.newProduct.price ||
      !this.newProduct.category ||
      !this.newProduct.stock ||
      !this.newProduct.description
    ) {
      this.notificationService.error('Please fill in all required fields', 'Validation Error');
      return;
    }

    // Validate description length
    if (this.newProduct.description.trim().length < 10) {
      this.notificationService.error(
        'Description must be at least 10 characters long',
        'Validation Error',
      );
      return;
    }

    // Validate price
    if (parseFloat(this.newProduct.price) <= 0) {
      this.notificationService.error('Price must be greater than 0', 'Validation Error');
      return;
    }

    // Validate stock
    if (parseInt(this.newProduct.stock) < 0) {
      this.notificationService.error('Stock must be a non-negative number', 'Validation Error');
      return;
    }

    // Create FormData to support file upload
    const formData = new FormData();
    formData.append('name', this.newProduct.name);
    formData.append('description', this.newProduct.description.trim());
    formData.append('price', parseFloat(this.newProduct.price).toString());
    formData.append('category', this.newProduct.category);
    formData.append('stock', (parseInt(this.newProduct.stock) || 0).toString());
    formData.append('status', this.newProduct.status || 'In Stock');

    // Add image if a new one was selected
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.productService.updateProductWithImage(this.editingProductId!, formData).subscribe(
      (result: any) => {
        this.notificationService.success(
          `Product "${this.newProduct.name}" updated successfully!`,
          'Product Updated',
        );
        this.resetForm();
        this.isEditMode = false;
        this.editingProductId = null;
        // Force reload products to ensure the list is updated
        this.productService.forceReloadProducts().subscribe(
          () => {
            console.log('Products list refreshed');
          },
          (error) => {
            console.error('Failed to refresh products:', error);
          },
        );
      },
      (error: any) => {
        console.error('Error:', error);
        const errorMessage = error.error?.message || 'Failed to update product. Please try again.';
        this.notificationService.error(errorMessage, 'Error');
      },
    );
  }

  deleteProduct(product: any) {
    this.productToDelete = product;
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    if (!this.productToDelete) return;

    this.productService
      .deleteProduct(this.productToDelete._id || this.productToDelete.id)
      .subscribe(
        () => {
          this.notificationService.success(
            `Product "${this.productToDelete.name}" deleted successfully!`,
            'Product Deleted',
          );
          this.productToDelete = null;
          // Force reload products to ensure the list is updated
          this.productService.forceReloadProducts().subscribe(
            () => {
              console.log('Products list refreshed');
            },
            (error) => {
              console.error('Failed to refresh products:', error);
            },
          );
        },
        (error) => {
          const errorMessage = error.error?.message || 'Failed to delete product';
          this.notificationService.error(errorMessage, 'Error');
          this.productToDelete = null;
        },
      );
  }

  cancelDelete() {
    this.productToDelete = null;
    this.showDeleteConfirm = false;
  }

  resetForm() {
    this.newProduct = {
      name: '',
      description: '',
      price: null,
      category: '',
      stock: null,
    };
    this.selectedFile = null;
    this.imagePreview = null;
    this.showAddForm = false;
  }

  onImageError(event: any) {
    // If image fails to load, hide it and show the no-image placeholder
    event.target.style.display = 'none';
    const cell = event.target.parentElement;
    if (cell && !cell.querySelector('.no-image')) {
      const noImageDiv = document.createElement('div');
      noImageDiv.className = 'no-image';
      noImageDiv.textContent = 'No Image';
      cell.appendChild(noImageDiv);
    }
  }
}
