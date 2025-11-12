import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { useAdSubscription, AdSubscription } from '@/hooks/useAdSubscription';
import { ModificationLimits, CouponConfig } from '@/types/subscriptionModification';
import { useToast } from '@/hooks/use-toast';
import { Settings, AlertCircle, Lock } from 'lucide-react';

interface ModifyCouponsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: AdSubscription;
  limits: ModificationLimits;
  onSuccess: () => void;
}

export function ModifyCouponsDialog({
  open,
  onOpenChange,
  subscription,
  limits,
  onSuccess,
}: ModifyCouponsDialogProps) {
  const { updateCouponConfig } = useAdSubscription(subscription.restaurant_id);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const currentConfig = subscription.coupon_config as CouponConfig | null;
  const [config, setConfig] = useState<CouponConfig>({
    coupon_count: currentConfig?.coupon_count || 0,
    single_coupon_face_value: currentConfig?.single_coupon_face_value || 0,
    min_spend: currentConfig?.min_spend || 0,
    max_discount: currentConfig?.max_discount,
  });
  
  useEffect(() => {
    if (open && currentConfig) {
      setConfig({
        coupon_count: currentConfig.coupon_count,
        single_coupon_face_value: currentConfig.single_coupon_face_value,
        min_spend: currentConfig.min_spend,
        max_discount: currentConfig.max_discount,
      });
    }
  }, [open, currentConfig]);
  
  const isFieldEditable = (field: keyof CouponConfig) => {
    const fieldMap: Record<keyof CouponConfig, string> = {
      coupon_count: 'coupon_count',
      single_coupon_face_value: 'single_coupon_face_value',
      min_spend: 'min_spend',
      max_discount: 'max_discount',
    };
    return limits.editableFields.includes(fieldMap[field] as any);
  };
  
  const totalFaceValue = config.coupon_count * config.single_coupon_face_value;
  const issuableFaceValue = subscription.coupon_budget * 2;
  
  const handleSubmit = async () => {
    if (totalFaceValue > issuableFaceValue) {
      toast({
        title: '配置錯誤',
        description: `總面值（${totalFaceValue} 元）超過可發放額度（${issuableFaceValue} 元）`,
        variant: 'destructive',
      });
      return;
    }
    
    if (config.min_spend < config.single_coupon_face_value * 3) {
      toast({
        title: '配置錯誤',
        description: `最低消費應至少為單張面值的 3 倍`,
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    try {
      await updateCouponConfig(config);
      toast({
        title: '修改成功',
        description: '優惠券配置已更新',
      });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Update config error:', error);
      toast({
        title: '修改失敗',
        description: error instanceof Error ? error.message : '未知錯誤',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (limits.modificationTier === 'locked') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-muted-foreground" />
              無法修改優惠券配置
            </DialogTitle>
          </DialogHeader>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              已發放 {limits.issuedCouponCount} 張優惠券，超過 50 張限制。
              <br />
              請等待更多優惠券被核銷或到期後再修改配置。
            </AlertDescription>
          </Alert>
          
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>
              知道了
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            調整優惠券配置
            {limits.modificationTier === 'limited' && (
              <Badge variant="secondary" className="text-xs">
                有限編輯
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {limits.modificationTier === 'full' 
              ? '可自由調整所有優惠券參數'
              : '已發放 11-50 張優惠券，僅可調整消費門檻和折扣上限'}
          </DialogDescription>
        </DialogHeader>
        
        {limits.modificationTier === 'limited' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              已發放 {limits.issuedCouponCount} 張優惠券。為保護用戶權益，優惠券數量和面值已鎖定。
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="coupon-count">優惠券數量</Label>
              {!isFieldEditable('coupon_count') && (
                <Lock className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
            <Input
              id="coupon-count"
              type="number"
              value={config.coupon_count}
              onChange={(e) => setConfig({ ...config, coupon_count: Number(e.target.value) })}
              disabled={!isFieldEditable('coupon_count')}
              className={!isFieldEditable('coupon_count') ? 'bg-muted' : ''}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="face-value">單張面值（元）</Label>
              {!isFieldEditable('single_coupon_face_value') && (
                <Lock className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
            <Input
              id="face-value"
              type="number"
              value={config.single_coupon_face_value}
              onChange={(e) => setConfig({ ...config, single_coupon_face_value: Number(e.target.value) })}
              disabled={!isFieldEditable('single_coupon_face_value')}
              className={!isFieldEditable('single_coupon_face_value') ? 'bg-muted' : ''}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="min-spend">最低消費（元）</Label>
              {!isFieldEditable('min_spend') && (
                <Lock className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
            <Input
              id="min-spend"
              type="number"
              value={config.min_spend}
              onChange={(e) => setConfig({ ...config, min_spend: Number(e.target.value) })}
              disabled={!isFieldEditable('min_spend')}
              className={!isFieldEditable('min_spend') ? 'bg-muted' : ''}
            />
            <p className="text-xs text-muted-foreground">
              建議為單張面值的 3-5 倍（當前：{(config.min_spend / config.single_coupon_face_value).toFixed(1)} 倍）
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="max-discount">折扣上限（元，可選）</Label>
              {!isFieldEditable('max_discount') && (
                <Lock className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
            <Input
              id="max-discount"
              type="number"
              placeholder="不限制"
              value={config.max_discount || ''}
              onChange={(e) => setConfig({ 
                ...config, 
                max_discount: e.target.value ? Number(e.target.value) : undefined 
              })}
              disabled={!isFieldEditable('max_discount')}
              className={!isFieldEditable('max_discount') ? 'bg-muted' : ''}
            />
          </div>
          
          <div className="rounded-lg border bg-muted/50 p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">總面值</span>
              <span className={`font-medium ${totalFaceValue > issuableFaceValue ? 'text-destructive' : ''}`}>
                {totalFaceValue} 元
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">可發放額度</span>
              <span className="font-medium">{issuableFaceValue} 元</span>
            </div>
            {totalFaceValue > issuableFaceValue && (
              <p className="text-xs text-destructive">
                ⚠️ 總面值超過可發放額度
              </p>
            )}
          </div>
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
            disabled={loading || totalFaceValue > issuableFaceValue}
          >
            {loading ? '處理中...' : '確認修改'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
