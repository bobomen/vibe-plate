import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAdSubscription, AdSubscription } from '@/hooks/useAdSubscription';
import { ModificationLimits } from '@/types/subscriptionModification';
import { useToast } from '@/hooks/use-toast';
import { TrendingDown, AlertTriangle } from 'lucide-react';

interface DowngradeSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: AdSubscription;
  limits: ModificationLimits;
  onSuccess: () => void;
}

export function DowngradeSubscriptionDialog({
  open,
  onOpenChange,
  subscription,
  limits,
  onSuccess,
}: DowngradeSubscriptionDialogProps) {
  const { downgradeSubscription } = useAdSubscription(subscription.restaurant_id);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  
  const minAmount = Math.ceil(limits.minPlanAmount);
  const priceDiff = newAmount ? subscription.plan_amount - Number(newAmount) : 0;
  const newCouponBudget = newAmount ? Number(newAmount) * (subscription.coupon_ratio / 100) : 0;
  
  const handleSubmit = async () => {
    const amount = Number(newAmount);
    
    if (!amount || amount < minAmount) {
      toast({
        title: '輸入錯誤',
        description: `新金額不能低於最低允許金額 ${minAmount} 元`,
        variant: 'destructive',
      });
      return;
    }
    
    if (amount >= subscription.plan_amount) {
      toast({
        title: '輸入錯誤',
        description: `新金額必須小於當前金額 ${subscription.plan_amount} 元`,
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    try {
      await downgradeSubscription(amount);
      toast({
        title: '降級成功',
        description: `方案已降級至 ${amount} 元`,
      });
      onOpenChange(false);
      setNewAmount('');
      onSuccess();
    } catch (error) {
      console.error('Downgrade error:', error);
      toast({
        title: '降級失敗',
        description: error instanceof Error ? error.message : '未知錯誤',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-orange-500" />
            降級訂閱方案
          </DialogTitle>
          <DialogDescription>
            降低方案金額以減少未來預算（不會退款）
          </DialogDescription>
        </DialogHeader>
        
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>注意事項：</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>降級不退款，僅調整未來預算</li>
              <li>已發放的優惠券保持有效</li>
              <li>最低金額基於已核銷金額計算</li>
            </ul>
          </AlertDescription>
        </Alert>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-amount">當前方案金額</Label>
            <Input
              id="current-amount"
              value={`${subscription.plan_amount} 元`}
              disabled
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="min-amount">最低允許金額</Label>
            <Input
              id="min-amount"
              value={`${minAmount} 元`}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              基於已核銷金額 {subscription.total_redeemed_amount} 元計算
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="new-amount">新方案金額</Label>
            <Input
              id="new-amount"
              type="number"
              placeholder={`輸入新金額（最低 ${minAmount} 元）`}
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              min={minAmount}
              max={subscription.plan_amount - 1}
            />
          </div>
          
          {priceDiff > 0 && (
            <div className="rounded-lg border bg-muted/50 p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">減少金額</span>
                <span className="font-medium text-orange-600">-{priceDiff.toFixed(0)} 元</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">新優惠券預算</span>
                <span className="font-medium">{newCouponBudget.toFixed(0)} 元</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">退款金額</span>
                <span className="font-medium text-muted-foreground">0 元（不退款）</span>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !newAmount || Number(newAmount) < minAmount || Number(newAmount) >= subscription.plan_amount}
            variant="destructive"
          >
            {loading ? '處理中...' : '確認降級'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
