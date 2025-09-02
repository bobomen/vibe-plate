import { useState, useEffect } from 'react';
import { Heart, X, Star, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
}

export const SwipeCards = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetchRestaurants();
  }, []);

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
        .limit(20);

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
        setRestaurants([]);
        return;
      }
      
      setRestaurants(data);
      console.log('Successfully set restaurants state');
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast({
        title: "載入失敗",
        description: "無法載入餐廳資料，請稍後再試",
        variant: "destructive",
      });
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

  const calculateDistance = (lat: number, lng: number) => {
    // Mock distance calculation - in real app, use user's location
    return Math.random() * 1000; // Random distance in meters
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (currentIndex >= restaurants.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">沒有更多餐廳了！</h2>
          <p className="text-muted-foreground mb-6">您已經瀏覽完所有附近的餐廳</p>
          <Button onClick={() => {
            setCurrentIndex(0);
            fetchRestaurants();
          }}>
            重新開始
          </Button>
        </div>
      </div>
    );
  }

  const currentRestaurant = restaurants[currentIndex];
  
  if (!currentRestaurant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">暫無餐廳資料</h2>
          <p className="text-muted-foreground mb-6">請稍後再試</p>
          <Button onClick={fetchRestaurants}>
            重新載入
          </Button>
        </div>
      </div>
    );
  }
  
  const distance = calculateDistance(currentRestaurant.lat, currentRestaurant.lng);
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
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
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
                  <span className="text-sm">{Math.round(distance)}m</span>
                </div>
              </div>

              <div className="flex gap-2">
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
  );
};