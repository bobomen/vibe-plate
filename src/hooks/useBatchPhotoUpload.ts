import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UploadTask {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  photoUrl?: string;
}

interface UseBatchPhotoUploadProps {
  restaurantId: string;
  userId: string;
  maxConcurrent?: number;
  onUploadComplete?: () => void;
}

export function useBatchPhotoUpload({
  restaurantId,
  userId,
  maxConcurrent = 3,
  onUploadComplete,
}: UseBatchPhotoUploadProps) {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [activeUploads, setActiveUploads] = useState(0);

  // 驗證圖片
  const validateImage = async (file: File): Promise<void> => {
    // 1. 檢查格式
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('僅支援 JPG、PNG、WEBP 格式');
    }

    // 2. 檢查大小
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('圖片大小不得超過 5MB');
    }

    // 3. 檢查尺寸
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        if (img.width < 800 || img.height < 600) {
          reject(new Error('圖片尺寸至少需為 800x600 像素'));
        }
        resolve();
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('無法讀取圖片'));
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // 上傳單個文件
  const uploadSingleFile = async (task: UploadTask): Promise<void> => {
    let uploadedFileName: string | null = null;

    try {
      // 驗證圖片
      await validateImage(task.file);

      // 更新狀態：開始上傳
      setTasks(prev =>
        prev.map(t => (t.id === task.id ? { ...t, status: 'uploading' as const, progress: 10 } : t))
      );

      // 上傳到 Storage
      const fileExt = task.file.name.split('.').pop();
      const fileName = `${restaurantId}/${Date.now()}-${task.id}.${fileExt}`;
      uploadedFileName = fileName;

      const { error: uploadError } = await supabase.storage
        .from('restaurant-photos')
        .upload(fileName, task.file);

      if (uploadError) throw uploadError;

      // 更新進度：Storage 上傳完成
      setTasks(prev =>
        prev.map(t => (t.id === task.id ? { ...t, progress: 60 } : t))
      );

      // 獲取公開 URL
      const { data: { publicUrl } } = supabase.storage
        .from('restaurant-photos')
        .getPublicUrl(fileName);

      // 插入資料庫
      const { error: insertError } = await supabase
        .from('restaurant_photos')
        .insert({
          restaurant_id: restaurantId,
          photo_url: publicUrl,
          status: 'pending',
          uploaded_by: userId,
          file_size_bytes: task.file.size,
          file_format: task.file.type,
        });

      if (insertError) throw insertError;

      // 更新狀態：成功
      setTasks(prev =>
        prev.map(t =>
          t.id === task.id
            ? { ...t, status: 'success' as const, progress: 100, photoUrl: publicUrl }
            : t
        )
      );
    } catch (error) {
      // 清理 Storage（如果已上傳）
      if (uploadedFileName) {
        await supabase.storage
          .from('restaurant-photos')
          .remove([uploadedFileName]);
      }

      // 更新狀態：失敗
      const errorMessage = error instanceof Error ? error.message : '上傳失敗';
      setTasks(prev =>
        prev.map(t =>
          t.id === task.id
            ? { ...t, status: 'error' as const, error: errorMessage }
            : t
        )
      );
      throw error;
    }
  };

  // 處理上傳隊列（並發控制）
  const processQueue = useCallback(async () => {
    setTasks(currentTasks => {
      const pendingTasks = currentTasks.filter(t => t.status === 'pending');
      const uploadingTasks = currentTasks.filter(t => t.status === 'uploading');
      
      // 計算可以啟動的新上傳數量
      const availableSlots = Math.max(0, maxConcurrent - uploadingTasks.length);
      const tasksToStart = pendingTasks.slice(0, availableSlots);

      if (tasksToStart.length === 0) {
        // 檢查是否所有任務都完成
        const allComplete = currentTasks.every(
          t => t.status === 'success' || t.status === 'error'
        );
        if (allComplete && currentTasks.length > 0) {
          const successCount = currentTasks.filter(t => t.status === 'success').length;
          const errorCount = currentTasks.filter(t => t.status === 'error').length;
          
          if (successCount > 0) {
            toast.success(`成功上傳 ${successCount} 張照片`);
            onUploadComplete?.();
          }
          if (errorCount > 0) {
            toast.error(`${errorCount} 張照片上傳失敗`);
          }
        }
        return currentTasks;
      }

      // 啟動新的上傳任務
      tasksToStart.forEach(task => {
        setActiveUploads(prev => prev + 1);
        uploadSingleFile(task)
          .finally(() => {
            setActiveUploads(prev => prev - 1);
            // 遞歸處理隊列
            processQueue();
          });
      });

      return currentTasks;
    });
  }, [maxConcurrent, onUploadComplete, restaurantId, userId]);

  // 添加文件到上傳隊列
  const addFiles = useCallback((files: File[]) => {
    const newTasks: UploadTask[] = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      status: 'pending',
      progress: 0,
    }));

    setTasks(prev => [...prev, ...newTasks]);

    // 延遲處理隊列，確保狀態已更新
    setTimeout(() => processQueue(), 0);
  }, [processQueue]);

  // 重試失敗的任務
  const retryTask = useCallback((taskId: string) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId && t.status === 'error'
          ? { ...t, status: 'pending', progress: 0, error: undefined }
          : t
      )
    );
    setTimeout(() => processQueue(), 0);
  }, [processQueue]);

  // 取消任務
  const cancelTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  // 清除已完成的任務
  const clearCompleted = useCallback(() => {
    setTasks(prev => prev.filter(t => t.status !== 'success'));
  }, []);

  // 清除所有任務
  const clearAll = useCallback(() => {
    setTasks([]);
  }, []);

  return {
    tasks,
    activeUploads,
    addFiles,
    retryTask,
    cancelTask,
    clearCompleted,
    clearAll,
    isUploading: activeUploads > 0,
  };
}
