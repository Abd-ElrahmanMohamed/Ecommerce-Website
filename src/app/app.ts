import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { NotificationContainerComponent } from './shared/components/notification-container.component';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterOutlet, HttpClientModule, NotificationContainerComponent],
  template: `
    <div class="app-wrapper">
      <app-notification-container></app-notification-container>
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [
    `
      .app-wrapper {
        width: 100%;
        overflow-x: hidden;
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }
    `,
  ],
})
export class App {}
