import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { CompetitivenessMetrics } from '@/types/restaurantOwner';

interface CompetitivenessCardProps {
  data: CompetitivenessMetrics;
  district: string;
  cuisineType: string;
}

export function CompetitivenessCard({ data, district, cuisineType }: CompetitivenessCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
              競爭力指數
            </CardTitle>
            <CardDescription>在區域和菜系中的排名表現</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 區域排名 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-foreground">
              {district} 區域排名
            </span>
            <span className="text-2xl font-bold text-primary">
              #{data.district_rank}
            </span>
          </div>
          <Progress value={data.district_percentile} className="h-2" />
          <p className="text-xs text-muted-foreground">
            超越 {data.district_percentile}% 的餐廳 
            （共 {data.district_total} 家）
          </p>
        </div>

        {/* 菜系排名 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-foreground">
              {cuisineType} 菜系排名
            </span>
            <span className="text-2xl font-bold text-primary">
              #{data.cuisine_rank}
            </span>
          </div>
          <Progress value={data.cuisine_percentile} className="h-2" />
          <p className="text-xs text-muted-foreground">
            超越 {data.cuisine_percentile}% 的餐廳 
            （共 {data.cuisine_total} 家）
          </p>
        </div>

        {/* 提示信息 */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-900 dark:text-blue-100">
            排名越高，您的餐廳在滑卡推薦中出現的機率越大
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
