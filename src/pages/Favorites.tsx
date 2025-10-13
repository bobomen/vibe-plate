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

const CITY_OPTIONS = [
  { id: 'all', label: '所有地區', icon: '🌏' },
  { id: '台北市', label: '台北市', icon: '🏙️' },
  { id: '新北市', label: '新北市', icon: '🌆' },
  { id: '基隆市', label: '基隆市', icon: '⚓' },
  { id: '桃園市', label: '桃園市', icon: '✈️' },
  { id: '新竹市', label: '新竹市', icon: '🎋' },
  { id: '新竹縣', label: '新竹縣', icon: '🏔️' },
  { id: '苗栗縣', label: '苗栗縣', icon: '🌾' },
  { id: '台中市', label: '台中市', icon: '🏛️' },
  { id: '彰化縣', label: '彰化縣', icon: '🌸' },
  { id: '南投縣', label: '南投縣', icon: '⛰️' },
  { id: '雲林縣', label: '雲林縣', icon: '🌾' },
  { id: '嘉義市', label: '嘉義市', icon: '🌳' },
  { id: '嘉義縣', label: '嘉義縣', icon: '🏞️' },
  { id: '台南市', label: '台南市', icon: '🏯' },
  { id: '高雄市', label: '高雄市', icon: '🚢' },
  { id: '屏東縣', label: '屏東縣', icon: '🌴' },
  { id: '宜蘭縣', label: '宜蘭縣', icon: '🏖️' },
  { id: '花蓮縣', label: '花蓮縣', icon: '🏔️' },
  { id: '台東縣', label: '台東縣', icon: '🌊' },
  { id: '澎湖縣', label: '澎湖縣', icon: '🏝️' },
  { id: '金門縣', label: '金門縣', icon: '🦁' },
  { id: '連江縣', label: '連江縣', icon: '🚤' },
];

interface FavoriteRestaurant {
  id: string;
  restaurant_id: string;
  created_at: string;
  restaurants: {
    id: string;
    name: string;
    address: string;
    city: string | null;
    district: string | null;
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
  const [selectedCity, setSelectedCity] = useState<string>('all');
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
            city,
            district,
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
      if (!data || data.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }
      
      // Optimized: Batch fetch all category items at once
      const favoriteIds = data.map(f => f.id);
      const { data: allCategoryItems } = await supabase
        .from('favorite_category_items')
        .select(`
          favorite_id,
          favorite_categories (
            id,
            name,
            color
          )
        `)
        .in('favorite_id', favoriteIds);
      
      // Build favorites with categories efficiently
      const favoritesWithCategories = data.map(favorite => {
        const categoryItems = (allCategoryItems || [])
          .filter(item => item.favorite_id === favorite.id)
          .map(item => item.favorite_categories)
          .filter(Boolean);
        
        return {
          ...favorite,
          categories: categoryItems
        };
      });
      
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

  // Filter by category and city
  const filteredFavorites = favorites.filter(favorite => {
    // Category filter
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'uncategorized') {
        if (favorite.categories && favorite.categories.length > 0) return false;
      } else {
        if (!favorite.categories?.some(cat => cat.id === selectedCategory)) return false;
      }
    }
    
    // City filter
    if (selectedCity !== 'all') {
      if (favorite.restaurants.city !== selectedCity) return false;
    }
    
    return true;
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
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex gap-2">
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
              
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-full">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="選擇地區" />
                </SelectTrigger>
                <SelectContent>
                  {CITY_OPTIONS.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      <span className="mr-2">{city.icon}</span>
                      {city.label}
                    </SelectItem>
                  ))}
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