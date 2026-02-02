import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">
      <h2>Users Management</h2>

      <!-- Loading State -->
      <div *ngIf="isLoading" style="text-align: center; padding: 40px;">
        <p>Loading users...</p>
      </div>

      <!-- Users Table -->
      <table class="table" *ngIf="!isLoading">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Join Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let user of users">
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>
              <select [(ngModel)]="user.role" (change)="updateUserRole(user)" class="form-select">
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </td>
            <td>{{ user.joinDate | date: 'short' }}</td>
            <td>
              <span [class]="'status-' + user.status">{{ user.status }}</span>
            </td>
            <td>
              <button (click)="deleteUser(user)" class="btn btn-sm btn-danger">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div *ngIf="users.length === 0 && !isLoading" class="empty-state">
        <p>No users found</p>
      </div>
    </div>

    <!-- Delete Confirmation Dialog Overlay -->
    <div class="dialog-overlay" *ngIf="showDeleteDialog">
      <div class="dialog-box">
        <div class="dialog-header">
          <h3>Delete User</h3>
          <button class="close-btn" (click)="cancelDelete()">×</button>
        </div>

        <div class="dialog-body">
          <p>
            Are you sure you want to delete <strong>{{ userToDelete?.name }}</strong
            >?
          </p>
          <p class="text-muted">This action cannot be undone.</p>
        </div>

        <div class="dialog-footer">
          <button class="btn btn-secondary" (click)="cancelDelete()">Cancel</button>
          <button class="btn btn-danger" (click)="confirmDelete()">Delete User</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .admin-container {
        padding: 20px;
        background: #f5f5f5;
        border-radius: 8px;
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

      .form-select {
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
      }

      .status-active {
        color: #28a745;
        font-weight: bold;
      }

      .status-inactive {
        color: #dc3545;
        font-weight: bold;
      }

      .btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }

      .btn-danger {
        background: #dc3545;
        color: white;
      }

      .btn-sm {
        padding: 5px 10px;
        font-size: 12px;
      }

      .empty-state {
        text-align: center;
        padding: 40px;
        color: #666;
      }

      /* Dialog Overlay Styles */
      .dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        animation: fadeIn 0.3s ease-out;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .dialog-box {
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        max-width: 400px;
        width: 90%;
        animation: slideIn 0.3s ease-out;
      }

      @keyframes slideIn {
        from {
          transform: translateY(-30px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .dialog-header {
        padding: 20px;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .dialog-header h3 {
        margin: 0;
        color: #333;
        font-size: 18px;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 28px;
        cursor: pointer;
        color: #999;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s;
      }

      .close-btn:hover {
        color: #333;
      }

      .dialog-body {
        padding: 20px;
      }

      .dialog-body p {
        margin: 0 0 10px 0;
        color: #333;
        font-size: 14px;
      }

      .text-muted {
        color: #999;
        font-size: 12px;
      }

      .dialog-footer {
        padding: 20px;
        border-top: 1px solid #eee;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }

      .btn-secondary {
        background: #e0e0e0;
        color: #333;
      }

      .btn-secondary:hover {
        background: #d0d0d0;
      }

      .btn-danger:hover {
        background: #c82333;
      }
    `,
  ],
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  isLoading = true;
  showDeleteDialog = false;
  userToDelete: any = null;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    console.log('📥 Loading users from backend...');

    this.userService.getUsers().subscribe(
      (response: any) => {
        console.log('✅ Response received:', response);

        if (response.success && response.users) {
          this.users = response.users.map((user: any) => ({
            ...user,
            joinDate: new Date(user.createdAt),
            status: user.isActive ? 'active' : 'inactive', // Map isActive to status
          }));
          console.log('✅ Users mapped:', this.users);
        } else if (response.users) {
          // Fallback if success field is not present
          this.users = response.users.map((user: any) => ({
            ...user,
            joinDate: new Date(user.createdAt),
            status: user.isActive ? 'active' : 'inactive',
          }));
        }
        this.isLoading = false;
      },
      (error: any) => {
        console.error('❌ Failed to load users:', error);
        this.isLoading = false;
      },
    );
  }

  updateUserRole(user: any) {
    console.log('User role updated:', user._id, user.role);
    this.userService.updateUserRole(user._id, user.role).subscribe(
      () => {
        console.log('Role updated successfully');
      },
      (error: any) => {
        console.error('Failed to update user role:', error);
        this.loadUsers(); // Reload to reset
      },
    );
  }

  deleteUser(user: any) {
    this.userToDelete = user;
    this.showDeleteDialog = true;
  }

  cancelDelete() {
    this.showDeleteDialog = false;
    this.userToDelete = null;
  }

  confirmDelete() {
    if (!this.userToDelete) return;

    const userId = this.userToDelete._id;
    const userName = this.userToDelete.name;

    this.userService.deleteUser(userId).subscribe(
      () => {
        console.log('✅ User deleted successfully');
        this.users = this.users.filter((u) => u._id !== userId);
        this.showDeleteDialog = false;
        this.userToDelete = null;
      },
      (error: any) => {
        console.error('❌ Failed to delete user:', error);
        this.showDeleteDialog = false;
        this.userToDelete = null;
      },
    );
  }
}
