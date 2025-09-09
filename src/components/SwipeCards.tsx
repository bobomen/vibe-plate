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
  const [locationLoading, setLocationLoading] = useState(false);
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
    console.log('Starting filter application...', { 
      totalRestaurants: allRestaurants.length,
      filters,
      hasLocation: !!userLocation
    });
    
    let filtered = [...allRestaurants];

    // Convert UI price range (0-10) to database price range (1-4)
    const convertPriceRange = (uiRange: number[]): number[] => {
      const [min, max] = uiRange;
      // UI: 0-10 represents $0-$1000+ range
      // DB: 1-4 represents actual price categories
      const dbMin = min === 0 ? 1 : Math.ceil(min / 2.5);
      const dbMax = max === 10 ? 4 : Math.ceil(max / 2.5);
      return [Math.max(1, dbMin), Math.min(4, dbMax)];
    };

    const [dbMinPrice, dbMaxPrice] = convertPriceRange(filters.priceRange);
    console.log('Price range conversion:', { ui: filters.priceRange, db: [dbMinPrice, dbMaxPrice] });

    // Apply search term filter
    if (filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase();
      const originalCount = filtered.length;
      filtered = filtered.filter(restaurant => 
        restaurant.name.toLowerCase().includes(searchLower) ||
        restaurant.address.toLowerCase().includes(searchLower) ||
        restaurant.cuisine_type.toLowerCase().includes(searchLower)
      );
      console.log(`Search filter: ${originalCount} → ${filtered.length}`);
    }

    // Apply price range filter
    const beforePriceFilter = filtered.length;
    filtered = filtered.filter(restaurant => 
      restaurant.price_range >= dbMinPrice && restaurant.price_range <= dbMaxPrice
    );
    console.log(`Price filter: ${beforePriceFilter} → ${filtered.length}`);

    // Apply distance filter (only if location is available and distance is set)
    if (userLocation && filters.distanceRange < 999) {
      const beforeDistanceFilter = filtered.length;
      filtered = filtered.filter(restaurant => {
        const dist = calculateDistance(
          userLocation.lat, 
          userLocation.lng, 
          restaurant.lat, 
          restaurant.lng
        );
        return dist <= filters.distanceRange;
      });
      console.log(`Distance filter: ${beforeDistanceFilter} → ${filtered.length}`);
    }

    // Apply rating filter
    if (filters.minRating > 0) {
      const beforeRatingFilter = filtered.length;
      filtered = filtered.filter(restaurant => 
        restaurant.google_rating >= filters.minRating
      );
      console.log(`Rating filter: ${beforeRatingFilter} → ${filtered.length}`);
    }

    // Apply Michelin stars filter
    if (filters.hasMichelinStars) {
      const beforeMichelinFilter = filtered.length;
      filtered = filtered.filter(restaurant => 
        restaurant.michelin_stars > 0
      );
      console.log(`Michelin filter: ${beforeMichelinFilter} → ${filtered.length}`);
    }

    // Apply 500 dishes filter
    if (filters.has500Dishes) {
      const before500Filter = filtered.length;
      filtered = filtered.filter(restaurant => 
        restaurant.has_500_dishes === true
      );
      console.log(`500 dishes filter: ${before500Filter} → ${filtered.length}`);
    }

    // Apply Bib Gourmand filter
    if (filters.hasBibGourmand) {
      const beforeBibFilter = filtered.length;
      filtered = filtered.filter(restaurant => 
        restaurant.bib_gourmand === true
      );
      console.log(`Bib Gourmand filter: ${beforeBibFilter} → ${filtered.length}`);
    }

    console.log(`Final filtered results: ${filtered.length} restaurants`);
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

  // Apply filters when filters, restaurants data, or location changes
  useEffect(() => {
    if (allRestaurants.length > 0) {
      console.log('Applying filters...', { 
        restaurantsCount: allRestaurants.length, 
        filters, 
        hasLocation: !!userLocation 
      });
      applyFilters();
    }
  }, [allRestaurants, filters, userLocation, applyFilters]);

  // Get user location for distance filtering - only after restaurants are loaded
  useEffect(() => {
    if (allRestaurants.length > 0 && navigator.geolocation && !userLocation) {
      console.log('Requesting location permission...');
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Location granted:', position.coords);
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationLoading(false);
        },
        (error) => {
          console.log('Location access denied or unavailable:', error);
          setLocationLoading(false);
          // Continue without location - don't block the app
          toast({
            title: "位置權限被拒絕",
            description: "您仍可以瀏覽餐廳，但無法使用距離篩選功能。",
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    }
  }, [allRestaurants, toast, userLocation]);

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
        <SearchAndFilter
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={applyFilters}
          resultsCount={restaurants.length}
        />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-foreground">沒有找到符合條件的餐廳</h3>
            <p className="text-muted-foreground max-w-md">
              請嘗試調整篩選條件，或者
              {!userLocation && '開啟位置權限以使用距離篩選，或者'}
              重新載入資料。
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => {
                  setFilters({
                    searchTerm: '',
                    priceRange: [0, 10],
                    distanceRange: 999,
                    minRating: 0,
                    hasMichelinStars: false,
                    has500Dishes: false,
                    hasBibGourmand: false,
                  });
                }}
                variant="outline"
                className="mx-2"
              >
                重置篩選條件
              </Button>
              <Button onClick={fetchRestaurants} className="mx-2">
                重新載入
              </Button>
            </div>
          </div>
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