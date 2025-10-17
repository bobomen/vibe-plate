import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, TrendingUp, Heart, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useMonthlyReviewStats } from '@/hooks/useMonthlyReviewStats';

const MonthlyReview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentMonth = new Date();
  currentMonth.setDate(1); // Set to first day of month
  
  const { data: stats, isLoading, error, refetch } = useMonthlyReviewStats(currentMonth);

  // If user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 p-4">
        <Card>
          <CardContent className="p-6">
            <Alert>
              <AlertTitle>需要登入</AlertTitle>
              <AlertDescription>
                請先登入才能查看月度回顧
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => navigate('/auth')} 
              className="w-full mt-4"
            >
              前往登入
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If there's an error loading stats
  if (error) {
    return (
      <div className="min-h-screen bg-background pb-20 p-4">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/profile')}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold">月度回顧</h1>
        </div>
        
        <Alert variant="destructive">
          <AlertTitle>無法載入統計數據</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>請檢查網路連線或稍後再試</p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              重試
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/profile')}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月美食回顧
            </h1>
            <p className="text-sm text-muted-foreground">你這個月的餐廳探險統計</p>
          </div>
        </div>

        {/* Stats Summary */}
        {isLoading ? (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
                <div className="h-6 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Main Stats Card */}
            <Card className="mb-6 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  本月統計
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-3xl font-bold text-primary">{stats?.totalSwipes || 0}</p>
                    <p className="text-sm text-muted-foreground">探索餐廳數量</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-bold text-primary">{stats?.likePercentage || 0}%</p>
                    <p className="text-sm text-muted-foreground">喜歡比例</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-bold text-primary">{stats?.totalFavorites || 0}</p>
                    <p className="text-sm text-muted-foreground">收藏最愛</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-bold text-primary">{stats?.totalLikes || 0}</p>
                    <p className="text-sm text-muted-foreground">喜歡的餐廳</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* District Card */}
            {stats?.mostVisitedDistrict && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5" />
                    最常探索的地區
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">{stats.mostVisitedDistrict}</p>
                </CardContent>
              </Card>
            )}

            {/* Cuisine Type Card */}
            {stats?.topCuisineType && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Heart className="h-5 w-5" />
                    最愛的料理類型
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">{stats.topCuisineType}</p>
                </CardContent>
              </Card>
            )}

            {/* Test Info Card */}
            <Card className="mb-6 border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">📊 測試版本</CardTitle>
                <CardDescription>
                  這是 Phase 1.1 測試版本，確保基礎功能正常運作
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>✅ 頁面路由正常</p>
                <p>✅ 統計數據載入</p>
                <p>✅ 錯誤處理機制</p>
                <p className="text-xs pt-2 border-t">
                  下個階段將加入照片上傳和美術圖生成功能
                </p>
              </CardContent>
            </Card>

            {/* Empty State */}
            {stats && stats.totalSwipes === 0 && stats.totalFavorites === 0 && (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="text-4xl">🍽️</div>
                  <div>
                    <h3 className="font-semibold mb-2">還沒有數據</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      開始滑卡探索餐廳，下個月就能看到你的美食統計了！
                    </p>
                    <Button onClick={() => navigate('/app')}>
                      開始探索餐廳
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MonthlyReview;
