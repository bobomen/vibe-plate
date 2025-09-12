/**
 * Shared Restaurant type definition
 * Used across all restaurant-related components and hooks
 */
export interface Restaurant {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  google_rating: number;
  google_reviews_count: number;
  michelin_stars: number;
  has_500_dishes: boolean;
  photos: string[];
  cuisine_type: string;
  price_range: number;
  bib_gourmand: boolean;
}

/**
 * Minimal Restaurant interface for swipe operations
 */
export interface RestaurantBase {
  id: string;
  name: string;
}