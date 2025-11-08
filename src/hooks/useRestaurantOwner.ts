import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface RestaurantOwnerData {
  restaurantId: string;
  restaurantName: string;
  verified: boolean;
}

export function useRestaurantOwner() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerData, setOwnerData] = useState<RestaurantOwnerData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      checkOwnership();
    } else {
      setLoading(false);
      setIsOwner(false);
      setOwnerData(null);
    }
  }, [user]);

  const checkOwnership = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('restaurant_owners')
        .select('restaurant_id, verified, restaurants(name)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error checking restaurant ownership:', fetchError);
        setError(fetchError.message);
        setIsOwner(false);
        setOwnerData(null);
        return;
      }

      if (data) {
        setIsOwner(true);
        setOwnerData({
          restaurantId: data.restaurant_id,
          restaurantName: (data.restaurants as any)?.name || '未知餐厅',
          verified: data.verified,
        });
      } else {
        setIsOwner(false);
        setOwnerData(null);
      }
    } catch (err) {
      console.error('Error in checkOwnership:', err);
      setError(err instanceof Error ? err.message : '未知错误');
      setIsOwner(false);
      setOwnerData(null);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    checkOwnership();
  };

  return {
    loading,
    isOwner,
    ownerData,
    error,
    refetch,
  };
}
