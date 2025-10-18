import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ViewContext {
  source: 'personal_swipe' | 'group_swipe' | 'favorites' | 'search' | 'monthly_review';
  groupId?: string;
  filters?: any;
  userLocation?: { lat: number; lng: number };
  restaurantLocation?: { lat: number; lng: number };
}

/**
 * Hook for tracking restaurant view behavior
 * Records user clicks on restaurant cards with contextual data
 */
export const useRestaurantView = () => {
  const { user } = useAuth();

  const trackRestaurantView = useCallback(async (
    restaurantId: string,
    context: ViewContext
  ) => {
    if (!user?.id) return;

    // Calculate distance between user and restaurant
    let distance = null;
    if (context.userLocation && context.restaurantLocation) {
      distance = calculateDistance(
        context.userLocation.lat,
        context.userLocation.lng,
        context.restaurantLocation.lat,
        context.restaurantLocation.lng
      );
    }

    try {
      // Insert view record (using type assertion until types are regenerated)
      await (supabase as any).from('restaurant_views').insert({
        user_id: user.id,
        restaurant_id: restaurantId,
        view_source: context.source,
        group_id: context.groupId || null,
        user_lat: context.userLocation?.lat,
        user_lng: context.userLocation?.lng,
        distance_km: distance,
        filter_context: context.filters || {}
      });

      // Increment restaurant view count (optimistic update)
      await (supabase as any).rpc('increment_restaurant_view_count', {
        target_restaurant_id: restaurantId
      });

    } catch (error) {
      console.error('Failed to track restaurant view:', error);
      // Silent failure - don't impact user experience
    }
  }, [user?.id]);

  return { trackRestaurantView };
};

/**
 * Calculate distance between two coordinates in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
