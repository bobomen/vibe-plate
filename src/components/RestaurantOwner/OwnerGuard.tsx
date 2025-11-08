import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useRestaurantOwner } from '@/hooks/useRestaurantOwner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, AlertCircle } from 'lucide-react';

interface OwnerGuardProps {
  children: ReactNode;
}

export function OwnerGuard({ children }: OwnerGuardProps) {
  const { loading, isOwner, error } = useRestaurantOwner();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-center">载入错误</CardTitle>
            <CardDescription className="text-center">
              无法验证您的餐厅老板身份
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()}>重新加载</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-center">认领您的餐厅</CardTitle>
            <CardDescription className="text-center">
              您还没有认领任何餐厅
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              认领您的餐厅以访问餐厅管理后台，管理餐厅信息、查看数据分析、设置优惠活动等。
            </p>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <a href="/claim-restaurant">立即认领餐厅</a>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href="/">返回首页</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
