import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, Eye, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RestaurantCardSkeleton } from '@/components/ui/RestaurantCardSkeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useParams } from 'react-router-dom';
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

interface GroupInfo {
  id: string;
  name: string;
  code: string;
}

export const GroupSwipeCards = React.memo(() => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [userGroupSwipes, setUserGroupSwipes] = useState<Set<string>>(new Set());
  const [userPreference, setUserPreference] = useState<{ [key: string]: boolean }>({});
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

  const currentRestaurant = useMemo(() => 
    restaurants[currentIndex], [restaurants, currentIndex]
  );

  const distance = useMemo(() => 
    userLocation && currentRestaurant ? 
      calculateDistance(userLocation.lat, userLocation.lng, currentRestaurant.lat, currentRestaurant.lng) : 
      null, 
    [userLocation, currentRestaurant, calculateDistance]
  );

  // Fetch group info and verify membership
  const fetchGroupInfo = useCallback(async () => {
    if (!groupId || !user?.id) return;

    try {
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('id, name, code')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;

      // Check if user is member of this group
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single();

      if (memberError || !memberData) {
        toast({
          title: "無法存取群組",
          description: "您不是此群組的成員",
          variant: "destructive",
        });
        navigate('/app/groups');
        return;
      }

      setGroupInfo(groupData);
    } catch (error) {
      console.error('Error fetching group info:', error);
      toast({
        title: "載入失敗",
        description: "無法載入群組資訊",
        variant: "destructive",
      });
      navigate('/app/groups');
    }
  }, [groupId, user?.id, toast, navigate]);

  // Fetch user's group swipes and preferences
  const fetchUserSwipes = useCallback(async () => {
    if (!user?.id || !groupId) return;

    try {
      // Get user's swipes in this group context (we'll track by group context later)
      // For now, get all user swipes to show their previous preferences
      const { data: swipeData, error: swipeError } = await supabase
        .from('user_swipes')
        .select('restaurant_id, liked')
        .eq('user_id', user.id);

      if (swipeError) throw swipeError;

      // Build preference map and swipe set
      const preferences: { [key: string]: boolean } = {};
      const groupSwipeSet = new Set<string>();

      if (swipeData) {
        swipeData.forEach(swipe => {
          preferences[swipe.restaurant_id] = swipe.liked;
          // For now, consider all swipes as group swipes
          // Later we can add group_id to user_swipes table if needed
          groupSwipeSet.add(swipe.restaurant_id);
        });
      }

      setUserPreference(preferences);
      setUserGroupSwipes(groupSwipeSet);
    } catch (error) {
      console.error('Error fetching user swipes:', error);
    }
  }, [user?.id, groupId]);

  const applyFilters = useCallback(() => {
    let filtered = [...allRestaurants];

    // Exclude restaurants user has already swiped in this group
    filtered = filtered.filter(restaurant => !userGroupSwipes.has(restaurant.id));

    // Apply other filters...
    const convertPriceRange = (uiRange: number[]): number[] => {
      const [min, max] = uiRange;
      const dbMin = min === 0 ? 1 : Math.ceil(min / 2.5);
      const dbMax = max === 10 ? 4 : Math.ceil(max / 2.5);
      return [Math.max(1, dbMin), Math.min(4, dbMax)];
    };

    const [dbMinPrice, dbMaxPrice] = convertPriceRange(filters.priceRange);

    if (filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(restaurant => 
        restaurant.name.toLowerCase().includes(searchLower) ||
        restaurant.address.toLowerCase().includes(searchLower) ||
        restaurant.cuisine_type.toLowerCase().includes(searchLower)
      );
    }

    filtered = filtered.filter(restaurant => 
      restaurant.price_range >= dbMinPrice && restaurant.price_range <= dbMaxPrice
    );

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

    if (filters.minRating > 0) {
      filtered = filtered.filter(restaurant => 
        restaurant.google_rating >= filters.minRating
      );
    }

    if (filters.hasMichelinStars) {
      filtered = filtered.filter(restaurant => 
        restaurant.michelin_stars > 0
      );
    }

    if (filters.has500Dishes) {
      filtered = filtered.filter(restaurant => 
        restaurant.has_500_dishes === true
      );
    }

    if (filters.hasBibGourmand) {
      filtered = filtered.filter(restaurant => 
        restaurant.bib_gourmand === true
      );
    }

    setRestaurants(filtered);
    setCurrentIndex(0);
  }, [allRestaurants, filters, userLocation, calculateDistance, userGroupSwipes]);

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
      // Update user group swipes
      setUserGroupSwipes(prev => new Set([...prev, currentRestaurant.id]));
      setUserPreference(prev => ({ ...prev, [currentRestaurant.id]: liked }));
    }
  }, [currentRestaurant, handleSwipe, handleNext]);

  const handleCardClick = useCallback(() => {
    if (!isDragging && currentRestaurant) {
      navigate(`/app/restaurant/${currentRestaurant.id}`);
    }
  }, [isDragging, currentRestaurant, navigate]);

  useEffect(() => {
    fetchGroupInfo();
  }, [fetchGroupInfo]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  useEffect(() => {
    fetchUserSwipes();
  }, [fetchUserSwipes]);

  useEffect(() => {
    if (allRestaurants.length > 0) {
      applyFilters();
    }
  }, [allRestaurants, filters, userLocation, applyFilters]);

  // Get user location
  useEffect(() => {
    if (allRestaurants.length > 0 && navigator.geolocation && !userLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          toast({
            title: "位置權限被拒絕",
            description: "您仍可以瀏覽餐廳，但無法使用距離篩選功能。",
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    }
  }, [allRestaurants, toast, userLocation]);

  if (loading || !groupInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
          <RestaurantCardSkeleton />
        </div>
      </div>
    );
  }

  const hasUserPreference = currentRestaurant && userPreference.hasOwnProperty(currentRestaurant.id);
  const preferenceText = hasUserPreference 
    ? (userPreference[currentRestaurant.id] ? "你之前喜歡過這家" : "你之前不喜歡這家")
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/groups')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-semibold">{groupInfo.name || `群組 ${groupInfo.code}`}</h1>
              <p className="text-sm text-muted-foreground">群組滑卡模式</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/app/groups/${groupId}/consensus`)}
            >
              <Eye className="h-4 w-4 mr-1" />
              查看共識
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/app/groups/${groupId}/consensus-summary`)}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              共識總結
            </Button>
          </div>
        </div>
      </div>

      <SearchAndFilter
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={applyFilters}
        resultsCount={restaurants.length}
      />

      {!currentRestaurant ? (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold text-foreground">已完成所有可用餐廳的投票</h3>
            <p className="text-muted-foreground max-w-md">
              您已經對所有符合條件的餐廳投過票了！
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => navigate(`/app/groups/${groupId}/consensus`)}
                className="mx-2"
              >
                查看群組共識結果
              </Button>
              <Button 
                onClick={() => navigate('/app/groups')}
                variant="outline"
                className="mx-2"
              >
                返回群組列表
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)] p-4">
          {hasUserPreference && (
            <div className="mb-3 px-3 py-2 bg-accent/50 rounded-full text-sm text-muted-foreground">
              {preferenceText}
            </div>
          )}
          
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
      )}
    </div>
  );
});

GroupSwipeCards.displayName = 'GroupSwipeCards';