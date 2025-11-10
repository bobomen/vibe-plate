-- ====================================
-- 广告投放系统数据库结构
-- ====================================

-- 表1：restaurant_ad_subscriptions（餐厅广告订阅主表）
CREATE TABLE restaurant_ad_subscriptions (
  -- 基础字段
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  
  -- 方案金额
  plan_amount NUMERIC(10,2) NOT NULL,
  cash_paid NUMERIC(10,2) NOT NULL,
  coupon_budget NUMERIC(10,2) NOT NULL,
  coupon_ratio NUMERIC(5,2) NOT NULL,
  
  -- 流量相关
  traffic_multiplier NUMERIC(5,2) NOT NULL DEFAULT 0.80,
  total_redeemed_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  
  -- 订阅状态
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  subscription_type TEXT NOT NULL DEFAULT 'hybrid' CHECK (subscription_type IN ('cash_only', 'hybrid')),
  
  -- 时间戳
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Stripe 相关
  stripe_payment_id TEXT,
  stripe_subscription_id TEXT,
  
  -- 约束
  CONSTRAINT positive_amounts CHECK (
    plan_amount > 0 AND 
    cash_paid >= 0 AND 
    coupon_budget >= 0 AND
    cash_paid + coupon_budget = plan_amount
  ),
  CONSTRAINT valid_traffic_multiplier CHECK (
    traffic_multiplier >= 0.80 AND traffic_multiplier <= 1.00
  )
);

-- 索引
CREATE INDEX idx_restaurant_ad_subscriptions_restaurant_id ON restaurant_ad_subscriptions(restaurant_id);
CREATE INDEX idx_restaurant_ad_subscriptions_status ON restaurant_ad_subscriptions(status);
CREATE INDEX idx_restaurant_ad_subscriptions_expires_at ON restaurant_ad_subscriptions(expires_at);

-- RLS 策略
ALTER TABLE restaurant_ad_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant owners can view their own subscriptions"
  ON restaurant_ad_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_owners
      WHERE restaurant_owners.restaurant_id = restaurant_ad_subscriptions.restaurant_id
        AND restaurant_owners.user_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant owners can create their own subscriptions"
  ON restaurant_ad_subscriptions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_owners
      WHERE restaurant_owners.restaurant_id = restaurant_ad_subscriptions.restaurant_id
        AND restaurant_owners.user_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant owners can update their own subscriptions"
  ON restaurant_ad_subscriptions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_owners
      WHERE restaurant_owners.restaurant_id = restaurant_ad_subscriptions.restaurant_id
        AND restaurant_owners.user_id = auth.uid()
    )
  );

-- ====================================

-- 表2：restaurant_ad_coupons（餐厅广告优惠券表）
CREATE TABLE restaurant_ad_coupons (
  -- 基础字段
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES restaurant_ad_subscriptions(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  
  -- 优惠券参数
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  min_spend NUMERIC(10,2),
  max_discount NUMERIC(10,2),
  
  -- 地理限制
  radius_km NUMERIC(5,2),
  
  -- 领取与核销
  user_id UUID,
  claimed_at TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ,
  redeemed_amount NUMERIC(10,2),
  discount_applied NUMERIC(10,2),
  
  -- 核销验证
  verification_code TEXT,
  code_generated_at TIMESTAMPTZ,
  code_expires_at TIMESTAMPTZ,
  
  -- 状态
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'claimed', 'redeemed', 'expired')),
  
  -- 时间戳
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 约束
  CONSTRAINT valid_discount_value CHECK (
    (discount_type = 'percentage' AND discount_value > 0 AND discount_value < 100) OR
    (discount_type = 'fixed' AND discount_value > 0)
  )
);

