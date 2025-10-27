import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Restaurant } from '@/types/restaurant';
import { FilterOptions } from '@/components/SearchAndFilter';

// 計算兩點之間的距離（公里）
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export interface SwipeContext {
  filters: FilterOptions;
  userLocation: {lat: number, lng: number} | null;
  swipeDuration: number;
}

export const usePersonalSwipeLogic = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });

  const handleSwipe = useCallback(async (
    restaurant: Restaurant, 
    liked: boolean, 
    onNext: () => void,
    context?: SwipeContext
  ) => {
    if (!user?.id) {
      console.error('[PersonalSwipe] No user ID available');
      toast({
        title: "登入錯誤",
        description: "請重新登入",
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
    
    // Swipe tracking for analytics (removed verbose logging)
    
    setSwipeDirection(liked ? 'right' : 'left');
    
    try {
      // Record the personal swipe with context data
      const swipeData = {
        user_id: user.id,
        restaurant_id: restaurant.id,
        liked,
        group_id: null,
        // Phase 1 新增欄位：記錄滑卡上下文
        swipe_lat: context?.userLocation?.lat || null,
        swipe_lng: context?.userLocation?.lng || null,
        swipe_distance_km: distance,
        filter_context: context?.filters ? {
          priceRange: context.filters.priceRange,
          distanceRange: context.filters.distanceRange,
          minRating: context.filters.minRating,
          cuisineTypes: context.filters.cuisineTypes,
          dietaryOptions: context.filters.dietaryOptions,
          hasMichelinStars: context.filters.hasMichelinStars,
          has500Dishes: context.filters.has500Dishes,
          hasBibGourmand: context.filters.hasBibGourmand,
          hasFilters: (
            context.filters.cuisineTypes.length > 0 || 
            context.filters.priceRange[0] > 0 || 
            context.filters.priceRange[1] < 10 ||
            context.filters.distanceRange < 999 ||
            context.filters.minRating > 0
          ),
          searchTerm: context.filters.searchTerm
        } : {},
        swipe_duration_ms: context?.swipeDuration || null
      };
      
      // Try insert first, if conflict then update
      const { data: insertData, error: insertError } = await supabase
        .from('user_swipes')
        .insert(swipeData)
        .select();

      if (insertError) {
        // If it's a duplicate error, try update instead
        if (insertError.code === '23505') {
          const { data: updateData, error: updateError } = await supabase
            .from('user_swipes')
            .update({ liked })
            .eq('user_id', user.id)
            .eq('restaurant_id', restaurant.id)
            .is('group_id', null)
            .select();
            
          if (updateError) throw updateError;
        } else {
          throw insertError;
        }
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