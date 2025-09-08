import { useState, useEffect } from 'react';
import { Heart, MapPin, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LazyImage } from '@/components/ui/LazyImage';
import { FavoriteListSkeleton } from '@/components/ui/FavoriteListSkeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { BottomNavigation } from '@/components/BottomNavigation';

interface FavoriteRestaurant {
  id: string;
  restaurant_id: string;
  created_at: string;
  restaurants: {
    id: string;
    name: string;
    address: string;
    google_rating: number;
    google_reviews_count: number;
    michelin_stars: number;
    has_500_dishes: boolean;
    photos: string[];
  };
}

const Favorites = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<FavoriteRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'distance'>('newest');

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          restaurant_id,
          created_at,
          restaurants (
            id,
            name,
            address,
            google_rating,
            google_reviews_count,
            michelin_stars,
            has_500_dishes,
            photos
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast({
        title: "載入失敗",
        description: "無法載入收藏清單，請重試",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: string, restaurantName: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
      toast({
        title: "已移除收藏",
        description: `${restaurantName} 已從收藏清單移除`,
      });
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast({
        title: "操作失敗",
        description: "無法移除收藏，請重試",
        variant: "destructive",
      });
    }
  };

  const sortedFavorites = [...favorites].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'rating':
        return (b.restaurants.google_rating || 0) - (a.restaurants.google_rating || 0);
      case 'distance':
        // Mock distance sorting - in real app, calculate based on user location
        return Math.random() - 0.5;
      default:
        return 0;
    }
  });

  if (loading) {
    return <FavoriteListSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">我的收藏</h1>
            <p className="text-sm text-muted-foreground">{favorites.length} 間餐廳</p>
          </div>
          
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">最新</SelectItem>
              <SelectItem value="rating">評分高</SelectItem>
              <SelectItem value="distance">距離近</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {sortedFavorites.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">還沒有收藏的餐廳</h2>
            <p className="text-muted-foreground">開始滑卡來發現喜愛的餐廳吧！</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedFavorites.map((favorite) => (
              <Card key={favorite.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex">
                    <div className="w-24 h-24 flex-shrink-0">
                      <LazyImage
                        src={favorite.restaurants.photos[0] || '/placeholder.svg'}
                        alt={favorite.restaurants.name}
                        className="w-full h-full"
                      />
                    </div>
                    
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">
                            {favorite.restaurants.name}
                          </h3>
                          
                          <div className="flex items-center gap-3 mb-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span>{favorite.restaurants.google_rating}</span>
                              <span>({favorite.restaurants.google_reviews_count})</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{Math.round(Math.random() * 1000)}m</span>
                            </div>
                          </div>

                          <div className="flex gap-2 mb-2">
                            {favorite.restaurants.michelin_stars > 0 && (
                              <Badge variant="secondary" className="text-xs bg-yellow-600 text-white">
                                米其林 {favorite.restaurants.michelin_stars}星
                              </Badge>
                            )}
                            {favorite.restaurants.has_500_dishes && (
                              <Badge variant="secondary" className="text-xs bg-green-600 text-white">
                                500盤
                              </Badge>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFavorite(favorite.id, favorite.restaurants.name)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <BottomNavigation />
    </div>
  );
};

export default Favorites;