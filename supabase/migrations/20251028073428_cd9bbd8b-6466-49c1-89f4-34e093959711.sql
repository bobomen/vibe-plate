-- Phase 0: Product Analytics & Growth Infrastructure

-- 1. Create hypothesis tracking table
CREATE TABLE IF NOT EXISTS public.hypothesis_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hypothesis_id TEXT NOT NULL UNIQUE,
  hypothesis_name TEXT NOT NULL,
  target_metric TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'testing' CHECK (status IN ('testing', 'validated', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert initial hypotheses
INSERT INTO public.hypothesis_tracking (hypothesis_id, hypothesis_name, target_metric, target_value) VALUES
  ('H1', '使用者會持續使用（留存率驗證）', 'retention_d7', 20),
  ('H2', '群組功能具有吸引力', 'group_adoption_rate', 20),
  ('H3', '用戶喜歡推薦的餐廳（Like 率）', 'like_rate', 35),
  ('H4', '用戶會邀請朋友（病毒係數）', 'viral_coefficient', 0.5)
ON CONFLICT (hypothesis_id) DO NOTHING;

-- 2. Create group invites tracking table
CREATE TABLE IF NOT EXISTS public.group_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL,
  invited_user_id UUID,
  invite_code TEXT NOT NULL,
  invite_link TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_group_invites_group_id ON public.group_invites(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invites_inviter_id ON public.group_invites(inviter_id);
CREATE INDEX IF NOT EXISTS idx_group_invites_invited_user_id ON public.group_invites(invited_user_id);

-- Enable RLS
ALTER TABLE public.hypothesis_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hypothesis_tracking (admin only write, public read)
CREATE POLICY "Anyone can view hypothesis tracking"
  ON public.hypothesis_tracking FOR SELECT
  USING (true);

CREATE POLICY "Admins can update hypothesis tracking"
  ON public.hypothesis_tracking FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for group_invites
CREATE POLICY "Users can view invites for their groups"
  ON public.group_invites FOR SELECT
  USING (
    user_is_in_group(group_id, auth.uid()) OR
    inviter_id = auth.uid() OR
    invited_user_id = auth.uid()
  );

CREATE POLICY "Users can create invites for their groups"
  ON public.group_invites FOR INSERT
  WITH CHECK (
    user_is_in_group(group_id, auth.uid()) AND
    inviter_id = auth.uid()
  );

CREATE POLICY "Users can update their own invites"
  ON public.group_invites FOR UPDATE
  USING (inviter_id = auth.uid());

-- 3. Create daily active users view
CREATE OR REPLACE VIEW public.daily_active_users AS
SELECT 
  DATE(created_at) as activity_date,
  COUNT(DISTINCT user_id) as dau
FROM (
  SELECT user_id, created_at FROM public.user_swipes
  UNION ALL
  SELECT user_id, created_at FROM public.favorites
  UNION ALL
  SELECT user_id, created_at FROM public.restaurant_views
) as all_activities
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(created_at)
ORDER BY activity_date DESC;

-- 4. Create retention cohorts view
CREATE OR REPLACE VIEW public.retention_cohorts AS
WITH user_first_activity AS (
  SELECT 
    user_id,
    DATE(MIN(created_at)) as cohort_date
  FROM public.user_swipes
  GROUP BY user_id
),
user_activity_days AS (
  SELECT DISTINCT
    us.user_id,
    ufa.cohort_date,
    DATE(us.created_at) as activity_date,
    DATE(us.created_at) - ufa.cohort_date as days_since_signup
  FROM public.user_swipes us
  JOIN user_first_activity ufa ON us.user_id = ufa.user_id
  WHERE us.created_at >= CURRENT_DATE - INTERVAL '90 days'
)
SELECT 
  cohort_date,
  COUNT(DISTINCT CASE WHEN days_since_signup = 0 THEN user_id END) as day_0_users,
  COUNT(DISTINCT CASE WHEN days_since_signup = 1 THEN user_id END) as day_1_users,
  COUNT(DISTINCT CASE WHEN days_since_signup = 7 THEN user_id END) as day_7_users,
  COUNT(DISTINCT CASE WHEN days_since_signup = 30 THEN user_id END) as day_30_users,
  ROUND(
    COUNT(DISTINCT CASE WHEN days_since_signup = 7 THEN user_id END)::NUMERIC / 
    NULLIF(COUNT(DISTINCT CASE WHEN days_since_signup = 0 THEN user_id END), 0) * 100, 
    2
  ) as d7_retention_rate
FROM user_activity_days
WHERE cohort_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY cohort_date
ORDER BY cohort_date DESC;

-- 5. Create funnel stats view
CREATE OR REPLACE VIEW public.funnel_stats AS
WITH date_range AS (
  SELECT CURRENT_DATE - INTERVAL '30 days' as start_date
),
user_counts AS (
  SELECT 
    COUNT(DISTINCT us.user_id) as total_swipers,
    COUNT(DISTINCT f.user_id) as users_with_favorites,
    COUNT(DISTINCT gm.user_id) as users_in_groups,
    COUNT(DISTINCT mr.user_id) as users_with_reviews
  FROM public.user_swipes us
  CROSS JOIN date_range dr
  LEFT JOIN public.favorites f ON us.user_id = f.user_id AND f.created_at >= dr.start_date
  LEFT JOIN public.group_members gm ON us.user_id = gm.user_id AND gm.joined_at >= dr.start_date
  LEFT JOIN public.monthly_reviews mr ON us.user_id = mr.user_id AND mr.created_at >= dr.start_date
  WHERE us.created_at >= dr.start_date
)
SELECT 
  total_swipers,
  users_with_favorites,
  users_in_groups,
  users_with_reviews,
  ROUND((users_with_favorites::NUMERIC / NULLIF(total_swipers, 0)) * 100, 2) as favorite_conversion_rate,
  ROUND((users_in_groups::NUMERIC / NULLIF(total_swipers, 0)) * 100, 2) as group_adoption_rate,
  ROUND((users_with_reviews::NUMERIC / NULLIF(total_swipers, 0)) * 100, 2) as review_creation_rate
FROM user_counts;

-- 6. Create function to update hypothesis current value
CREATE OR REPLACE FUNCTION public.update_hypothesis_value(
  hypothesis_id_param TEXT,
  new_value NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.hypothesis_tracking
  SET 
    current_value = new_value,
    status = CASE 
      WHEN new_value >= target_value THEN 'validated'
      ELSE 'testing'
    END,
    updated_at = now()
  WHERE hypothesis_id = hypothesis_id_param;
END;
$$;

-- 7. Add invite_count to profiles for gamification
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS successful_invites INTEGER DEFAULT 0;

-- 8. Create trigger to update updated_at on hypothesis_tracking
CREATE TRIGGER update_hypothesis_tracking_updated_at
  BEFORE UPDATE ON public.hypothesis_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();