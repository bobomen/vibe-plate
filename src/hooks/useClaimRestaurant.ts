import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { ClaimState, ClaimStep, ClaimType, SearchedRestaurant, ContactInfoForm, CreateRestaurantForm } from '@/types/claimRestaurant';

const initialState: ClaimState = {
  currentStep: 'search',
  claimType: null,
  selectedRestaurant: null,
  contactInfo: null,
  createInfo: null,
  verificationCodeSent: false,
  isSubmitting: false,
  error: null,
};

export function useClaimRestaurant() {
  const [state, setState] = useState<ClaimState>(initialState);
  const navigate = useNavigate();

  const setStep = useCallback((step: ClaimStep) => {
    setState(prev => ({ ...prev, currentStep: step, error: null }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const selectExistingRestaurant = useCallback((restaurant: SearchedRestaurant) => {
    setState(prev => ({
      ...prev,
      claimType: 'existing',
      selectedRestaurant: restaurant,
      currentStep: 'contact-info',
      error: null,
    }));
  }, []);

  const chooseCreateNew = useCallback(() => {
    setState(prev => ({
      ...prev,
      claimType: 'new',
      selectedRestaurant: null,
      currentStep: 'create-info',
      error: null,
    }));
  }, []);

  const submitContactInfo = useCallback(async (data: ContactInfoForm) => {
    if (!state.selectedRestaurant) {
      setError('未選擇餐廳');
      return false;
    }

    setState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const response = await supabase.functions.invoke('send-verification-code', {
        body: {
          restaurant_id: state.selectedRestaurant.id,
          claim_type: 'existing',
          contact_email: data.email,
          restaurant_name: state.selectedRestaurant.name,
        },
      });

      if (response.error) throw response.error;

      setState(prev => ({
        ...prev,
        contactInfo: data,
        verificationCodeSent: true,
        currentStep: 'verification',
        isSubmitting: false,
      }));

      toast({
        title: '驗證碼已發送',
        description: `驗證碼已發送至 ${data.email}`,
      });

      return true;
    } catch (error) {
      console.error('Error sending verification code:', error);
      setError(error instanceof Error ? error.message : '發送驗證碼失敗');
      setState(prev => ({ ...prev, isSubmitting: false }));
      return false;
    }
  }, [state.selectedRestaurant, setError]);

  const submitCreateInfo = useCallback(async (data: CreateRestaurantForm) => {
    setState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const response = await supabase.functions.invoke('create-new-restaurant', {
        body: {
          name: data.name,
          address: data.address,
          phone: data.phone,
          email: data.email,
          city: data.city,
          district: data.district,
          cuisine_type: data.cuisine_type,
          website: data.website,
          menu_url: data.menu_url,
        },
      });

      if (response.error) throw response.error;

      const newRestaurant = response.data?.restaurant;
      if (!newRestaurant) throw new Error('創建餐廳失敗');

      // Send verification code
      const verifyResponse = await supabase.functions.invoke('send-verification-code', {
        body: {
          restaurant_id: newRestaurant.id,
          claim_type: 'new',
          contact_email: data.email,
          restaurant_name: data.name,
        },
      });

      if (verifyResponse.error) throw verifyResponse.error;

      setState(prev => ({
        ...prev,
        createInfo: data,
        selectedRestaurant: {
          id: newRestaurant.id,
          name: data.name,
          address: data.address,
          city: data.city,
          district: data.district,
          cuisine_type: data.cuisine_type,
        },
        verificationCodeSent: true,
        currentStep: 'verification',
        isSubmitting: false,
      }));

      toast({
        title: '餐廳創建成功',
        description: `驗證碼已發送至 ${data.email}`,
      });

      return true;
    } catch (error) {
      console.error('Error creating restaurant:', error);
      setError(error instanceof Error ? error.message : '創建餐廳失敗');
      setState(prev => ({ ...prev, isSubmitting: false }));
      return false;
    }
  }, [setError]);

  const submitVerificationCode = useCallback(async (code: string) => {
    if (!state.selectedRestaurant) {
      setError('未找到餐廳資訊');
      return false;
    }

    setState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const response = await supabase.functions.invoke('verify-restaurant-claim', {
        body: {
          restaurant_id: state.selectedRestaurant.id,
          verification_code: code,
        },
      });

      if (response.error) throw response.error;

      setState(prev => ({
        ...prev,
        currentStep: 'success',
        isSubmitting: false,
      }));

      toast({
        title: '驗證成功',
        description: '餐廳認領已完成',
      });

      return true;
    } catch (error) {
      console.error('Error verifying code:', error);
      setError(error instanceof Error ? error.message : '驗證碼錯誤');
      setState(prev => ({ ...prev, isSubmitting: false }));
      return false;
    }
  }, [state.selectedRestaurant, setError]);

  const goToDashboard = useCallback(() => {
    navigate('/app/restaurant-owner-v2/overview');
  }, [navigate]);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    state,
    setStep,
    setError,
    selectExistingRestaurant,
    chooseCreateNew,
    submitContactInfo,
    submitCreateInfo,
    submitVerificationCode,
    goToDashboard,
    reset,
  };
}
