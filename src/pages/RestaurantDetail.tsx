import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Clock, Heart, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LazyImage } from '@/components/ui/LazyImage';
import { RestaurantDetailSkeleton } from '@/components/ui/RestaurantDetailSkeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
  business_hours: any;
  klook_url: string | null;
  photos: string[];
}

export default function RestaurantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  useEffect(() => {
    if (id) {
      fetchRestaurant();
      checkIfFavorited();
    }
  }, [id]);

  const fetchRestaurant = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setRestaurant(data);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      toast({
        title: "載入失敗",
        description: "無法載入餐廳資料",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorited = async () => {
    if (!user?.id) return;
    
    try {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('restaurant_id', id)
        .maybeSingle();
      
      setIsFavorited(!!data);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user?.id || !restaurant) return;

    try {
      if (isFavorited) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('restaurant_id', restaurant.id);
        
        setIsFavorited(false);
        toast({
          title: "已取消收藏",
          description: `${restaurant.name} 已從收藏清單移除`,
        });
      } else {
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            restaurant_id: restaurant.id
          });
        
        setIsFavorited(true);
        toast({
          title: "已收藏！",
          description: `${restaurant.name} 已加入收藏清單`,
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "操作失敗",
        description: "無法更新收藏狀態，請重試",
        variant: "destructive",
      });
    }
  };

  const calculateDistance = (lat: number, lng: number) => {
    // Mock distance calculation
    return Math.random() * 1000;
  };

  if (loading) {
    return <RestaurantDetailSkeleton />;
  }

  if (!restaurant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <h2 className="text-2xl font-bold mb-4">找不到餐廳</h2>
        <Button onClick={() => navigate('/app')}>返回主頁</Button>
      </div>
    );
  }

  const photos = restaurant.photos || ['/placeholder.svg'];
  const distance = calculateDistance(restaurant.lat, restaurant.lng);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/app')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">餐廳詳情</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFavorite}
          >
            <Heart className={`h-5 w-5 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Photos */}
      <div className="relative">
        <div className="aspect-[4/3] bg-muted">
          <LazyImage
            src={photos[selectedPhoto]}
            alt={restaurant.name}
            className="w-full h-full"
          />
        </div>
        
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedPhoto(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === selectedPhoto ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Title & Rating */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{restaurant.google_rating}</span>
              <span className="text-muted-foreground">({restaurant.google_reviews_count} 則評論)</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{Math.round(distance)}m</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {restaurant.michelin_stars > 0 && (
              <Badge variant="secondary" className="bg-yellow-600 text-white">
                米其林 {restaurant.michelin_stars}星
              </Badge>
            )}
            {restaurant.has_500_dishes && (
              <Badge variant="secondary" className="bg-green-600 text-white">
                500盤
              </Badge>
            )}
          </div>
        </div>

        {/* Address */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h3 className="font-medium mb-1">地址</h3>
              <p className="text-muted-foreground">{restaurant.address}</p>
            </div>
          </div>
        </Card>

        {/* Business Hours */}
        {restaurant.business_hours && (
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium mb-1">營業時間</h3>
                <p className="text-muted-foreground">詳情請洽餐廳</p>
              </div>
            </div>
          </Card>
        )}

        {/* Klook Link */}
        {restaurant.klook_url && (
          <Card className="p-4">
            <Button
              asChild
              className="w-full"
              variant="outline"
            >
              <a
                href={restaurant.klook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                查看 Klook 優惠
              </a>
            </Button>
          </Card>
        )}

        {/* Photos Grid */}
        {photos.length > 1 && (
          <div>
            <h3 className="font-medium mb-3">更多照片</h3>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedPhoto(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                    index === selectedPhoto ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <LazyImage
                    src={photo}
                    alt={`${restaurant.name} 照片 ${index + 1}`}
                    className="w-full h-full"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="sticky bottom-0 bg-background border-t p-4">
        <Button
          onClick={toggleFavorite}
          className="w-full"
          variant={isFavorited ? "secondary" : "default"}
        >
          <Heart className={`h-4 w-4 mr-2 ${isFavorited ? 'fill-current' : ''}`} />
          {isFavorited ? '已收藏' : '加入收藏'}
        </Button>
      </div>
    </div>
  );
}