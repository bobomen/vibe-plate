import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Palette, Tag, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useFavoriteCategories, FavoriteCategory } from '@/hooks/useFavoriteCategories';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', 
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
];

const CATEGORY_ICONS = [
  'heart', 'star', 'users', 'briefcase', 'gift', 'bookmark',
  'coffee', 'utensils', 'wine', 'cake', 'pizza', 'ice-cream'
];

interface CategoryFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
}

export const CategoryManagement = () => {
  const navigate = useNavigate();
  const { categories, loading, createCategory, updateCategory, deleteCategory, createDefaultCategories, getRestaurantsInCategory } = useFavoriteCategories();
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FavoriteCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    color: '#6366f1',
    icon: 'heart'
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#6366f1',
      icon: 'heart'
    });
    setEditingCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCategory) {
      await updateCategory(editingCategory.id, formData);
    } else {
      await createCategory(formData.name, formData.description, formData.color, formData.icon);
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (category: FavoriteCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color,
      icon: category.icon
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (category: FavoriteCategory) => {
    await deleteCategory(category.id, category.name);
    loadCategoryCounts();
  };

  const loadCategoryCounts = async () => {
    const counts: Record<string, number> = {};
    for (const category of categories) {
      const restaurants = await getRestaurantsInCategory(category.id);
      counts[category.id] = restaurants.length;
    }
    setCategoryCounts(counts);
  };

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/app/categories/${categoryId}`);
  };

  useEffect(() => {
    if (categories.length > 0 && !loading) {
      loadCategoryCounts();
    }
  }, [categories, loading]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">分類管理</h2>
          <p className="text-sm text-muted-foreground">管理您的收藏分類</p>
        </div>
        
        <div className="flex gap-2">
          {categories.length === 0 && (
            <Button
              variant="outline"
              onClick={createDefaultCategories}
              className="text-sm"
            >
              <Tag className="h-4 w-4 mr-2" />
              建立預設分類
            </Button>
          )}
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="text-sm">
                <Plus className="h-4 w-4 mr-2" />
                新增分類
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? '編輯分類' : '新增分類'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">分類名稱</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例如：約會餐廳"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">描述（選填）</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="簡單描述這個分類..."
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label>顏色</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {CATEGORY_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-all",
                          formData.color === color ? "border-foreground scale-110" : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    取消
                  </Button>
                  <Button type="submit">
                    {editingCategory ? '更新' : '建立'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">還沒有分類</h3>
            <p className="text-muted-foreground mb-4">建立分類來更好地整理您的收藏</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {categories.map((category) => (
            <Card key={category.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div 
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{category.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {categoryCounts[category.id] || 0}
                          </Badge>
                        </div>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
                
                <div className="px-4 pb-4 flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(category);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>確定要刪除這個分類嗎？</AlertDialogTitle>
                        <AlertDialogDescription>
                          刪除「{category.name}」分類後，所有使用這個分類的餐廳將不再歸類於此。此操作無法復原。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(category)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          刪除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};