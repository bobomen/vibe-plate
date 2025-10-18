-- Phase 1: 優化 user_swipes 表以收集更詳細的用戶行為數據
-- 新增滑卡時的地理位置、篩選條件、停留時間等關鍵數據

-- 新增欄位
ALTER TABLE public.user_swipes 
ADD COLUMN IF NOT EXISTS swipe_lat NUMERIC,              -- 滑卡時的緯度
ADD COLUMN IF NOT EXISTS swipe_lng NUMERIC,              -- 滑卡時的經度
ADD COLUMN IF NOT EXISTS swipe_distance_km NUMERIC,      -- 與餐廳的距離（公里）
ADD COLUMN IF NOT EXISTS filter_context JSONB DEFAULT '{}',  -- 當時使用的篩選條件
ADD COLUMN IF NOT EXISTS swipe_duration_ms INTEGER;      -- 用戶停留在這張卡片的時間（毫秒）

-- 建立索引以優化查詢效能
CREATE INDEX IF NOT EXISTS idx_user_swipes_location 
ON public.user_swipes USING btree (swipe_lat, swipe_lng);

CREATE INDEX IF NOT EXISTS idx_user_swipes_filter_context 
ON public.user_swipes USING gin (filter_context);

CREATE INDEX IF NOT EXISTS idx_user_swipes_distance 
ON public.user_swipes (swipe_distance_km) 
WHERE swipe_distance_km IS NOT NULL;

-- 新增註解說明
COMMENT ON COLUMN public.user_swipes.swipe_lat IS '用戶滑卡時的緯度（用於分析地理位置偏好）';
COMMENT ON COLUMN public.user_swipes.swipe_lng IS '用戶滑卡時的經度（用於分析地理位置偏好）';
COMMENT ON COLUMN public.user_swipes.swipe_distance_km IS '用戶與餐廳的距離（公里），用於分析距離偏好';
COMMENT ON COLUMN public.user_swipes.filter_context IS '滑卡時使用的篩選條件（JSONB格式），用於分析篩選行為';
COMMENT ON COLUMN public.user_swipes.swipe_duration_ms IS '用戶在此卡片停留的時間（毫秒），用於分析興趣度';