-- 索引
CREATE INDEX idx_restaurant_ad_coupons_subscription_id ON restaurant_ad_coupons(subscription_id);
CREATE INDEX idx_restaurant_ad_coupons_restaurant_id ON restaurant_ad_coupons(restaurant_id);
CREATE INDEX idx_restaurant_ad_coupons_user_id ON restaurant_ad_coupons(user_id);
CREATE INDEX idx_restaurant_ad_coupons_status ON restaurant_ad_coupons(status);
CREATE INDEX idx_restaurant_ad_coupons_verification_code ON restaurant_ad_coupons(verification_code) WHERE verification_code IS NOT NULL;
CREATE INDEX idx_restaurant_ad_coupons_expires_at ON restaurant_ad_coupons(expires_at);

-- RLS 策略
ALTER TABLE restaurant_ad_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view available coupons"
  ON restaurant_ad_coupons FOR SELECT
  USING (
    status = 'available' AND expires_at > NOW()
  );

CREATE POLICY "Users can view their own claimed/redeemed coupons"
  ON restaurant_ad_coupons FOR SELECT
  USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can claim available coupons"
  ON restaurant_ad_coupons FOR UPDATE
  USING (
    status = 'available' AND 
    expires_at > NOW() AND
    user_id IS NULL
  )
  WITH CHECK (
    user_id = auth.uid() AND
    status = 'claimed'
  );

CREATE POLICY "Restaurant owners can view their restaurant coupons"
  ON restaurant_ad_coupons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_owners
      WHERE restaurant_owners.restaurant_id = restaurant_ad_coupons.restaurant_id
        AND restaurant_owners.user_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant owners can redeem coupons"
  ON restaurant_ad_coupons FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_owners
      WHERE restaurant_owners.restaurant_id = restaurant_ad_coupons.restaurant_id
        AND restaurant_owners.user_id = auth.uid()
    ) AND
    status = 'claimed'
  );

-- ====================================

-- 表3：traffic_multiplier_history（流量系数历史记录表）
CREATE TABLE traffic_multiplier_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES restaurant_ad_subscriptions(id) ON DELETE CASCADE,
  
  -- 变化数据
  previous_multiplier NUMERIC(5,2) NOT NULL,
  new_multiplier NUMERIC(5,2) NOT NULL,
  redeemed_amount_at_change NUMERIC(10,2) NOT NULL,
  trigger_reason TEXT,
  
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 约束
  CONSTRAINT valid_multipliers CHECK (
    previous_multiplier >= 0.80 AND previous_multiplier <= 1.00 AND
    new_multiplier >= 0.80 AND new_multiplier <= 1.00
  )
);

-- 索引
CREATE INDEX idx_traffic_multiplier_history_subscription_id ON traffic_multiplier_history(subscription_id);
CREATE INDEX idx_traffic_multiplier_history_calculated_at ON traffic_multiplier_history(calculated_at);

-- RLS 策略
ALTER TABLE traffic_multiplier_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant owners can view their traffic history"
  ON traffic_multiplier_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_ad_subscriptions ras
      JOIN restaurant_owners ro ON ro.restaurant_id = ras.restaurant_id
      WHERE ras.id = traffic_multiplier_history.subscription_id
        AND ro.user_id = auth.uid()
    )
  );

-- ====================================

-- 表4：ad_performance_stats（广告成效统计表）
CREATE TABLE ad_performance_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES restaurant_ad_subscriptions(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  
  -- 日期
  stats_date DATE NOT NULL,
  
  -- 曝光数据
  total_impressions INTEGER NOT NULL DEFAULT 0,
  unique_viewers INTEGER NOT NULL DEFAULT 0,
  
  -- 点击数据
  total_clicks INTEGER NOT NULL DEFAULT 0,
  click_through_rate NUMERIC(5,2),
  
  -- 优惠券数据
  coupons_claimed INTEGER NOT NULL DEFAULT 0,
  coupons_redeemed INTEGER NOT NULL DEFAULT 0,
  redemption_rate NUMERIC(5,2),
  
  -- 收藏数据
  new_favorites INTEGER NOT NULL DEFAULT 0,
  
  -- 流量数据
  avg_traffic_multiplier NUMERIC(5,2),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 唯一约束
  UNIQUE(subscription_id, stats_date)
);

