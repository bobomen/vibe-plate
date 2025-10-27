import { useState, useCallback } from 'react';

// ✅ 教學狀態的 localStorage keys
const CORE_STORAGE_KEY = 'onboarding_core_v1';
const FILTER_TIP_KEY = 'onboarding_filter_tip_shown';
const PROFILE_TIP_KEY = 'onboarding_profile_tip_shown';
const GROUP_TIP_KEY = 'onboarding_group_tip_shown';
const FAVORITE_TIP_KEY = 'onboarding_favorite_tip_shown';
const CATEGORY_TIP_KEY = 'onboarding_category_tip_shown';

/**
 * ✅ 優化的 Onboarding Hook
 * 
 * 功能：
 * - 管理所有教學提示的顯示狀態
 * - 使用 localStorage 持久化狀態
 * - 提供簡潔的 API 來檢查和更新教學狀態
 * 
 * 邏輯：
 * - showXxxTip: true = 需要顯示教學，false = 已經看過
 * - markXxxTipSeen: 標記教學為已看過
 */
export const useOnboarding = () => {
  // ✅ 滑卡頁面核心教學狀態
  const [coreCompleted, setCoreCompleted] = useState(() => 
    localStorage.getItem(CORE_STORAGE_KEY) === 'true'
  );

  // ✅ 各頁面教學提示狀態
  const [filterTipShown, setFilterTipShown] = useState(() => 
    localStorage.getItem(FILTER_TIP_KEY) === 'true'
  );

  const [profileTipShown, setProfileTipShown] = useState(() => 
    localStorage.getItem(PROFILE_TIP_KEY) === 'true'
  );

  const [groupTipShown, setGroupTipShown] = useState(() => 
    localStorage.getItem(GROUP_TIP_KEY) === 'true'
  );

  const [favoriteTipShown, setFavoriteTipShown] = useState(() => 
    localStorage.getItem(FAVORITE_TIP_KEY) === 'true'
  );

  const [categoryTipShown, setCategoryTipShown] = useState(() => 
    localStorage.getItem(CATEGORY_TIP_KEY) === 'true'
  );

  // ✅ 滑卡頁面核心教學
  const completeCoreOnboarding = useCallback(() => {
    localStorage.setItem(CORE_STORAGE_KEY, 'true');
    setCoreCompleted(true);
  }, []);

  // ✅ 篩選提示
  const markFilterTipSeen = useCallback(() => {
    localStorage.setItem(FILTER_TIP_KEY, 'true');
    setFilterTipShown(true);
  }, []);

  // ✅ 個人資料提示
  const markProfileTipSeen = useCallback(() => {
    localStorage.setItem(PROFILE_TIP_KEY, 'true');
    setProfileTipShown(true);
  }, []);

  // ✅ 群組提示
  const markGroupTipSeen = useCallback(() => {
    localStorage.setItem(GROUP_TIP_KEY, 'true');
    setGroupTipShown(true);
  }, []);

  // ✅ 收藏提示
  const markFavoriteTipSeen = useCallback(() => {
    localStorage.setItem(FAVORITE_TIP_KEY, 'true');
    setFavoriteTipShown(true);
  }, []);

  // ✅ 分類提示
  const markCategoryTipSeen = useCallback(() => {
    localStorage.setItem(CATEGORY_TIP_KEY, 'true');
    setCategoryTipShown(true);
  }, []);

  // ✅ 重置所有教學狀態
  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(CORE_STORAGE_KEY);
    localStorage.removeItem(FILTER_TIP_KEY);
    localStorage.removeItem(PROFILE_TIP_KEY);
    localStorage.removeItem(GROUP_TIP_KEY);
    localStorage.removeItem(FAVORITE_TIP_KEY);
    localStorage.removeItem(CATEGORY_TIP_KEY);
    setCoreCompleted(false);
    setFilterTipShown(false);
    setProfileTipShown(false);
    setGroupTipShown(false);
    setFavoriteTipShown(false);
    setCategoryTipShown(false);
  }, []);

  return {
    // ✅ 滑卡頁面核心教學（true = 需要顯示）
    showCoreOnboarding: !coreCompleted,
    completeCoreOnboarding,
    
    // ✅ 各頁面教學提示（true = 需要顯示）
    showFilterTip: !filterTipShown,
    markFilterTipSeen,
    
    showProfileTip: !profileTipShown,
    markProfileTipSeen,
    
    showGroupTip: !groupTipShown,
    markGroupTipSeen,
    
    showFavoriteTip: !favoriteTipShown,
    markFavoriteTipSeen,
    
    showCategoryTip: !categoryTipShown,
    markCategoryTipSeen,
    
    // ✅ 重置功能
    resetOnboarding,
  };
};
