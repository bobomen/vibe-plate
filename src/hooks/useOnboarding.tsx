import { useState, useCallback } from 'react';

const CORE_STORAGE_KEY = 'onboarding_core_v1';
const FILTER_TIP_KEY = 'onboarding_filter_tip_shown';
const PROFILE_TIP_KEY = 'onboarding_profile_tip_shown';
const GROUP_TIP_KEY = 'onboarding_group_tip_shown';
const FAVORITE_TIP_KEY = 'onboarding_favorite_tip_shown';
const CATEGORY_TIP_KEY = 'onboarding_category_tip_shown';

export const useOnboarding = () => {
  const [coreCompleted, setCoreCompleted] = useState(() => {
    return localStorage.getItem(CORE_STORAGE_KEY) === 'true';
  });

  const [filterTipShown, setFilterTipShown] = useState(() => {
    return localStorage.getItem(FILTER_TIP_KEY) === 'true';
  });

  const [profileTipShown, setProfileTipShown] = useState(() => {
    return localStorage.getItem(PROFILE_TIP_KEY) === 'true';
  });

  const [groupTipShown, setGroupTipShown] = useState(() => {
    return localStorage.getItem(GROUP_TIP_KEY) === 'true';
  });

  const [favoriteTipShown, setFavoriteTipShown] = useState(() => {
    return localStorage.getItem(FAVORITE_TIP_KEY) === 'true';
  });

  const [categoryTipShown, setCategoryTipShown] = useState(() => {
    return localStorage.getItem(CATEGORY_TIP_KEY) === 'true';
  });

  const showCoreOnboarding = useCallback(() => {
    return !coreCompleted;
  }, [coreCompleted]);

  const completeCoreOnboarding = useCallback(() => {
    localStorage.setItem(CORE_STORAGE_KEY, 'true');
    setCoreCompleted(true);
  }, []);

  const showFilterTip = useCallback(() => {
    return !filterTipShown;
  }, [filterTipShown]);

  const markFilterTipSeen = useCallback(() => {
    localStorage.setItem(FILTER_TIP_KEY, 'true');
    setFilterTipShown(true);
  }, []);

  const showProfileTip = useCallback(() => {
    return !profileTipShown;
  }, [profileTipShown]);

  const markProfileTipSeen = useCallback(() => {
    localStorage.setItem(PROFILE_TIP_KEY, 'true');
    setProfileTipShown(true);
  }, []);

  const showGroupTip = useCallback(() => {
    return !groupTipShown;
  }, [groupTipShown]);

  const markGroupTipSeen = useCallback(() => {
    localStorage.setItem(GROUP_TIP_KEY, 'true');
    setGroupTipShown(true);
  }, []);

  const showFavoriteTip = useCallback(() => {
    return !favoriteTipShown;
  }, [favoriteTipShown]);

  const markFavoriteTipSeen = useCallback(() => {
    localStorage.setItem(FAVORITE_TIP_KEY, 'true');
    setFavoriteTipShown(true);
  }, []);

  const showCategoryTip = useCallback(() => {
    return !categoryTipShown;
  }, [categoryTipShown]);

  const markCategoryTipSeen = useCallback(() => {
    localStorage.setItem(CATEGORY_TIP_KEY, 'true');
    setCategoryTipShown(true);
  }, []);

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
    showCoreOnboarding: showCoreOnboarding(),
    completeCoreOnboarding,
    showFilterTip: showFilterTip(),
    markFilterTipSeen,
    showProfileTip: showProfileTip(),
    markProfileTipSeen,
    showGroupTip: showGroupTip(),
    markGroupTipSeen,
    showFavoriteTip: showFavoriteTip(),
    markFavoriteTipSeen,
    showCategoryTip: showCategoryTip(),
    markCategoryTipSeen,
    resetOnboarding,
  };
};
