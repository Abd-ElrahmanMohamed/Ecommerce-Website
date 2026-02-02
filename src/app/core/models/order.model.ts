export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  phone?: string;
  email?: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  paymentMethod: 'COD';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  refundDeadline?: Date;
  canCancel: boolean;
  canReturn?: boolean;
  returnDeadline?: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ShippingAddress {
  name?: string;
  mobile?: string;
  street: string;
  city: string;
  state: string;
  zipCode?: string;
  postalCode?: string;
  country: string;
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'ready'
  | 'shipped'
  | 'received'
  | 'refused'
  | 'canceled';

export interface PlaceOrderRequest {
  cartItems: CartItemForOrder[];
  shippingAddressId?: string;
  shippingAddress?: {
    name: string;
    mobile: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  userInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    password?: string;
  };
  phone?: string;
  email?: string;
  notes?: string;
}

export interface CartItemForOrder {
  productId: string;
  productName?: string;
  productImage?: string;
  quantity: number;
  price: number;
}

export interface OrderSummary {
  totalOrders: number;
  totalRevenue: number;
  totalProductsSold: number;
  pendingOrders: number;
  processingOrders: number;
  readyOrders: number;
  shippedOrders: number;
}

export type ReturnStatus = 'requested' | 'approved' | 'rejected' | 'processing' | 'completed';

export interface ReturnRequest {
  id: string;
  orderId: string;
  orderNumber: string;
  userId: string;
  items: ReturnItem[];
  reason: string;
  description?: string;
  status: ReturnStatus;
  refundAmount: number;
  requestedAt: Date;
  approvedAt?: Date;
  completedAt?: Date;
  notes?: string;
}

export interface ReturnItem {
  orderItemId: string;
  productId: string;
  productName: string;
  quantity: number;
  pricePaid: number;
  returnReason: string;
}

export interface ProcessReturnRequest {
  returnId: string;
  action: 'approve' | 'reject';
  notes?: string;
}
