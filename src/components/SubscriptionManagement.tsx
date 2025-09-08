import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, Crown, CreditCard, AlertTriangle } from 'lucide-react';
import { usePremium } from '@/hooks/usePremium';
import { toast } from 'sonner';

export const SubscriptionManagement = () => {
  const { 
    isPremium, 
    subscription, 
    daysUntilExpiry, 
    cancelSubscription, 
    loading, 
    refreshSubscription 
  } = usePremium();
  const [cancelLoading, setCancelLoading] = useState(false);

  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    try {
      await cancelSubscription();
      toast.success('訂閱已取消');
      await refreshSubscription();
    } catch (error) {
      toast.error('取消訂閱失敗');
    } finally {
      setCancelLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">活躍</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">已取消</Badge>;
      case 'expired':
        return <Badge variant="secondary">已過期</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSubscriptionTypeBadge = (type: string) => {
    switch (type) {
      case 'premium':
        return (
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-yellow-500" />
            <span className="font-medium">Premium</span>
          </div>
        );
      case 'basic':
        return <span>Basic</span>;
      default:
        return <span>{type}</span>;
    }
  };

  if (!isPremium || !subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            訂閱管理
          </CardTitle>
          <CardDescription>管理您的訂閱和付款設定</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground">您目前沒有活躍的訂閱</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          訂閱管理
        </CardTitle>
        <CardDescription>管理您的訂閱和付款設定</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Subscription */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {getSubscriptionTypeBadge(subscription.subscription_type)}
                {getStatusBadge(subscription.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                開始日期：{formatDate(subscription.started_at)}
              </p>
            </div>
          </div>

          {/* Expiry Information */}
          {subscription.expires_at && (
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  到期日期：{formatDate(subscription.expires_at)}
                </p>
                {daysUntilExpiry !== null && (
                  <p className="text-sm text-muted-foreground">
                    {daysUntilExpiry > 0 
                      ? `還有 ${daysUntilExpiry} 天到期`
                      : '已過期'
                    }
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Cancellation Warning */}
          {subscription.status === 'cancelled' && subscription.expires_at && (
            <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  訂閱已取消
                </p>
                <p className="text-sm text-yellow-700">
                  您可以繼續使用 Premium 功能直到 {formatDate(subscription.expires_at)}
                </p>
              </div>
            </div>
          )}

          {/* Auto Renewal */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">自動續費</p>
              <p className="text-sm text-muted-foreground">
                {subscription.auto_renew ? '已啟用' : '已停用'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {subscription.status === 'active' && (
          <div className="pt-4 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={cancelLoading}>
                  取消訂閱
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>確定要取消訂閱嗎？</AlertDialogTitle>
                  <AlertDialogDescription>
                    取消訂閱後，您將失去所有 Premium 功能的存取權限。
                    {subscription.expires_at && (
                      <>您可以繼續使用 Premium 功能直到 {formatDate(subscription.expires_at)}。</>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelSubscription}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={cancelLoading}
                  >
                    {cancelLoading ? '處理中...' : '確定取消'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* Refresh Button */}
        <div className="pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={refreshSubscription}
            disabled={loading}
            className="w-full"
          >
            {loading ? '更新中...' : '重新整理訂閱狀態'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};