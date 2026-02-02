import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog.component';
import { CategoryService } from '../../../core/services/category.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  template: `
    <div class="admin-container">
      <h2>Categories Management</h2>

      <!-- Add Category Button -->
      <button (click)="toggleAddForm()" class="btn btn-primary mb-3">
        {{ showAddForm ? 'Cancel' : '+ Add New Category' }}
      </button>

      <!-- Add Category Form -->
      <div *ngIf="showAddForm" class="form-container mb-4">
        <h3>Add New Category</h3>
        <form (ngSubmit)="onAddCategory()">
          <div class="form-group">
            <label>Category Name *</label>
            <input
              [(ngModel)]="newCategory.name"
              name="name"
              placeholder="Enter category name"
              required
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea
              [(ngModel)]="newCategory.description"
              name="description"
              placeholder="Enter description"
              class="form-input"
            ></textarea>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-success">Add Category</button>
            <button type="button" (click)="toggleAddForm()" class="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>

      <!-- Categories Table -->
      <div *ngIf="categories$ | async as categories">
        <table class="table" *ngIf="categories.length > 0">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let category of categories">
              <td>{{ category.name }}</td>
              <td>{{ category.slug }}</td>
              <td>{{ category.description }}</td>
              <td>
                <button (click)="editCategory(category)" class="btn btn-sm btn-warning">
                  Edit
                </button>
                <button (click)="deleteCategory(category)" class="btn btn-sm btn-danger">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="categories.length === 0" class="empty-state">
          <p>No categories found</p>
        </div>
      </div>

      <!-- Confirm Delete Dialog -->
      <app-confirm-dialog
        [isOpen]="showDeleteConfirm"
        title="Delete Category"
        [message]="'Are you sure you want to delete &quot;' + categoryToDelete?.name + '&quot;?'"
        confirmText="Delete"
        cancelText="Cancel"
        (confirmed)="confirmDeleteCategory()"
        (cancelled)="cancelDeleteCategory()"
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
        margin-bottom: 5px;
        font-weight: 500;
        color: #333;
      }

      .form-input {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        box-sizing: border-box;
      }

      .form-input:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
      }

      .form-actions {
        display: flex;
        gap: 10px;
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
        margin-top: 20px;
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

      .mb-4 {
        margin-bottom: 30px;
      }

      .empty-state {
        text-align: center;
        padding: 40px;
        color: #666;
      }
    `,
  ],
})
export class AdminCategoriesComponent implements OnInit {
  categories$: Observable<any[]> = new Observable();
  showAddForm = false;
  showDeleteConfirm = false;
  categoryToDelete: any = null;
  newCategory = {
    name: '',
    description: '',
  };

  constructor(
    private categoryService: CategoryService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
  ) {
    this.checkAdminAccess();
    this.categories$ = this.categoryService.categories$;
  }

  ngOnInit() {
    this.categories$ = this.categoryService.categories$;
    this.categoryService.reloadCategories();
  }

  checkAdminAccess() {
    const user = this.authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      this.router.navigate(['/']);
    }
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.resetForm();
    }
  }

  onAddCategory() {
    if (!this.newCategory.name) {
      this.notificationService.error('Please fill in all required fields', 'Validation Error');
      return;
    }

    console.log('Adding category:', this.newCategory);

    this.categoryService.createCategory(this.newCategory).subscribe(
      (result: any) => {
        this.notificationService.success(
          `Category "${this.newCategory.name}" created successfully!`,
          'Category Added',
        );
        this.resetForm();
        // Force reload categories to ensure the list is updated
        this.categoryService.forceReloadCategories().subscribe(
          () => {
            console.log('Categories list refreshed');
          },
          (error) => {
            console.error('Failed to refresh categories:', error);
          },
        );
      },
      (error: any) => {
        console.error('Error:', error);
        const errorMessage = error.error?.message || 'Failed to add category. Please try again.';
        this.notificationService.error(errorMessage, 'Error');
      },
    );
  }

  editCategory(category: any) {
    this.notificationService.info('Edit feature coming soon', 'Coming Soon');
  }

  deleteCategory(category: any) {
    this.categoryToDelete = category;
    this.showDeleteConfirm = true;
  }

  confirmDeleteCategory() {
    if (!this.categoryToDelete) return;

    this.categoryService
      .deleteCategory(this.categoryToDelete._id || this.categoryToDelete.id)
      .subscribe(
        () => {
          this.notificationService.success(
            `Category "${this.categoryToDelete.name}" deleted successfully!`,
            'Category Deleted',
          );
          this.categoryToDelete = null;
          // Force reload categories to ensure the list is updated
          this.categoryService.forceReloadCategories().subscribe(
            () => {
              console.log('Categories list refreshed');
            },
            (error) => {
              console.error('Failed to refresh categories:', error);
            },
          );
        },
        (error) => {
          const errorMessage = error.error?.message || 'Failed to delete category';
          this.notificationService.error(errorMessage, 'Error');
          this.categoryToDelete = null;
        },
      );
  }

  cancelDeleteCategory() {
    this.categoryToDelete = null;
    this.showDeleteConfirm = false;
  }

  resetForm() {
    this.newCategory = {
      name: '',
      description: '',
    };
    this.showAddForm = false;
  }
}
