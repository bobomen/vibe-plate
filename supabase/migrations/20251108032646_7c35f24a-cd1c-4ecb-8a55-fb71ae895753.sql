-- ==========================================
-- Phase 1: Restaurant Ownership System Foundation
-- 基于现有系统的稳健扩展
-- ==========================================

-- 1. 扩展 restaurants 表：添加状态管理和soft delete
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'suspended')),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 为状态查询创建索引
CREATE INDEX IF NOT EXISTS idx_restaurants_status ON public.restaurants(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_restaurants_deleted_at ON public.restaurants(deleted_at) WHERE deleted_at IS NOT NULL;

-- 2. 创建 restaurant_claims 表：追踪认领申请流程
CREATE TABLE IF NOT EXISTS public.restaurant_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  verification_attempt_id UUID REFERENCES public.verification_attempts(id) ON DELETE SET NULL,
  
  -- 认领类型：'claim_existing' (认领现有) | 'create_new' (创建新餐厅)
  claim_type TEXT NOT NULL CHECK (claim_type IN ('claim_existing', 'create_new')),
  
  -- 状态追踪
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'cancelled')),
  
  -- 新餐厅创建时的提交数据（JSON存储，仅create_new类型使用）
  submitted_data JSONB DEFAULT NULL,
  
  -- 数据完整度分数（用于计算exposure_multiplier）
  data_completeness_score INTEGER DEFAULT 0 CHECK (data_completeness_score >= 0 AND data_completeness_score <= 100),
  
  -- 拒绝/取消原因
  rejection_reason TEXT DEFAULT NULL,
  cancelled_reason TEXT DEFAULT NULL,
  
  -- 时间戳
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ DEFAULT NULL,
  rejected_at TIMESTAMPTZ DEFAULT NULL,
  cancelled_at TIMESTAMPTZ DEFAULT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 为常见查询创建索引
CREATE INDEX idx_restaurant_claims_user_id ON public.restaurant_claims(user_id);
CREATE INDEX idx_restaurant_claims_restaurant_id ON public.restaurant_claims(restaurant_id) WHERE restaurant_id IS NOT NULL;
CREATE INDEX idx_restaurant_claims_status ON public.restaurant_claims(status);
CREATE INDEX idx_restaurant_claims_created_at ON public.restaurant_claims(created_at DESC);

-- 3. 启用 RLS
ALTER TABLE public.restaurant_claims ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for restaurant_claims

-- 用户可以查看自己的认领申请
CREATE POLICY "Users can view their own claims"
ON public.restaurant_claims
FOR SELECT
USING (auth.uid() = user_id);

-- 用户可以创建自己的认领申请
CREATE POLICY "Users can create their own claims"
ON public.restaurant_claims
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 用户可以更新自己的认领申请（仅限pending状态，用于取消）
CREATE POLICY "Users can update their own pending claims"
ON public.restaurant_claims
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND status = 'pending'
)
WITH CHECK (
  auth.uid() = user_id 
  AND status IN ('pending', 'cancelled')
);

-- 5. 创建触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION public.update_restaurant_claims_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_restaurant_claims_updated_at
BEFORE UPDATE ON public.restaurant_claims
FOR EACH ROW
EXECUTE FUNCTION public.update_restaurant_claims_updated_at();

-- 6. 创建辅助函数：计算数据完整度分数
CREATE OR REPLACE FUNCTION public.calculate_restaurant_data_completeness(
  p_restaurant_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score INTEGER := 0;
  v_restaurant RECORD;
BEGIN
  SELECT * INTO v_restaurant FROM public.restaurants WHERE id = p_restaurant_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- 基础信息 (40分)
  IF v_restaurant.phone IS NOT NULL AND v_restaurant.phone != '' THEN v_score := v_score + 10; END IF;
  IF v_restaurant.address IS NOT NULL AND v_restaurant.address != '' THEN v_score := v_score + 10; END IF;
  IF v_restaurant.cuisine_type IS NOT NULL AND v_restaurant.cuisine_type != '' THEN v_score := v_score + 10; END IF;
  IF v_restaurant.price_range IS NOT NULL THEN v_score := v_score + 10; END IF;
  
  -- 照片 (20分)
  IF v_restaurant.photos IS NOT NULL AND array_length(v_restaurant.photos, 1) >= 3 THEN 
    v_score := v_score + 20; 
  ELSIF v_restaurant.photos IS NOT NULL AND array_length(v_restaurant.photos, 1) >= 1 THEN
    v_score := v_score + 10;
  END IF;
  
  -- 菜单/网站 (20分)
  IF v_restaurant.menu_url IS NOT NULL AND v_restaurant.menu_url != '' THEN v_score := v_score + 10; END IF;
  IF v_restaurant.website IS NOT NULL AND v_restaurant.website != '' THEN v_score := v_score + 10; END IF;
  
  -- 营业时间 (20分)
  IF v_restaurant.business_hours IS NOT NULL AND v_restaurant.business_hours::text != '{}'::text THEN 
    v_score := v_score + 20; 
  END IF;
  
  RETURN v_score;
END;
$$;

-- 7. 创建辅助函数：更新餐厅的exposure_multiplier
CREATE OR REPLACE FUNCTION public.update_restaurant_exposure_multiplier(
  p_restaurant_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_completeness INTEGER;
  v_new_multiplier NUMERIC;
BEGIN
  -- 计算数据完整度
  v_completeness := public.calculate_restaurant_data_completeness(p_restaurant_id);
  
  -- 根据完整度设置倍数
  -- 100分 -> 1.1倍, 80-99分 -> 1.05倍, <80分 -> 1.0倍
  IF v_completeness >= 100 THEN
    v_new_multiplier := 1.1;
  ELSIF v_completeness >= 80 THEN
    v_new_multiplier := 1.05;
  ELSE
    v_new_multiplier := 1.0;
  END IF;
  
  -- 更新餐厅表
  UPDATE public.restaurants
  SET exposure_multiplier = v_new_multiplier
  WHERE id = p_restaurant_id;
END;
$$;

-- 8. 添加注释说明
COMMENT ON TABLE public.restaurant_claims IS 'Phase 1: 追踪餐厅认领申请流程，支持认领现有餐厅和创建新餐厅两种路径';
COMMENT ON COLUMN public.restaurant_claims.claim_type IS '认领类型：claim_existing(认领现有餐厅) 或 create_new(创建新餐厅)';
COMMENT ON COLUMN public.restaurant_claims.submitted_data IS '创建新餐厅时的提交数据（JSON格式），包含电话/照片/菜单/营业时间等';
COMMENT ON COLUMN public.restaurant_claims.data_completeness_score IS '数据完整度分数(0-100)，用于计算exposure_multiplier奖励';
COMMENT ON FUNCTION public.calculate_restaurant_data_completeness IS '计算餐厅数据完整度分数(0-100)，基于电话/照片/菜单/营业时间等';
COMMENT ON FUNCTION public.update_restaurant_exposure_multiplier IS '根据数据完整度自动更新餐厅的exposure_multiplier（1.0-1.1）';

-- 9. 确保现有数据兼容性：为所有现有餐厅设置默认status
UPDATE public.restaurants 
SET status = 'active' 
WHERE status IS NULL;

-- 为已验证的restaurant_owners更新关联餐厅的verified_at
UPDATE public.restaurants r
SET verified_at = ro.created_at
FROM public.restaurant_owners ro
WHERE r.id = ro.restaurant_id 
  AND ro.verified = true 
  AND r.verified_at IS NULL;