import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, TrendingUp, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
          <CardTitle className="text-lg">競爭力指數</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Info className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>競爭力指數計算邏輯</DialogTitle>
                <DialogDescription>
                  了解您的餐廳如何在競爭中脫穎而出
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">📊 什麼是競爭力指數？</h4>
                  <p className="text-muted-foreground">
                    競爭力指數衡量您的餐廳在同區域和同菜系餐廳中的相對表現。
                    排名越高，在用戶滑卡時被推薦的機率越大。
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-foreground mb-3">🏆 區域排名</h4>
                  <ul className="space-y-2 text-muted-foreground ml-4">
                    <li>• <span className="font-medium text-foreground">計算方式：</span>
                      根據過去 30 天的曝光次數（view_count）在同區域餐廳中排序
                    </li>
                    <li>• <span className="font-medium text-foreground">百分比計算：</span>
                      （總餐廳數 - 您的排名）÷ 總餐廳數 × 100%
                    </li>
                    <li>• <span className="font-medium text-foreground">範例：</span>
                      在 100 家餐廳中排名第 10，則超越 90% 的餐廳
                    </li>
                  </ul>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-foreground mb-3">🍜 菜系排名</h4>
                  <ul className="space-y-2 text-muted-foreground ml-4">
                    <li>• <span className="font-medium text-foreground">計算方式：</span>
                      根據過去 30 天的曝光次數在同菜系餐廳中排序
                    </li>
                    <li>• <span className="font-medium text-foreground">用途：</span>
                      當用戶選擇特定菜系時，您的排名決定出現順序
                    </li>
                    <li>• <span className="font-medium text-foreground">提升方法：</span>
                      增加餐廳互動（詳細頁瀏覽、收藏等）可提升曝光次數
                    </li>
                  </ul>
                </div>

                <div className="border-t pt-4 bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    💡 如何提升競爭力？
                  </h4>
                  <ul className="space-y-1 text-blue-900 dark:text-blue-100 text-xs ml-4">
                    <li>• 保持餐廳資訊完整且最新</li>
                    <li>• 鼓勵顧客收藏和分享</li>
                    <li>• 提升曝光效率評分（互動率、品質表現）</li>
                    <li>• 定期登入查看並優化數據</li>
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>在區域和菜系中的排名表現</CardDescription>
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
