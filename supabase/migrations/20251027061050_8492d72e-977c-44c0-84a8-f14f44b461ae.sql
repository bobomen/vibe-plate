-- 演算法效果追蹤表
-- 用於記錄每次滑卡時演算法給的分數，以便分析演算法效果

CREATE TABLE IF NOT EXISTS public.algorithm_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  
  -- 演算法評分
  algorithm_score DECIMAL(5,2) NOT NULL, -- 0-100 的分數
  
  -- 用戶反應
  user_action TEXT CHECK (user_action IN ('like', 'dislike')),
  
  -- 卡片位置
  card_position INT NOT NULL, -- 第幾張卡
  
  -- 時間戳記
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- 索引優化查詢
  CONSTRAINT valid_score CHECK (algorithm_score >= 0 AND algorithm_score <= 100)
);

-- 索引優化
CREATE INDEX idx_algorithm_scores_user ON public.algorithm_scores(user_id);
CREATE INDEX idx_algorithm_scores_restaurant ON public.algorithm_scores(restaurant_id);
CREATE INDEX idx_algorithm_scores_created ON public.algorithm_scores(created_at DESC);

-- RLS 政策
ALTER TABLE public.algorithm_scores ENABLE ROW LEVEL SECURITY;

-- 用戶只能查看自己的分數記錄
CREATE POLICY "Users can view their own algorithm scores"
ON public.algorithm_scores
FOR SELECT
USING (auth.uid() = user_id);

-- 用戶可以新增自己的分數記錄（由前端追蹤）
CREATE POLICY "Users can insert their own algorithm scores"
ON public.algorithm_scores
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 註釋
COMMENT ON TABLE public.algorithm_scores IS '演算法評分追蹤表 - 記錄每次滑卡時演算法給的分數';
COMMENT ON COLUMN public.algorithm_scores.algorithm_score IS '演算法給的分數 (0-100)';
COMMENT ON COLUMN public.algorithm_scores.user_action IS '用戶的實際行為 (like/dislike)';
COMMENT ON COLUMN public.algorithm_scores.card_position IS '這是用戶看到的第幾張卡';