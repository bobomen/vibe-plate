import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface FavoriteCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface FavoriteCategoryItem {
  id: string;
  favorite_id: string;
  category_id: string;
  created_at: string;
}

export const useFavoriteCategories = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<FavoriteCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all categories for the current user
  const fetchCategories = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('favorite_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "載入失敗",
        description: "無法載入分類清單",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create default categories for new users
  const createDefaultCategories = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('create_default_categories', {
        target_user_id: user.id
      });

      if (error) throw error;
      
      await fetchCategories();
      toast({
        title: "預設分類已建立",
        description: "為您建立了幾個常用分類",
      });
    } catch (error) {
      console.error('Error creating default categories:', error);
      toast({
        title: "建立失敗",
        description: "無法建立預設分類",
        variant: "destructive",
      });
    }
  };

  // Create a new category
  const createCategory = async (
    name: string, 
    description?: string, 
    color: string = '#6366f1', 
    icon: string = 'heart'
  ) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('favorite_categories')
        .insert({
          user_id: user.id,
          name,
          description,
          color,
          icon,
        })
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data]);
      toast({
        title: "分類已建立",
        description: `「${name}」分類已成功建立`,
      });
      
      return data;
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: "建立失敗",
        description: "無法建立新分類",
        variant: "destructive",
      });
    }
  };

  // Update a category
  const updateCategory = async (
    id: string, 
    updates: Partial<Pick<FavoriteCategory, 'name' | 'description' | 'color' | 'icon'>>
  ) => {
    try {
      const { data, error } = await supabase
        .from('favorite_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => 
        prev.map(cat => cat.id === id ? data : cat)
      );
      
      toast({
        title: "分類已更新",
        description: "分類資訊已成功更新",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "更新失敗",
        description: "無法更新分類",
        variant: "destructive",
      });
    }
  };

  // Delete a category
  const deleteCategory = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('favorite_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCategories(prev => prev.filter(cat => cat.id !== id));
      toast({
        title: "分類已刪除",
        description: `「${name}」分類已刪除`,
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "刪除失敗",
        description: "無法刪除分類",
        variant: "destructive",
      });
    }
  };

  // Add restaurant to categories
  const addToCategories = async (favoriteId: string, categoryIds: string[]) => {
    try {
      // First, remove existing category associations
      await supabase
        .from('favorite_category_items')
        .delete()
        .eq('favorite_id', favoriteId);

      // Then, add new category associations
      if (categoryIds.length > 0) {
        const items = categoryIds.map(categoryId => ({
          favorite_id: favoriteId,
          category_id: categoryId,
        }));

        const { error } = await supabase
          .from('favorite_category_items')
          .insert(items);

        if (error) throw error;
      }

      toast({
        title: "分類已更新",
        description: "餐廳分類已成功更新",
      });
    } catch (error) {
      console.error('Error updating restaurant categories:', error);
      toast({
        title: "更新失敗",
        description: "無法更新餐廳分類",
        variant: "destructive",
      });
    }
  };

  // Get categories for a specific favorite
  const getCategoriesForFavorite = async (favoriteId: string) => {
    try {
      const { data, error } = await supabase
        .from('favorite_category_items')
        .select(`
          category_id,
          favorite_categories (*)
        `)
        .eq('favorite_id', favoriteId);

      if (error) throw error;
      
      return data?.map(item => item.favorite_categories).filter(Boolean) || [];
    } catch (error) {
      console.error('Error fetching categories for favorite:', error);
      return [];
    }
  };

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  return {
    categories,
    loading,
    fetchCategories,
    createDefaultCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    addToCategories,
    getCategoriesForFavorite,
  };
};