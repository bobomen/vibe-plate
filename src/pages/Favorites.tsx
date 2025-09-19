import { useState, useEffect } from 'react';
import { Heart, MapPin, Star, Trash2, Settings, Tag, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LazyImage } from '@/components/ui/LazyImage';
import { FavoriteListSkeleton } from '@/components/ui/FavoriteListSkeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { BottomNavigation } from '@/components/BottomNavigation';
import { CategoryManagement } from '@/components/CategoryManagement';
import { CategorySelector } from '@/components/CategorySelector';
import { useFavoriteCategories } from '@/hooks/useFavoriteCategories';

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
  categories?: {
    id: string;
    name: string;
    color: string;
  }[];
}

const Favorites = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { categories } = useFavoriteCategories();
  const [favorites, setFavorites] = useState<FavoriteRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'distance'>('newest');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [activeTab, setActiveTab] = useState('list');

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
      
      // Fetch categories for each favorite
      const favoritesWithCategories = await Promise.all(
        (data || []).map(async (favorite) => {
          const { data: categoryItems } = await supabase
            .from('favorite_category_items')
            .select(`
              favorite_categories (
                id,
                name,
                color
              )
            `)
            .eq('favorite_id', favorite.id);
          
          return {
            ...favorite,
            categories: categoryItems?.map(item => item.favorite_categories).filter(Boolean) || []
          };
        })
      );
      
      setFavorites(favoritesWithCategories);
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

  // Filter by category
  const filteredFavorites = favorites.filter(favorite => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'uncategorized') {
      return !favorite.categories || favorite.categories.length === 0;
    }
    return favorite.categories?.some(cat => cat.id === selectedCategory);
  });

  const sortedFavorites = [...filteredFavorites].sort((a, b) => {
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">我的收藏</h1>
            <p className="text-sm text-muted-foreground">
              {filteredFavorites.length} 間餐廳
              {selectedCategory !== 'all' && ` (${favorites.length} 總計)`}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">收藏清單</TabsTrigger>
            <TabsTrigger value="categories">分類管理</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="flex-1">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="選擇分類" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分類</SelectItem>
                  <SelectItem value="uncategorized">未分類</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
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
                <h2 className="text-xl font-semibold mb-2">
                  {selectedCategory === 'all' ? '還沒有收藏的餐廳' : '此分類沒有餐廳'}
                </h2>
                <p className="text-muted-foreground">
                  {selectedCategory === 'all' 
                    ? '開始滑卡來發現喜愛的餐廳吧！' 
                    : '試試其他分類或新增餐廳到這個分類'
                  }
                </p>
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

                              <div className="flex gap-2 mb-2 flex-wrap">
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
                                {favorite.categories?.map((category) => (
                                  <Badge
                                    key={category.id}
                                    variant="outline"
                                    className="text-xs"
                                    style={{ 
                                      borderColor: category.color,
                                      color: category.color
                                    }}
                                  >
                                    {category.name}
                                  </Badge>
                                ))}
                              </div>
                              
                              <div className="flex gap-2 mt-2">
                                <CategorySelector
                                  favoriteId={favorite.id}
                                  restaurantName={favorite.restaurants.name}
                                  onCategoriesUpdate={fetchFavorites}
                                />
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
          </TabsContent>
          
          <TabsContent value="categories">
            <CategoryManagement />
          </TabsContent>
        </Tabs>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default Favorites;