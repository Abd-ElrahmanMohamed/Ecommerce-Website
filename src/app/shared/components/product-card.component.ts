import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css',
})
export class ProductCardComponent {
  @Input() product: any;
  @Output() addToCart = new EventEmitter();
  @Output() viewDetails = new EventEmitter();

  onAddToCart(event: Event) {
    event.preventDefault();
    this.addToCart.emit(this.product);
  }

  onViewDetails() {
    this.viewDetails.emit(this.product);
  }

  getStockStatus(): string {
    if (this.product.quantity === 0) {
      return 'Out of Stock';
    } else if (this.product.quantity <= 3) {
      return 'Low Stock';
    }
    return 'In Stock';
  }

  isOutOfStock(): boolean {
    return this.product.quantity <= 0;
  }

  showStockCount(): boolean {
    // Show stock count ONLY when quantity <= 3 and > 0
    return this.product.quantity > 0 && this.product.quantity <= 3;
  }
}
