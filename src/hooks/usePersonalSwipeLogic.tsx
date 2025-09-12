import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RestaurantBase } from '@/types/restaurant';

export const usePersonalSwipeLogic = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });

  const handleSwipe = useCallback(async (restaurant: RestaurantBase, liked: boolean, onNext: () => void) => {
    if (!user?.id) {
      console.error('[PersonalSwipe] No user ID available');
      toast({
        title: "登入錯誤",
        description: "請重新登入",
        variant: "destructive"
      });
      return;
    }
    
    console.log('[PersonalSwipe] Recording personal swipe:', {
      userId: user.id,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      liked,
    });
    
    setSwipeDirection(liked ? 'right' : 'left');
    
    try {
      // Record the personal swipe (group_id is always null)
      const swipeData = {
        user_id: user.id,
        restaurant_id: restaurant.id,
        liked,
        group_id: null
      };
      
      console.log('[PersonalSwipe] Inserting personal swipe data:', swipeData);
      
      // Try insert first, if conflict then update
      const { data: insertData, error: insertError } = await supabase
        .from('user_swipes')
        .insert(swipeData)
        .select();

      if (insertError) {
        // If it's a duplicate error, try update instead
        if (insertError.code === '23505') {
          console.log('[PersonalSwipe] Duplicate found, updating existing record');
          
          const { data: updateData, error: updateError } = await supabase
            .from('user_swipes')
            .update({ liked })
            .eq('user_id', user.id)
            .eq('restaurant_id', restaurant.id)
            .is('group_id', null)
            .select();
            
          if (updateError) throw updateError;
          console.log('[PersonalSwipe] Personal swipe updated successfully:', updateData);
        } else {
          throw insertError;
        }
      } else {
        console.log('[PersonalSwipe] Personal swipe recorded successfully:', insertData);
      }

      // Add to favorites if liked (personal swipes always add to favorites)
      if (liked) {
        const { error: favError } = await supabase
          .from('favorites')
          .upsert({
            user_id: user.id,
            restaurant_id: restaurant.id
          });
          
        if (favError) {
          console.error('[PersonalSwipe] Favorites error:', favError);
          // Don't fail the whole operation for favorites error
        }
        
        toast({
          title: "已收藏！",
          description: `${restaurant.name} 已加入收藏清單`,
        });
      }
    } catch (error) {
      console.error('[PersonalSwipe] Error recording personal swipe:', error);
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

  const handleMouseUp = useCallback((restaurant: RestaurantBase, onNext: () => void) => {
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

  const handleTouchEnd = useCallback((restaurant: RestaurantBase, onNext: () => void) => {
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