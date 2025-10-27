/**
 * 統一的滑卡邏輯 Hook
 * 
 * 這個 Hook 整合了個人和群組滑卡的所有邏輯
 * 優勢：
 * 1. 消除代碼重複（原本兩個 hook 有 90% 相同代碼）
 * 2. 統一錯誤處理和日誌記錄
 * 3. 更容易維護和擴展
 * 4. 為 AI 功能預留接口
 * 
 * 使用方式：
 * - Personal: useSwipeLogic({ mode: 'personal' })
 * - Group: useSwipeLogic({ mode: 'group', groupId: 'xxx' })
 */

import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Restaurant } from '@/types/restaurant';
import { calculateDistance, calculateDuration } from '@/utils/calculations';
import { 
  buildSwipePayload, 
  validateSwipeContext, 
  formatSwipeLog,
  SwipeContext 
} from '@/utils/swipeHelpers';

interface UseSwipeLogicOptions {
  mode: 'personal' | 'group';
  groupId?: string;
  onSwipeComplete?: (liked: boolean) => void;
}

export const useSwipeLogic = ({ mode, groupId, onSwipeComplete }: UseSwipeLogicOptions) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // UI 狀態
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });

  /**
   * 核心滑卡處理函數
   */
  const handleSwipe = useCallback(async (
    restaurant: Restaurant, 
    liked: boolean, 
    onNext: () => void,
    context?: SwipeContext
  ) => {
    // 驗證數據
    const validation = validateSwipeContext(user?.id, restaurant.id);
    if (!validation.valid) {
      toast({
        title: "操作失敗",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    // 群組模式額外驗證
    if (mode === 'group' && !groupId) {
      toast({
        title: "群組錯誤",
        description: "無法找到群組資訊",
        variant: "destructive"
      });
      return;
    }
    
    // 計算距離
    let distance = null;
    if (context?.userLocation && restaurant.lat && restaurant.lng) {
      distance = calculateDistance(
        context.userLocation.lat,
        context.userLocation.lng,
        Number(restaurant.lat),
        Number(restaurant.lng)
      );
    }
    
    // 設置動畫
    setSwipeDirection(liked ? 'right' : 'left');
    
    try {
      // 群組模式：驗證成員資格
      if (mode === 'group' && groupId) {
        const { data: membership, error: membershipError } = await supabase
          .from('group_members')
          .select('id')
          .eq('group_id', groupId)
          .eq('user_id', user!.id)
          .maybeSingle();
          
        if (membershipError || !membership) {
          throw new Error('您不是此群組的成員，無法投票');
        }
      }

      // 構建數據負載
      const swipeData = buildSwipePayload(
        user!.id,
        restaurant.id,
        liked,
        mode === 'group' ? groupId || null : null,
        distance,
        context
      );
      
      // 嘗試插入，如果衝突則更新
      const { error: insertError } = await supabase
        .from('user_swipes')
        .insert(swipeData)
        .select();

      if (insertError) {
        // 處理重複記錄
        if (insertError.code === '23505') {
          const { error: updateError } = await supabase
            .from('user_swipes')
            .update({ liked })
            .eq('user_id', user!.id)
            .eq('restaurant_id', restaurant.id)
            .eq('group_id', mode === 'group' ? groupId || null : null)
            .select();
            
          if (updateError) throw updateError;
        } else {
          throw insertError;
        }
      }

      // 個人模式：自動加入收藏
      if (mode === 'personal' && liked) {
        await supabase
          .from('favorites')
          .upsert({
            user_id: user!.id,
            restaurant_id: restaurant.id
          });
      }

      // 顯示成功提示
      if (mode === 'personal' && liked) {
        toast({
          title: "已收藏！",
          description: `${restaurant.name} 已加入收藏清單`,
        });
      } else if (mode === 'group') {
        toast({
          title: "已投票！",
          description: liked 
            ? `你對 ${restaurant.name} 投了讚成票`
            : `你對 ${restaurant.name} 投了反對票`,
        });
      }

      // 回調
      onSwipeComplete?.(liked);

    } catch (error: any) {
      console.error(`[${mode}Swipe] Error:`, error);
      toast({
        title: "操作失敗",
        description: `無法記錄您的選擇：${error.message}`,
        variant: "destructive"
      });
      return;
    }

    // 動畫完成後移到下一張
    setTimeout(() => {
      onNext();
      setSwipeDirection(null);
    }, 300);
  }, [user?.id, mode, groupId, toast, onSwipeComplete]);

  // 滑鼠事件處理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target !== e.currentTarget && !(e.target as Element).closest('.card-content')) return;
    setIsDragging(false);
    startPosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (startPosRef.current.x === 0) return;
    
    const deltaX = e.clientX - startPosRef.current.x;
    const deltaY = e.clientY - startPosRef.current.y;
    
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      setIsDragging(true);
      setDragOffset({ x: deltaX, y: deltaY });
    }
  }, []);

  const handleMouseUp = useCallback((restaurant: Restaurant, onNext: () => void) => {
    const currentDragOffset = dragOffset;
    const currentIsDragging = isDragging;
    
    if (currentIsDragging && Math.abs(currentDragOffset.x) > 100) {
      const liked = currentDragOffset.x > 0;
      handleSwipe(restaurant, liked, onNext);
    }
    
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    startPosRef.current = { x: 0, y: 0 };
  }, [isDragging, dragOffset, handleSwipe]);

  // 觸控事件處理
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(false);
    startPosRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (startPosRef.current.x === 0) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startPosRef.current.x;
    const deltaY = touch.clientY - startPosRef.current.y;
    
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      setIsDragging(true);
      setDragOffset({ x: deltaX, y: deltaY });
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback((restaurant: Restaurant, onNext: () => void) => {
    const currentDragOffset = dragOffset;
    const currentIsDragging = isDragging;
    
    if (currentIsDragging && Math.abs(currentDragOffset.x) > 100) {
      const liked = currentDragOffset.x > 0;
      handleSwipe(restaurant, liked, onNext);
    }
    
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    startPosRef.current = { x: 0, y: 0 };
  }, [isDragging, dragOffset, handleSwipe]);

  return {
    swipeDirection,
    isDragging,
    dragOffset,
    handleSwipe,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
};
