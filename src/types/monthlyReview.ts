/**
 * Monthly Review Data Types
 * Designed for scalability and future backend analytics
 */

/**
 * User-selected top restaurant with photo binding
 * This structure allows for future analytics on:
 * - Most popular restaurants across users
 * - Cuisine preference trends
 * - Photo quality and engagement metrics
 */
export interface TopRestaurantSelection {
  rank: 1 | 2 | 3;
  restaurantId?: string; // UUID if selected from favorites
  restaurantName: string; // Supports manual input
  photoIndex: number; // Index in uploaded photos array
  photoUrl?: string; // Storage URL after upload (Phase 2.4)
}

/**
 * Complete monthly review data structure
 * Extensible for future features:
 * - Additional ranking categories (e.g., "Best Ambiance", "Best Value")
 * - User sentiment analysis from notes/comments
 * - Social sharing metrics
 */
export interface MonthlyReviewData {
  // User-created content
  uploadedPhotos: File[];
  topRestaurants: {
    top1: TopRestaurantSelection | null;
    top2: TopRestaurantSelection | null;
    top3: TopRestaurantSelection | null;
  };

  // Backend-calculated statistics (not shown to user)
  statistics?: {
    totalSwipes: number;
    totalLikes: number;
    likePercentage: number;
    totalFavorites: number;
    topCuisineType: string;
    mostVisitedDistrict: string;
  };
}

/**
 * Database record structure for monthly_reviews table
 * All fields align with existing schema
 */
export interface MonthlyReviewRecord {
  id?: string;
  user_id: string;
  review_month: string; // YYYY-MM-DD format
  user_ranked_restaurants: Array<{
    rank: number;
    restaurant_id?: string;
    restaurant_name: string;
    photo_url: string;
  }>;
  graphic_url?: string;
  total_swipes?: number;
  total_likes?: number;
  like_percentage?: number;
  total_favorites?: number;
  top_cuisine_type?: string;
  most_visited_district?: string;
  generated_at?: string;
  shared_at?: string;
  shared_to_platform?: string;
}
