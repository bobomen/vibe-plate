-- ===================================
-- Phase 1: 餐厅曝光指标函数
-- 保留未来留言功能扩展性
-- ===================================

-- 1. 计算餐厅竞争力指标和曝光效率评分
CREATE OR REPLACE FUNCTION public.get_restaurant_exposure_metrics(
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
  target_restaurant RECORD;
  district_total_restaurants INTEGER;
  cuisine_total_restaurants INTEGER;
BEGIN
  -- 获取目标餐厅基本信息
  SELECT * INTO target_restaurant 
  FROM restaurants 
  WHERE id = target_restaurant_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Restaurant not found');
  END IF;

  -- 计算区域内餐厅总数
  SELECT COUNT(*) INTO district_total_restaurants
  FROM restaurants
  WHERE district = target_restaurant.district
    AND status = 'active'
    AND deleted_at IS NULL;

  -- 计算菜系内餐厅总数
  SELECT COUNT(*) INTO cuisine_total_restaurants
  FROM restaurants
  WHERE cuisine_type = target_restaurant.cuisine_type
    AND status = 'active'
    AND deleted_at IS NULL;

  SELECT json_build_object(
    -- 基础信息
    'restaurant_id', target_restaurant_id,
    'district', target_restaurant.district,
    'cuisine_type', target_restaurant.cuisine_type,
    
    -- 竞争力指标
    'competitiveness', json_build_object(
      'district_rank', (
        SELECT COUNT(*) + 1
        FROM restaurants r
        WHERE r.district = target_restaurant.district
          AND r.view_count > target_restaurant.view_count
          AND r.status = 'active'
          AND r.deleted_at IS NULL
      ),
      'district_total', district_total_restaurants,
      'district_percentile', ROUND(
        (1 - (
          SELECT COUNT(*)::NUMERIC 
          FROM restaurants r
          WHERE r.district = target_restaurant.district
            AND r.view_count > target_restaurant.view_count
            AND r.status = 'active'
            AND r.deleted_at IS NULL
        ) / NULLIF(district_total_restaurants, 0)) * 100, 1
      ),
      'cuisine_rank', (
        SELECT COUNT(*) + 1
        FROM restaurants r
        WHERE r.cuisine_type = target_restaurant.cuisine_type
          AND r.view_count > target_restaurant.view_count
          AND r.status = 'active'
          AND r.deleted_at IS NULL
      ),
      'cuisine_total', cuisine_total_restaurants,
      'cuisine_percentile', ROUND(
        (1 - (
          SELECT COUNT(*)::NUMERIC 
          FROM restaurants r
          WHERE r.cuisine_type = target_restaurant.cuisine_type
            AND r.view_count > target_restaurant.view_count
            AND r.status = 'active'
            AND r.deleted_at IS NULL
        ) / NULLIF(cuisine_total_restaurants, 0)) * 100, 1
      )
    ),
    
    -- 曝光效率评分组件
    'efficiency_score', json_build_object(
      -- 曝光表现 (0-25分)
      'exposure_score', LEAST(25, ROUND(
        (SELECT COUNT(*)::NUMERIC FROM restaurant_views 
         WHERE restaurant_id = target_restaurant_id 
           AND created_at >= start_date) / 
        NULLIF((SELECT AVG(cnt)::NUMERIC FROM (
          SELECT COUNT(*) as cnt FROM restaurant_views 
          WHERE created_at >= start_date 
          GROUP BY restaurant_id
        ) avg_views), 0) * 25, 1
      )),
      
      -- 互动表现 (0-25分)
      'engagement_score', LEAST(25, ROUND(
        (SELECT 
          CASE 
            WHEN COUNT(*) > 0 THEN
              (COUNT(*) FILTER (WHERE view_source = 'detail')::NUMERIC / COUNT(*)) * 100
            ELSE 0 
          END
        FROM restaurant_views 
        WHERE restaurant_id = target_restaurant_id 
          AND created_at >= start_date) / 4, 1
      )),
      
      -- 收藏表现 (0-25分)
      'favorite_score', LEAST(25, ROUND(
        (SELECT 
          CASE 
            WHEN COUNT(*) > 0 THEN
              (SELECT COUNT(*) FROM favorites 
               WHERE restaurant_id = target_restaurant_id 
                 AND created_at >= start_date)::NUMERIC / COUNT(*) * 100
            ELSE 0 
          END
        FROM restaurant_views 
        WHERE restaurant_id = target_restaurant_id 
          AND created_at >= start_date) * 2.5, 1
      )),
      
      -- 品质表现 (0-25分) - 基于喜欢率和平均浏览时长
      'quality_score', LEAST(25, ROUND(
        ((SELECT 
          CASE 
            WHEN COUNT(*) > 0 THEN
              COUNT(*) FILTER (WHERE liked = true)::NUMERIC / COUNT(*) * 100
            ELSE 0 
          END
        FROM user_swipes 
        WHERE restaurant_id = target_restaurant_id 
          AND created_at >= start_date) / 4 +
        LEAST(12.5, COALESCE((SELECT AVG(view_duration_ms / 1000.0) 
                     FROM restaurant_views 
                     WHERE restaurant_id = target_restaurant_id 
                       AND view_duration_ms IS NOT NULL 
                       AND created_at >= start_date), 0) / 2)), 1
      )),
      
      -- 总分 (0-100)
      'total_score', LEAST(100, (
        COALESCE(LEAST(25, ROUND(
          (SELECT COUNT(*)::NUMERIC FROM restaurant_views 
           WHERE restaurant_id = target_restaurant_id 
             AND created_at >= start_date) / 
          NULLIF((SELECT AVG(cnt)::NUMERIC FROM (
            SELECT COUNT(*) as cnt FROM restaurant_views 
            WHERE created_at >= start_date 
            GROUP BY restaurant_id
          ) avg_views), 0) * 25, 1
        )), 0) +
        COALESCE(LEAST(25, ROUND(
          (SELECT 
            CASE 
              WHEN COUNT(*) > 0 THEN
                (COUNT(*) FILTER (WHERE view_source = 'detail')::NUMERIC / COUNT(*)) * 100
              ELSE 0 
            END
          FROM restaurant_views 
          WHERE restaurant_id = target_restaurant_id 
            AND created_at >= start_date) / 4, 1
        )), 0) +
        COALESCE(LEAST(25, ROUND(
          (SELECT 
            CASE 
              WHEN COUNT(*) > 0 THEN
                (SELECT COUNT(*) FROM favorites 
                 WHERE restaurant_id = target_restaurant_id 
                   AND created_at >= start_date)::NUMERIC / COUNT(*) * 100
              ELSE 0 
            END
          FROM restaurant_views 
          WHERE restaurant_id = target_restaurant_id 
            AND created_at >= start_date) * 2.5, 1
        )), 0) +
        COALESCE(LEAST(25, ROUND(
          ((SELECT 
            CASE 
              WHEN COUNT(*) > 0 THEN
                COUNT(*) FILTER (WHERE liked = true)::NUMERIC / COUNT(*) * 100
              ELSE 0 
            END
          FROM user_swipes 
          WHERE restaurant_id = target_restaurant_id 
            AND created_at >= start_date) / 4 +
          LEAST(12.5, COALESCE((SELECT AVG(view_duration_ms / 1000.0) 
                       FROM restaurant_views 
                       WHERE restaurant_id = target_restaurant_id 
                         AND view_duration_ms IS NOT NULL 
                         AND created_at >= start_date), 0) / 2)), 1
        )), 0)
      )),
      
      -- 预留：留言互动评分（未来功能）
      'comment_score', 0,
      'comment_engagement_rate', 0
    ),
    
    -- 曝光提升预测（基于 exposure_multiplier）
    'exposure_boost', json_build_object(
      'current_multiplier', COALESCE(target_restaurant.exposure_multiplier, 1.0),
      'potential_multiplier', 1.5,
      'estimated_impressions_increase', ROUND(
        COALESCE((SELECT COUNT(*) FROM restaurant_views 
         WHERE restaurant_id = target_restaurant_id 
           AND created_at >= start_date), 0) * 0.5
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 2. 添加性能优化索引
CREATE INDEX IF NOT EXISTS idx_restaurants_district_views 
ON public.restaurants(district, view_count DESC) 
WHERE status = 'active' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine_views 
ON public.restaurants(cuisine_type, view_count DESC) 
WHERE status = 'active' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_restaurant_views_metrics
ON public.restaurant_views(restaurant_id, created_at, view_source, view_duration_ms);

COMMENT ON FUNCTION public.get_restaurant_exposure_metrics IS 
'Phase 1: 计算餐厅的竞争力指标、曝光效率评分和预期曝光提升。
包含预留字段用于未来的留言功能（comment_score, comment_engagement_rate）';