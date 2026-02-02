import { Injectable } from '@angular/core';

/**
 * SlugService: Handles clean URL slugs for products, categories, etc.
 *
 * Examples:
 * - "Summer T-Shirt" -> "summer-t-shirt"
 * - "Casual Shirt (50% OFF)" -> "casual-shirt-50-off"
 * - "Product & Brand" -> "product-brand"
 */
@Injectable({
  providedIn: 'root',
})
export class SlugService {
  /**
   * Generate a slug from a string
   * @param text - The text to convert to slug
   * @returns URL-friendly slug
   */
  generateSlug(text: string): string {
    if (!text) return '';

    return text
      .toLowerCase() // Convert to lowercase
      .trim() // Remove leading/trailing spaces
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Generate slug for product
   * @param productName - Product name
   * @param productId - Product ID
   * @returns URL slug with ID
   */
  generateProductSlug(productName: string, productId?: string): string {
    const nameSlug = this.generateSlug(productName);
    return productId ? `${nameSlug}-${productId}` : nameSlug;
  }

  /**
   * Generate slug for category
   * @param categoryName - Category name
   * @param categoryId - Category ID
   * @returns URL slug with ID
   */
  generateCategorySlug(categoryName: string, categoryId?: string): string {
    const nameSlug = this.generateSlug(categoryName);
    return categoryId ? `${nameSlug}-${categoryId}` : nameSlug;
  }

  /**
   * Extract ID from slug
   * @param slug - The slug string (e.g., "product-name-123")
   * @returns Extracted ID or null
   */
  extractIdFromSlug(slug: string): string | null {
    if (!slug) return null;
    const parts = slug.split('-');
    const lastPart = parts[parts.length - 1];
    // Check if last part is an ID (numeric or standard format)
    return /^[a-zA-Z0-9]+$/.test(lastPart) ? lastPart : null;
  }

  /**
   * Extract name from slug
   * @param slug - The slug string (e.g., "product-name-123")
   * @returns Extracted name
   */
  extractNameFromSlug(slug: string): string {
    if (!slug) return '';
    const parts = slug.split('-');
    // Remove last part if it's an ID
    if (/^[a-zA-Z0-9]+$/.test(parts[parts.length - 1])) {
      parts.pop();
    }
    return parts.join(' ');
  }

  /**
   * Validate if string is a valid slug
   * @param slug - String to validate
   * @returns true if valid slug format
   */
  isValidSlug(slug: string): boolean {
    if (!slug) return false;
    // Valid slug: lowercase, hyphens, numbers, no spaces or special chars
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  }

  /**
   * Create a slug URL for product
   * @param productName - Product name
   * @param productId - Product ID
   * @returns Complete URL path
   */
  getProductUrl(productName: string, productId: string): string {
    return `/products/${this.generateProductSlug(productName, productId)}`;
  }

  /**
   * Create a slug URL for category
   * @param categoryName - Category name
   * @param categoryId - Category ID
   * @returns Complete URL path
   */
  getCategoryUrl(categoryName: string, categoryId: string): string {
    return `/categories/${this.generateCategorySlug(categoryName, categoryId)}`;
  }

  /**
   * Generate multiple slugs in batch
   * @param items - Array of items with name property
   * @returns Array of slugs
   */
  generateMultipleSlugs(items: Array<{ name: string; id?: string }>): string[] {
    return items.map((item) => this.generateProductSlug(item.name, item.id));
  }

  /**
   * Sanitize user input for slug
   * @param input - User input
   * @returns Safe slug
   */
  sanitizeForSlug(input: string): string {
    // Remove script tags and dangerous content
    let safe = input.replace(/<[^>]*>/g, ''); // Remove HTML tags
    safe = safe.replace(/javascript:/gi, ''); // Remove javascript protocol
    safe = safe.replace(/on\w+\s*=/gi, ''); // Remove event handlers
    return this.generateSlug(safe);
  }
}
