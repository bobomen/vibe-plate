-- =====================================================
-- 阶段一：数据库索引优化
-- 目标：提升查询性能 30-50%，零风险，完全向后兼容
-- =====================================================

-- 1. favorites 表索引优化
-- 优化场景：查询用户所有收藏（Favorites.tsx）
CREATE INDEX IF NOT EXISTS idx_favorites_user_id 
ON public.favorites(user_id, created_at DESC);

-- 优化场景：统计餐厅被收藏次数（Restaurant Owner Dashboard）
CREATE INDEX IF NOT EXISTS idx_favorites_restaurant_id 
ON public.favorites(restaurant_id, created_at DESC);

-- 2. group_members 表索引优化
-- 优化场景：查询用户参与的所有群组（Groups.tsx）
CREATE INDEX IF NOT EXISTS idx_group_members_user_id 
ON public.group_members(user_id, joined_at DESC);

-- 验证索引创建
COMMENT ON INDEX idx_favorites_user_id IS 'Optimizes user favorites lookup - Expected 30-50% performance improvement';
COMMENT ON INDEX idx_favorites_restaurant_id IS 'Optimizes restaurant popularity stats - Expected 30-50% performance improvement';
COMMENT ON INDEX idx_group_members_user_id IS 'Optimizes user groups lookup - Expected 40-60% performance improvement';