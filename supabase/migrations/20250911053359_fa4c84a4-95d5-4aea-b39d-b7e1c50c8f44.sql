-- Drop the existing problematic unique constraint
ALTER TABLE public.user_swipes DROP CONSTRAINT IF EXISTS user_swipes_user_id_restaurant_id_key;

-- Clean up any duplicate records that may exist first
DELETE FROM public.user_swipes a USING (
  SELECT MIN(ctid) as min_ctid, user_id, restaurant_id, COALESCE(group_id, 'personal') as group_context
  FROM public.user_swipes 
  GROUP BY user_id, restaurant_id, COALESCE(group_id, 'personal') 
  HAVING COUNT(*) > 1
) b 
WHERE a.user_id = b.user_id 
  AND a.restaurant_id = b.restaurant_id 
  AND COALESCE(a.group_id, 'personal') = b.group_context
  AND a.ctid != b.min_ctid;

-- Create unique index that properly handles group vs personal swipes
-- This allows users to swipe on the same restaurant in both personal and group contexts
CREATE UNIQUE INDEX user_swipes_user_restaurant_group_unique 
ON public.user_swipes (user_id, restaurant_id, COALESCE(group_id, 'personal'));