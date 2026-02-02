import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header.component';
import { FooterComponent } from '../../shared/components/footer.component';

interface FAQItem {
  id: number;
  category: string;
  question: string;
  answer: string;
  open?: boolean;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.css',
})
export class FAQComponent {
  selectedCategory = 'all';

  faqs: FAQItem[] = [
    {
      id: 1,
      category: 'shipping',
      question: 'How long does shipping take?',
      answer:
        'We typically ship orders within 2-5 business days. Delivery time depends on your location.',
    },
    {
      id: 2,
      category: 'shipping',
      question: 'Do you ship outside Cairo?',
      answer:
        'Yes, we ship to all governorates in Egypt. Shipping costs and times may vary by location.',
    },
    {
      id: 3,
      category: 'payment',
      question: 'What payment methods do you accept?',
      answer: 'We currently accept Cash on Delivery (COD). You can pay when your order arrives.',
    },
    {
      id: 4,
      category: 'payment',
      question: 'Is my payment information safe?',
      answer:
        "Yes! Since we offer COD, you don't need to share sensitive payment information online.",
    },
    {
      id: 5,
      category: 'returns',
      question: 'What is your return policy?',
      answer:
        'We offer a 14-day return policy from the date of purchase. Products must be unused and in original packaging.',
    },
    {
      id: 6,
      category: 'returns',
      question: 'How do I return a product?',
      answer:
        "Contact our support team with your order number. We'll arrange a pickup for you and process the refund.",
    },
    {
      id: 7,
      category: 'products',
      question: 'Are the sizes accurate?',
      answer:
        'Yes, all sizes are standard. Please refer to our size guide on each product page for detailed measurements.',
    },
    {
      id: 8,
      category: 'products',
      question: 'Can I check product availability?',
      answer:
        'Product availability is shown on each product page. "In Stock" means it\'s available for immediate order.',
    },
    {
      id: 9,
      category: 'account',
      question: 'Do I need to create an account to order?',
      answer:
        'No, you can order as a guest. However, creating an account helps you track orders and save addresses.',
    },
    {
      id: 10,
      category: 'account',
      question: 'How do I track my order?',
      answer:
        "You can track your order using the order tracking page. You'll need your order number.",
    },
  ];

  categories = [
    { id: 'all', name: 'All Questions' },
    { id: 'shipping', name: 'Shipping' },
    { id: 'payment', name: 'Payment' },
    { id: 'returns', name: 'Returns' },
    { id: 'products', name: 'Products' },
    { id: 'account', name: 'Account' },
  ];

  get filteredFaqs(): FAQItem[] {
    if (this.selectedCategory === 'all') {
      return this.faqs;
    }
    return this.faqs.filter((f) => f.category === this.selectedCategory);
  }

  toggleFaq(faq: FAQItem) {
    faq.open = !faq.open;
  }
}
