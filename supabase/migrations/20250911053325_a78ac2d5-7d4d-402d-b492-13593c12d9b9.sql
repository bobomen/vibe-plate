-- Drop the existing problematic unique constraint
ALTER TABLE public.user_swipes DROP CONSTRAINT IF EXISTS user_swipes_user_id_restaurant_id_key;

-- Create new unique constraint that properly handles group vs personal swipes
-- This allows users to swipe on the same restaurant in both personal and group contexts
ALTER TABLE public.user_swipes 
ADD CONSTRAINT user_swipes_user_restaurant_group_unique 
UNIQUE (user_id, restaurant_id, COALESCE(group_id, 'personal'::text));

-- Clean up any duplicate records that may exist (keeping the most recent)
DELETE FROM public.user_swipes a USING (
  SELECT MIN(created_at) as min_created_at, user_id, restaurant_id, COALESCE(group_id, 'personal'::text) as group_key
  FROM public.user_swipes 
  GROUP BY user_id, restaurant_id, COALESCE(group_id, 'personal'::text) 
  HAVING COUNT(*) > 1
) b 
WHERE a.user_id = b.user_id 
  AND a.restaurant_id = b.restaurant_id 
  AND COALESCE(a.group_id, 'personal'::text) = b.group_key
  AND a.created_at != b.min_created_at;