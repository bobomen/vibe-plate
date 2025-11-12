import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Sparkles, Ticket, CreditCard, Check, TrendingUp, Users, Target } from 'lucide-react';
import { toast } from 'sonner';
import { getReferencePlans, calculateBudgetAnalysis, validateCouponConfig } from '@/config/adCouponPlans';
import { CouponConfig } from '@/types/adCoupon';

interface WizardProps {
  onComplete: (data: {
    plan_amount: number;
    cash_paid: number;
    coupon_budget: number;
    expires_at: string;
    coupon_config?: CouponConfig; // 优惠券配置（可选）
  }) => void;
  onCancel: () => void;
}

export function AdSubscriptionWizard({ onComplete, onCancel }: WizardProps) {
  const [step, setStep] = useState(1);
  const [planAmount, setPlanAmount] = useState(6000);
  const [paymentType, setPaymentType] = useState<'cash' | 'hybrid'>('cash');
  const [couponRatio, setCouponRatio] = useState(20);
  const [loading, setLoading] = useState(false);

  // Step 3: 优惠券配置
  const [couponConfig, setCouponConfig] = useState<CouponConfig>({
    coupon_count: 24,
    single_coupon_face_value: 100,
    min_spend: 300,
    max_discount: 100,
  });

  const cashPaid = paymentType === 'cash' 
    ? planAmount 
    : Math.round(planAmount * (1 - couponRatio / 100));
  const couponBudget = paymentType === 'cash' ? 0 : planAmount - cashPaid;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // 计算预算分析
  const budgetAnalysis = useMemo(
    () => calculateBudgetAnalysis(planAmount, cashPaid),
    [planAmount, cashPaid]
  );

  // 获取参考方案
  const referencePlans = useMemo(
    () => getReferencePlans(budgetAnalysis.coupon_budget),
    [budgetAnalysis.coupon_budget]
  );

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      // 如果選擇純現金，跳過優惠券配置
      if (paymentType === 'cash') {
        setStep(4);
      } else {
        setStep(3);
      }
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step === 4 && paymentType === 'cash') {
      // 如果是純現金模式，從第4步回到第2步
      setStep(2);
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    // 验证优惠券配置（如果是混合支付）
    if (paymentType === 'hybrid') {
      const validation = validateCouponConfig(
        couponConfig,
        budgetAnalysis.issuable_face_value
      );
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }
    }

    setLoading(true);
    try {
      await onComplete({
        plan_amount: planAmount,
        cash_paid: cashPaid,
        coupon_budget: couponBudget,
        expires_at: expiresAt,
        coupon_config: paymentType === 'hybrid' ? couponConfig : undefined,
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
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {[1, 2, paymentType === 'hybrid' ? 3 : null, 4].filter(i => i !== null).map((i) => {
                const displayStep = i as number;
                const isCompleted = displayStep < step || (step === 4 && displayStep === 3 && paymentType === 'cash');
                return (
                  <div
                    key={displayStep}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      displayStep === step
                        ? 'bg-primary text-primary-foreground'
                        : isCompleted
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : displayStep === 4 ? 3 : displayStep === 3 && paymentType === 'hybrid' ? 3 : displayStep}
                  </div>
                );
              })}
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              取消
            </Button>
          </div>
          <CardTitle>
            {step === 1 && '選擇廣告方案'}
            {step === 2 && '選擇支付方式'}
            {step === 3 && '配置優惠券預算'}
            {step === 4 && '確認訂單'}
          </CardTitle>
          <CardDescription>
            {step === 1 && '設定您的廣告投放預算'}
            {step === 2 && '選擇最適合您的支付方式'}
            {step === 3 && '用優惠券吸引更多客人，降低現金成本'}
            {step === 4 && '確認您的廣告投放設置'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-6">
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
                    <span className="text-lg font-bold">{amount}</span>
                    <span className="text-xs opacity-80">推薦方案</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="grid gap-4">
                <Card 
                  className={`cursor-pointer transition-all ${
                    paymentType === 'cash' 
                      ? 'ring-2 ring-primary' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setPaymentType('cash')}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-6 h-6 text-primary" />
                        <div>
                          <CardTitle className="text-lg">純現金支付</CardTitle>
                          <CardDescription className="mt-1">
                            直接支付，簡單明瞭
                          </CardDescription>
                        </div>
                      </div>
                      {paymentType === 'cash' && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </CardHeader>
                </Card>

                <Card 
                  className={`cursor-pointer transition-all ${
                    paymentType === 'hybrid' 
                      ? 'ring-2 ring-primary' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setPaymentType('hybrid')}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Ticket className="w-6 h-6 text-primary" />
                        <div>
                          <CardTitle className="text-lg">現金 + 優惠券支付</CardTitle>
                          <CardDescription className="mt-1">
                            用更少的現金來做行銷
                          </CardDescription>
                        </div>
                      </div>
                      {paymentType === 'hybrid' && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      💡 發放優惠券吸引顧客上門，只在顧客實際消費時才需支付優惠券成本
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {/* 预算分析 */}
              <div className="p-3 bg-primary/5 rounded-lg space-y-2">
                <p className="text-sm font-medium">📊 預算分析</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">優惠券預算：</span>
                    <span className="font-semibold ml-1">{budgetAnalysis.coupon_budget} 元</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">可發放面值：</span>
                    <span className="font-semibold ml-1">{budgetAnalysis.issuable_face_value} 元</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">實際支出上限：</span>
                    <span className="font-semibold ml-1">{budgetAnalysis.redemption_cap} 元</span>
                    <span className="text-xs text-muted-foreground ml-1">（先到先得，用完即止）</span>
                  </div>
                </div>
              </div>

              {/* 参考方案 */}
              <div className="space-y-2">
                <Label className="text-sm">參考方案（點擊快速套用）</Label>
                <div className="grid gap-2">
                  {referencePlans.map((plan) => (
                    <Card
                      key={plan.id}
                      className="cursor-pointer transition-all hover:border-primary/50"
                      onClick={() => setCouponConfig(plan.config)}
                    >
                      <CardHeader className="pb-2 pt-3 px-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-sm flex items-center gap-2">
                              {plan.name}
                              <Badge variant="outline" className="text-xs">
                                {plan.config.coupon_count} 張 × {plan.config.single_coupon_face_value} 元
                              </Badge>
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {plan.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 px-3 pb-3">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>觸達 ~{plan.estimated_reach} 人</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            <span>預計核銷 {plan.estimated_redemption_rate}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>最低消費 {plan.config.min_spend} 元</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* 自定义配置 */}
              <div className="space-y-3 p-3 border rounded-lg">
                <Label className="text-sm font-medium">自定義配置</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">優惠券數量</Label>
                    <Input
                      type="number"
                      value={couponConfig.coupon_count}
                      onChange={(e) =>
                        setCouponConfig({
                          ...couponConfig,
                          coupon_count: Number(e.target.value),
                        })
                      }
                      min={1}
                      max={1000}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      單張面值
                      <span className="text-xs text-muted-foreground ml-1">
                        ({Math.round(budgetAnalysis.issuable_face_value / couponConfig.coupon_count)} 元)
                      </span>
                    </Label>
                    <Input
                      type="number"
                      value={couponConfig.single_coupon_face_value}
                      onChange={(e) =>
                        setCouponConfig({
                          ...couponConfig,
                          single_coupon_face_value: Number(e.target.value),
                        })
                      }
                      min={10}
                      max={500}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">最低消費</Label>
                    <Input
                      type="number"
                      value={couponConfig.min_spend}
                      onChange={(e) =>
                        setCouponConfig({
                          ...couponConfig,
                          min_spend: Number(e.target.value),
                        })
                      }
                      min={couponConfig.single_coupon_face_value}
                      max={5000}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">最高折扣（可選）</Label>
                    <Input
                      type="number"
                      value={couponConfig.max_discount || ''}
                      onChange={(e) =>
                        setCouponConfig({
                          ...couponConfig,
                          max_discount: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      placeholder="不限制"
                      min={10}
                      max={couponConfig.single_coupon_face_value}
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="p-2 bg-muted rounded text-xs text-muted-foreground">
                  <p>
                    <strong>總面值：</strong>
                    {couponConfig.coupon_count * couponConfig.single_coupon_face_value} 元
                    {couponConfig.coupon_count * couponConfig.single_coupon_face_value >
                      budgetAnalysis.issuable_face_value && (
                      <span className="text-destructive ml-2">
                        （超過可發放額度 {budgetAnalysis.issuable_face_value} 元）
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">方案金額</span>
                  <span className="font-semibold">{planAmount} 元</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">支付方式</span>
                  <span className="font-semibold">
                    {paymentType === 'cash' ? '純現金支付' : '現金 + 優惠券支付'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">現金支付</span>
                  <span className="font-semibold">{cashPaid} 元</span>
                </div>
                {paymentType === 'hybrid' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">優惠券預算</span>
                    <span className="font-semibold">{couponBudget} 元</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t text-sm">
                  <span className="text-muted-foreground">有效期</span>
                  <span className="font-semibold">30 天</span>
                </div>
              </div>
              <div className="p-4 bg-primary/5 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">提示：</strong>
                  訂閱後將立即生效，您的餐廳曝光率將提升至 80% 基礎流量。
                  {paymentType === 'hybrid' && '每當用戶核銷 500 元優惠券，流量提升 5%，最高可達 100%。'}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 flex-shrink-0 border-t mt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1 || loading}
              size="sm"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              上一步
            </Button>
            {step < 4 ? (
              <Button onClick={handleNext} size="sm">
                下一步
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading} size="sm">
                {loading ? '創建中...' : '確認訂閱'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
