import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ticket, Clock, Gift, MapPin } from 'lucide-react';
import { useUserCoupons } from '@/hooks/useUserCoupons';
import { usePremium } from '@/hooks/usePremium';
import PremiumModal from '@/components/PremiumModal';
import { CouponClaimDialog } from './CouponClaimDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { RestaurantCardSkeleton } from '@/components/ui/RestaurantCardSkeleton';

export const CouponList = () => {
  const { isPremium, showFirstTimeModal, markModalAsSeen, upgradeToPremium } = usePremium();
  const { coupons, loading, error, claimCoupon } = useUserCoupons();
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);

  // 分類優惠券
  const availableCoupons = coupons.filter(c => 
    c.status === 'available' && !c.claimed_at
  );
  
  const claimedCoupons = coupons.filter(c => 
    c.status === 'available' && c.claimed_at && !c.used_at
  );
  
  const usedCoupons = coupons.filter(c => 
    c.used_at
  );

  const handleClaimClick = (coupon: any) => {
    if (!isPremium) {
      // 顯示 Premium 升級彈窗
      return;
    }
    setSelectedCoupon(coupon);
    setClaimDialogOpen(true);
  };

  const handleClaimConfirm = async () => {
    if (!selectedCoupon) return;
    
    try {
      await claimCoupon(selectedCoupon.id);
      setClaimDialogOpen(false);
      setSelectedCoupon(null);
    } catch (err) {
      console.error('領取優惠券失敗:', err);
    }
  };

  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  const CouponCard = ({ coupon, showClaimButton = false }: { coupon: any; showClaimButton?: boolean }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">{coupon.restaurant_name}</CardTitle>
            {coupon.restaurant_district && (
              <CardDescription className="flex items-center gap-1 text-xs">
                <MapPin className="h-3 w-3" />
                {coupon.restaurant_district}
              </CardDescription>
            )}
          </div>
          <Badge variant="secondary" className="ml-2">
            <Gift className="h-3 w-3 mr-1" />
            {coupon.discount_type === 'fixed' ? `${coupon.discount_value} 元` : `${coupon.discount_value}%`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">最低消費</span>
          <span className="font-medium">{coupon.min_spend} 元</span>
        </div>
        
        {coupon.max_discount && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">最高折扣</span>
            <span className="font-medium">{coupon.max_discount} 元</span>
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm pt-2 border-t">
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            有效期至
          </span>
          <span className="text-xs">{formatExpiryDate(coupon.expires_at)}</span>
        </div>

        {showClaimButton && (
          <Button 
            onClick={() => handleClaimClick(coupon)}
            className="w-full mt-2"
            disabled={!isPremium}
          >
            <Ticket className="h-4 w-4 mr-2" />
            領取優惠券
          </Button>
        )}

        {coupon.claimed_at && !coupon.used_at && (
          <Badge variant="default" className="w-full justify-center">
            已領取
          </Badge>
        )}

        {coupon.used_at && (
          <Badge variant="outline" className="w-full justify-center">
            已使用
          </Badge>
        )}
      </CardContent>
    </Card>
  );

  if (!isPremium) {
    return (
      <>
        <div className="container max-w-4xl mx-auto p-4">
          <EmptyState
            icon={<Ticket className="h-12 w-12" />}
            title="專屬 Premium 功能"
            description="升級 Premium 會員即可領取餐廳優惠券，享受專屬折扣"
            action={
            <Button onClick={upgradeToPremium} size="lg">
              升級 Premium
            </Button>
            }
          />
        </div>
        <PremiumModal
          open={showFirstTimeModal}
          onClose={markModalAsSeen}
          onUpgrade={upgradeToPremium}
        />
      </>
    );
  }

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <RestaurantCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto p-4">
        <EmptyState
          icon={<Ticket className="h-12 w-12" />}
          title="載入失敗"
          description={error}
        />
      </div>
    );
  }

  return (
    <>
      <div className="container max-w-4xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">我的優惠券</h1>
          <p className="text-muted-foreground">領取餐廳優惠券，享受會員專屬折扣</p>
        </div>

        <Tabs defaultValue="available" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available">
              可領取 ({availableCoupons.length})
            </TabsTrigger>
            <TabsTrigger value="claimed">
              已領取 ({claimedCoupons.length})
            </TabsTrigger>
            <TabsTrigger value="used">
              已使用 ({usedCoupons.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            {availableCoupons.length === 0 ? (
              <EmptyState
                icon={<Ticket className="h-12 w-12" />}
                title="暫無可領取優惠券"
                description="目前沒有可領取的優惠券，請稍後再來看看"
              />
            ) : (
              availableCoupons.map((coupon) => (
                <CouponCard key={coupon.id} coupon={coupon} showClaimButton />
              ))
            )}
          </TabsContent>

          <TabsContent value="claimed" className="space-y-4">
            {claimedCoupons.length === 0 ? (
              <EmptyState
                icon={<Ticket className="h-12 w-12" />}
                title="尚未領取優惠券"
                description="前往「可領取」分頁領取您的專屬優惠券"
              />
            ) : (
              claimedCoupons.map((coupon) => (
                <CouponCard key={coupon.id} coupon={coupon} />
              ))
            )}
          </TabsContent>

          <TabsContent value="used" className="space-y-4">
            {usedCoupons.length === 0 ? (
              <EmptyState
                icon={<Ticket className="h-12 w-12" />}
                title="尚無使用記錄"
                description="使用優惠券後會顯示在這裡"
              />
            ) : (
              usedCoupons.map((coupon) => (
                <CouponCard key={coupon.id} coupon={coupon} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {selectedCoupon && (
        <CouponClaimDialog
          open={claimDialogOpen}
          onClose={() => {
            setClaimDialogOpen(false);
            setSelectedCoupon(null);
          }}
          onConfirm={handleClaimConfirm}
          coupon={selectedCoupon}
        />
      )}
    </>
  );
};
