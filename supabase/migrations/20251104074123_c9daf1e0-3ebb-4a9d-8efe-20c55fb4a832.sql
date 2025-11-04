-- Phase 0.5: 餐厅业者数据后台 - 数据库迁移

-- 1. 添加 restaurant_owner 角色到 app_role enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t 
                 JOIN pg_enum e ON t.oid = e.enumtypid  
                 WHERE t.typname = 'app_role' AND e.enumlabel = 'restaurant_owner') THEN
    ALTER TYPE app_role ADD VALUE 'restaurant_owner';
  END IF;
END $$;

-- 2. 创建餐厅业者关联表
CREATE TABLE IF NOT EXISTS public.restaurant_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified BOOLEAN DEFAULT false,
  UNIQUE(user_id, restaurant_id)
);

-- 启用 RLS
ALTER TABLE public.restaurant_owners ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能查看自己的餐厅
CREATE POLICY "Users can view their own restaurants"
  ON public.restaurant_owners FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS 策略：用户可以申请成为餐厅业者（需要后续验证）
CREATE POLICY "Users can request restaurant ownership"
  ON public.restaurant_owners FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. 扩展 restaurant_views 表，添加外部点击追踪
ALTER TABLE public.restaurant_views 
ADD COLUMN IF NOT EXISTS click_type TEXT;

-- 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_restaurant_views_click_type 
ON public.restaurant_views(restaurant_id, click_type, created_at) 
WHERE click_type IS NOT NULL;

-- 4. 创建核心数据查询函数
CREATE OR REPLACE FUNCTION public.get_restaurant_stats(
  target_restaurant_id UUID,
  days_back INTEGER DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result JSON;
  start_date TIMESTAMPTZ := NOW() - (days_back || ' days')::INTERVAL;
BEGIN
  SELECT json_build_object(
    'total_impressions', (
      SELECT COUNT(*) FROM restaurant_views 
      WHERE restaurant_id = target_restaurant_id AND created_at >= start_date
    ),
    'detail_views', (
      SELECT COUNT(*) FROM restaurant_views 
      WHERE restaurant_id = target_restaurant_id 
        AND view_source = 'detail' AND created_at >= start_date
    ),
    'favorites_count', (
      SELECT COUNT(*) FROM favorites 
      WHERE restaurant_id = target_restaurant_id AND created_at >= start_date
    ),
    'save_rate', (
      SELECT ROUND(
        CASE 
          WHEN COUNT(*) > 0 THEN 
            (SELECT COUNT(*) FROM favorites WHERE restaurant_id = target_restaurant_id AND created_at >= start_date)::NUMERIC 
            / COUNT(*)::NUMERIC * 100
          ELSE 0 
        END, 2
      )
      FROM restaurant_views 
      WHERE restaurant_id = target_restaurant_id AND created_at >= start_date
    ),
    'phone_clicks', (
      SELECT COUNT(*) FROM restaurant_views 
      WHERE restaurant_id = target_restaurant_id AND click_type = 'phone' AND created_at >= start_date
    ),
    'map_clicks', (
      SELECT COUNT(*) FROM restaurant_views 
      WHERE restaurant_id = target_restaurant_id AND click_type = 'map' AND created_at >= start_date
    ),
    'menu_clicks', (
      SELECT COUNT(*) FROM restaurant_views 
      WHERE restaurant_id = target_restaurant_id AND click_type = 'menu' AND created_at >= start_date
    ),
    'website_clicks', (
      SELECT COUNT(*) FROM restaurant_views 
      WHERE restaurant_id = target_restaurant_id AND click_type = 'website' AND created_at >= start_date
    ),
    'avg_view_duration_sec', (
      SELECT ROUND(AVG(view_duration_ms / 1000.0), 1)
      FROM restaurant_views 
      WHERE restaurant_id = target_restaurant_id 
        AND view_duration_ms IS NOT NULL AND created_at >= start_date
    ),
    'like_rate', (
      SELECT ROUND(
        CASE 
          WHEN COUNT(*) > 0 THEN 
            COUNT(*) FILTER (WHERE liked = true)::NUMERIC / COUNT(*)::NUMERIC * 100
          ELSE 0 
        END, 2
      )
      FROM user_swipes 
      WHERE restaurant_id = target_restaurant_id AND created_at >= start_date
    ),
    'district_rank', (
      SELECT COUNT(*) + 1
      FROM restaurants r
      WHERE r.district = (SELECT district FROM restaurants WHERE id = target_restaurant_id)
        AND r.view_count > (SELECT view_count FROM restaurants WHERE id = target_restaurant_id)
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 5. 创建趋势数据查询函数
CREATE OR REPLACE FUNCTION public.get_restaurant_trend(
  target_restaurant_id UUID,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
  date DATE,
  impressions BIGINT,
  detail_views BIGINT,
  favorites BIGINT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  start_date TIMESTAMPTZ := NOW() - (days_back || ' days')::INTERVAL;
BEGIN
  RETURN QUERY
  SELECT 
    DATE(rv.created_at) as date,
    COUNT(*) as impressions,
    COUNT(*) FILTER (WHERE rv.view_source = 'detail') as detail_views,
    COALESCE(COUNT(DISTINCT f.id), 0) as favorites
  FROM restaurant_views rv
  LEFT JOIN favorites f ON f.restaurant_id = rv.restaurant_id 
    AND DATE(f.created_at) = DATE(rv.created_at)
  WHERE rv.restaurant_id = target_restaurant_id
    AND rv.created_at >= start_date
  GROUP BY DATE(rv.created_at)
  ORDER BY DATE(rv.created_at) ASC;
END;
$$;