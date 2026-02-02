export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  images: string[];
  categoryId: string;
  subCategoryId: string;
  quantity: number;
  status: ProductStatus;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
  isBestSeller?: boolean;
  isNewArrival?: boolean;

  // Seasonal Fields
  isSeasonal?: boolean;
  season?: Season;
  seasonStartDate?: Date;
  seasonEndDate?: Date;
  isSeasonalActive?: boolean;
}

export type Season = 'spring' | 'summer' | 'fall' | 'winter' | 'all-year';

export interface ProductDetail extends Product {
  category: any;
  subCategory: any;
  reviews: any[];
}

export type ProductStatus = 'in-stock' | 'out-of-stock';

export interface ProductFilter {
  categoryId?: string;
  subCategoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: 'newest' | 'popular' | 'price-low' | 'price-high' | 'rating';
  page?: number;
  limit?: number;
}

export interface ProductSearchResult {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
