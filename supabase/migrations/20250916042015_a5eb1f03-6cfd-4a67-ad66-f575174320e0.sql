-- 修復安全問題：限制 profiles 表的訪問權限
-- 刪除過於寬鬆的 profiles SELECT 政策
DROP POLICY "Users can view all profiles" ON public.profiles;

-- 創建更安全的 profiles SELECT 政策 - 用戶只能查看自己的資料
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 修復安全問題：限制 groups 表的訪問權限  
-- 刪除過於寬鬆的 groups SELECT 政策
DROP POLICY "Users can view groups they're members of or search by code" ON public.groups;

-- 創建更安全的 groups SELECT 政策 - 只允許群組成員和創建者查看
CREATE POLICY "Users can view groups they are members of or created" 
ON public.groups 
FOR SELECT 
USING (
  -- 用戶可以查看自己創建的群組
  (auth.uid() = created_by) 
  OR 
  -- 或者查看自己是成員的群組
  (EXISTS (
    SELECT 1 
    FROM public.group_members 
    WHERE group_members.group_id = groups.id 
    AND group_members.user_id = auth.uid()
  ))
);