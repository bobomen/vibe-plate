import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Eye, Heart, MousePointerClick, Clock, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RestaurantStats {
  total_impressions: number;
  detail_views: number;
  favorites_count: number;
  save_rate: number;
  phone_clicks: number;
  map_clicks: number;
  menu_clicks: number;
  website_clicks: number;
  avg_view_duration_sec: number;
  like_rate: number;
  district_rank: number;
}

interface RestaurantTrend {
  date: string;
  impressions: number;
  detail_views: number;
  favorites: number;
}

interface OwnedRestaurant {
  id: string;
  restaurant_id: string;
  verified: boolean;
  restaurants: {
    id: string;
    name: string;
    district: string;
  };
}

export default function RestaurantOwnerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [ownedRestaurants, setOwnedRestaurants] = useState<OwnedRestaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [stats, setStats] = useState<RestaurantStats | null>(null);
  const [trends, setTrends] = useState<RestaurantTrend[]>([]);
  const [daysBack, setDaysBack] = useState<number>(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOwnedRestaurants();
  }, [user]);

  useEffect(() => {
    if (selectedRestaurantId) {
      fetchRestaurantData();
    }
  }, [selectedRestaurantId, daysBack]);

  const fetchOwnedRestaurants = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('restaurant_owners')
        .select(`
          id,
          restaurant_id,
          verified,
          restaurants:restaurant_id (
            id,
            name,
            district
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      setOwnedRestaurants(data || []);
      
      if (data && data.length > 0) {
        setSelectedRestaurantId(data[0].restaurant_id);
      } else {
        toast({
          title: "暫無餐廳數據",
          description: "您目前沒有關聯的餐廳，請聯繫管理員申請權限",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching owned restaurants:', error);
      toast({
        title: "載入失敗",
        description: "無法載入餐廳列表",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurantData = async () => {
    if (!selectedRestaurantId) return;

    setLoading(true);
    try {
      // Fetch stats
      const { data: statsData, error: statsError } = await supabase.rpc(
        'get_restaurant_stats',
        { 
          target_restaurant_id: selectedRestaurantId,
          days_back: daysBack 
        }
      );

      if (statsError) throw statsError;
      setStats(statsData as unknown as RestaurantStats);

      // Fetch trends
      const { data: trendsData, error: trendsError } = await supabase.rpc(
        'get_restaurant_trend',
        { 
          target_restaurant_id: selectedRestaurantId,
          days_back: daysBack 
        }
      );

      if (trendsError) throw trendsError;
      setTrends(trendsData || []);

    } catch (error) {
      console.error('Error fetching restaurant data:', error);
      toast({
        title: "載入失敗",
        description: "無法載入餐廳數據",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedRestaurant = ownedRestaurants.find(
    (r) => r.restaurant_id === selectedRestaurantId
  );

  const totalExternalClicks = stats
    ? stats.phone_clicks + stats.map_clicks + stats.menu_clicks + stats.website_clicks
    : 0;

  if (loading && ownedRestaurants.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (ownedRestaurants.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回首頁
        </Button>
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>暫無餐廳數據</CardTitle>
            <CardDescription>
              您目前沒有關聯的餐廳，請聯繫管理員申請權限
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回首頁
        </Button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">餐廳業者數據後台</h1>
            <p className="text-muted-foreground mt-1">
              即時追蹤您的餐廳曝光與轉換數據
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Restaurant Selector */}
            {ownedRestaurants.length > 1 && (
              <Select value={selectedRestaurantId} onValueChange={setSelectedRestaurantId}>
                <SelectTrigger className="w-full sm:w-[250px]">
                  <SelectValue placeholder="選擇餐廳" />
                </SelectTrigger>
                <SelectContent>
                  {ownedRestaurants.map((r) => (
                    <SelectItem key={r.restaurant_id} value={r.restaurant_id}>
                      {r.restaurants.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Time Range Selector */}
            <Select value={daysBack.toString()} onValueChange={(v) => setDaysBack(Number(v))}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">近 7 天</SelectItem>
                <SelectItem value="30">近 30 天</SelectItem>
                <SelectItem value="90">近 90 天</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedRestaurant && (
          <div className="mt-4 flex items-center gap-2">
            <Badge variant={selectedRestaurant.verified ? "default" : "secondary"}>
              {selectedRestaurant.verified ? "✓ 已驗證" : "待驗證"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {selectedRestaurant.restaurants.district}
            </span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                總曝光次數
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_impressions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                詳細頁瀏覽：{stats.detail_views.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                收藏數 / 轉換率
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.favorites_count.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                收藏率：{stats.save_rate}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MousePointerClick className="h-4 w-4 text-blue-500" />
                外部點擊次數
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalExternalClicks.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                <div>電話：{stats.phone_clicks} | 地圖：{stats.map_clicks}</div>
                <div>菜單：{stats.menu_clicks} | 官網：{stats.website_clicks}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-500" />
                地區排名
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">#{stats.district_rank}</div>
              <p className="text-xs text-muted-foreground mt-1">
                平均瀏覽時長：{stats.avg_view_duration_sec}秒
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trend Chart */}
      {trends.length > 0 && (
        <div className="max-w-7xl mx-auto mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                曝光趨勢圖
              </CardTitle>
              <CardDescription>
                追蹤您的餐廳曝光、詳細頁瀏覽與收藏數據變化
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('zh-TW')}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="impressions" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="總曝光"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="detail_views" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    name="詳細頁"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="favorites" 
                    stroke="hsl(var(--chart-3))" 
                    strokeWidth={2}
                    name="收藏數"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Behavior Analysis */}
      {stats && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>用戶互動行為</CardTitle>
              <CardDescription>了解用戶如何與您的餐廳資訊互動</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">收藏率</span>
                <span className="font-bold text-lg">{stats.save_rate}%</span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.min(stats.save_rate, 100)}%` }}
                />
              </div>

              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-muted-foreground">喜歡率（滑卡）</span>
                <span className="font-bold text-lg">{stats.like_rate}%</span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${Math.min(stats.like_rate, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>外部連結點擊分佈</CardTitle>
              <CardDescription>用戶最常點擊哪些外部連結</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {totalExternalClicks > 0 ? (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>📞 電話</span>
                      <span className="font-semibold">
                        {stats.phone_clicks} ({((stats.phone_clicks / totalExternalClicks) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${(stats.phone_clicks / totalExternalClicks) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>🗺️ 地圖</span>
                      <span className="font-semibold">
                        {stats.map_clicks} ({((stats.map_clicks / totalExternalClicks) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${(stats.map_clicks / totalExternalClicks) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>📖 菜單</span>
                      <span className="font-semibold">
                        {stats.menu_clicks} ({((stats.menu_clicks / totalExternalClicks) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 transition-all"
                        style={{ width: `${(stats.menu_clicks / totalExternalClicks) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>🌐 官網</span>
                      <span className="font-semibold">
                        {stats.website_clicks} ({((stats.website_clicks / totalExternalClicks) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 transition-all"
                        style={{ width: `${(stats.website_clicks / totalExternalClicks) * 100}%` }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  暫無外部連結點擊數據
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
