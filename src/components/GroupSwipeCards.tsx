/**
 * GOLDEN PATH 2: 建群組 → 群組滑卡 → 共識清單
 * INVARIANTS:
 * - 群組滑卡只讀 group_id = :groupId 的記錄
 * - 任何 API 不得在未登入時回傳個資
 */
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Eye, BarChart3, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { RestaurantCardSkeleton } from '@/components/ui/RestaurantCardSkeleton';
import { SwipeActionButtons } from '@/components/ui/SwipeActionButtons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useParams } from 'react-router-dom';
import SearchAndFilter from './SearchAndFilter';
import { SwipeCard } from './SwipeCard';
import { useSwipeLogic } from '@/hooks/useSwipeLogic';
import { useSwipeState } from '@/hooks/useSwipeState';
import { useRestaurantView } from '@/hooks/useRestaurantView';

interface GroupInfo {
  id: string;
  name: string;
  code: string;
  target_regions?: Array<{city: string; district: string}> | null;
  current_region?: {city: string; district: string} | null;
}

export const GroupSwipeCards = React.memo(() => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [groupLoading, setGroupLoading] = useState(true);
  const [currentRegion, setCurrentRegion] = useState<{city: string; district: string} | null>(null);

  // Use unified swipe state (group mode - with groupId)
  // Apply group region filter if available
  const {
    restaurants,
    currentIndex,
    loading,
    userSwipes: userGroupSwipes,
    userPreference,
    filters,
    currentRestaurant,
    distance,
    canGoBack,
    userLocation,
    setCurrentIndex,
    setFilters,
    applyFilters,
    withRetry,
    resetGroupSwipes,
    addToSwipeHistory,
    goBackToPrevious,
  } = useSwipeState({ 
    groupId,
  }); // INVARIANT: Group swipes have groupId

  // Phase 1: 記錄卡片顯示時間（用於計算停留時長）
  const [cardDisplayTime, setCardDisplayTime] = useState<number>(Date.now());

  // 當卡片切換時重置顯示時間
  useEffect(() => {
    setCardDisplayTime(Date.now());
  }, [currentIndex]);

  // Group swipe logic hook (unified)
  const {
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
  } = useSwipeLogic({ mode: 'group', groupId: groupId || '' });

  // Restaurant view tracking hook
  const { trackRestaurantView } = useRestaurantView();

  /**
   * INVARIANT: 任何 API 不得在未登入時回傳個資
   * Fetch group info and verify membership
   */
  const fetchGroupInfo = useCallback(async () => {
    if (!groupId || !user?.id) return;

    try {
      const operation = async () => {
        // Fetch group details including target_regions
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('id, name, code, target_regions, current_region')
          .eq('id', groupId)
          .single();

        if (groupError) throw groupError;

        // Verify user is a member of this group
        const { data: memberData, error: memberError } = await supabase
          .from('group_members')
          .select('id')
          .eq('group_id', groupId)
          .eq('user_id', user.id)
          .single();

        if (memberError) {
          throw new Error('你不是此群組的成員');
        }

        return groupData as unknown as GroupInfo;
      };

      const data = await withRetry(operation);
      
      // Cast target_regions and current_region to proper types
      const groupInfoData: GroupInfo = {
        ...data,
        target_regions: data.target_regions ? (data.target_regions as any) : null,
        current_region: data.current_region ? (data.current_region as any) : null,
      };
      
      setGroupInfo(groupInfoData);
      
      // Set initial current region: current_region || first target_region || null
      const initialRegion = groupInfoData.current_region || 
                           (groupInfoData.target_regions && groupInfoData.target_regions.length > 0 
                             ? groupInfoData.target_regions[0] 
                             : null);
      setCurrentRegion(initialRegion);
      
      // Apply group region filter if available
      if (groupInfoData.target_regions && groupInfoData.target_regions.length > 0) {
        const cities = Array.from(new Set(groupInfoData.target_regions.map(r => r.city)));
        const districts = groupInfoData.target_regions.map(r => r.district);
        setFilters(prev => ({
          ...prev,
          cities,
          districts
        }));
      }
    } catch (error) {
      console.error('Error fetching group info:', error);
      toast({
        title: "載入失敗",
        description: "無法載入群組資訊或您不是此群組成員",
        variant: "destructive"
      });
      navigate('/app/groups');
    }
  }, [groupId, user?.id, withRetry, toast, navigate, setFilters]);

  // Handle card interactions
  const handleCardSwipe = useCallback(async (liked: boolean) => {
    if (!currentRestaurant) return;
    
    // 計算停留時長
    const swipeDuration = Date.now() - cardDisplayTime;
    
    try {
      // Add to history before swiping
      addToSwipeHistory(currentRestaurant, liked);
      
      // Phase 1: 傳遞上下文數據（filters, userLocation, swipeDuration）
      await handleSwipe(currentRestaurant, liked, () => {
        setCurrentIndex(prev => prev + 1);
      }, {
        filters,
        userLocation,
        swipeDuration
      });
    } catch (error) {
      console.error('Error handling group swipe:', error);
    }
  }, [handleSwipe, setCurrentIndex, currentRestaurant, addToSwipeHistory, filters, userLocation, cardDisplayTime]);

  const handleCardClick = useCallback(() => {
    if (currentRestaurant) {
      // Track restaurant view
      trackRestaurantView(currentRestaurant.id, {
        source: 'group_swipe',
        groupId,
        filters,
        userLocation,
        restaurantLocation: {
          lat: currentRestaurant.lat,
          lng: currentRestaurant.lng
        }
      });
      
      navigate(`/app/restaurant/${currentRestaurant.id}`);
    }
  }, [navigate, currentRestaurant, trackRestaurantView, groupId, filters, userLocation]);

  // Event handlers with proper parameters  
  const handleMouseUpWithParams = useCallback(() => {
    if (!currentRestaurant) return;
    handleMouseUp(currentRestaurant, () => {
      // Add to history before moving to next
      addToSwipeHistory(currentRestaurant, true); // Assuming right swipe is like
      setCurrentIndex(prev => prev + 1);
    });
  }, [handleMouseUp, currentRestaurant, setCurrentIndex, addToSwipeHistory]);

  const handleTouchEndWithParams = useCallback(() => {
    if (!currentRestaurant) return;
    handleTouchEnd(currentRestaurant, () => {
      // Add to history before moving to next
      addToSwipeHistory(currentRestaurant, true); // Assuming right swipe is like
      setCurrentIndex(prev => prev + 1);
    });
  }, [handleTouchEnd, currentRestaurant, setCurrentIndex, addToSwipeHistory]);

  // Handle reset votes
  const handleResetVotes = useCallback(async () => {
    await resetGroupSwipes();
  }, [resetGroupSwipes]);

  // Handle region change
  const handleRegionChange = useCallback(async (region: {city: string; district: string}) => {
    if (!groupId) return;
    
    try {
      // Update local state immediately
      setCurrentRegion(region);
      
      // Update database
      const { error } = await supabase
        .from('groups')
        .update({ current_region: region as any })
        .eq('id', groupId);
      
      if (error) throw error;
      
      // Apply filters for this region and reset to first card
      setFilters(prev => ({
        ...prev,
        cities: [region.city],
        districts: [region.district]
      }));
      
      // Reset to first card when changing region
      setCurrentIndex(0);
      
      toast({
        title: "切換成功",
        description: `已切換至 ${region.city}${region.district}`
      });
    } catch (error) {
      console.error('Error updating region:', error);
      toast({
        title: "切換失敗",
        description: "無法更新地區設定",
        variant: "destructive"
      });
    }
  }, [groupId, setFilters, setCurrentIndex, toast]);

  // Load group info
  useEffect(() => {
    const loadGroupInfo = async () => {
      setGroupLoading(true);
      try {
        await fetchGroupInfo();
      } finally {
        setGroupLoading(false);
      }
    };

    loadGroupInfo();
  }, [fetchGroupInfo]);

  if (loading || groupLoading) {
    return <RestaurantCardSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">請先登入以使用群組滑卡功能</p>
      </div>
    );
  }

  if (!groupInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">群組資訊載入失敗</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Group Info and Navigation */}
      <div className="flex items-center justify-between p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/app/groups')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-semibold">{groupInfo.name}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>群組代碼: {groupInfo.code}</span>
              {groupInfo.target_regions && groupInfo.target_regions.length > 0 && (
                <>
                  <span>•</span>
                  <span>區域: {groupInfo.target_regions.map(r => `${r.city}${r.district}`).join(', ')}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-destructive hover:bg-destructive/10"
              >
                <RotateCcw className="h-4 w-4" />
                重置投票
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>確認重置投票</AlertDialogTitle>
                <AlertDialogDescription>
                  這會清除您在此群組的所有投票記錄，讓您可以重新開始滑卡投票。此操作無法復原。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetVotes} className="bg-destructive hover:bg-destructive/90">
                  確認重置
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/app/groups/${groupId}/consensus`)}
            className="flex items-center gap-1"
          >
            <Eye className="h-4 w-4" />
            查看共識
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/app/groups/${groupId}/consensus-summary`)}
            className="flex items-center gap-1"
          >
            <BarChart3 className="h-4 w-4" />
            數據分析
          </Button>
        </div>
      </div>

      {/* Region Switcher - Only show if multiple target regions */}
      {groupInfo.target_regions && groupInfo.target_regions.length > 1 && (
        <div className="px-4">
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium">選擇地區:</span>
            <div className="flex gap-2 flex-wrap">
              {groupInfo.target_regions.map((region, index) => (
                <Button
                  key={index}
                  variant={currentRegion?.city === region.city && currentRegion?.district === region.district ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleRegionChange(region)}
                  className="text-xs"
                >
                  {region.city}{region.district}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Filter */}
        <SearchAndFilter
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={applyFilters}
          resultsCount={restaurants.length}
        />

        {/* Current Card */}
        {currentRestaurant ? (
          <div className="relative">
            {/* Swipe Card */}
            <div className="relative mx-auto max-w-sm">
              <SwipeCard
                restaurant={currentRestaurant}
                distance={distance}
                swipeDirection={swipeDirection}
                isDragging={isDragging}
                dragOffset={dragOffset}
                onSwipe={handleCardSwipe}
                onCardClick={handleCardClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpWithParams}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEndWithParams}
              />
            </div>

            {/* Action Buttons */}
            <SwipeActionButtons
              onGoBack={goBackToPrevious}
              canGoBack={canGoBack}
              disabled={isDragging}
            />

            {/* User Feedback */}
            {userPreference[currentRestaurant.id] !== undefined && (
              <div className="text-center mt-4 text-sm text-muted-foreground">
                你已經{userPreference[currentRestaurant.id] ? '👍 喜歡' : '👎 不喜歡'}這間餐廳
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-xl font-semibold mb-2">群組滑卡完成！</h2>
            <p className="text-muted-foreground mb-6">
              已經沒有更多餐廳可以滑卡了
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => navigate(`/app/groups/${groupId}/consensus`)}
                className="w-full"
              >
                查看群組共識結果
              </Button>
              <Button 
                onClick={() => navigate(`/app/groups/${groupId}/consensus-summary`)}
                variant="outline"
                className="w-full"
              >
                查看數據分析
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline"
                    className="w-full text-destructive hover:bg-destructive/10"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    重新開始投票
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>確認重新開始投票</AlertDialogTitle>
                    <AlertDialogDescription>
                      這會清除您在此群組的所有投票記錄，讓您可以重新開始滑卡投票。此操作無法復原。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetVotes} className="bg-destructive hover:bg-destructive/90">
                      確認重置
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        {restaurants.length > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            {currentIndex + 1} / {restaurants.length + currentIndex} 張餐廳卡片
          </div>
        )}
      </div>
    </div>
  );
});

GroupSwipeCards.displayName = 'GroupSwipeCards';