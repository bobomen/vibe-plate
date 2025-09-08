import { useState, useEffect } from 'react';
import { User, LogOut, MapPin, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BottomNavigation } from '@/components/BottomNavigation';
import { PreferenceSettings } from '@/components/PreferenceSettings';

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
  preferences: {
    michelin_stars: boolean;
    bib_gourmand: boolean;
    has_500_dishes: boolean;
  };
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
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

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

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
        .upsert({
          user_id: user?.id,
          display_name: displayName,
        });

      if (error) throw error;

      setProfile(prev => ({ ...prev, display_name: displayName }));
      toast({
        title: "個人資料已更新",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "更新失敗",
        description: "無法更新個人資料，請重試",
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
    if (!navigator.geolocation) {
      toast({
        title: "不支援定位",
        description: "您的瀏覽器不支援地理位置功能",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const { error } = await supabase
            .from('profiles')
            .upsert({
              user_id: user?.id,
              location_lat: latitude,
              location_lng: longitude,
              city: '台北市', // In real app, reverse geocode to get city
            });

          if (error) throw error;

          setProfile(prev => ({
            ...prev,
            location_lat: latitude,
            location_lng: longitude,
            city: '台北市'
          }));

          toast({
            title: "位置已更新",
            description: "現在可以看到附近的餐廳推薦",
          });
        } catch (error) {
          console.error('Error updating location:', error);
          toast({
            title: "位置更新失敗",
            variant: "destructive",
          });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: "定位失敗",
          description: "無法獲取您的位置，請檢查權限設定",
          variant: "destructive",
        });
      }
    );
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
      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">個人資料</h1>
          <p className="text-sm text-muted-foreground">管理您的帳戶設定</p>
        </div>

        <div className="space-y-6">
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
                    當前位置：{profile.city || '未設定'}
                  </p>
                  <Button variant="outline" onClick={requestLocation}>
                    更新位置
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
              preferences: profile.preferences,
            }}
            onUpdate={updatePreferences}
          />

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                設定
              </CardTitle>
            </CardHeader>
            <CardContent>
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
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default Profile;