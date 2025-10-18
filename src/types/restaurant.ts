/**
 * Shared Restaurant type definition
 * Used across all restaurant-related components and hooks
 */
export interface Restaurant {
  id: string;
  name: string;
  address: string;
  city?: string | null;
  district?: string | null;
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
  dietary_options?: {
    vegetarian?: boolean;
    vegan?: boolean;
    halal?: boolean;
    gluten_free?: boolean;
  };
  ai_classified_at?: string;
  ai_confidence?: number;
  phone?: string | null;
  menu_url?: string | null;
  website?: string | null;
  google_maps_url?: string | null;
  view_count?: number;
  last_viewed_at?: string | null;
}

/**
 * Minimal Restaurant interface for swipe operations
 */
export interface RestaurantBase {
  id: string;
  name: string;
}