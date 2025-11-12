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
import { useAdSubscription, AdSubscription } from '@/hooks/useAdSubscription';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp } from 'lucide-react';

interface UpgradeSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: AdSubscription;
  onSuccess: () => void;
}

export function UpgradeSubscriptionDialog({
  open,
  onOpenChange,
  subscription,
  onSuccess,
}: UpgradeSubscriptionDialogProps) {
  const { upgradeSubscription } = useAdSubscription(subscription.restaurant_id);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  
  const priceDiff = newAmount ? Number(newAmount) - subscription.plan_amount : 0;
  const newCouponBudget = newAmount ? Number(newAmount) * (subscription.coupon_ratio / 100) : 0;
  
  const handleSubmit = async () => {
    const amount = Number(newAmount);
    
    if (!amount || amount <= subscription.plan_amount) {
      toast({
        title: '輸入錯誤',
        description: `新金額必須大於當前金額 ${subscription.plan_amount} 元`,
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    try {
      await upgradeSubscription(amount);
      toast({
        title: '升級成功',
        description: `方案已升級至 ${amount} 元`,
      });
      onOpenChange(false);
      setNewAmount('');
      onSuccess();
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: '升級失敗',
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
            <TrendingUp className="w-5 h-5 text-primary" />
            升級訂閱方案
          </DialogTitle>
          <DialogDescription>
            提升方案金額以獲得更多優惠券預算和流量
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
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
            <Label htmlFor="new-amount">新方案金額</Label>
            <Input
              id="new-amount"
              type="number"
              placeholder="輸入新的方案金額"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              min={subscription.plan_amount + 1}
            />
          </div>
          
          {priceDiff > 0 && (
            <div className="rounded-lg border bg-muted/50 p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">需補差價</span>
                <span className="font-medium text-primary">+{priceDiff.toFixed(0)} 元</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">新優惠券預算</span>
                <span className="font-medium">{newCouponBudget.toFixed(0)} 元</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">效果</span>
                <span className="font-medium text-green-600">立即生效</span>
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
            disabled={loading || !newAmount || Number(newAmount) <= subscription.plan_amount}
          >
            {loading ? '處理中...' : '確認升級'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
