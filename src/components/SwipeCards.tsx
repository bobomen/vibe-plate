import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RestaurantCardSkeleton } from '@/components/ui/RestaurantCardSkeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import SearchAndFilter, { FilterOptions } from './SearchAndFilter';
import { SwipeCard } from './SwipeCard';
import { useSwipeLogic } from '@/hooks/useSwipeLogic';

interface Restaurant {
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

export const SwipeCards = React.memo(() => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    priceRange: [0, 10],
    distanceRange: 999,
    minRating: 0,
    hasMichelinStars: false,
    has500Dishes: false,
    hasBibGourmand: false,
  });
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  const {
    swipeDirection,
    isDragging,
    dragOffset,
    handleSwipe,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  } = useSwipeLogic();

  const currentRestaurant = useMemo(() => 
    restaurants[currentIndex], [restaurants, currentIndex]
  );

  const distance = useMemo(() => 
    userLocation && currentRestaurant ? 
      calculateDistance(userLocation.lat, userLocation.lng, currentRestaurant.lat, currentRestaurant.lng) : 
      null, 
    [userLocation, currentRestaurant]
  );

  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...allRestaurants];

    // Convert UI price range (0-10) to database price range (1-4)
    const convertPriceRange = (uiRange: number[]): number[] => {
      const [min, max] = uiRange;
      // UI: 0=$0-100, 1=$100-200, 2=$200-300, 3=$300-400, etc.
      // DB: 1=$0-100, 2=$100-200, 3=$200-300, 4=$300+
      const dbMin = Math.max(1, min === 0 ? 1 : min);
      const dbMax = Math.min(4, max === 10 ? 4 : max);
      return [dbMin, dbMax];
    };

    const [dbMinPrice, dbMaxPrice] = convertPriceRange(filters.priceRange);

    // Apply search term filter
    if (filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(restaurant => 
        restaurant.name.toLowerCase().includes(searchLower) ||
        restaurant.address.toLowerCase().includes(searchLower) ||
        restaurant.cuisine_type.toLowerCase().includes(searchLower)
      );
    }

    // Apply price range filter
    filtered = filtered.filter(restaurant => 
      restaurant.price_range >= dbMinPrice && restaurant.price_range <= dbMaxPrice
    );

    // Apply distance filter
    if (userLocation && filters.distanceRange < 999) {
      filtered = filtered.filter(restaurant => {
        const dist = calculateDistance(
          userLocation.lat, 
          userLocation.lng, 
          restaurant.lat, 
          restaurant.lng
        );
        return dist <= filters.distanceRange;
      });
    }

    // Apply rating filter
    if (filters.minRating > 0) {
      filtered = filtered.filter(restaurant => 
        restaurant.google_rating >= filters.minRating
      );
    }

    // Apply Michelin stars filter
    if (filters.hasMichelinStars) {
      filtered = filtered.filter(restaurant => 
        restaurant.michelin_stars > 0
      );
    }

    // Apply 500 dishes filter
    if (filters.has500Dishes) {
      filtered = filtered.filter(restaurant => 
        restaurant.has_500_dishes === true
      );
    }

    // Apply Bib Gourmand filter
    if (filters.hasBibGourmand) {
      filtered = filtered.filter(restaurant => 
        restaurant.bib_gourmand === true
      );
    }

    setRestaurants(filtered);
    setCurrentIndex(0); // Reset to first card when filters change
  }, [allRestaurants, filters, userLocation, calculateDistance]);

  const fetchRestaurants = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('restaurants').select('*').limit(200);
      if (error) throw error;
      if (!data || data.length === 0) {
        setAllRestaurants([]);
        setRestaurants([]);
        return;
      }
      setAllRestaurants(data);
      setRestaurants(data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => prev + 1);
  }, []);

  const handleCardSwipe = useCallback((liked: boolean) => {
    if (currentRestaurant) {
      handleSwipe(currentRestaurant, liked, handleNext);
    }
  }, [currentRestaurant, handleSwipe, handleNext]);

  const handleCardClick = useCallback(() => {
    if (!isDragging && currentRestaurant) {
      navigate(`/app/restaurant/${currentRestaurant.id}`);
    }
  }, [isDragging, currentRestaurant, navigate]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  // Apply filters when filters or restaurants data changes
  useEffect(() => {
    if (allRestaurants.length > 0) {
      applyFilters();
    }
  }, [applyFilters, allRestaurants]);

  // Get user location for distance filtering
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied or unavailable:', error);
        }
      );
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
          <RestaurantCardSkeleton />
        </div>
      </div>
    );
  }

  if (!currentRestaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
          <Utensils className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">沒有找到餐廳</h3>
          <Button onClick={fetchRestaurants} className="mt-4">重新載入</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <SearchAndFilter
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={applyFilters}
        resultsCount={restaurants.length}
      />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <SwipeCard
          restaurant={currentRestaurant}
          distance={distance}
          onSwipe={handleCardSwipe}
          onCardClick={handleCardClick}
          swipeDirection={swipeDirection}
          isDragging={isDragging}
          dragOffset={dragOffset}
          onMouseDown={handleMouseDown}
          onMouseMove={(e) => handleMouseMove(e)}
          onMouseUp={() => handleMouseUp(currentRestaurant, handleNext)}
          onTouchStart={handleTouchStart}
          onTouchMove={(e) => handleTouchMove(e)}
          onTouchEnd={() => handleTouchEnd(currentRestaurant, handleNext)}
        />
        <div className="text-center text-sm text-muted-foreground mt-4">
          {currentIndex + 1} / {restaurants.length}
        </div>
      </div>
    </div>
  );
});

SwipeCards.displayName = 'SwipeCards';