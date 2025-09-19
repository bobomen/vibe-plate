import { useState, useEffect } from 'react';
import { Check, Plus, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useFavoriteCategories } from '@/hooks/useFavoriteCategories';
import { cn } from '@/lib/utils';

interface CategorySelectorProps {
  favoriteId: string;
  restaurantName: string;
  trigger?: React.ReactNode;
  onCategoriesUpdate?: () => void;
}

export const CategorySelector = ({ 
  favoriteId, 
  restaurantName, 
  trigger,
  onCategoriesUpdate 
}: CategorySelectorProps) => {
  const { categories, addToCategories, getCategoriesForFavorite } = useFavoriteCategories();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [currentCategories, setCurrentCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load current categories when dialog opens
  useEffect(() => {
    if (isOpen && favoriteId) {
      loadCurrentCategories();
    }
  }, [isOpen, favoriteId]);

  const loadCurrentCategories = async () => {
    setLoading(true);
    try {
      const categoryData = await getCategoriesForFavorite(favoriteId);
      const categoryIds = categoryData.map((cat: any) => cat.id);
      setCurrentCategories(categoryIds);
      setSelectedCategories(categoryIds);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await addToCategories(favoriteId, selectedCategories);
      setCurrentCategories(selectedCategories);
      setIsOpen(false);
      onCategoriesUpdate?.();
    } catch (error) {
      console.error('Error updating categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="h-8">
      <Tag className="h-3 w-3 mr-1" />
      分類
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>為「{restaurantName}」選擇分類</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="h-8 w-8 mx-auto mb-2" />
              <p>尚未建立任何分類</p>
              <p className="text-sm">請先到分類管理建立分類</p>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedCategories.includes(category.id)
                      ? "bg-primary/5 border-primary"
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => handleCategoryToggle(category.id)}
                >
                  <Checkbox
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                  />
                  
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  
                  {selectedCategories.includes(category.id) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || categories.length === 0}
            >
              {loading ? '儲存中...' : '儲存'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};