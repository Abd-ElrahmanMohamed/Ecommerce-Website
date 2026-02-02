import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
  email = '';

  onSubscribe() {
    if (this.email.trim()) {
      console.log('Subscribed with email:', this.email);
      alert('Thank you for subscribing!');
      this.email = '';
    }
  }
}
