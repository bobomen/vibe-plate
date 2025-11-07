import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Megaphone } from 'lucide-react';

export default function RestaurantOwnerPromotions() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Megaphone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>廣告投放管理</CardTitle>
              <CardDescription>即將推出</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            此功能正在開發中，預計將包含：
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>優惠券創建與管理</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>廣告投放數據分析</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>用戶領取與核銷追蹤</span>
            </li>
          </ul>
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">預計上線時間：Phase 3</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
