-- Add group_id column to user_swipes table to separate personal and group swipes
ALTER TABLE public.user_swipes 
ADD COLUMN group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_user_swipes_group_id ON public.user_swipes(group_id);
CREATE INDEX idx_user_swipes_user_group ON public.user_swipes(user_id, group_id);

-- Update RLS policies to allow users to view swipes in groups they're members of
DROP POLICY IF EXISTS "Users can view own swipes" ON public.user_swipes;

CREATE POLICY "Users can view own swipes" 
ON public.user_swipes 
FOR SELECT 
USING (
  auth.uid() = user_id AND (
    -- Personal swipes (group_id is null)
    group_id IS NULL 
    OR 
    -- Group swipes (user is member of the group)
    user_is_in_group(group_id, auth.uid())
  )
);