-- 索引
CREATE INDEX idx_ad_performance_stats_subscription_id ON ad_performance_stats(subscription_id);
CREATE INDEX idx_ad_performance_stats_restaurant_id ON ad_performance_stats(restaurant_id);
CREATE INDEX idx_ad_performance_stats_stats_date ON ad_performance_stats(stats_date);

-- RLS 策略
ALTER TABLE ad_performance_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant owners can view their ad stats"
  ON ad_performance_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_owners
      WHERE restaurant_owners.restaurant_id = ad_performance_stats.restaurant_id
        AND restaurant_owners.user_id = auth.uid()
    )
  );

-- ====================================
-- 核心计算函数
-- ====================================

-- 函数1：计算流量系数
CREATE OR REPLACE FUNCTION calculate_traffic_multiplier(
  p_subscription_id UUID
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon_budget NUMERIC;
  v_redeemed_amount NUMERIC;
  v_new_multiplier NUMERIC;
BEGIN
  -- 获取订阅数据
  SELECT coupon_budget, total_redeemed_amount
  INTO v_coupon_budget, v_redeemed_amount
  FROM restaurant_ad_subscriptions
  WHERE id = p_subscription_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found: %', p_subscription_id;
  END IF;
  
  -- 根据解锁步长计算流量系数
  -- 每核销 ¥500 → 流量 +5%
  -- 起始 80%，满额 100%
  v_new_multiplier := 0.80 + (FLOOR(v_redeemed_amount / 500) * 0.05);
  
  -- 限制在 [0.80, 1.00] 范围内
  v_new_multiplier := LEAST(1.00, GREATEST(0.80, v_new_multiplier));
  
  RETURN v_new_multiplier;
END;
$$;

-- ====================================

-- 函数2：更新流量系数（带历史记录）
CREATE OR REPLACE FUNCTION update_traffic_multiplier(
  p_subscription_id UUID,
  p_trigger_reason TEXT DEFAULT 'manual_update'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_previous_multiplier NUMERIC;
  v_new_multiplier NUMERIC;
  v_redeemed_amount NUMERIC;
  v_restaurant_id UUID;
BEGIN
  -- 获取当前流量系数、已核销金额和餐厅ID
  SELECT traffic_multiplier, total_redeemed_amount, restaurant_id
  INTO v_previous_multiplier, v_redeemed_amount, v_restaurant_id
  FROM restaurant_ad_subscriptions
  WHERE id = p_subscription_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found: %', p_subscription_id;
  END IF;
  
  -- 计算新的流量系数
  v_new_multiplier := calculate_traffic_multiplier(p_subscription_id);
  
  -- 如果有变化，更新并记录历史
  IF v_new_multiplier != v_previous_multiplier THEN
    -- 更新订阅表
    UPDATE restaurant_ad_subscriptions
    SET traffic_multiplier = v_new_multiplier,
        updated_at = NOW()
    WHERE id = p_subscription_id;
    
    -- 记录历史
    INSERT INTO traffic_multiplier_history (
      subscription_id,
      previous_multiplier,
      new_multiplier,
      redeemed_amount_at_change,
      trigger_reason
    ) VALUES (
      p_subscription_id,
      v_previous_multiplier,
      v_new_multiplier,
      v_redeemed_amount,
      p_trigger_reason
    );
    
    -- 更新restaurants表的exposure_multiplier
    UPDATE restaurants
    SET exposure_multiplier = v_new_multiplier
    WHERE id = v_restaurant_id;
  END IF;
END;
$$;

-- ====================================

-- 触发器：自动更新 updated_at
CREATE TRIGGER update_restaurant_ad_subscriptions_updated_at
  BEFORE UPDATE ON restaurant_ad_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();