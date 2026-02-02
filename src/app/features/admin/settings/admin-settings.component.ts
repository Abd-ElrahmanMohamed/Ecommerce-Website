import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">
      <h2>Admin Settings</h2>

      <!-- General Settings -->
      <div class="settings-section">
        <h3>General Settings</h3>
        <div class="settings-form">
          <div class="form-group">
            <label>Store Name</label>
            <input [(ngModel)]="settings.storeName" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>Store Email</label>
            <input [(ngModel)]="settings.storeEmail" type="email" class="form-input" />
          </div>
          <div class="form-group">
            <label>Store Phone</label>
            <input [(ngModel)]="settings.storePhone" type="tel" class="form-input" />
          </div>
          <div class="form-group">
            <label>Store Address</label>
            <textarea [(ngModel)]="settings.storeAddress" class="form-input"></textarea>
          </div>
          <button (click)="saveSettings()" class="btn btn-primary">Save Settings</button>
        </div>
      </div>

      <!-- Payment Settings -->
      <div class="settings-section">
        <h3>Payment Settings</h3>
        <div class="settings-form">
          <div class="form-group">
            <label>
              <input type="checkbox" [(ngModel)]="settings.codEnabled" />
              Cash on Delivery (COD)
            </label>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" [(ngModel)]="settings.creditCardEnabled" />
              Credit Card Payment
            </label>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" [(ngModel)]="settings.walletEnabled" />
              Digital Wallet
            </label>
          </div>
          <button (click)="saveSettings()" class="btn btn-primary">Save Payment Settings</button>
        </div>
      </div>

      <!-- Shipping Settings -->
      <div class="settings-section">
        <h3>Shipping Settings</h3>
        <div class="settings-form">
          <div class="form-group">
            <label>Free Shipping Threshold (EGP)</label>
            <input [(ngModel)]="settings.freeShippingThreshold" type="number" class="form-input" />
          </div>
          <div class="form-group">
            <label>Standard Shipping Cost (EGP)</label>
            <input [(ngModel)]="settings.shippingCost" type="number" class="form-input" />
          </div>
          <div class="form-group">
            <label>Estimated Delivery Days</label>
            <input [(ngModel)]="settings.deliveryDays" type="number" class="form-input" />
          </div>
          <button (click)="saveSettings()" class="btn btn-primary">Save Shipping Settings</button>
        </div>
      </div>

      <!-- Tax Settings -->
      <div class="settings-section">
        <h3>Tax Settings</h3>
        <div class="settings-form">
          <div class="form-group">
            <label>Tax Rate (%)</label>
            <input [(ngModel)]="settings.taxRate" type="number" class="form-input" />
          </div>
          <button (click)="saveSettings()" class="btn btn-primary">Save Tax Settings</button>
        </div>
      </div>

      <!-- Security Settings -->
      <div class="settings-section">
        <h3>Security Settings</h3>
        <div class="settings-form">
          <div class="form-group">
            <label>
              <input type="checkbox" [(ngModel)]="settings.twoFactorEnabled" />
              Enable Two-Factor Authentication
            </label>
          </div>
          <button (click)="saveSettings()" class="btn btn-primary">Save Security Settings</button>
        </div>
      </div>

      <!-- Backup & Maintenance -->
      <div class="settings-section">
        <h3>Backup & Maintenance</h3>
        <div class="settings-form">
          <button (click)="backupDatabase()" class="btn btn-secondary">Backup Database</button>
          <button (click)="clearCache()" class="btn btn-secondary">Clear Cache</button>
          <button (click)="restartServer()" class="btn btn-danger">Restart Server</button>
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

      .settings-section {
        background: white;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .settings-section h3 {
        margin-top: 0;
        margin-bottom: 15px;
        color: #333;
      }

      .settings-form {
        display: grid;
        gap: 15px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
      }

      .form-group label {
        margin-bottom: 8px;
        font-weight: 600;
        color: #333;
      }

      .form-input {
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
      }

      .form-input:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
      }

      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }

      .btn-primary {
        background: #007bff;
        color: white;
      }

      .btn-primary:hover {
        background: #0056b3;
      }

      .btn-secondary {
        background: #6c757d;
        color: white;
        margin-right: 10px;
      }

      .btn-secondary:hover {
        background: #5a6268;
      }

      .btn-danger {
        background: #dc3545;
        color: white;
      }

      .btn-danger:hover {
        background: #c82333;
      }
    `,
  ],
})
export class AdminSettingsComponent implements OnInit {
  settings = {
    // General
    storeName: 'Fashion Store',
    storeEmail: 'info@fashionstore.com',
    storePhone: '+20 123 456 7890',
    storeAddress: '123 Main Street, Cairo, Egypt',

    // Payment
    codEnabled: true,
    creditCardEnabled: true,
    walletEnabled: false,

    // Shipping
    freeShippingThreshold: 300,
    shippingCost: 25,
    deliveryDays: 3,

    // Tax
    taxRate: 10,

    // Security
    twoFactorEnabled: false,
  };

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
  ) {
    this.checkAdminAccess();
  }

  ngOnInit() {
    this.loadSettings();
  }

  checkAdminAccess() {
    const user = this.authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      this.router.navigate(['/']);
    }
  }

  loadSettings() {
    // Load settings from localStorage or API
    const saved = localStorage.getItem('adminSettings');
    if (saved) {
      this.settings = { ...this.settings, ...JSON.parse(saved) };
    }
  }

  saveSettings() {
    localStorage.setItem('adminSettings', JSON.stringify(this.settings));
    this.notificationService.success('Settings saved successfully', 'Success');
  }

  backupDatabase() {
    this.notificationService.info('Backup started...', 'Info');
    // Implement backup logic
  }

  clearCache() {
    this.notificationService.info('Cache cleared', 'Success');
    // Implement cache clear logic
  }

  restartServer() {
    if (confirm('Are you sure you want to restart the server?')) {
      this.notificationService.info('Server is restarting...', 'Info');
      // Implement server restart logic
    }
  }
}
