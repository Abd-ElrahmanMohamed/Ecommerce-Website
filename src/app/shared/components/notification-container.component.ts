import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../core/services/notification.service';

@Component({
  selector: 'app-notification-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container">
      <div
        *ngFor="let notification of notifications; trackBy: trackByNotificationId"
        [class]="'notification notification-' + notification.type"
      >
        <div class="notification-content">
          <div class="notification-header">
            <span class="notification-icon">
              <i [class]="getIcon(notification.type)"></i>
            </span>
            <span class="notification-title">{{ notification.title || 'Notification' }}</span>
            <button class="notification-close" (click)="close(notification.id)">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="notification-message">{{ notification.message || 'No message' }}</div>
          <div *ngIf="notification.action" class="notification-action">
            <button class="btn-action">{{ notification.action }}</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .notification-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        max-width: 400px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .notification {
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 16px;
        animation: slideIn 0.3s ease-out;
        border-left: 4px solid;
        min-width: 300px;
        max-width: 400px;
      }

      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .notification-success {
        border-left-color: #28a745;
      }

      .notification-error {
        border-left-color: #dc3545;
      }

      .notification-info {
        border-left-color: #17a2b8;
      }

      .notification-warning {
        border-left-color: #ffc107;
      }

      .notification-content {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .notification-header {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .notification-icon {
        font-size: 20px;
        display: flex;
        align-items: center;
      }

      .notification-success .notification-icon {
        color: #28a745;
      }

      .notification-error .notification-icon {
        color: #dc3545;
      }

      .notification-info .notification-icon {
        color: #17a2b8;
      }

      .notification-warning .notification-icon {
        color: #ffc107;
      }

      .notification-title {
        font-weight: 600;
        color: #333;
        flex: 1;
      }

      .notification-close {
        background: none;
        border: none;
        color: #999;
        cursor: pointer;
        font-size: 18px;
        padding: 0;
        display: flex;
        align-items: center;
      }

      .notification-close:hover {
        color: #333;
      }

      .notification-message {
        color: #666;
        font-size: 14px;
        line-height: 1.4;
      }

      .notification-action {
        margin-top: 8px;
      }

      .btn-action {
        background: none;
        border: none;
        color: #007bff;
        cursor: pointer;
        font-weight: 500;
        padding: 0;
        text-decoration: underline;
      }

      .btn-action:hover {
        color: #0056b3;
      }

      @media (max-width: 600px) {
        .notification-container {
          left: 10px;
          right: 10px;
          max-width: none;
        }

        .notification {
          min-width: auto;
          max-width: none;
        }
      }
    `,
  ],
})
export class NotificationContainerComponent implements OnInit {
  notifications: Notification[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.notificationService.notifications$.subscribe((notifications) => {
      // Ensure notifications are properly bound
      this.notifications = [...notifications];
    });
  }

  close(id: string) {
    this.notificationService.dismiss(id);
  }

  trackByNotificationId(index: number, notification: Notification): string {
    return notification.id;
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'fas fa-check-circle';
      case 'error':
        return 'fas fa-times-circle';
      case 'info':
        return 'fas fa-info-circle';
      case 'warning':
        return 'fas fa-exclamation-circle';
      default:
        return 'fas fa-bell';
    }
  }
}
