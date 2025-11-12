import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, Settings, AlertCircle } from 'lucide-react';
import { useAdSubscription, AdSubscription } from '@/hooks/useAdSubscription';
import { ModificationLimits } from '@/types/subscriptionModification';
import { UpgradeSubscriptionDialog } from './UpgradeSubscriptionDialog';
import { DowngradeSubscriptionDialog } from './DowngradeSubscriptionDialog';
import { ModifyCouponsDialog } from './ModifyCouponsDialog';

interface SubscriptionManagementActionsProps {
  subscription: AdSubscription;
  onRefresh: () => void;
}

export function SubscriptionManagementActions({
  subscription,
  onRefresh,
}: SubscriptionManagementActionsProps) {
  const { checkModificationLimits } = useAdSubscription(subscription.restaurant_id);
  const [limits, setLimits] = useState<ModificationLimits | null>(null);
  const [limitsLoading, setLimitsLoading] = useState(true);
  
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [showModifyCouponsDialog, setShowModifyCouponsDialog] = useState(false);
  
  useEffect(() => {
    async function loadLimits() {
      setLimitsLoading(true);
      try {
        const result = await checkModificationLimits();
        setLimits(result);
      } catch (err) {
        console.error('Failed to check limits:', err);
      } finally {
        setLimitsLoading(false);
      }
    }
    loadLimits();
  }, [checkModificationLimits]);
  
  if (limitsLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        檢查可用操作...
      </div>
    );
  }
  
  if (!limits) {
    return null;
  }
  
  return (
    <>
      <p className="text-sm font-medium mb-3">訂閱管理</p>
      
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {/* 升級 - 總是可用 */}
          {limits.canUpgrade && (
            <Button 
              variant="default" 
              size="sm"
              onClick={() => setShowUpgradeDialog(true)}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              升級方案
            </Button>
          )}
          
          {/* 調整優惠券 - 條件性顯示 */}
          {subscription.subscription_type === 'hybrid' && limits.canModifyCoupons && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowModifyCouponsDialog(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              調整優惠券
              {limits.modificationTier === 'limited' && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  有限編輯
                </Badge>
              )}
            </Button>
          )}
          
          {/* 降級 - 需滿足條件 */}
          {limits.canDowngrade && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowDowngradeDialog(true)}
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              降級方案
            </Button>
          )}
        </div>
        
        {/* 限制提示 */}
        {limits.restrictions.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs space-y-1">
              {limits.restrictions.map((r, i) => (
                <div key={i}>• {r}</div>
              ))}
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      {/* 對話框 */}
      <UpgradeSubscriptionDialog 
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        subscription={subscription}
        onSuccess={onRefresh}
      />
      
      <DowngradeSubscriptionDialog 
        open={showDowngradeDialog}
        onOpenChange={setShowDowngradeDialog}
        subscription={subscription}
        limits={limits}
        onSuccess={onRefresh}
      />
      
      <ModifyCouponsDialog 
        open={showModifyCouponsDialog}
        onOpenChange={setShowModifyCouponsDialog}
        subscription={subscription}
        limits={limits}
        onSuccess={onRefresh}
      />
    </>
  );
}
