import { useState, useCallback, useEffect } from 'react';

const CORE_STORAGE_KEY = 'onboarding_core_v1';
const FILTER_TIP_KEY = 'onboarding_filter_tip_shown';
const PROFILE_TIP_KEY = 'onboarding_profile_tip_shown';
const GROUP_TIP_KEY = 'onboarding_group_tip_shown';

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

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(CORE_STORAGE_KEY);
    localStorage.removeItem(FILTER_TIP_KEY);
    localStorage.removeItem(PROFILE_TIP_KEY);
    localStorage.removeItem(GROUP_TIP_KEY);
    setCoreCompleted(false);
    setFilterTipShown(false);
    setProfileTipShown(false);
    setGroupTipShown(false);
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
    resetOnboarding,
  };
};
