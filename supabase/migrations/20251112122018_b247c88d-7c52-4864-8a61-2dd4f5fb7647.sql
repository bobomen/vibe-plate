-- ============= 階段 1: 創建訂閱變更歷史表 =============
-- 此表用於記錄所有訂閱修改，確保可回溯性

CREATE TABLE IF NOT EXISTS subscription_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES restaurant_ad_subscriptions(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN (
    'upgrade',           -- 升級方案
    'downgrade',         -- 降級方案
    'modify_coupons',    -- 修改優惠券配置
    'change_to_hybrid',  -- 改為混合支付
    'change_to_cash'     -- 改為純現金
  )),
  previous_values JSONB NOT NULL,
  new_values JSONB NOT NULL,
  payment_amount NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 索引優化（支持高並發查詢）
CREATE INDEX IF NOT EXISTS idx_subscription_change_history_subscription 
  ON subscription_change_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_change_history_created 
  ON subscription_change_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_change_history_type 
  ON subscription_change_history(change_type);

-- 為表添加註釋
COMMENT ON TABLE subscription_change_history IS '訂閱變更歷史記錄表，用於審計和回溯分析';
COMMENT ON COLUMN subscription_change_history.change_type IS '變更類型：upgrade/downgrade/modify_coupons/change_to_hybrid/change_to_cash';
COMMENT ON COLUMN subscription_change_history.previous_values IS '變更前的值（JSONB格式）';
COMMENT ON COLUMN subscription_change_history.new_values IS '變更後的值（JSONB格式）';

-- RLS 政策（確保數據安全）
ALTER TABLE subscription_change_history ENABLE ROW LEVEL SECURITY;

-- 餐廳業主可以查看自己餐廳的變更歷史
CREATE POLICY "Owners can view their subscription changes"
  ON subscription_change_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_ad_subscriptions ras
      JOIN restaurant_owners ro ON ro.restaurant_id = ras.restaurant_id
      WHERE ras.id = subscription_change_history.subscription_id
        AND ro.user_id = auth.uid()
    )
  );

-- 防止手動修改歷史記錄（確保數據完整性）
CREATE POLICY "No manual modifications allowed"
  ON subscription_change_history FOR UPDATE
  USING (false);

CREATE POLICY "No manual deletions allowed"
  ON subscription_change_history FOR DELETE
  USING (false);

-- ============= 階段 2: 擴展訂閱表（不影響現有數據）=============

-- 添加新欄位（全部有默認值，確保向後兼容）
ALTER TABLE restaurant_ad_subscriptions
ADD COLUMN IF NOT EXISTS coupon_config JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS modification_count INTEGER DEFAULT 0;

-- 為新欄位添加註釋
COMMENT ON COLUMN restaurant_ad_subscriptions.coupon_config IS 
  '優惠券配置（包含 coupon_count, single_coupon_face_value, min_spend, max_discount）';
COMMENT ON COLUMN restaurant_ad_subscriptions.last_modified_at IS 
  '最後修改時間（用於防止頻繁修改）';
COMMENT ON COLUMN restaurant_ad_subscriptions.modification_count IS 
  '修改次數（樂觀鎖，防止並發衝突）';

-- 為優惠券配置添加 GIN 索引（加速 JSONB 查詢）
CREATE INDEX IF NOT EXISTS idx_restaurant_ad_subscriptions_config 
  ON restaurant_ad_subscriptions USING gin(coupon_config);
  
-- 為修改時間添加索引（用於頻率限制檢查）
CREATE INDEX IF NOT EXISTS idx_restaurant_ad_subscriptions_modified 
  ON restaurant_ad_subscriptions(last_modified_at);
