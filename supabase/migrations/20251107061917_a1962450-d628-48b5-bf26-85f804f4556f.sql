-- Phase 1: 餐厅业者系统基础架构

-- 1. 添加 restaurant_owner 角色到 enum
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    WHERE t.typname = 'app_role' AND e.enumlabel = 'restaurant_owner'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'restaurant_owner';
  END IF;
END $$;

-- 2. 创建验证尝试表
CREATE TABLE IF NOT EXISTS public.verification_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  restaurant_id UUID REFERENCES public.restaurants(id) NOT NULL,
  
  verification_method TEXT NOT NULL CHECK (verification_method IN ('email_code', 'google_match', 'manual_review')),
  
  -- Email 验证码
  email_code TEXT,
  email_sent_to TEXT,
  code_expires_at TIMESTAMPTZ,
  
  -- Google 比对资料
  submitted_address TEXT,
  submitted_phone TEXT,
  google_match_score NUMERIC CHECK (google_match_score >= 0 AND google_match_score <= 100),
  
  -- 验证状态
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed', 'manual_review')),
  verified_at TIMESTAMPTZ,
  failed_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 政策
ALTER TABLE public.verification_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own verification attempts" ON public.verification_attempts;
CREATE POLICY "Users can insert own verification attempts"
  ON public.verification_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own verification attempts" ON public.verification_attempts;
CREATE POLICY "Users can view own verification attempts"
  ON public.verification_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. 创建信任分数表
CREATE TABLE IF NOT EXISTS public.restaurant_trust_score (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- 信任分数（0-100）
  trust_score INTEGER DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100),
  
  -- 计算因子
  login_frequency_score INTEGER DEFAULT 0 CHECK (login_frequency_score >= 0 AND login_frequency_score <= 20),
  data_completeness_score INTEGER DEFAULT 0 CHECK (data_completeness_score >= 0 AND data_completeness_score <= 30),
  photo_quality_score INTEGER DEFAULT 0 CHECK (photo_quality_score >= 0 AND photo_quality_score <= 20),
  update_recency_score INTEGER DEFAULT 0 CHECK (update_recency_score >= 0 AND update_recency_score <= 30),
  
  -- 统计数据
  total_logins INTEGER DEFAULT 0,
  last_login_at TIMESTAMPTZ,
  last_data_update_at TIMESTAMPTZ,
  photo_count INTEGER DEFAULT 0,
  menu_last_updated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 政策
ALTER TABLE public.restaurant_trust_score ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view their restaurant trust score" ON public.restaurant_trust_score;
CREATE POLICY "Owners can view their restaurant trust score"
  ON public.restaurant_trust_score FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Owners can update their restaurant trust score" ON public.restaurant_trust_score;
CREATE POLICY "Owners can update their restaurant trust score"
  ON public.restaurant_trust_score FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- 4. 创建优惠券系统表
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) NOT NULL,
  
  -- 优惠券资讯
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_item')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  
  -- 使用限制
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0 CHECK (current_uses >= 0),
  min_spend NUMERIC CHECK (min_spend >= 0),
  
  -- 有效期限
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  
  -- 状态
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户优惠券领取记录
CREATE TABLE IF NOT EXISTS public.user_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  coupon_id UUID REFERENCES public.coupons(id) NOT NULL,
  
  -- 核销状态
  status TEXT DEFAULT 'unused' CHECK (status IN ('unused', 'used', 'expired')),
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  
  -- 防止重复领取
  UNIQUE(user_id, coupon_id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 政策
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;

-- 所有用户可以查看有效优惠券
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
CREATE POLICY "Anyone can view active coupons"
  ON public.coupons FOR SELECT
  TO authenticated
  USING (is_active = TRUE AND (valid_until IS NULL OR valid_until > NOW()));

-- 餐厅业者可以管理自己餐厅的优惠券
DROP POLICY IF EXISTS "Owners can manage their restaurant coupons" ON public.coupons;
CREATE POLICY "Owners can manage their restaurant coupons"
  ON public.coupons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_owners
      WHERE restaurant_id = coupons.restaurant_id
      AND user_id = auth.uid()
    )
  );

-- 用户可以查看和领取自己的优惠券
DROP POLICY IF EXISTS "Users can view own coupons" ON public.user_coupons;
CREATE POLICY "Users can view own coupons"
  ON public.user_coupons FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can claim coupons" ON public.user_coupons;
CREATE POLICY "Users can claim coupons"
  ON public.user_coupons FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can use own coupons" ON public.user_coupons;
CREATE POLICY "Users can use own coupons"
  ON public.user_coupons FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. 在 restaurants 表添加预留字段
ALTER TABLE public.restaurants 
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium')),
  ADD COLUMN IF NOT EXISTS last_owner_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS exposure_multiplier NUMERIC DEFAULT 1.0 CHECK (exposure_multiplier >= 0.05 AND exposure_multiplier <= 1.2);