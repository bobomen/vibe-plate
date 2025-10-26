import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, MapPin, Settings, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useOnboarding } from '@/hooks/useOnboarding';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';
import { BottomNavigation } from '@/components/BottomNavigation';
import { PreferenceSettings } from '@/components/PreferenceSettings';
import PremiumModal from '@/components/PremiumModal';
import { SubscriptionManagement } from '@/components/SubscriptionManagement';
import { usePremium } from '@/hooks/usePremium';
import { ContextualTip } from '@/components/Onboarding/ContextualTip';

interface Profile {
  display_name: string;
  avatar_url?: string;
  location_lat?: number;
  location_lng?: number;
  city?: string;
  dietary_preferences: string[];
  preferred_price_min: number;
  preferred_price_max: number;
  favorite_cuisines: string[];
  min_rating?: number;
  preferences: {
    michelin_stars: boolean;
    bib_gourmand: boolean;
    has_500_dishes: boolean;
  };
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isPremium, showFirstTimeModal, markModalAsSeen, upgradeToPremium, loading: premiumLoading } = usePremium();
  const { showProfileTip, markProfileTipSeen, resetOnboarding } = useOnboarding();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showProfileTooltip, setShowProfileTooltip] = useState(false);
  const [profile, setProfile] = useState<Profile>({ 
    display_name: '',
    dietary_preferences: [],
    preferred_price_min: 1,
    preferred_price_max: 4,
    favorite_cuisines: [],
    preferences: {
      michelin_stars: false,
      bib_gourmand: false,
      has_500_dishes: false,
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Show contextual tip on first visit
  useEffect(() => {
    if (!loading && showProfileTip) {
      const timer = setTimeout(() => {
        setShowProfileTooltip(true);
        setTimeout(() => {
          markProfileTipSeen();
          setShowProfileTooltip(false);
        }, 3000);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, showProfileTip, markProfileTipSeen]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const profileData: Profile = {
          display_name: data.display_name || '',
          avatar_url: data.avatar_url,
          location_lat: data.location_lat,
          location_lng: data.location_lng,
          city: data.city,
          dietary_preferences: Array.isArray(data.dietary_preferences) ? data.dietary_preferences as string[] : [],
          preferred_price_min: data.preferred_price_min || 1,
          preferred_price_max: data.preferred_price_max || 4,
          favorite_cuisines: Array.isArray(data.favorite_cuisines) ? data.favorite_cuisines as string[] : [],
          min_rating: data.min_rating,
          preferences: {
            michelin_stars: (data.preferences as any)?.michelin_stars || false,
            bib_gourmand: (data.preferences as any)?.bib_gourmand || false,
            has_500_dishes: (data.preferences as any)?.has_500_dishes || false,
          }
        };
        setProfile(profileData);
        setDisplayName(data.display_name || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      setProfile(prev => ({ ...prev, display_name: displayName }));
      toast({
        title: "個人資料已更新",
        description: "顯示名稱更新成功",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "更新失敗",
        description: "無法更新顯示名稱，請重試",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePreferences = async (updates: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user?.id);

      if (error) throw error;

      setProfile(prev => ({ ...prev, ...updates }));
      toast({
        title: "偏好設定已更新",
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  };

  const requestLocation = async () => {
    // Validate user exists
    if (!user?.id) {
      toast({
        title: "用戶驗證失敗",
        description: "請重新登入後再試",
        variant: "destructive",
      });
      return;
    }

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      toast({
        title: "不支援定位",
        description: "您的瀏覽器不支援地理位置功能",
        variant: "destructive",
      });
      return;
    }

    // Check permissions first
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      if (permission.state === 'denied') {
        toast({
          title: "位置權限被拒絕",
          description: "請在瀏覽器設定中允許位置存取權限",
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      // Some browsers don't support permissions API, continue anyway
      console.log('Permissions API not supported, continuing...');
    }

    setLocationLoading(true);

    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('位置請求超時')), 10000)
    );

    // Create a promise for geolocation
    const locationPromise = new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });

    try {
      // Race between location and timeout
      const position = await Promise.race([locationPromise, timeoutPromise]) as GeolocationPosition;
      const { latitude, longitude } = position.coords;
      
      // Validate coordinates
      if (!latitude || !longitude || 
          latitude < -90 || latitude > 90 || 
          longitude < -180 || longitude > 180) {
        throw new Error('獲取的位置數據無效');
      }

      // Update database using UPDATE instead of UPSERT
      const { error } = await supabase
        .from('profiles')
        .update({
          location_lat: latitude,
          location_lng: longitude,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Database update error:', error);
        throw new Error(`資料庫更新失敗: ${error.message}`);
      }

      // Update local state
      setProfile(prev => ({
        ...prev,
        location_lat: latitude,
        location_lng: longitude
      }));

      toast({
        title: "位置已更新",
        description: "現在可以看到附近的餐廳推薦",
      });

    } catch (error: any) {
      console.error('Location update error:', error);
      
      // Provide specific error messages based on error type
      let errorTitle = "位置更新失敗";
      let errorDescription = "請重試或檢查權限設定";

      if (error.code === 1) { // PERMISSION_DENIED
        errorTitle = "位置權限被拒絕";
        errorDescription = "請允許瀏覽器存取您的位置，然後重試";
      } else if (error.code === 2) { // POSITION_UNAVAILABLE
        errorTitle = "無法獲取位置";
        errorDescription = "位置服務暫時不可用，請稍後再試";
      } else if (error.code === 3 || error.message?.includes('超時')) { // TIMEOUT
        errorTitle = "位置請求超時";
        errorDescription = "獲取位置花費時間過長，請重試";
      } else if (error.message?.includes('資料庫')) {
        errorTitle = "儲存失敗";
        errorDescription = "位置已獲取但儲存失敗，請重試";
      } else if (error.message?.includes('無效')) {
        errorTitle = "位置數據無效";
        errorDescription = "獲取的位置數據有誤，請重試";
      } else if (error.message?.includes('網路') || error.message?.includes('network')) {
        errorTitle = "網路連接失敗";
        errorDescription = "請檢查網路連接後重試";
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "已登出",
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {showProfileTooltip && (
        <ContextualTip
          message="在這裡設定您的位置和偏好，獲得更精準的餐廳推薦 🎯"
          direction="down"
          duration={3000}
          onClose={() => {
            markProfileTipSeen();
            setShowProfileTooltip(false);
          }}
        />
      )}
      
      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">個人資料</h1>
          <p className="text-sm text-muted-foreground">管理您的帳戶設定</p>
        </div>

        <div className="space-y-6">
          {/* Monthly Review Banner */}
          <Card className="bg-gradient-to-r from-pink-500/10 to-purple-600/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-lg">🎨</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">
                      創作你的 {new Date().getMonth() + 1} 月美食回顧
                    </h3>
                    <p className="text-xs text-muted-foreground">打造專屬美食回憶，分享到 Instagram</p>
                  </div>
                </div>
                <Button 
                  size="sm"
                  onClick={() => navigate('/app/monthly-review')}
                  className="bg-gradient-to-r from-primary to-primary/80"
                >
                  開始創作 →
                </Button>
              </div>
            </CardContent>
          </Card>
          {/* Premium Banner - Only show if not premium - Move to top */}
          {!isPremium && (
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-lg">💎</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">解鎖 Premium</h3>
                      <p className="text-xs text-muted-foreground">吃飯更快、更聰明、更有意義</p>
                    </div>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => setShowUpgradeModal(true)}
                    className="bg-gradient-to-r from-primary to-primary/80"
                  >
                    升級
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                位置設定
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    當前位置：{profile.location_lat ? '✓ 位置已更新' : '未設定'}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={requestLocation}
                    disabled={locationLoading}
                  >
                    {locationLoading ? "更新中..." : "更新位置"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  提供位置權限可以獲得更精準的餐廳推薦
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <PreferenceSettings
            preferences={{
              dietary_preferences: profile.dietary_preferences,
              preferred_price_min: profile.preferred_price_min,
              preferred_price_max: profile.preferred_price_max,
              favorite_cuisines: profile.favorite_cuisines,
              min_rating: profile.min_rating,
              preferences: profile.preferences,
            }}
            onUpdate={updatePreferences}
            isPremium={isPremium}
            onUpgrade={() => setShowUpgradeModal(true)}
          />

          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                基本資料
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">電子郵件</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              
              <div>
                <Label htmlFor="displayName">顯示名稱</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="請輸入顯示名稱"
                />
              </div>

              <Button onClick={updateProfile} disabled={saving}>
                {saving ? "更新中..." : "更新資料"}
              </Button>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                設定
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                onClick={async () => {
                  if (!user?.id) return;
                  
                  try {
                    // 1. Reset onboarding state in localStorage
                    resetOnboarding();
                    
                    // 2. Clear personal swipe records (ensures tutorial restaurants appear)
                    const { error } = await supabase
                      .from('user_swipes')
                      .delete()
                      .eq('user_id', user.id)
                      .is('group_id', null);
                    
                    if (error) throw error;
                    
                    toast({
                      title: "教學已重置",
                      description: "即將返回首頁重新開始",
                    });
                    
                    // 3. Navigate to swipe page after short delay
                    setTimeout(() => {
                      navigate('/app/');
                    }, 500);
                    
                  } catch (error) {
                    console.error('Error resetting onboarding:', error);
                    toast({
                      title: "重置失敗",
                      description: "請重試",
                      variant: "destructive",
                    });
                  }
                }}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                重新播放新手教學
              </Button>
              
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                登出
              </Button>
            </CardContent>
          </Card>

          {/* Subscription Management - Only show if premium - Move to bottom */}
          {isPremium && (
            <div>
              <SubscriptionManagement />
            </div>
          )}
        </div>
      </div>
      <BottomNavigation />
      
      <PremiumModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={async () => {
          await upgradeToPremium();
          setShowUpgradeModal(false);
        }}
      />
      
      {/* Contextual Tip for First Time Profile Visit */}
      {showProfileTooltip && (
        <ContextualTip
          message="這裡可以管理你的收藏和偏好設定！"
          direction="down"
          onClose={() => {
            markProfileTipSeen();
            setShowProfileTooltip(false);
          }}
        />
      )}
    </div>
  );
};

export default Profile;