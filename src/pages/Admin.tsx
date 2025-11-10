import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Upload, CheckCircle, XCircle, AlertCircle, TestTube, Database } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsDashboard } from '@/components/Analytics/AnalyticsDashboard';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [isCreatingTestData, setIsCreatingTestData] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

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
          navigate('/app/');
          return;
        }

        setIsAdmin(true);
        await loadStats();
        await loadRestaurants();
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/app/');
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

  // 測試餐廳數據 - 包含明確的飲食選項特徵
  const TEST_RESTAURANTS = [
    { name: "素食天地", address: "台北市大安區復興南路一段100號", expectedVegetarian: true },
    { name: "純素蔬食館", address: "台北市信義區信義路五段7號", expectedVegan: true },
    { name: "清真牛肉麵", address: "新北市中和區中山路二段200號", expectedHalal: true },
    { name: "印度咖哩屋", address: "台北市中山區南京東路二段50號", expectedVegetarian: true },
    { name: "寬心園精緻蔬食", address: "台北市松山區南京東路五段123號", expectedVegetarian: true },
    { name: "清真阿拉伯料理", address: "台北市大同區重慶北路一段30號", expectedHalal: true },
  ];

  const createTestRestaurants = async () => {
    setIsCreatingTestData(true);
    try {
      const testData = TEST_RESTAURANTS.map(r => ({
        name: r.name,
        address: r.address,
        lat: 25.033 + Math.random() * 0.1,
        lng: 121.565 + Math.random() * 0.1,
        cuisine_type: "其他",
        status: "active",
        google_rating: 4.0 + Math.random(),
        google_reviews_count: Math.floor(Math.random() * 1000),
      }));

      const { error } = await supabase
        .from('restaurants')
        .insert(testData);

      if (error) throw error;

      toast({
        title: '創建成功',
        description: `已創建 ${TEST_RESTAURANTS.length} 家測試餐廳`,
      });

      await loadStats();
      await loadRestaurants();
    } catch (error) {
      console.error('Create test data error:', error);
      toast({
        title: '創建測試數據失敗',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsCreatingTestData(false);
    }
  };

  const runTestClassification = async () => {
    setBatchProcessing(true);
    setTestResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('batch-classify-restaurants', {
        body: { batchSize: 20, offset: 0 }
      });

      if (error) throw error;

      if (data?.results) {
        setTestResults(data.results);
        toast({
          title: '測試完成',
          description: `成功: ${data.successCount}, 失敗: ${data.failCount}`,
        });
        await loadStats();
        await loadRestaurants();
      }
    } catch (error) {
      console.error('Test classification error:', error);
      toast({
        title: '測試失敗',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setBatchProcessing(false);
    }
  };

  const getDietaryBadges = (options: any) => {
    const badges = [];
    if (options?.vegetarian) badges.push({ label: "素食", color: "bg-green-500" });
    if (options?.vegan) badges.push({ label: "純素", color: "bg-emerald-600" });
    if (options?.halal) badges.push({ label: "清真", color: "bg-blue-500" });
    if (options?.gluten_free) badges.push({ label: "無麩質", color: "bg-orange-500" });
    return badges;
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
        <h1 className="text-3xl font-bold">管理後台</h1>
        <Button onClick={() => navigate('/app/')}>返回首頁</Button>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analytics">產品分析</TabsTrigger>
          <TabsTrigger value="restaurants">餐廳管理</TabsTrigger>
          <TabsTrigger value="testing">AI 測試</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-6">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="restaurants" className="space-y-6 mt-6">

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
        </TabsContent>

        <TabsContent value="testing" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                AI 飲食選項分類測試
              </CardTitle>
              <CardDescription>
                測試改進後的 AI Prompt 對飲食選項（素食、純素、清真、無麩質）的識別準確率
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>測試步驟：</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                    <li>點擊「創建測試餐廳」添加 6 家包含明確飲食特徵的測試餐廳</li>
                    <li>點擊「運行 AI 分類測試」讓 AI 分析所有餐廳的飲食選項</li>
                    <li>查看下方結果，驗證 AI 是否正確識別了素食、純素、清真等選項</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="flex gap-4">
                <Button 
                  onClick={createTestRestaurants}
                  disabled={isCreatingTestData}
                  variant="outline"
                >
                  {isCreatingTestData ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      創建中...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      創建測試餐廳
                    </>
                  )}
                </Button>

                <Button 
                  onClick={runTestClassification}
                  disabled={batchProcessing}
                >
                  {batchProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      測試中...
                    </>
                  ) : (
                    <>
                      <TestTube className="mr-2 h-4 w-4" />
                      運行 AI 分類測試
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>測試結果詳情</CardTitle>
                <CardDescription>檢查 AI 是否正確識別飲食選項</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testResults.map((result: any) => (
                    <div 
                      key={result.id} 
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{result.name}</h3>
                            {result.success ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                          
                          {result.success && result.classification && (
                            <>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="secondary">
                                  {result.classification.cuisine_type}
                                </Badge>
                                {getDietaryBadges(result.classification.dietary_options).map((badge: any, i: number) => (
                                  <Badge key={i} className={`${badge.color} text-white`}>
                                    {badge.label}
                                  </Badge>
                                ))}
                              </div>
                              
                              {result.classification.dietary_reasoning && (
                                <p className="text-sm text-muted-foreground">
                                  💭 {result.classification.dietary_reasoning}
                                </p>
                              )}

                              <div className="text-xs text-muted-foreground">
                                置信度: {(result.classification.confidence * 100).toFixed(0)}%
                              </div>
                            </>
                          )}

                          {result.error && (
                            <p className="text-sm text-red-600">{result.error}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}