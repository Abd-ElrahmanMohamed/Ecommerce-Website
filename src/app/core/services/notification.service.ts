import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  title?: string;
  duration?: number; // milliseconds, 0 means don't auto-dismiss
  action?: string; // button text
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notifications.asObservable();

  private notificationIdCounter = 0;

  constructor() {}

  /**
   * Show success notification
   */
  success(message: string, title?: string, duration: number = 3000): void {
    this.show({
      type: 'success',
      message,
      title: title || 'Success',
      duration,
    });
  }

  /**
   * Show error notification
   */
  error(message: string, title?: string, duration: number = 5000): void {
    this.show({
      type: 'error',
      message,
      title: title || 'Error',
      duration,
    });
  }

  /**
   * Show info notification
   */
  info(message: string, title?: string, duration: number = 3000): void {
    this.show({
      type: 'info',
      message,
      title: title || 'Info',
      duration,
    });
  }

  /**
   * Show warning notification
   */
  warning(message: string, title?: string, duration: number = 4000): void {
    this.show({
      type: 'warning',
      message,
      title: title || 'Warning',
      duration,
    });
  }

  /**
   * Show custom notification
   */
  show(notification: Omit<Notification, 'id'>): string {
    const id = `notif-${++this.notificationIdCounter}`;
    const notif: Notification = {
      id,
      ...notification,
    };

    // Add to list immediately. Using a zero-delay setTimeout here
    // can cause a race where the first rendered notification's
    // bindings appear empty; pushing synchronously avoids that.
    const current = this.notifications.value;
    this.notifications.next([...current, notif]);

    // Auto-dismiss if duration > 0
    if (notif.duration && notif.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, notif.duration);
    }

    return id;
  }

  /**
   * Dismiss notification by ID
   */
  dismiss(id: string): void {
    const current = this.notifications.value;
    this.notifications.next(current.filter((n) => n.id !== id));
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notifications.next([]);
  }
}
