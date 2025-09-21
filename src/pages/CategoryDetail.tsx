import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Star, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useFavoriteCategories } from '@/hooks/useFavoriteCategories';
import { LazyImage } from '@/components/ui/LazyImage';
import { useToast } from '@/hooks/use-toast';

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

const CategoryDetail = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    categories, 
    getRestaurantsInCategory, 
    getUncategorizedRestaurants,
    removeRestaurantFromCategory,
    addToCategories 
  } = useFavoriteCategories();
  
  const [categoryRestaurants, setCategoryRestaurants] = useState<FavoriteRestaurant[]>([]);
  const [uncategorizedRestaurants, setUncategorizedRestaurants] = useState<FavoriteRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([]);

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
    if (!categoryId || selectedRestaurants.length === 0) return;
    
    try {
      for (const favoriteId of selectedRestaurants) {
        await addToCategories(favoriteId, [categoryId]);
      }
      
      setShowAddDialog(false);
      setSelectedRestaurants([]);
      await loadCategoryRestaurants();
      
      toast({
        title: "新增成功",
        description: `已新增 ${selectedRestaurants.length} 間餐廳到分類`,
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

  useEffect(() => {
    if (categoryId) {
      loadCategoryRestaurants();
    }
  }, [categoryId]);

  useEffect(() => {
    if (showAddDialog) {
      loadUncategorizedRestaurants();
    }
  }, [showAddDialog, categoryId]);

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
            <Card>
              <CardContent className="text-center py-8">
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                </div>
                <h3 className="text-lg font-semibold mb-2">還沒有餐廳</h3>
                <p className="text-muted-foreground mb-4">
                  開始新增餐廳到「{category.name}」分類
                </p>
                <Button 
                  onClick={() => setShowAddDialog(true)}
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  新增餐廳
                </Button>
              </CardContent>
            </Card>
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
          
          <div className="flex-1 overflow-y-auto space-y-3">
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
          </div>
          
          {uncategorizedRestaurants.length > 0 && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  setSelectedRestaurants([]);
                }}
              >
                取消
              </Button>
              <Button
                onClick={handleAddRestaurants}
                disabled={selectedRestaurants.length === 0}
              >
                新增 {selectedRestaurants.length > 0 && `(${selectedRestaurants.length})`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryDetail;