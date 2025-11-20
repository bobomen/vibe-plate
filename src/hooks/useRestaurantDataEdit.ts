import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Restaurant } from '@/types/restaurant';

interface RestaurantPhoto {
  id: string;
  restaurant_id: string;
  photo_url: string;
  status: 'pending' | 'active' | 'rejected';
  uploaded_at: string;
  approved_at: string | null;
  rejection_reason: string | null;
  file_size_bytes: number | null;
  file_format: string | null;
}

export function useRestaurantDataEdit(restaurantId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 獲取餐廳資料
  const { data: restaurant, isLoading: isLoadingRestaurant } = useQuery({
    queryKey: ['restaurant-edit', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single();
      if (error) throw error;
      return data as Restaurant;
    },
    enabled: !!restaurantId,
  });

  // 獲取照片（包含 pending）
  const { data: photos = [], isLoading: isLoadingPhotos } = useQuery({
    queryKey: ['restaurant-photos', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_photos')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return data as RestaurantPhoto[];
    },
    enabled: !!restaurantId,
  });

  // 更新文字資料
  const updateTextData = useMutation({
    mutationFn: async (updates: Partial<Restaurant>) => {
      if (!user?.id) throw new Error('請先登入');

      // 記錄變更到 audit log
      const changePromises = Object.entries(updates).map(([field, newValue]) =>
        supabase.from('restaurant_data_changes').insert({
          restaurant_id: restaurantId,
          changed_by: user.id,
          field_name: field,
          old_value: restaurant?.[field as keyof Restaurant]?.toString() || null,
          new_value: newValue?.toString() || null,
        })
      );

      await Promise.all(changePromises);

      // 執行更新
      const { error } = await supabase
        .from('restaurants')
        .update(updates)
        .eq('id', restaurantId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('資料已更新');
      queryClient.invalidateQueries({ queryKey: ['restaurant-edit', restaurantId] });
    },
    onError: (error) => {
      toast.error('更新失敗：' + (error as Error).message);
    },
  });

  // 上傳照片
  const uploadPhoto = useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error('請先登入');

      // 1. 技術檢查
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('僅支援 JPG、PNG、WEBP 格式');
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('圖片大小不得超過 5MB');
      }

      // 2. 檢查圖片尺寸
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          if (img.width < 800 || img.height < 600) {
            reject(new Error('圖片尺寸至少需為 800x600 像素'));
          }
          resolve();
        };
        img.onerror = () => reject(new Error('無法讀取圖片'));
        img.src = URL.createObjectURL(file);
      });

      let uploadedFileName: string | null = null;

      try {
        // 3. 上傳到 Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${restaurantId}/${Date.now()}.${fileExt}`;
        uploadedFileName = fileName;
        
        const { error: uploadError } = await supabase.storage
          .from('restaurant-photos')
          .upload(fileName, file);
        
        if (uploadError) throw uploadError;

        // 4. 獲取公開 URL
        const { data: { publicUrl } } = supabase.storage
          .from('restaurant-photos')
          .getPublicUrl(fileName);

        // 5. 記錄到 restaurant_photos 表（status = pending）
        const { error: insertError } = await supabase
          .from('restaurant_photos')
          .insert({
            restaurant_id: restaurantId,
            photo_url: publicUrl,
            status: 'pending',
            uploaded_by: user.id,
            file_size_bytes: file.size,
            file_format: file.type,
          });
        
        if (insertError) throw insertError;
      } catch (error) {
        // 回滾：刪除已上傳的 Storage 文件
        if (uploadedFileName) {
          await supabase.storage
            .from('restaurant-photos')
            .remove([uploadedFileName]);
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('照片已上傳，24小時後自動發布');
      queryClient.invalidateQueries({ queryKey: ['restaurant-photos', restaurantId] });
    },
    onError: (error) => {
      toast.error('上傳失敗：' + (error as Error).message);
    },
  });

  // 刪除照片
  const deletePhoto = useMutation({
    mutationFn: async (photoId: string) => {
      const photo = photos.find(p => p.id === photoId);
      if (!photo) throw new Error('照片不存在');

      // 從 Storage 刪除
      const fileName = photo.photo_url.split('/').slice(-2).join('/');
      const { error: storageError } = await supabase.storage
        .from('restaurant-photos')
        .remove([fileName]);
      
      if (storageError) console.error('Storage deletion error:', storageError);

      // 從資料庫刪除
      const { error } = await supabase
        .from('restaurant_photos')
        .delete()
        .eq('id', photoId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('照片已刪除');
      queryClient.invalidateQueries({ queryKey: ['restaurant-photos', restaurantId] });
    },
    onError: (error) => {
      toast.error('刪除失敗：' + (error as Error).message);
    },
  });

  return {
    restaurant,
    photos,
    isLoading: isLoadingRestaurant || isLoadingPhotos,
    updateTextData,
    uploadPhoto,
    deletePhoto,
  };
}
