import { useState, useEffect } from 'react';
import { Heart, X, Star, MapPin, ChevronLeft, ChevronRight, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import SearchAndFilter, { FilterOptions } from './SearchAndFilter';

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
}

export const SwipeCards = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    cuisineType: '',
    priceRange: [1, 4],
    distanceRange: 999,
    minRating: 0,
    hasMichelinStars: false,
    has500Dishes: false,
  });
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    fetchRestaurants();
    getUserLocation();
  }, []);

  useEffect(() => {
    if (allRestaurants.length > 0) {
      applyFilters();
    }
  }, [filters, allRestaurants]);

  // Debug effect to track component state
  useEffect(() => {
    console.log('SwipeCards state update:', {
      restaurantsCount: restaurants.length,
      currentIndex,
      loading,
      hasUser: !!user,
      currentRestaurant: currentIndex < restaurants.length ? restaurants[currentIndex]?.name : 'N/A'
    });
  }, [restaurants, currentIndex, loading, user]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Location access denied:', error);
          // 設定預設位置（台北市中心）
          setUserLocation({ lat: 25.0330, lng: 121.5654 });
        }
      );
    } else {
      // 設定預設位置
      setUserLocation({ lat: 25.0330, lng: 121.5654 });
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // 地球半徑（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const applyFilters = () => {
    if (!allRestaurants.length) return;

    let filtered = [...allRestaurants];

    // 搜尋篩選
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(restaurant => 
        restaurant.name.toLowerCase().includes(searchLower) ||
        (restaurant.address && restaurant.address.toLowerCase().includes(searchLower))
      );
    }

    // 菜系篩選
    if (filters.cuisineType) {
      filtered = filtered.filter(restaurant => restaurant.cuisine_type === filters.cuisineType);
    }

    // 價位篩選
    filtered = filtered.filter(restaurant => 
      restaurant.price_range >= filters.priceRange[0] && 
      restaurant.price_range <= filters.priceRange[1]
    );

    // 評分篩選
    if (filters.minRating > 0) {
      filtered = filtered.filter(restaurant => restaurant.google_rating >= filters.minRating);
    }

    // 距離篩選
    if (filters.distanceRange < 999 && userLocation) {
      filtered = filtered.filter(restaurant => {
        const distance = calculateDistance(
          userLocation.lat, 
          userLocation.lng, 
          restaurant.lat, 
          restaurant.lng
        );
        return distance <= filters.distanceRange;
      });
    }

    // 特殊標籤篩選
    if (filters.hasMichelinStars) {
      filtered = filtered.filter(restaurant => restaurant.michelin_stars > 0);
    }

    if (filters.has500Dishes) {
      filtered = filtered.filter(restaurant => restaurant.has_500_dishes === true);
    }

    setRestaurants(filtered);
    setCurrentIndex(0);
    setCurrentPhotoIndex(0);
  };

  const handleSearch = () => {
    applyFilters();
    toast({
      title: "篩選完成",
      description: `找到 ${restaurants.length} 間符合條件的餐廳`,
    });
  };

  const fetchRestaurants = async () => {
    try {
      console.log('Starting to fetch restaurants...');
      setLoading(true);
      
      // First check if we have a user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Auth error:', userError);
      }
      console.log('Current user:', user?.id ? 'Authenticated' : 'Not authenticated');
      
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .limit(200);

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      
      console.log('Fetched restaurants count:', data?.length || 0);
      console.log('Sample restaurant data:', data?.[0]);
      
      if (!data || data.length === 0) {
        console.warn('No restaurants found in database');
        toast({
          title: "暫無餐廳資料",
          description: "目前沒有餐廳資料，請稍後再試",
          variant: "destructive",
        });
        setAllRestaurants([]);
        setRestaurants([]);
        return;
      }
      
      setAllRestaurants(data);
      setRestaurants(data);
      console.log('Successfully set restaurants state');
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast({
        title: "載入失敗",
        description: "無法載入餐廳資料，請稍後再試",
        variant: "destructive",
      });
      setAllRestaurants([]);
      setRestaurants([]);
    } finally {
      setLoading(false);
      console.log('Fetch restaurants completed');
    }
  };

  const handleSwipe = async (liked: boolean) => {
    if (currentIndex >= restaurants.length) return;
    
    const restaurant = restaurants[currentIndex];
    setSwipeDirection(liked ? 'right' : 'left');
    
    try {
      // Record the swipe
      await supabase
        .from('user_swipes')
        .upsert({
          user_id: user?.id,
          restaurant_id: restaurant.id,
          liked
        });

      // Add to favorites if liked
      if (liked) {
        await supabase
          .from('favorites')
          .upsert({
            user_id: user?.id,
            restaurant_id: restaurant.id
          });
        
        toast({
          title: "已收藏！",
          description: `${restaurant.name} 已加入收藏清單`,
        });
      }
    } catch (error) {
      console.error('Error recording swipe:', error);
    }

    // Move to next card after animation
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setSwipeDirection(null);
      setCurrentPhotoIndex(0); // Reset photo index for next card
    }, 300);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <SearchAndFilter
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={handleSearch}
          resultsCount={restaurants.length}
        />
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
          <Utensils className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">沒有找到餐廳</h3>
          <p className="text-muted-foreground text-center">
            沒有符合篩選條件的餐廳，請嘗試調整篩選條件。
          </p>
          <Button 
            onClick={() => setFilters({
              searchTerm: '',
              cuisineType: '',
              priceRange: [1, 4],
              distanceRange: 999,
              minRating: 0,
              hasMichelinStars: false,
              has500Dishes: false,
            })}
            className="mt-4"
          >
            重置篩選條件
          </Button>
        </div>
      </div>
    );
  }

  if (currentIndex >= restaurants.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <SearchAndFilter
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={handleSearch}
          resultsCount={restaurants.length}
        />
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">沒有更多餐廳了！</h2>
            <p className="text-muted-foreground mb-6">您已經瀏覽完所有符合條件的餐廳</p>
            <Button onClick={() => {
              setCurrentIndex(0);
              fetchRestaurants();
            }}>
              重新開始
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentRestaurant = restaurants[currentIndex];
  
  if (!currentRestaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <SearchAndFilter
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={handleSearch}
          resultsCount={restaurants.length}
        />
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">暫無餐廳資料</h2>
            <p className="text-muted-foreground mb-6">請稍後再試</p>
            <Button onClick={fetchRestaurants}>
              重新載入
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  const distance = userLocation ? 
    calculateDistance(userLocation.lat, userLocation.lng, currentRestaurant.lat, currentRestaurant.lng) : 
    null;
  const photos = currentRestaurant.photos?.slice(0, 3) || ['/placeholder.svg'];

  const nextPhoto = () => {
    setCurrentPhotoIndex(prev => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex(prev => (prev - 1 + photos.length) % photos.length);
  };

  const handleCardClick = () => {
    if (!isDragging) {
      navigate(`/app/restaurant/${currentRestaurant.id}`);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget && !(e.target as Element).closest('.card-content')) return;
    setIsDragging(false);
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (startPos.x === 0) return;
    
    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;
    
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      setIsDragging(true);
      setDragOffset({ x: deltaX, y: deltaY });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && Math.abs(dragOffset.x) > 100) {
      const liked = dragOffset.x > 0;
      handleSwipe(liked);
    }
    
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    setStartPos({ x: 0, y: 0 });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(false);
    setStartPos({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startPos.x === 0) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startPos.x;
    const deltaY = touch.clientY - startPos.y;
    
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      setIsDragging(true);
      setDragOffset({ x: deltaX, y: deltaY });
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (isDragging && Math.abs(dragOffset.x) > 100) {
      const liked = dragOffset.x > 0;
      handleSwipe(liked);
    }
    
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    setStartPos({ x: 0, y: 0 });
  };

  const getCardTransform = () => {
    if (swipeDirection === 'left') return 'translate-x-[-100%] rotate-[-15deg]';
    if (swipeDirection === 'right') return 'translate-x-[100%] rotate-[15deg]';
    if (isDragging) {
      const rotation = dragOffset.x * 0.1;
      return `translate(${dragOffset.x}px, ${dragOffset.y * 0.5}px) rotate(${rotation}deg)`;
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <SearchAndFilter
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={handleSearch}
        resultsCount={restaurants.length}
      />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <div className="relative w-full max-w-sm">{currentRestaurant && (
        <>
          {/* Restaurant Card */}
          <Card 
            className={`relative w-full bg-card border-0 shadow-2xl overflow-hidden cursor-pointer select-none ${
              !isDragging ? 'transition-transform duration-300' : ''
            } ${getCardTransform()}`}
            onClick={handleCardClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
          {/* Restaurant Image Carousel */}
          <div className="relative h-96 bg-gradient-to-b from-transparent to-black/50 card-content">
            <img
              src={photos[currentPhotoIndex]}
              alt={currentRestaurant.name}
              className="w-full h-full object-cover"
            />
            
            {/* Photo Navigation */}
            {photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white border-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevPhoto();
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white border-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextPhoto();
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                {/* Photo Indicators */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1">
                  {photos.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
            
            {/* Overlay Info */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h3 className="text-2xl font-bold mb-2">{currentRestaurant.name}</h3>
              
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">{currentRestaurant.google_rating}</span>
                  <span className="text-xs text-gray-300">({currentRestaurant.google_reviews_count})</span>
                </div>
                
                 <div className="flex items-center gap-1">
                   <MapPin className="h-4 w-4" />
                   <span className="text-sm">{distance ? `${distance.toFixed(1)}km` : '距離未知'}</span>
                 </div>
              </div>

               <div className="flex flex-wrap gap-2">
                 {currentRestaurant.cuisine_type && (
                   <Badge variant="secondary" className="bg-primary/20 text-primary">
                     {currentRestaurant.cuisine_type}
                   </Badge>
                 )}
                 <Badge variant="secondary" className="bg-secondary/80 text-secondary-foreground">
                   {'$'.repeat(currentRestaurant.price_range)}
                 </Badge>
                 {currentRestaurant.michelin_stars > 0 && (
                   <Badge variant="secondary" className="bg-yellow-600 text-white">
                     米其林 {currentRestaurant.michelin_stars}星
                   </Badge>
                 )}
                 {currentRestaurant.has_500_dishes && (
                   <Badge variant="secondary" className="bg-green-600 text-white">
                     500盤
                   </Badge>
                 )}
               </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-8 mt-8">
          <Button
            size="lg"
            variant="outline"
            className="rounded-full w-16 h-16 p-0 border-red-200 hover:bg-red-50 hover:border-red-300"
            onClick={(e) => {
              e.stopPropagation();
              handleSwipe(false);
            }}
          >
            <X className="h-8 w-8 text-red-500" />
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            className="rounded-full w-16 h-16 p-0 border-green-200 hover:bg-green-50 hover:border-green-300"
            onClick={(e) => {
              e.stopPropagation();
              handleSwipe(true);
            }}
          >
            <Heart className="h-8 w-8 text-green-500" />
          </Button>
        </div>

        {/* Swipe Instructions */}
        <p className="text-center text-sm text-muted-foreground mt-4">
          左滑跳過，右滑收藏，或點擊卡片查看詳情
        </p>
        </>
        )}
        </div>
      </div>
    </div>
  );
};