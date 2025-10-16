import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

interface ClassificationStats {
  total: number;
  classified: number;
  unclassified: number;
  byType: { [key: string]: number };
}

interface Restaurant {
  id: string;
  name: string;
  address: string;
  cuisine_type: string;
  dietary_options: any;
  ai_classified_at: string | null;
  ai_confidence: number | null;
}

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ClassificationStats | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [importData, setImportData] = useState('');

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user?.id) {
        navigate('/auth');
        return;
      }

      try {
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        if (error) throw error;

        if (!data) {
          toast({
            title: '權限不足',
            description: '您沒有管理員權限',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }

        setIsAdmin(true);
        await loadStats();
        await loadRestaurants();
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user, navigate, toast]);

  const loadStats = async () => {
    try {
      const { data: restaurants, error } = await supabase
        .from('restaurants')
        .select('cuisine_type, ai_classified_at');

      if (error) throw error;

      const stats: ClassificationStats = {
        total: restaurants.length,
        classified: restaurants.filter(r => r.ai_classified_at).length,
        unclassified: restaurants.filter(r => !r.ai_classified_at).length,
        byType: {},
      };

      restaurants.forEach(r => {
        stats.byType[r.cuisine_type] = (stats.byType[r.cuisine_type] || 0) + 1;
      });

      setStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: '載入失敗',
        description: '無法載入統計資料',
        variant: 'destructive',
      });
    }
  };

  const loadRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, address, cuisine_type, dietary_options, ai_classified_at, ai_confidence')
        .or('cuisine_type.eq.其他,ai_classified_at.is.null')
        .order('name')
        .limit(50);

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error('Error loading restaurants:', error);
    }
  };

  const handleClassifySingle = async (restaurant: Restaurant) => {
    try {
      const { data, error } = await supabase.functions.invoke('classify-restaurant-cuisine', {
        body: {
          restaurantId: restaurant.id,
          name: restaurant.name,
          address: restaurant.address,
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: '分類成功',
          description: `${restaurant.name} → ${data.classification.cuisine_type}`,
        });
        await loadStats();
        await loadRestaurants();
      }
    } catch (error) {
      console.error('Classification error:', error);
      toast({
        title: '分類失敗',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleBatchClassify = async () => {
    setBatchProcessing(true);
    setBatchProgress(0);

    try {
      const batchSize = 10;
      let offset = 0;
      let totalProcessed = 0;

      while (true) {
        const { data, error } = await supabase.functions.invoke('batch-classify-restaurants', {
          body: { batchSize, offset }
        });

        if (error) throw error;

        if (data.processed === 0) {
          break; // No more restaurants to process
        }

        totalProcessed += data.successCount;
        offset += batchSize;

        // Update progress
        const progress = Math.min((totalProcessed / (stats?.unclassified || 1)) * 100, 100);
        setBatchProgress(progress);

        toast({
          title: '批次處理中',
          description: `已處理 ${totalProcessed} 間餐廳`,
        });

        // Add delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      toast({
        title: '批次處理完成',
        description: `總共處理 ${totalProcessed} 間餐廳`,
      });

      await loadStats();
      await loadRestaurants();
    } catch (error) {
      console.error('Batch classification error:', error);
      toast({
        title: '批次處理失敗',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setBatchProcessing(false);
      setBatchProgress(0);
    }
  };

  const handleImport = async () => {
    try {
      const restaurants = JSON.parse(importData);

      if (!Array.isArray(restaurants)) {
        throw new Error('匯入資料必須是陣列格式');
      }

      toast({
        title: '開始匯入',
        description: `準備匯入 ${restaurants.length} 間餐廳`,
      });

      const { data, error } = await supabase.functions.invoke('import-restaurants', {
        body: { restaurants }
      });

      if (error) throw error;

      toast({
        title: '匯入完成',
        description: `成功: ${data.successCount}, 失敗: ${data.failCount}`,
      });

      setImportData('');
      await loadStats();
      await loadRestaurants();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: '匯入失敗',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">餐廳管理後台</h1>
        <Button onClick={() => navigate('/')}>返回首頁</Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>總餐廳數</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>已分類</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats?.classified || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>未分類</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats?.unclassified || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Cuisine Types Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>菜系分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {stats?.byType && Object.entries(stats.byType).map(([type, count]) => (
              <Badge key={type} variant="outline" className="text-sm">
                {type}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Batch Actions */}
      <Card>
        <CardHeader>
          <CardTitle>批次操作</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button
              onClick={handleBatchClassify}
              disabled={batchProcessing || (stats?.unclassified || 0) === 0}
              className="w-full"
            >
              {batchProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  批次分類中...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  批次分類未分類餐廳 ({stats?.unclassified || 0})
                </>
              )}
            </Button>

            {batchProcessing && (
              <div className="mt-2">
                <Progress value={batchProgress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-1">
                  進度: {Math.round(batchProgress)}%
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">匯入餐廳資料 (JSON 格式)</label>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder='[{"name": "餐廳名稱", "address": "地址", "lat": 25.0330, "lng": 121.5654, ...}]'
              className="w-full h-32 p-2 border rounded-md font-mono text-sm"
            />
            <Button
              onClick={handleImport}
              disabled={!importData.trim()}
              variant="outline"
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              匯入餐廳資料
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Restaurant List */}
      <Card>
        <CardHeader>
          <CardTitle>未分類/待確認餐廳 (前50筆)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                onClick={() => setSelectedRestaurant(restaurant)}
              >
                <div className="flex-1">
                  <div className="font-medium">{restaurant.name}</div>
                  <div className="text-sm text-muted-foreground">{restaurant.address}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{restaurant.cuisine_type}</Badge>
                    {restaurant.ai_classified_at ? (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        已分類 ({Math.round((restaurant.ai_confidence || 0) * 100)}%)
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        未分類
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClassifySingle(restaurant);
                  }}
                >
                  重新分類
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}