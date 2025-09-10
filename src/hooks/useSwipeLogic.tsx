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
          .single();
          
        if (membershipError || !membership) {
          throw new Error('您不是此群組的成員，無法投票');
        }
        console.log('[handleSwipe] Group membership validated');
      }

      // Record the swipe with explicit group_id handling
      const swipeData = {
        user_id: user.id,
        restaurant_id: restaurant.id,
        liked,
        group_id: groupId || null
      };
      
      console.log('[handleSwipe] Inserting swipe data:', swipeData);
      
      const { data, error } = await supabase
        .from('user_swipes')
        .upsert(swipeData, { 
          onConflict: 'user_id,restaurant_id,group_id',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error('[handleSwipe] Database error:', error);
        throw error;
      }
      
      console.log('[handleSwipe] Swipe recorded successfully:', data);

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
      setSwipeDirection(liked ? 'right' : 'left');
      
      // Record the swipe async with proper validation
      (async () => {
        try {
          if (!user?.id) {
            throw new Error('用戶未登入');
          }
          
          console.log('[handleMouseUp] Recording mouse swipe:', {
            userId: user.id,
            restaurantId: restaurant.id,
            liked,
            groupId: groupId || 'null (personal)'
          });
          
          // Validate group membership for group swipes
          if (groupId) {
            const { data: membership, error: membershipError } = await supabase
              .from('group_members')
              .select('id')
              .eq('group_id', groupId)
              .eq('user_id', user.id)
              .single();
              
            if (membershipError || !membership) {
              throw new Error('您不是此群組的成員，無法投票');
            }
          }
          
          const { data, error } = await supabase
            .from('user_swipes')
            .upsert({
              user_id: user.id,
              restaurant_id: restaurant.id,
              liked,
              group_id: groupId || null
            }, { 
              onConflict: 'user_id,restaurant_id,group_id',
              ignoreDuplicates: false 
            })
            .select();

          if (error) throw error;
          console.log('[handleMouseUp] Swipe recorded:', data);

          if (liked && !groupId) {
            await supabase
              .from('favorites')
              .upsert({
                user_id: user.id,
                restaurant_id: restaurant.id
              });
            
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
          console.error('[handleMouseUp] Error recording swipe:', error);
          toast({
            title: "操作失敗",
            description: `無法記錄您的選擇：${error.message}`,
            variant: "destructive"
          });
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
      
      // Record the swipe async with proper validation
      (async () => {
        try {
          if (!user?.id) {
            throw new Error('用戶未登入');
          }
          
          console.log('[handleTouchEnd] Recording touch swipe:', {
            userId: user.id,
            restaurantId: restaurant.id,
            liked,
            groupId: groupId || 'null (personal)'
          });
          
          // Validate group membership for group swipes
          if (groupId) {
            const { data: membership, error: membershipError } = await supabase
              .from('group_members')
              .select('id')
              .eq('group_id', groupId)
              .eq('user_id', user.id)
              .single();
              
            if (membershipError || !membership) {
              throw new Error('您不是此群組的成員，無法投票');
            }
          }
          
          const { data, error } = await supabase
            .from('user_swipes')
            .upsert({
              user_id: user.id,
              restaurant_id: restaurant.id,
              liked,
              group_id: groupId || null
            }, { 
              onConflict: 'user_id,restaurant_id,group_id',
              ignoreDuplicates: false 
            })
            .select();

          if (error) throw error;
          console.log('[handleTouchEnd] Swipe recorded:', data);

          if (liked && !groupId) {
            await supabase
              .from('favorites')
              .upsert({
                user_id: user.id,
                restaurant_id: restaurant.id
              });
            
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
          console.error('[handleTouchEnd] Error recording swipe:', error);
          toast({
            title: "操作失敗",
            description: `無法記錄您的選擇：${error.message}`,
            variant: "destructive"
          });
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