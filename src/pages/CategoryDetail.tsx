import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Star, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFavoriteCategories } from '@/hooks/useFavoriteCategories';
import { LazyImage } from '@/components/ui/LazyImage';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FavoriteRestaurant {
  id: string;
  restaurant_id: string;
  user_id: string;
  created_at: string;
  restaurants: {
    id: string;
    name: string;
    address?: string;
    photos?: string[];
    google_rating?: number;
    michelin_stars?: number;
    bib_gourmand?: boolean;
    price_range?: number;
    cuisine_type?: string;
  };
}

interface Restaurant {
  id: string;
  name: string;
  address?: string;
  photos?: string[];
  google_rating?: number;
  michelin_stars?: number;
  bib_gourmand?: boolean;
  price_range?: number;
  cuisine_type?: string;
}

const CategoryDetail = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    categories, 
    getRestaurantsInCategory, 
    getUncategorizedRestaurants,
    removeRestaurantFromCategory,
    addToCategories 
  } = useFavoriteCategories();
  
  const [categoryRestaurants, setCategoryRestaurants] = useState<FavoriteRestaurant[]>([]);
  const [uncategorizedRestaurants, setUncategorizedRestaurants] = useState<FavoriteRestaurant[]>([]);
  const [searchResults, setSearchResults] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([]);
  const [selectedNewRestaurants, setSelectedNewRestaurants] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const category = categories.find(cat => cat.id === categoryId);

  const loadCategoryRestaurants = async () => {
    if (!categoryId) return;
    
    setLoading(true);
    try {
      const restaurants = await getRestaurantsInCategory(categoryId);
      setCategoryRestaurants(restaurants);
    } catch (error) {
      console.error('Error loading category restaurants:', error);
      toast({
        title: "載入失敗",
        description: "無法載入分類餐廳",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const searchRestaurants = async (query: string) => {
    if (!query.trim() || !user) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    try {
      // Split query into keywords for better search
      const keywords = query.trim().split(/\s+/);
      let queryBuilder = supabase.from('restaurants').select('*');
      
      // Search in multiple fields: name, address, cuisine_type
      if (keywords.length === 1) {
        // Single keyword - search in all fields
        const keyword = keywords[0];
        queryBuilder = queryBuilder.or(
          `name.ilike.%${keyword}%,address.ilike.%${keyword}%,cuisine_type.ilike.%${keyword}%`
        );
      } else {
        // Multiple keywords - each keyword must appear in at least one field
        const searchConditions = keywords.map(keyword => 
          `name.ilike.%${keyword}%,address.ilike.%${keyword}%,cuisine_type.ilike.%${keyword}%`
        ).join(',');
        queryBuilder = queryBuilder.or(searchConditions);
      }
      
      const { data, error } = await queryBuilder.limit(20);

      if (error) throw error;
      
      // Show all search results - don't filter out favorites
      // Users should be able to see if a restaurant is already in their favorites
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching restaurants:', error);
      toast({
        title: "搜尋失敗",
        description: "無法搜尋餐廳",
        variant: "destructive",
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const loadUncategorizedRestaurants = async () => {
    try {
      const restaurants = await getUncategorizedRestaurants(categoryId);
      setUncategorizedRestaurants(restaurants);
    } catch (error) {
      console.error('Error loading uncategorized restaurants:', error);
    }
  };

  const handleRemoveRestaurant = async (favoriteId: string, restaurantName: string) => {
    if (!categoryId) return;
    
    try {
      await removeRestaurantFromCategory(favoriteId, categoryId);
      await loadCategoryRestaurants();
      toast({
        title: "移除成功",
        description: `${restaurantName} 已從分類中移除`,
      });
    } catch (error) {
      console.error('Error removing restaurant:', error);
      toast({
        title: "移除失敗",
        description: "無法移除餐廳",
        variant: "destructive",
      });
    }
  };

  const handleAddRestaurants = async () => {
    if (!categoryId || (!selectedRestaurants.length && !selectedNewRestaurants.length)) return;
    
    try {
      let addedCount = 0;
      
      // Add existing favorites to category
      for (const favoriteId of selectedRestaurants) {
        await addToCategories(favoriteId, [categoryId]);
        addedCount++;
      }
      
      // Handle new restaurants - check if they're already favorites first
      for (const restaurantId of selectedNewRestaurants) {
        // Check if this restaurant is already in user's favorites
        const { data: existingFavorite } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user!.id)
          .eq('restaurant_id', restaurantId)
          .maybeSingle();
          
        if (existingFavorite) {
          // Already a favorite, just add to category
          await addToCategories(existingFavorite.id, [categoryId]);
        } else {
          // Not a favorite yet, add to favorites first then to category
          const { data: newFavorite, error: favoriteError } = await supabase
            .from('favorites')
            .insert({
              user_id: user!.id,
              restaurant_id: restaurantId
            })
            .select()
            .single();
            
          if (favoriteError) throw favoriteError;
          
          // Then add to category
          await addToCategories(newFavorite.id, [categoryId]);
        }
        addedCount++;
      }
      
      setShowAddDialog(false);
      setSelectedRestaurants([]);
      setSelectedNewRestaurants([]);
      setSearchQuery('');
      setSearchResults([]);
      await loadCategoryRestaurants();
      
      toast({
        title: "新增成功",
        description: `已新增 ${addedCount} 間餐廳到分類`,
      });
    } catch (error) {
      console.error('Error adding restaurants:', error);
      toast({
        title: "新增失敗",
        description: "無法新增餐廳到分類",
        variant: "destructive",
      });
    }
  };

  const toggleRestaurantSelection = (favoriteId: string) => {
    setSelectedRestaurants(prev => 
      prev.includes(favoriteId) 
        ? prev.filter(id => id !== favoriteId)
        : [...prev, favoriteId]
    );
  };

  const toggleNewRestaurantSelection = (restaurantId: string) => {
    setSelectedNewRestaurants(prev => 
      prev.includes(restaurantId) 
        ? prev.filter(id => id !== restaurantId)
        : [...prev, restaurantId]
    );
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  useEffect(() => {
    if (categoryId) {
      loadCategoryRestaurants();
    }
  }, [categoryId]);

  useEffect(() => {
    if (showAddDialog) {
      loadUncategorizedRestaurants();
      setSelectedRestaurants([]);
      setSelectedNewRestaurants([]);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [showAddDialog, categoryId]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchRestaurants(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  if (!category) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/app/favorites')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold">分類不存在</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b p-4 z-10">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/app/favorites')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <div>
                  <h1 className="text-lg font-semibold">{category.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {categoryRestaurants.length} 間餐廳
                  </p>
                </div>
              </div>
            </div>
            
            <Button 
              size="sm"
              onClick={() => setShowAddDialog(true)}
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-1" />
              新增
            </Button>
          </div>
          
          {category.description && (
            <p className="text-sm text-muted-foreground mt-2 ml-10">
              {category.description}
            </p>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="max-w-md mx-auto space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 bg-muted rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : categoryRestaurants.length === 0 ? (
            <EmptyState
              icon={
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                </div>
              }
              title="還沒有餐廳"
              description={`開始新增餐廳到「${category.name}」分類`}
              action={
                <Button 
                  onClick={() => setShowAddDialog(true)}
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  新增餐廳
                </Button>
              }
              variant="compact"
            />
          ) : (
            categoryRestaurants.map((favorite) => (
              <Card key={favorite.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex gap-3 p-4">
                    <div className="flex-shrink-0">
                      <LazyImage
                        src={favorite.restaurants.photos?.[0] || '/placeholder.svg'}
                        alt={favorite.restaurants.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm line-clamp-1">
                            {favorite.restaurants.name}
                          </h3>
                          
                          {favorite.restaurants.address && (
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {favorite.restaurants.address}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 mt-2">
                            {favorite.restaurants.google_rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-muted-foreground">
                                  {favorite.restaurants.google_rating}
                                </span>
                              </div>
                            )}
                            
                            {favorite.restaurants.michelin_stars > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {'⭐'.repeat(favorite.restaurants.michelin_stars)}
                              </Badge>
                            )}
                            
                            {favorite.restaurants.bib_gourmand && (
                              <Badge variant="secondary" className="text-xs">
                                Bib Gourmand
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRestaurant(favorite.id, favorite.restaurants.name)}
                          className="text-red-500 hover:text-red-600 p-1 h-auto"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>新增餐廳到「{category.name}」</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="existing" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">現有收藏</TabsTrigger>
              <TabsTrigger value="search">搜尋餐廳</TabsTrigger>
            </TabsList>
            
            <TabsContent value="existing" className="flex-1 overflow-y-auto space-y-3 mt-4">
              {uncategorizedRestaurants.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    沒有可新增的餐廳
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    所有收藏的餐廳都已經在此分類中
                  </p>
                </div>
              ) : (
                uncategorizedRestaurants.map((favorite) => (
                  <div
                    key={favorite.id}
                    className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleRestaurantSelection(favorite.id)}
                  >
                    <Checkbox
                      checked={selectedRestaurants.includes(favorite.id)}
                      onChange={() => toggleRestaurantSelection(favorite.id)}
                    />
                    
                    <LazyImage
                      src={favorite.restaurants.photos?.[0] || '/placeholder.svg'}
                      alt={favorite.restaurants.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-1">
                        {favorite.restaurants.name}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {favorite.restaurants.address}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
            
            <TabsContent value="search" className="flex-1 flex flex-col mt-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋餐廳名稱..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3">
                {searchLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">搜尋中...</p>
                  </div>
                ) : searchQuery && searchResults.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      找不到相關餐廳
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      試試其他關鍵字
                    </p>
                  </div>
                ) : !searchQuery ? (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      輸入餐廳名稱開始搜尋
                    </p>
                  </div>
                ) : (
                  searchResults.map((restaurant) => (
                    <div
                      key={restaurant.id}
                      className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleNewRestaurantSelection(restaurant.id)}
                    >
                      <Checkbox
                        checked={selectedNewRestaurants.includes(restaurant.id)}
                        onChange={() => toggleNewRestaurantSelection(restaurant.id)}
                      />
                      
                      <LazyImage
                        src={restaurant.photos?.[0] || '/placeholder.svg'}
                        alt={restaurant.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-1">
                          {restaurant.name}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {restaurant.address}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {restaurant.google_rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs text-muted-foreground">
                                {restaurant.google_rating}
                              </span>
                            </div>
                          )}
                          
                          {restaurant.michelin_stars > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {'⭐'.repeat(restaurant.michelin_stars)}
                            </Badge>
                          )}
                          
                          {restaurant.bib_gourmand && (
                            <Badge variant="secondary" className="text-xs">
                              Bib Gourmand
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setSelectedRestaurants([]);
                setSelectedNewRestaurants([]);
                setSearchQuery('');
                setSearchResults([]);
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleAddRestaurants}
              disabled={selectedRestaurants.length === 0 && selectedNewRestaurants.length === 0}
            >
              新增 {(selectedRestaurants.length + selectedNewRestaurants.length) > 0 && 
                `(${selectedRestaurants.length + selectedNewRestaurants.length})`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryDetail;