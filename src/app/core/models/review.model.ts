export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userImage?: string;
  rating: number;
  title: string;
  comment: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
  verifiedPurchase: boolean;
  helpful: number;
  notHelpful: number;
}

export interface CreateReviewRequest {
  productId: string;
  rating: number;
  title: string;
  comment: string;
}

export interface ReviewApproval {
  reviewId: string;
  isApproved: boolean;
}
