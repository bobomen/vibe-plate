import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, Eye, MousePointerClick, Heart, Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
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
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              曝光效率評分
            </CardTitle>
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
