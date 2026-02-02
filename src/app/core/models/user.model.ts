export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  mobile?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  addresses?: Address[];
  defaultAddressId?: string;
  avatar?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isActive?: boolean;
}

export interface Address {
  id: string;
  userId: string;
  type: 'home' | 'office' | 'other';
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'customer' | 'admin';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}
