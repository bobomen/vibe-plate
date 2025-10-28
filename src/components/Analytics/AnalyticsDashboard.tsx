import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Users, Heart, UserPlus, Target, CheckCircle2, AlertCircle } from 'lucide-react';
import { useProductAnalytics } from '@/hooks/useProductAnalytics';
import { Loader2 } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const AnalyticsDashboard = () => {
  const {
    dauData,
    retentionData,
    funnelData,
    hypothesesData,
    engagementData,
    geoData,
    isLoading,
    currentDAU,
    dauGrowth,
    avgD7Retention,
  } = useProductAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">今日活躍用戶 (DAU)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentDAU}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {dauGrowth >= 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+{dauGrowth}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">{dauGrowth}%</span>
                </>
              )}
              vs 昨日
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">D7 留存率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgD7Retention}%</div>
            <p className="text-xs text-muted-foreground mt-1">平均 7 日留存</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Like 率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagementData?.like_rate || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {engagementData?.total_likes || 0} / {engagementData?.total_swipes || 0} 滑卡
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">群組採用率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funnelData?.group_adoption_rate || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {funnelData?.users_in_groups || 0} / {funnelData?.total_swipers || 0} 用戶
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hypothesis Validation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            假設驗證進度
          </CardTitle>
          <CardDescription>30 天內需達成的關鍵指標</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {hypothesesData?.map((hypothesis) => {
              const progress = (hypothesis.current_value / hypothesis.target_value) * 100;
              const isValidated = hypothesis.status === 'validated';
              
              return (
                <div key={hypothesis.hypothesis_id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isValidated ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                      )}
                      <span className="text-sm font-medium">{hypothesis.hypothesis_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={isValidated ? "default" : "outline"}>
                        {hypothesis.current_value} / {hypothesis.target_value}
                      </Badge>
                      <Badge variant={isValidated ? "default" : "secondary"}>
                        {hypothesis.status === 'validated' ? '✅ 已驗證' : '🔄 測試中'}
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isValidated ? 'bg-green-500' : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* DAU Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            每日活躍用戶趨勢 (30 天)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dauData?.slice().reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="activity_date" tickFormatter={(date) => new Date(date).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="dau" stroke="#8884d8" name="DAU" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Funnel & Retention */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              用戶轉換漏斗 (30 天)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { name: '滑卡用戶', value: funnelData?.total_swipers || 0 },
                  { name: '有收藏', value: funnelData?.users_with_favorites || 0 },
                  { name: '加入群組', value: funnelData?.users_in_groups || 0 },
                  { name: '創建回顧', value: funnelData?.users_with_reviews || 0 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              地理分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={geoData?.slice(0, 5)}
                  dataKey="user_count"
                  nameKey="city"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.city} (${entry.percentage}%)`}
                >
                  {geoData?.slice(0, 5).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>參與度指標 (30 天)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">總滑卡數</p>
              <p className="text-2xl font-bold">{engagementData?.total_swipes || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">平均每人滑卡</p>
              <p className="text-2xl font-bold">{engagementData?.avg_swipes_per_user || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Like 率</p>
              <p className="text-2xl font-bold">{engagementData?.like_rate || 0}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
