import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ChevronLeft, ChevronRight, Sparkles, Ticket, CreditCard, Check } from 'lucide-react';
import { toast } from 'sonner';

interface WizardProps {
  onComplete: (data: {
    plan_amount: number;
    cash_paid: number;
    coupon_budget: number;
    expires_at: string;
  }) => void;
  onCancel: () => void;
}

export function AdSubscriptionWizard({ onComplete, onCancel }: WizardProps) {
  const [step, setStep] = useState(1);
  const [planAmount, setPlanAmount] = useState(6000);
  const [couponRatio, setCouponRatio] = useState(33);
  const [loading, setLoading] = useState(false);

  const cashPaid = Math.round(planAmount * (1 - couponRatio / 100));
  const couponBudget = planAmount - cashPaid;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onComplete({
        plan_amount: planAmount,
        cash_paid: cashPaid,
        coupon_budget: couponBudget,
        expires_at: expiresAt,
      });
      toast.success('廣告訂閱創建成功！');
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('創建失敗，請重試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    i === step
                      ? 'bg-primary text-primary-foreground'
                      : i < step
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {i < step ? <Check className="w-4 h-4" /> : i}
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              取消
            </Button>
          </div>
          <CardTitle>
            {step === 1 && '選擇廣告方案'}
            {step === 2 && '配置優惠券預算'}
            {step === 3 && '確認訂單'}
          </CardTitle>
          <CardDescription>
            {step === 1 && '設定您的廣告投放預算'}
            {step === 2 && '分配現金和優惠券比例'}
            {step === 3 && '確認您的廣告投放設置'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>方案金額</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    value={planAmount}
                    onChange={(e) => setPlanAmount(Number(e.target.value))}
                    min={1000}
                    max={50000}
                    step={1000}
                    className="text-lg"
                  />
                  <span className="text-muted-foreground">元</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[3000, 6000, 10000].map((amount) => (
                  <Button
                    key={amount}
                    variant={planAmount === amount ? 'default' : 'outline'}
                    onClick={() => setPlanAmount(amount)}
                    className="h-auto py-4 flex-col gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span className="text-lg font-bold">¥{amount}</span>
                    <span className="text-xs opacity-80">推薦方案</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <Label>優惠券預算佔比：{couponRatio}%</Label>
                <Slider
                  value={[couponRatio]}
                  onValueChange={(value) => setCouponRatio(value[0])}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CreditCard className="w-8 h-8 text-primary mb-2" />
                    <CardTitle className="text-lg">現金支付</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">¥{cashPaid}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {Math.round((1 - couponRatio / 100) * 100)}% 方案金額
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Ticket className="w-8 h-8 text-primary mb-2" />
                    <CardTitle className="text-lg">優惠券預算</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">¥{couponBudget}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {couponRatio}% 方案金額
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">方案金額</span>
                  <span className="font-semibold">¥{planAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">現金支付</span>
                  <span className="font-semibold">¥{cashPaid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">優惠券預算</span>
                  <span className="font-semibold">¥{couponBudget}</span>
                </div>
                <div className="flex justify-between pt-3 border-t">
                  <span className="text-muted-foreground">有效期</span>
                  <span className="font-semibold">30天</span>
                </div>
              </div>
              <div className="p-4 bg-primary/5 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">提示：</strong>
                  訂閱後將立即生效，您的餐廳曝光率將提升至80%基礎流量。
                  每當用戶核銷¥500優惠券，流量提升5%，最高可達100%。
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1 || loading}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              上一步
            </Button>
            {step < 3 ? (
              <Button onClick={handleNext}>
                下一步
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? '創建中...' : '確認訂閱'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
