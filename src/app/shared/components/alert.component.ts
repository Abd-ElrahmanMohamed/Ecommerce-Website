import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="alert" [class]="'alert-' + type" *ngIf="visible">
      <div class="alert-content">
        <span class="alert-icon">{{ getIcon() }}</span>
        <span class="alert-message">{{ message }}</span>
      </div>
      <button class="alert-close" (click)="close()" *ngIf="closable">×</button>
    </div>
  `,
  styles: [
    `
      .alert {
        padding: 12px 16px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
        animation: slideIn 0.3s ease;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .alert-success {
        background: #e8f5e9;
        border: 1px solid #c8e6c9;
        color: #27ae60;
      }

      .alert-error {
        background: #ffebee;
        border: 1px solid #ffcdd2;
        color: #c62828;
      }

      .alert-warning {
        background: #fff3e0;
        border: 1px solid #ffe0b2;
        color: #e65100;
      }

      .alert-info {
        background: #e3f2fd;
        border: 1px solid #bbdefb;
        color: #1565c0;
      }

      .alert-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .alert-icon {
        font-size: 18px;
        font-weight: bold;
      }

      .alert-message {
        font-size: 14px;
      }

      .alert-close {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        margin-left: 12px;
        opacity: 0.7;
        transition: opacity 0.2s;
      }

      .alert-close:hover {
        opacity: 1;
      }
    `,
  ],
})
export class AlertComponent {
  @Input() message: string = '';
  @Input() type: 'success' | 'error' | 'warning' | 'info' = 'info';
  @Input() closable = true;
  @Input() visible = true;

  close() {
    this.visible = false;
  }

  getIcon(): string {
    const icons: any = {
      success: '✓',
      error: '✕',
      warning: '!',
      info: 'ℹ',
    };
    return icons[this.type] || 'ℹ';
  }
}
