import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ticket, Gift, Clock, MapPin, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Coupon {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  restaurant_district?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_spend?: number;
  max_discount?: number;
  expires_at: string;
}

interface CouponClaimDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  coupon: Coupon;
}

export const CouponClaimDialog = ({ open, onClose, onConfirm, coupon }: CouponClaimDialogProps) => {
  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Ticket className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            確認領取優惠券
          </DialogTitle>
          <DialogDescription className="text-center">
            領取後優惠券將保存在您的帳戶中
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 餐廳資訊 */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <h4 className="font-semibold text-lg">{coupon.restaurant_name}</h4>
            {coupon.restaurant_district && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {coupon.restaurant_district}
              </p>
            )}
          </div>

          {/* 優惠券詳情 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Gift className="h-4 w-4" />
                優惠金額
              </span>
              <Badge variant="secondary" className="text-base">
                {coupon.discount_type === 'fixed' ? `${coupon.discount_value} 元` : `${coupon.discount_value}%`}
              </Badge>
            </div>

            {coupon.min_spend && (
              <div className="flex items-center justify-between p-3 bg-background border rounded-lg">
                <span className="text-sm text-muted-foreground">最低消費</span>
                <span className="font-medium">{coupon.min_spend} 元</span>
              </div>
            )}

            {coupon.max_discount && (
              <div className="flex items-center justify-between p-3 bg-background border rounded-lg">
                <span className="text-sm text-muted-foreground">最高折扣</span>
                <span className="font-medium">{coupon.max_discount} 元</span>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-background border rounded-lg">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                有效期至
              </span>
              <span className="text-sm">{formatExpiryDate(coupon.expires_at)}</span>
            </div>
          </div>

          {/* 使用說明 */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              領取後請至餐廳消費時出示優惠券，每張優惠券僅限使用一次
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={onConfirm}>
            確認領取
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
