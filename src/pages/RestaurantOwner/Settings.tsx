import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings as SettingsIcon } from 'lucide-react';

export default function RestaurantOwnerSettings() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <SettingsIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>個人設定</CardTitle>
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
              <span>業者帳號資料管理</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>通知偏好設定</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>多餐廳切換管理</span>
            </li>
          </ul>
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">預計上線時間：Phase 2</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
