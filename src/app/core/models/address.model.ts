export interface Address {
  id: string;
  userId: string;
  type: AddressType;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type AddressType = 'home' | 'office' | 'other';

export interface CreateAddressRequest {
  type: AddressType;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface UpdateAddressRequest extends CreateAddressRequest {
  id: string;
}
