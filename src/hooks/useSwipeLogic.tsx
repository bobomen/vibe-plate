import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Restaurant {
  id: string;
  name: string;
}

export const useSwipeLogic = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });

  const handleSwipe = useCallback(async (restaurant: Restaurant, liked: boolean, onNext: () => void, groupId?: string) => {
    if (!user?.id) {
      console.error('[handleSwipe] No user ID available');
      toast({
        title: "登入錯誤",
        description: "請重新登入",
        variant: "destructive"
      });
      return;
    }
    
    console.log('[handleSwipe] Recording swipe:', {
      userId: user.id,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      liked,
      groupId: groupId || 'null (personal)',
      isGroupSwipe: !!groupId
    });
    
    setSwipeDirection(liked ? 'right' : 'left');
    
    try {
      // Validate group membership if it's a group swipe
      if (groupId) {
        const { data: membership, error: membershipError } = await supabase
          .from('group_members')
          .select('id')
          .eq('group_id', groupId)
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (membershipError || !membership) {
          throw new Error('您不是此群組的成員，無法投票');
        }
        console.log('[handleSwipe] Group membership validated');
      }

      // Record the swipe - use insert instead of upsert to handle conflicts better
      const swipeData = {
        user_id: user.id,
        restaurant_id: restaurant.id,
        liked,
        group_id: groupId || null
      };
      
      console.log('[handleSwipe] Inserting swipe data:', swipeData);
      
      // Try insert first, if conflict then update
      const { data: insertData, error: insertError } = await supabase
        .from('user_swipes')
        .insert(swipeData)
        .select();

      if (insertError) {
        // If it's a duplicate error, try update instead
        if (insertError.code === '23505') {
          console.log('[handleSwipe] Duplicate found, updating existing record');
          const { data: updateData, error: updateError } = await supabase
            .from('user_swipes')
            .update({ liked })
            .eq('user_id', user.id)
            .eq('restaurant_id', restaurant.id)
            .eq('group_id', groupId || null)
            .select();
            
          if (updateError) throw updateError;
          console.log('[handleSwipe] Swipe updated successfully:', updateData);
        } else {
          throw insertError;
        }
      } else {
        console.log('[handleSwipe] Swipe recorded successfully:', insertData);
      }

      // Add to favorites if liked (only for personal swipes)
      if (liked && !groupId) {
        const { error: favError } = await supabase
          .from('favorites')
          .upsert({
            user_id: user.id,
            restaurant_id: restaurant.id
          });
          
        if (favError) {
          console.error('[handleSwipe] Favorites error:', favError);
          // Don't fail the whole operation for favorites error
        }
        
        toast({
          title: "已收藏！",
          description: `${restaurant.name} 已加入收藏清單`,
        });
      } else if (liked && groupId) {
        toast({
          title: "已投票！",
          description: `你對 ${restaurant.name} 投了讚成票`,
        });
      } else if (!liked && groupId) {
        toast({
          title: "已投票！",
          description: `你對 ${restaurant.name} 投了反對票`,
        });
      }
    } catch (error) {
      console.error('[handleSwipe] Error recording swipe:', error);
      toast({
        title: "操作失敗",
        description: `無法記錄您的選擇：${error.message}`,
        variant: "destructive"
      });
      return;
    }

    // Move to next card after animation
    setTimeout(() => {
      onNext();
      setSwipeDirection(null);
    }, 300);
  }, [user?.id, toast]);

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

  const handleMouseUp = useCallback((restaurant: Restaurant, onNext: () => void, groupId?: string) => {
    const currentDragOffset = dragOffset;
    const currentIsDragging = isDragging;
    
    if (currentIsDragging && Math.abs(currentDragOffset.x) > 100) {
      const liked = currentDragOffset.x > 0;
      
      // Use the same handleSwipe function for consistency
      handleSwipe(restaurant, liked, onNext, groupId);
    }
    
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    startPosRef.current = { x: 0, y: 0 };
  }, [isDragging, dragOffset, handleSwipe]);

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

  const handleTouchEnd = useCallback((restaurant: Restaurant, onNext: () => void, groupId?: string) => {
    const currentDragOffset = dragOffset;
    const currentIsDragging = isDragging;
    
    if (currentIsDragging && Math.abs(currentDragOffset.x) > 100) {
      const liked = currentDragOffset.x > 0;
      
      // Use the same handleSwipe function for consistency
      handleSwipe(restaurant, liked, onNext, groupId);
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