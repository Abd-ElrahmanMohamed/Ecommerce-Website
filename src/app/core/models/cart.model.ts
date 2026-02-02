export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  priceChanged: boolean;
  previousPrice?: number;
  product?: CartProduct;
}

export interface CartProduct {
  id: string;
  name: string;
  image: string;
  currentPrice: number;
  slug: string;
}

export interface Cart {
  id: string;
  userId?: string;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CartSummary {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  itemCount: number;
  priceChangedItems: CartItem[];
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}
