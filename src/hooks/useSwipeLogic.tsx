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
    setSwipeDirection(liked ? 'right' : 'left');
    
    try {
      // Record the swipe with optional group_id
      await supabase
        .from('user_swipes')
        .upsert({
          user_id: user?.id,
          restaurant_id: restaurant.id,
          liked,
          group_id: groupId || null
        });

      // Add to favorites if liked
      if (liked) {
        await supabase
          .from('favorites')
          .upsert({
            user_id: user?.id,
            restaurant_id: restaurant.id
          });
        
        toast({
          title: "已收藏！",
          description: `${restaurant.name} 已加入收藏清單`,
        });
      }
    } catch (error) {
      console.error('Error recording swipe:', error);
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
      setSwipeDirection(liked ? 'right' : 'left');
      
      // Record the swipe async
      (async () => {
        try {
          await supabase
            .from('user_swipes')
            .upsert({
              user_id: user?.id,
              restaurant_id: restaurant.id,
              liked,
              group_id: groupId || null
            });

          if (liked) {
            await supabase
              .from('favorites')
              .upsert({
                user_id: user?.id,
                restaurant_id: restaurant.id
              });
            
            toast({
              title: "已收藏！",
              description: `${restaurant.name} 已加入收藏清單`,
            });
          }
        } catch (error) {
          console.error('Error recording swipe:', error);
        }
      })();

      // Move to next card after animation
      setTimeout(() => {
        onNext();
        setSwipeDirection(null);
      }, 300);
    }
    
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    startPosRef.current = { x: 0, y: 0 };
  }, [isDragging, dragOffset, user?.id, toast]);

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
      setSwipeDirection(liked ? 'right' : 'left');
      
      // Record the swipe async
      (async () => {
        try {
          await supabase
            .from('user_swipes')
            .upsert({
              user_id: user?.id,
              restaurant_id: restaurant.id,
              liked,
              group_id: groupId || null
            });

          if (liked) {
            await supabase
              .from('favorites')
              .upsert({
                user_id: user?.id,
                restaurant_id: restaurant.id
              });
            
            toast({
              title: "已收藏！",
              description: `${restaurant.name} 已加入收藏清單`,
            });
          }
        } catch (error) {
          console.error('Error recording swipe:', error);
        }
      })();

      // Move to next card after animation
      setTimeout(() => {
        onNext();
        setSwipeDirection(null);
      }, 300);
    }
    
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    startPosRef.current = { x: 0, y: 0 };
  }, [isDragging, dragOffset, user?.id, toast]);

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