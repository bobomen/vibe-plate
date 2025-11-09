import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, Eye, MousePointerClick, Heart, Star, Info } from 'lucide-react';
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
import type { EfficiencyScore } from '@/types/restaurantOwner';
import { getHealthScoreLevel, getHealthScoreColor, getHealthScoreBgColor } from '@/types/restaurantOwner';
import { cn } from '@/lib/utils';

interface EfficiencyScoreCardProps {
  data: EfficiencyScore;
}

const scoreComponents = [
  { key: 'exposure_score', label: '曝光表現', icon: Eye, max: 25 },
  { key: 'engagement_score', label: '互動表現', icon: MousePointerClick, max: 25 },
  { key: 'favorite_score', label: '收藏表現', icon: Heart, max: 25 },
  { key: 'quality_score', label: '品質表現', icon: Star, max: 25 },
] as const;

export function EfficiencyScoreCard({ data }: EfficiencyScoreCardProps) {
  const level = getHealthScoreLevel(data.total_score);
  const textColor = getHealthScoreColor(data.total_score);
  const bgColor = getHealthScoreBgColor(data.total_score);

  const levelLabels = {
    excellent: '優秀',
    good: '良好',
    fair: '普通',
    poor: '待改進',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-lg">曝光效率評分</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>曝光效率評分計算邏輯</DialogTitle>
                    <DialogDescription>
                      了解您的餐廳在曝光轉化的各個環節表現如何
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">📈 總分說明（滿分 100）</h4>
                      <p className="text-muted-foreground mb-2">
                        曝光效率評分衡量您的餐廳從曝光到轉化的整體健康度，由四個維度組成：
                      </p>
                      <ul className="space-y-1 text-muted-foreground ml-4">
                        <li>• <span className="font-medium text-green-600 dark:text-green-400">85-100 分</span> - 優秀：表現出色</li>
                        <li>• <span className="font-medium text-blue-600 dark:text-blue-400">70-84 分</span> - 良好：表現穩定</li>
                        <li>• <span className="font-medium text-yellow-600 dark:text-yellow-400">50-69 分</span> - 普通：有改進空間</li>
                        <li>• <span className="font-medium text-red-600 dark:text-red-400">0-49 分</span> - 待改進：需要優化</li>
                      </ul>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        曝光表現（25 分）
                      </h4>
                      <ul className="space-y-2 text-muted-foreground ml-4">
                        <li>• <span className="font-medium text-foreground">計算方式：</span>
                          根據過去 30 天的總曝光次數（impressions）評分
                        </li>
                        <li>• <span className="font-medium text-foreground">評分標準：</span>
                          <ul className="ml-4 mt-1 space-y-1">
                            <li>- 1,000+ 次：25 分（滿分）</li>
                            <li>- 500-999 次：20 分</li>
                            <li>- 100-499 次：15 分</li>
                            <li>- 50-99 次：10 分</li>
                            <li>- 50 次以下：按比例計分</li>
                          </ul>
                        </li>
                        <li>• <span className="font-medium text-foreground">提升方法：</span>
                          提高競爭力排名、完善餐廳資訊
                        </li>
                      </ul>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <MousePointerClick className="h-4 w-4" />
                        互動表現（25 分）
                      </h4>
                      <ul className="space-y-2 text-muted-foreground ml-4">
                        <li>• <span className="font-medium text-foreground">計算方式：</span>
                          點擊率（CTR）= 詳細頁瀏覽數 ÷ 曝光次數 × 100%
                        </li>
                        <li>• <span className="font-medium text-foreground">評分標準：</span>
                          <ul className="ml-4 mt-1 space-y-1">
                            <li>- 15%+ CTR：25 分（滿分）</li>
                            <li>- 10-15% CTR：20 分</li>
                            <li>- 5-10% CTR：15 分</li>
                            <li>- 3-5% CTR：10 分</li>
                            <li>- 3% 以下：按比例計分</li>
                          </ul>
                        </li>
                        <li>• <span className="font-medium text-foreground">提升方法：</span>
                          優化照片品質、確保餐廳名稱和標籤吸引人
                        </li>
                      </ul>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        收藏表現（25 分）
                      </h4>
                      <ul className="space-y-2 text-muted-foreground ml-4">
                        <li>• <span className="font-medium text-foreground">計算方式：</span>
                          收藏率 = 收藏次數 ÷ 曝光次數 × 100%
                        </li>
                        <li>• <span className="font-medium text-foreground">評分標準：</span>
                          <ul className="ml-4 mt-1 space-y-1">
                            <li>- 5%+ 收藏率：25 分（滿分）</li>
                            <li>- 3-5% 收藏率：20 分</li>
                            <li>- 2-3% 收藏率：15 分</li>
                            <li>- 1-2% 收藏率：10 分</li>
                            <li>- 1% 以下：按比例計分</li>
                          </ul>
                        </li>
                        <li>• <span className="font-medium text-foreground">提升方法：</span>
                          提供獨特賣點、優惠資訊，鼓勵收藏
                        </li>
                      </ul>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        品質表現（25 分）
                      </h4>
                      <ul className="space-y-2 text-muted-foreground ml-4">
                        <li>• <span className="font-medium text-foreground">計算方式：</span>
                          綜合多項品質指標的加權平均
                        </li>
                        <li>• <span className="font-medium text-foreground">包含指標：</span>
                          <ul className="ml-4 mt-1 space-y-1">
                            <li>- <strong>平均瀏覽時長：</strong>用戶在詳細頁停留時間（30秒+ 為佳）</li>
                            <li>- <strong>互動深度：</strong>電話、地圖、菜單、網站點擊次數</li>
                            <li>- <strong>喜歡率：</strong>在滑卡中被喜歡的比例</li>
                            <li>- <strong>資料完整度：</strong>照片、營業時間、聯絡資訊等</li>
                          </ul>
                        </li>
                        <li>• <span className="font-medium text-foreground">評分標準：</span>
                          根據各指標達標情況綜合評分
                        </li>
                        <li>• <span className="font-medium text-foreground">提升方法：</span>
                          完善餐廳資訊、上傳高品質照片、提供完整菜單
                        </li>
                      </ul>
                    </div>

                    <div className="border-t pt-4 bg-amber-50 dark:bg-amber-950 p-3 rounded-lg">
                      <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                        🚀 即將推出
                      </h4>
                      <p className="text-amber-900 dark:text-amber-100 text-xs">
                        <strong>留言互動評分（預留）：</strong>未來將加入顧客留言回覆率、留言品質等指標
                      </p>
                    </div>

                    <div className="border-t pt-4 bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        💡 整體優化建議
                      </h4>
                      <ul className="space-y-1 text-blue-900 dark:text-blue-100 text-xs ml-4">
                        <li>• 專注提升分數最低的維度</li>
                        <li>• 定期更新照片和資訊保持新鮮感</li>
                        <li>• 觀察趨勢圖找出優化時機</li>
                        <li>• 與同區域、同菜系餐廳對比學習</li>
                      </ul>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <CardDescription>綜合健康度評估</CardDescription>
          </div>
          <div className="text-right">
            <div className={cn("text-4xl font-bold", textColor)}>
              {data.total_score}
            </div>
            <div className={cn("text-xs font-medium px-2 py-1 rounded-full mt-1", bgColor, textColor)}>
              {levelLabels[level]}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {scoreComponents.map(({ key, label, icon: Icon, max }) => {
          const score = data[key];
          const percentage = (score / max) * 100;
          
          return (
            <div key={key} className="space-y-1.5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {score}/{max}
                </span>
              </div>
              <Progress value={percentage} className="h-1.5" />
            </div>
          );
        })}

        {/* 預留：留言功能提示 */}
        {data.comment_score === 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">
              💬 即將推出：留言互動功能，讓您更瞭解顧客反饋
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
