-- 刪除現有的 SELECT 政策
DROP POLICY "Users can view own swipes" ON public.user_swipes;

-- 創建新的 SELECT 政策
CREATE POLICY "Users can view own swipes and group swipes from same group" 
ON public.user_swipes 
FOR SELECT 
USING (
  -- 用戶可以查看自己的所有投票記錄
  (auth.uid() = user_id) 
  OR 
  -- 或者查看同群組成員的群組投票記錄（不包括個人投票）
  (group_id IS NOT NULL AND user_is_in_group(group_id, auth.uid()))
);