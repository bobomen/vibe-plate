import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface SuccessStepProps {
  restaurantName: string;
  onGoToDashboard: () => void;
}

export function SuccessStep({ restaurantName, onGoToDashboard }: SuccessStepProps) {
  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardContent className="pt-12 pb-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">認領成功！</h2>
            <p className="text-muted-foreground">
              恭喜您成功認領 <span className="font-semibold text-foreground">{restaurantName}</span>
            </p>
          </div>

          <div className="pt-4 space-y-3">
            <Button onClick={onGoToDashboard} className="w-full" size="lg">
              前往餐廳管理後台
            </Button>
          </div>

          <div className="pt-4 space-y-2 text-sm text-muted-foreground">
            <p>現在您可以：</p>
            <ul className="space-y-1 text-left max-w-sm mx-auto">
              <li>• 更新餐廳資訊和照片</li>
              <li>• 設置優惠券和促銷活動</li>
              <li>• 查看餐廳數據分析</li>
              <li>• 提升餐廳曝光度</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
