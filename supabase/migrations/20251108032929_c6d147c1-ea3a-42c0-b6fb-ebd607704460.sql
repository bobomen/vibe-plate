-- ==========================================
-- 修复 Security Definer Views 警告
-- 将视图设置为 security_invoker 以应用RLS
-- ==========================================

-- 1. daily_active_users 视图：改为 security_invoker
ALTER VIEW public.daily_active_users
SET (security_invoker = true);

-- 2. funnel_stats 视图：改为 security_invoker  
ALTER VIEW public.funnel_stats
SET (security_invoker = true);

-- 3. popular_restaurants_7d 视图：改为 security_invoker
ALTER VIEW public.popular_restaurants_7d
SET (security_invoker = true);

-- 4. retention_cohorts 视图：改为 security_invoker
ALTER VIEW public.retention_cohorts
SET (security_invoker = true);

-- 添加说明注释
COMMENT ON VIEW public.daily_active_users IS '每日活跃用户统计（security_invoker模式，尊重RLS policies）';
COMMENT ON VIEW public.funnel_stats IS '用户转化漏斗统计（security_invoker模式，尊重RLS policies）';
COMMENT ON VIEW public.popular_restaurants_7d IS '7天热门餐厅排行（security_invoker模式，尊重RLS policies）';
COMMENT ON VIEW public.retention_cohorts IS '用户留存率分析（security_invoker模式，尊重RLS policies）';