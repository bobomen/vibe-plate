-- Drop the existing problematic unique constraint
ALTER TABLE public.user_swipes DROP CONSTRAINT IF EXISTS user_swipes_user_id_restaurant_id_key;

-- Clean up duplicate records first (keeping the most recent one)
WITH duplicates AS (
  SELECT 
    user_id, 
    restaurant_id, 
    group_id,
    MIN(created_at) as first_created,
    COUNT(*) as duplicate_count
  FROM public.user_swipes 
  GROUP BY user_id, restaurant_id, group_id
  HAVING COUNT(*) > 1
)
DELETE FROM public.user_swipes 
WHERE (user_id, restaurant_id, group_id, created_at) IN (
  SELECT us.user_id, us.restaurant_id, us.group_id, us.created_at
  FROM public.user_swipes us
  INNER JOIN duplicates d ON 
    us.user_id = d.user_id 
    AND us.restaurant_id = d.restaurant_id 
    AND ((us.group_id = d.group_id) OR (us.group_id IS NULL AND d.group_id IS NULL))
    AND us.created_at != d.first_created
);

-- Create partial unique indexes to handle the constraint properly
-- One for personal swipes (group_id IS NULL)
CREATE UNIQUE INDEX user_swipes_personal_unique 
ON public.user_swipes (user_id, restaurant_id) 
WHERE group_id IS NULL;

-- One for group swipes (group_id IS NOT NULL)  
CREATE UNIQUE INDEX user_swipes_group_unique 
ON public.user_swipes (user_id, restaurant_id, group_id) 
WHERE group_id IS NOT NULL;